import { NextResponse } from 'next/server';

export interface DeputadoResumo {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
}

export interface DespesaMensalPoint {
  mes: string;
  valor: number;
}

export interface DespesaAnualPoint {
  ano: number;
  totalGasto: number;
  qtdNotas: number;
}

export interface DespesaCategoriaItem {
  tipoDespesa: string;
  valor: number;
  percentual: number;
  qtdDocumentos: number;
}

export interface FornecedorItem {
  nomeFornecedor: string;
  cnpjCpf: string;
  valorTotal: number;
  qtdNotas: number;
}

export interface NotaFiscalItem {
  id: string;
  data: string;
  fornecedor: string;
  cnpjCpf: string;
  tipo: string;
  valor: number;
  urlDocumento: string | null;
}

export interface ProposicaoItem {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  dataApresentacao: string;
  ementa: string;
}

export interface VotacaoHistoricoItem {
  id: string | number;
  projeto: string;
  voto: string;
}

export interface ComissaoItem {
  id: string | number;
  orgaoNome: string;
  papel: string;
  dataInicio: string;
}

function slugifyNomeCivil(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const HEADERS_CAMARA = {
  Accept: 'application/json',
  'User-Agent': 'BrasilLog-DadosAbertos/1.0',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Default to 220654 (Delegado Paulo Bilynskyj) as requested in the user's example
  const depId = parseInt(searchParams.get('id') || '220654', 10) || 220654;

  let deputadosLista: DeputadoResumo[] = [];
  let nomeParlamentar = 'Delegado Paulo Bilynskyj';
  let siglaPartido = 'PL';
  let siglaUf = 'SP';
  let situacao = 'Exercício';
  let nomeCivil = 'PAULO FRANCISCO MUNIZ BILYNSKYJ';

  // 1. Fetch list of deputies and target deputy metadata from Câmara API v2
  const [listaRes, detalheRes] = await Promise.allSettled([
    fetch(
      'https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&ordem=ASC&ordenarPor=nome&itens=600',
      { headers: HEADERS_CAMARA, signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } }
    ),
    fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${depId}`, {
      headers: HEADERS_CAMARA,
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    }),
  ]);

  if (listaRes.status === 'fulfilled' && listaRes.value.ok) {
    try {
      const json = await listaRes.value.json();
      const rawList = Array.isArray(json?.dados) ? json.dados : [];
      const seen = new Set<number>();
      for (const d of rawList) {
        if (d.id && !seen.has(d.id)) {
          seen.add(d.id);
          deputadosLista.push({
            id: Number(d.id),
            nome: String(d.nome || ''),
            siglaPartido: String(d.siglaPartido || ''),
            siglaUf: String(d.siglaUf || ''),
          });
        }
      }
    } catch {
      // ignore
    }
  }

  if (detalheRes.status === 'fulfilled' && detalheRes.value.ok) {
    try {
      const json = await detalheRes.value.json();
      const dados = json?.dados;
      if (dados) {
        nomeCivil = String(dados.nomeCivil || nomeCivil);
        const st = dados.ultimoStatus || {};
        nomeParlamentar = String(st.nomeEleitoral || st.nome || nomeParlamentar);
        siglaPartido = String(st.siglaPartido || siglaPartido);
        siglaUf = String(st.siglaUf || siglaUf);
        situacao = String(st.situacao || situacao);
      }
    } catch {
      // ignore
    }
  }

  const slug = slugifyNomeCivil(nomeCivil);

  // 2. Fetch in parallel:
  // - Câmara API Despesas (2023, 2024, 2025, 2026) with idLegislatura=57
  // - Câmara API Proposições de Autoria
  // - Câmara API Órgãos / Comissões
  // - Ranking.org.br SSR public work & expense series (ONLY expenses, total_proposicoes, votos, and orgaos)
  const years = [2023, 2024, 2025, 2026];

  const [
    desp2023Res,
    desp2024Res,
    desp2025Res,
    desp2026Res,
    proposicoesRes,
    orgaosRes,
    rankingSsrRes,
  ] = await Promise.allSettled([
    ...years.map((yr) =>
      fetch(
        `https://dadosabertos.camara.leg.br/api/v2/deputados/${depId}/despesas?idLegislatura=57&ano=${yr}&itens=100&ordem=DESC&ordenarPor=mes`,
        { headers: HEADERS_CAMARA, signal: AbortSignal.timeout(6500), next: { revalidate: 1800 } }
      )
    ),
    fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${depId}&itens=100&ordem=DESC&ordenarPor=id`,
      { headers: HEADERS_CAMARA, signal: AbortSignal.timeout(6500), next: { revalidate: 1800 } }
    ),
    fetch(
      `https://dadosabertos.camara.leg.br/api/v2/deputados/${depId}/orgaos?itens=40&ordem=DESC&ordenarPor=dataInicio`,
      { headers: HEADERS_CAMARA, signal: AbortSignal.timeout(5500), next: { revalidate: 3600 } }
    ),
    fetch(`https://ranking.org.br/perfil/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrasilLog/1.0)' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    }),
  ]);

  // Parse Câmara API Despesas across 2023-2026
  interface RawCamaraDespesa {
    ano: number;
    mes: number;
    tipoDespesa: string;
    codDocumento: string | number;
    dataDocumento: string;
    valorLiquido: number;
    valorDocumento: number;
    urlDocumento: string | null;
    nomeFornecedor: string;
    cnpjCpfFornecedor: string;
  }

  const allCamaraDespesas: RawCamaraDespesa[] = [];
  const despResults = [desp2023Res, desp2024Res, desp2025Res, desp2026Res];

  for (const r of despResults) {
    if (r.status === 'fulfilled' && r.value.ok) {
      try {
        const json = await r.value.json();
        if (Array.isArray(json?.dados)) {
          allCamaraDespesas.push(...json.dados);
        }
      } catch {
        // ignore
      }
    }
  }

  // Parse Ranking.org.br SSR public work & expense series (strictly excluding scores/personal data)
  let ssrTotalProposicoes: number | null = null;
  let ssrVotos: VotacaoHistoricoItem[] = [];
  let ssrDespesaMensal: DespesaMensalPoint[] = [];
  let ssrTotalPeriodo: number | null = null;
  let ssrMediaMensal: number | null = null;
  let ssrDespesasRecentes: NotaFiscalItem[] = [];
  let ssrOrgaos: ComissaoItem[] = [];

  if (rankingSsrRes.status === 'fulfilled' && rankingSsrRes.value.ok) {
    try {
      const html = await rankingSsrRes.value.text();
      const unescaped = html.replace(/\\"/g, '"');

      // 1. Extract total_proposicoes
      const propMatch = unescaped.match(/"total_proposicoes"\s*:\s*(\d+)/);
      if (propMatch) {
        ssrTotalProposicoes = parseInt(propMatch[1], 10);
      }

      // 2. Extract evolucao_anual
      const evoMatch = unescaped.match(
        /"evolucao_anual"\s*:\s*\{"despesa_mensal"\s*:\s*(\[[^\]]*\])\s*,\s*"total_periodo"\s*:\s*([0-9.]+)\s*,[^}]*"media_mensal"\s*:\s*([0-9.]+)/
      );
      if (evoMatch) {
        const arr = JSON.parse(evoMatch[1]);
        if (Array.isArray(arr)) {
          ssrDespesaMensal = arr.map((m: Record<string, unknown>) => ({
            mes: String(m.mes || ''),
            valor: Number(m.valor || 0),
          }));
        }
        ssrTotalPeriodo = parseFloat(evoMatch[2]);
        ssrMediaMensal = parseFloat(evoMatch[3]);
      }

      // 3. Extract votos array
      const votosIdx = unescaped.indexOf('"votos":[');
      if (votosIdx !== -1) {
        const startBracket = unescaped.indexOf('[', votosIdx);
        const endBracket = unescaped.indexOf(']', startBracket);
        if (startBracket !== -1 && endBracket !== -1) {
          const votosJson = unescaped.slice(startBracket, endBracket + 1);
          const parsedVotos = JSON.parse(votosJson);
          if (Array.isArray(parsedVotos)) {
            ssrVotos = parsedVotos.slice(0, 120).map((v: Record<string, unknown>, i: number) => ({
              id: (v.id as string | number) || i,
              projeto: String(v.projeto || ''),
              voto: String(v.voto || ''),
            }));
          }
        }
      }

      // 4. Extract financeiro.despesas if needed
      const finIdx = unescaped.indexOf('"financeiro":{"despesas":[');
      if (finIdx !== -1) {
        const startBracket = unescaped.indexOf('[', finIdx);
        const endBracket = unescaped.indexOf(']', startBracket);
        if (startBracket !== -1 && endBracket !== -1) {
          const despJson = unescaped.slice(startBracket, endBracket + 1);
          const parsedDesp = JSON.parse(despJson);
          if (Array.isArray(parsedDesp)) {
            ssrDespesasRecentes = parsedDesp.slice(0, 80).map((d: Record<string, unknown>, i: number) => ({
              id: String(d.id || i),
              data: String(d.data_documento || '').slice(0, 10),
              fornecedor: String(d.nome_fornecedor || ''),
              cnpjCpf: '',
              tipo: String(d.tipo_despesa || ''),
              valor: Number(d.valor || 0),
              urlDocumento: null,
            }));
          }
        }
      }

      // 5. Extract orgaos
      const orgIdx = unescaped.indexOf('"orgaos":[');
      if (orgIdx !== -1) {
        const startBracket = unescaped.indexOf('[', orgIdx);
        const endBracket = unescaped.indexOf(']', startBracket);
        if (startBracket !== -1 && endBracket !== -1) {
          const orgJson = unescaped.slice(startBracket, endBracket + 1);
          const parsedOrg = JSON.parse(orgJson);
          if (Array.isArray(parsedOrg)) {
            ssrOrgaos = parsedOrg.slice(0, 25).map((o: Record<string, unknown>, i: number) => ({
              id: (o.id as string | number) || i,
              orgaoNome: String(o.orgao_nome || ''),
              papel: String(o.titulo || 'Membro'),
              dataInicio: String(o.data_inicio || '').slice(0, 10),
            }));
          }
        }
      }
    } catch {
      // ignore SSR parse errors, fallback to Câmara API data
    }
  }

  // Aggregate Câmara Despesas into Monthly, Annual, Categories, Suppliers, and Receipts
  const monthlyMap = new Map<string, number>();
  const annualMap = new Map<number, { total: number; count: number }>();
  const categoryMap = new Map<string, { valor: number; count: number }>();
  const supplierMap = new Map<string, { nome: string; cnpj: string; valor: number; count: number }>();

  for (const d of allCamaraDespesas) {
    const val = Number(d.valorLiquido ?? d.valorDocumento ?? 0);
    if (val <= 0) continue;

    const mesKey = `${String(d.mes).padStart(2, '0')}/${d.ano}`;
    monthlyMap.set(mesKey, (monthlyMap.get(mesKey) || 0) + val);

    const yrEntry = annualMap.get(d.ano) || { total: 0, count: 0 };
    yrEntry.total += val;
    yrEntry.count += 1;
    annualMap.set(d.ano, yrEntry);

    const catName = String(d.tipoDespesa || 'OUTRAS DESPESAS').replace(/\.$/, '');
    const catEntry = categoryMap.get(catName) || { valor: 0, count: 0 };
    catEntry.valor += val;
    catEntry.count += 1;
    categoryMap.set(catName, catEntry);

    const supKey = String(d.cnpjCpfFornecedor || d.nomeFornecedor || 'N/I');
    const supEntry = supplierMap.get(supKey) || {
      nome: String(d.nomeFornecedor || 'Fornecedor'),
      cnpj: String(d.cnpjCpfFornecedor || ''),
      valor: 0,
      count: 0,
    };
    supEntry.valor += val;
    supEntry.count += 1;
    supplierMap.set(supKey, supEntry);
  }

  // If SSR has no categories/suppliers or if we want to combine both:
  if (categoryMap.size === 0 && ssrDespesasRecentes.length > 0) {
    for (const d of ssrDespesasRecentes) {
      if (d.valor <= 0) continue;
      const catName = d.tipo.replace(/\.$/, '');
      const catEntry = categoryMap.get(catName) || { valor: 0, count: 0 };
      catEntry.valor += d.valor;
      catEntry.count += 1;
      categoryMap.set(catName, catEntry);

      const supEntry = supplierMap.get(d.fornecedor) || {
        nome: d.fornecedor,
        cnpj: d.cnpjCpf,
        valor: 0,
        count: 0,
      };
      supEntry.valor += d.valor;
      supEntry.count += 1;
      supplierMap.set(d.fornecedor, supEntry);
    }
  }

  // Build Monthly Evolution Series (prefer SSR 12-month consolidated if available, else Câmara API monthly map)
  let serieMensal: DespesaMensalPoint[] = [];
  if (ssrDespesaMensal.length > 0) {
    serieMensal = ssrDespesaMensal;
  } else {
    serieMensal = Array.from(monthlyMap.entries())
      .map(([mes, valor]) => ({ mes, valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => {
        const [mA, yA] = a.mes.split('/').map(Number);
        const [mB, yB] = b.mes.split('/').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      })
      .slice(-14);
  }

  const resumoAnual: DespesaAnualPoint[] = years.map((yr) => {
    const entry = annualMap.get(yr);
    return {
      ano: yr,
      totalGasto: Math.round((entry?.total || 0) * 100) / 100,
      qtdNotas: entry?.count || 0,
    };
  });

  const totalCamaraSample = Array.from(categoryMap.values()).reduce((a, b) => a + b.valor, 0);
  const totalPeriodo =
    ssrTotalPeriodo ??
    Math.round(serieMensal.reduce((acc, item) => acc + item.valor, 0) * 100) / 100;
  const mediaMensal =
    ssrMediaMensal ??
    (serieMensal.length > 0 ? Math.round((totalPeriodo / serieMensal.length) * 100) / 100 : 0);

  const porCategoria: DespesaCategoriaItem[] = Array.from(categoryMap.entries())
    .map(([tipoDespesa, info]) => ({
      tipoDespesa,
      valor: Math.round(info.valor * 100) / 100,
      percentual:
        totalCamaraSample > 0 ? Math.round((info.valor / totalCamaraSample) * 1000) / 10 : 0,
      qtdDocumentos: info.count,
    }))
    .sort((a, b) => b.valor - a.valor);

  const maioresFornecedores: FornecedorItem[] = Array.from(supplierMap.values())
    .map((s) => ({
      nomeFornecedor: s.nome,
      cnpjCpf: s.cnpj,
      valorTotal: Math.round(s.valor * 100) / 100,
      qtdNotas: s.count,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 12);

  // Build detailed receipts list (prefer Câmara API receipts because they include CNPJ & direct NF-e PDF URL!)
  const ultimasDespesas: NotaFiscalItem[] =
    allCamaraDespesas.length > 0
      ? allCamaraDespesas
          .filter((d) => (d.valorLiquido ?? d.valorDocumento ?? 0) > 0)
          .sort((a, b) => String(b.dataDocumento || '').localeCompare(String(a.dataDocumento || '')))
          .slice(0, 60)
          .map((d, idx) => ({
            id: String(d.codDocumento || idx),
            data: d.dataDocumento
              ? String(d.dataDocumento).slice(0, 10)
              : `${d.ano}-${String(d.mes).padStart(2, '0')}-01`,
            fornecedor: String(d.nomeFornecedor || ''),
            cnpjCpf: String(d.cnpjCpfFornecedor || ''),
            tipo: String(d.tipoDespesa || '').replace(/\.$/, ''),
            valor: Number(d.valorLiquido ?? d.valorDocumento ?? 0),
            urlDocumento: d.urlDocumento || null,
          }))
      : ssrDespesasRecentes;

  // Parse Proposições from Câmara API
  let listaProposicoes: ProposicaoItem[] = [];
  const tipoPropCount = new Map<string, number>();

  if (proposicoesRes.status === 'fulfilled' && proposicoesRes.value.ok) {
    try {
      const json = await proposicoesRes.value.json();
      const dados = Array.isArray(json?.dados) ? json.dados : [];
      for (const p of dados) {
        const sigla = String(p.siglaTipo || 'OUTROS');
        tipoPropCount.set(sigla, (tipoPropCount.get(sigla) || 0) + 1);
      }
      listaProposicoes = dados.slice(0, 50).map((p: Record<string, unknown>) => ({
        id: Number(p.id || 0),
        siglaTipo: String(p.siglaTipo || ''),
        numero: Number(p.numero || 0),
        ano: Number(p.ano || 0),
        dataApresentacao: String(p.dataApresentacao || '').slice(0, 10),
        ementa: String(p.ementa || ''),
      }));
    } catch {
      // ignore
    }
  }

  const proposicoesPorTipo = Array.from(tipoPropCount.entries())
    .map(([siglaTipo, quantidade]) => ({ siglaTipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const totalProposicoesAutoria = ssrTotalProposicoes ?? listaProposicoes.length;

  // Parse Comissões / Órgãos from Câmara API or SSR
  let comissoesOrgaos: ComissaoItem[] = [];
  if (orgaosRes.status === 'fulfilled' && orgaosRes.value.ok) {
    try {
      const json = await orgaosRes.value.json();
      const dados = Array.isArray(json?.dados) ? json.dados : [];
      comissoesOrgaos = dados.slice(0, 25).map((o: Record<string, unknown>, i: number) => ({
        id: String(o.idOrgao || i),
        orgaoNome: String(o.nomePublicacao || o.nomeOrgao || o.siglaOrgao || ''),
        papel: String(o.titulo || 'Membro'),
        dataInicio: String(o.dataInicio || '').slice(0, 10),
      }));
    } catch {
      // ignore
    }
  }
  if (comissoesOrgaos.length === 0 && ssrOrgaos.length > 0) {
    comissoesOrgaos = ssrOrgaos;
  }

  // Voting summary metrics
  const votosSim = ssrVotos.filter((v) => v.voto.toLowerCase() === 'sim').length;
  const votosNao = ssrVotos.filter((v) => v.voto.toLowerCase() === 'não' || v.voto.toLowerCase() === 'nao').length;
  const ausenciasOuAbstencoes = ssrVotos.length - votosSim - votosNao;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    fontesOficiais: [
      'API Dados Abertos da Câmara dos Deputados (v2)',
      'Portal Cota para o Exercício da Atividade Parlamentar (CEAP)',
      'Sistema de Votações e Proposições Legislativas',
    ],
    deputadosLista,
    parlamentar: {
      id: depId,
      nomeParlamentar,
      siglaPartido,
      siglaUf,
      cargo: 'Deputado Federal',
      situacao,
      legislatura: '57ª Legislatura (2023–2027)',
    },
    evolucaoDespesas: {
      totalPeriodo,
      mediaMensal,
      serieMensal,
      resumoAnual,
      porCategoria,
      maioresFornecedores,
      ultimasDespesas,
    },
    trabalhoLegislativo: {
      totalProposicoesAutoria,
      proposicoesPorTipo,
      listaProposicoes,
      resumoVotacoes: {
        totalRegistradas: ssrVotos.length,
        votosSim,
        votosNao,
        ausenciasOuAbstencoes,
      },
      historicoVotacoes: ssrVotos,
      comissoesOrgaos,
    },
  });
}
