import { NextResponse } from 'next/server';
import {
  ANNUAL_TAX_TARGET_2026,
  BASE_POPULATION_2026,
  DEFAULT_IPCA_SERIES,
  DEFAULT_UNEMPLOYMENT_SERIES,
  HistoricalPoint,
  MAJOR_PUBLIC_WORKS,
  PUBLIC_SPENDING_BY_FUNCTION,
  PUBLIC_WORKS_BY_SECTOR,
  PublicWorkProject,
  STATES_DATA,
  StateStats,
  TAX_BREAKDOWN,
} from '@/lib/brazil-data';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatIbgePeriod(code: string): string {
  if (code.length !== 6) return code;
  const year = code.slice(2, 4);
  const monthIdx = parseInt(code.slice(4, 6), 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || code.slice(4, 6);
  return `${monthName}/${year}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ufFilter = searchParams.get('uf')?.toUpperCase() || null;

  const sourcesStatus = {
    ibgePopulacao: 'online' as 'online' | 'fallback',
    ibgePnadDesemprego: 'online' as 'online' | 'fallback',
    ibgeIpca: 'online' as 'online' | 'fallback',
    brasilApiTaxas: 'online' as 'online' | 'fallback',
    obrasGov: 'online' as 'online' | 'fallback',
  };

  let nationalPopulation = BASE_POPULATION_2026;
  const statesMap = new Map<string, StateStats>(
    STATES_DATA.map((s) => [s.id, { ...s }])
  );

  let unemploymentSeries: HistoricalPoint[] = [...DEFAULT_UNEMPLOYMENT_SERIES];
  let currentUnemployment = 5.3;

  let ipcaSeries: HistoricalPoint[] = [...DEFAULT_IPCA_SERIES];
  let currentIpca = 4.58;

  let selicRate = 13.75;
  let cdiRate = 13.65;

  let liveObrasGovItems: PublicWorkProject[] = [];

  // Run all public API fetches in parallel with a 4.5s timeout per request
  await Promise.allSettled([
    // 1. IBGE População Estimada (Brasil + 27 UFs)
    (async () => {
      try {
        const res = await fetch(
          'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N1[all]|N3[all]',
          { signal: AbortSignal.timeout(4500), next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error('IBGE Pop error');
        const data = await res.json();
        const series = data?.[0]?.resultados?.[0]?.series || [];
        for (const item of series) {
          const locId = String(item?.localidade?.id || '');
          const serieObj = item?.serie || {};
          const latestValStr = Object.values(serieObj)[0] as string;
          const val = parseInt(latestValStr, 10);
          if (!isNaN(val) && val > 0) {
            if (locId === '1') {
              nationalPopulation = val;
            } else if (statesMap.has(locId)) {
              const st = statesMap.get(locId)!;
              st.populacao = val;
            }
          }
        }
      } catch {
        sourcesStatus.ibgePopulacao = 'fallback';
      }
    })(),

    // 2. IBGE PNAD Contínua - Taxa de Desocupação (Desemprego)
    (async () => {
      try {
        const res = await fetch(
          'https://servicodados.ibge.gov.br/api/v3/agregados/6381/periodos/-12/variaveis/4099?localidades=N1[all]',
          { signal: AbortSignal.timeout(4500), next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error('IBGE PNAD error');
        const data = await res.json();
        const serieObj = data?.[0]?.resultados?.[0]?.series?.[0]?.serie;
        if (serieObj && Object.keys(serieObj).length > 0) {
          const parsed: HistoricalPoint[] = Object.entries(serieObj)
            .map(([periodo, val]) => ({
              periodo: formatIbgePeriod(periodo),
              valor: parseFloat(String(val)),
            }))
            .filter((p) => !isNaN(p.valor));
          if (parsed.length > 0) {
            unemploymentSeries = parsed;
            currentUnemployment = parsed[parsed.length - 1].valor;
          }
        }
      } catch {
        sourcesStatus.ibgePnadDesemprego = 'fallback';
      }
    })(),

    // 3. IBGE IPCA Acumulado 12 Meses
    (async () => {
      try {
        const res = await fetch(
          'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-12/variaveis/2265?localidades=N1[all]',
          { signal: AbortSignal.timeout(4500), next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error('IBGE IPCA error');
        const data = await res.json();
        const serieObj = data?.[0]?.resultados?.[0]?.series?.[0]?.serie;
        if (serieObj && Object.keys(serieObj).length > 0) {
          const parsed: HistoricalPoint[] = Object.entries(serieObj)
            .map(([periodo, val]) => ({
              periodo: formatIbgePeriod(periodo),
              valor: parseFloat(String(val)),
            }))
            .filter((p) => !isNaN(p.valor));
          if (parsed.length > 0) {
            ipcaSeries = parsed;
            currentIpca = parsed[parsed.length - 1].valor;
          }
        }
      } catch {
        sourcesStatus.ibgeIpca = 'fallback';
      }
    })(),

    // 4. BrasilAPI - Taxas Oficiais (Selic, CDI, IPCA)
    (async () => {
      try {
        const res = await fetch('https://brasilapi.com.br/api/taxas/v1', {
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 1800 },
        });
        if (!res.ok) throw new Error('BrasilAPI error');
        const taxas = await res.json();
        if (Array.isArray(taxas)) {
          for (const t of taxas) {
            const nome = String(t.nome || '').toUpperCase();
            if (nome === 'SELIC' && typeof t.valor === 'number') selicRate = t.valor;
            if (nome === 'CDI' && typeof t.valor === 'number') cdiRate = t.valor;
          }
        }
      } catch {
        sourcesStatus.brasilApiTaxas = 'fallback';
      }
    })(),

    // 5. Obrasgov.br - Projetos de Investimento do Governo Federal
    (async () => {
      try {
        const ufParam = ufFilter ? `&uf=${ufFilter}` : '';
        const res = await fetch(
          `https://api.obrasgov.gestao.gov.br/obrasgov/api/projeto-investimento?pagina=0&tamanhoDaPagina=6${ufParam}`,
          { signal: AbortSignal.timeout(4500), next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error('Obrasgov error');
        const data = await res.json();
        const content = Array.isArray(data?.content) ? data.content : [];
        liveObrasGovItems = content
          .filter((item: Record<string, unknown>) => item && item.nome && item.uf)
          .slice(0, 6)
          .map((item: Record<string, unknown>, idx: number) => {
            const fontes = Array.isArray(item.fontesDeRecurso) ? item.fontesDeRecurso : [];
            const valorPrevisto = Number(fontes[0]?.valorInvestimentoPrevisto || 25_000_000);
            const orcamentoMilhoes = Math.max(1.2, Math.round((valorPrevisto / 1_000_000) * 10) / 10);
            const situacaoRaw = String(item.situacao || 'Em Execução');
            let status: PublicWorkProject['status'] = 'Em Execução';
            let pct = 54;
            if (situacaoRaw.toLowerCase().includes('conclu')) {
              status = 'Concluída';
              pct = 100;
            } else if (situacaoRaw.toLowerCase().includes('paralis')) {
              status = 'Paralisada';
              pct = 38;
            } else if (situacaoRaw.toLowerCase().includes('cadastr') || situacaoRaw.toLowerCase().includes('licita')) {
              status = 'Em Licitação';
              pct = 15;
            }
            const repassadores = Array.isArray(item.repassadores) ? item.repassadores : [];
            const orgaoNome = String(repassadores[0]?.nome || 'Governo Federal / Obrasgov.br');
            return {
              id: `GOV-${item.idUnico || idx + 100}`,
              nome: String(item.nome).trim(),
              uf: String(item.uf),
              regiao: 'Brasil',
              setor: 'Habitação e Mobilidade',
              orgao: orgaoNome,
              programa: 'Cadastro Integrado Obrasgov.br',
              status,
              percentualExecucao: pct,
              orcamentoMilhoes,
              valorExecutadoMilhoes: Math.round(orcamentoMilhoes * (pct / 100) * 10) / 10,
              previsaoConclusao: item.dataFinalPrevista ? String(item.dataFinalPrevista).slice(0, 7) : '2027',
              municipio: `UF: ${item.uf}`,
            };
          });
      } catch {
        sourcesStatus.obrasGov = 'fallback';
      }
    })(),
  ]);

  const statesList = Array.from(statesMap.values()).sort((a, b) => b.pibBilhoes - a.pibBilhoes);

  // Aggregate national public works totals across all 27 states
  const obrasTotais = statesList.reduce(
    (acc, st) => {
      acc.emAndamento += st.obras.emAndamento;
      acc.paralisadas += st.obras.paralisadas;
      acc.concluidas += st.obras.concluidas;
      acc.emLicitacao += st.obras.emLicitacao;
      acc.investimentoTotalBilhoes += st.obras.investimentoTotalBilhoes;
      return acc;
    },
    { emAndamento: 0, paralisadas: 0, concluidas: 0, emLicitacao: 0, investimentoTotalBilhoes: 0 }
  );
  obrasTotais.investimentoTotalBilhoes = Math.round(obrasTotais.investimentoTotalBilhoes * 10) / 10;

  const pibNacionalBilhoes = Math.round(
    statesList.reduce((acc, st) => acc + st.pibBilhoes, 0) * 10
  ) / 10;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    sourcesStatus,
    resumoNacional: {
      populacaoTotal: nationalPopulation,
      taxaDesemprego: currentUnemployment,
      ipcaAcumulado12m: currentIpca,
      taxaSelic: selicRate,
      taxaCdi: cdiRate,
      pibTotalBilhoes: pibNacionalBilhoes,
      pibPerCapita: Math.round((pibNacionalBilhoes * 1_000_000_000) / nationalPopulation),
      metaImpostoAnualReais: ANNUAL_TAX_TARGET_2026,
      cargaTributariaPctPib: 33.4,
      dividaBrutaPctPib: 78.2,
      salarioMinimo: 1621,
      obrasTotais,
    },
    seriesHistoricas: {
      desemprego: unemploymentSeries,
      ipca: ipcaSeries,
    },
    tributos: TAX_BREAKDOWN,
    gastosPublicos: PUBLIC_SPENDING_BY_FUNCTION,
    obrasPorSetor: PUBLIC_WORKS_BY_SECTOR,
    grandesObras: [...MAJOR_PUBLIC_WORKS, ...liveObrasGovItems],
    estados: statesList,
  });
}
