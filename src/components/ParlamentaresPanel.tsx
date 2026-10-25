'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  Landmark,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  TrendingUp,
  Vote,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DeputadoResumo {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
}

interface ParlamentarResponse {
  updatedAt: string;
  fontesOficiais: string[];
  deputadosLista: DeputadoResumo[];
  parlamentar: {
    id: number;
    nomeParlamentar: string;
    siglaPartido: string;
    siglaUf: string;
    cargo: string;
    situacao: string;
    legislatura: string;
  };
  evolucaoDespesas: {
    totalPeriodo: number;
    mediaMensal: number;
    serieMensal: { mes: string; valor: number }[];
    resumoAnual: { ano: number; totalGasto: number; qtdNotas: number }[];
    porCategoria: {
      tipoDespesa: string;
      valor: number;
      percentual: number;
      qtdDocumentos: number;
    }[];
    maioresFornecedores: {
      nomeFornecedor: string;
      cnpjCpf: string;
      valorTotal: number;
      qtdNotas: number;
    }[];
    ultimasDespesas: {
      id: string;
      data: string;
      fornecedor: string;
      cnpjCpf: string;
      tipo: string;
      valor: number;
      urlDocumento: string | null;
    }[];
  };
  trabalhoLegislativo: {
    totalProposicoesAutoria: number;
    proposicoesPorTipo: { siglaTipo: string; quantidade: number }[];
    listaProposicoes: {
      id: number;
      siglaTipo: string;
      numero: number;
      ano: number;
      dataApresentacao: string;
      ementa: string;
    }[];
    resumoVotacoes: {
      totalRegistradas: number;
      votosSim: number;
      votosNao: number;
      ausenciasOuAbstencoes: number;
    };
    historicoVotacoes: {
      id: string | number;
      projeto: string;
      voto: string;
    }[];
    comissoesOrgaos: {
      id: string | number;
      orgaoNome: string;
      papel: string;
      dataInicio: string;
    }[];
  };
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNum(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function ParlamentaresPanel({ isDark }: { isDark: boolean }) {
  // Default to 220654 (Delegado Paulo Bilynskyj)
  const [selectedDepId, setSelectedDepId] = useState<number>(220654);
  const [data, setData] = useState<ParlamentarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for Deputy Selector
  const [depSearch, setDepSearch] = useState<string>('');
  const [depUfFilter, setDepUfFilter] = useState<string>('TODAS');

  // Filters for Receipts, Votes & Propositions
  const [despesaSearch, setDespesaSearch] = useState<string>('');
  const [despesaTipoFilter, setDespesaTipoFilter] = useState<string>('TODOS');
  const [votoSearch, setVotoSearch] = useState<string>('');
  const [votoTipoFilter, setVotoTipoFilter] = useState<string>('TODOS');
  const [propSearch, setPropSearch] = useState<string>('');

  const fetchParlamentar = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parlamentares?id=${id}`);
      if (res.ok) {
        const json: ParlamentarResponse = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParlamentar(selectedDepId);
  }, [selectedDepId]);

  const chartColors = useMemo(
    () => ({
      primary: isDark ? '#83b899' : '#4a6d58',
      destructive: isDark ? '#d96666' : '#c62020',
      grid: isDark ? '#3d3936' : '#d2cec4',
      axis: isDark ? '#aba69e' : '#545454',
      tooltipBg: isDark ? '#23211f' : '#e9e5dc',
      tooltipBorder: isDark ? '#403d39' : '#d2cec4',
      tooltipText: isDark ? '#eae6df' : '#171717',
    }),
    [isDark]
  );

  const filteredDeputies = useMemo(() => {
    if (!data?.deputadosLista) return [];
    return data.deputadosLista.filter((d) => {
      if (depUfFilter !== 'TODAS' && d.siglaUf !== depUfFilter) return false;
      if (depSearch.trim() !== '') {
        const q = depSearch.toLowerCase();
        return (
          d.nome.toLowerCase().includes(q) ||
          d.siglaPartido.toLowerCase().includes(q) ||
          d.siglaUf.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.deputadosLista, depUfFilter, depSearch]);

  const ufsDisponiveis = useMemo(() => {
    if (!data?.deputadosLista) return [];
    return Array.from(new Set(data.deputadosLista.map((d) => d.siglaUf))).sort();
  }, [data?.deputadosLista]);

  const filteredDespesas = useMemo(() => {
    if (!data?.evolucaoDespesas.ultimasDespesas) return [];
    return data.evolucaoDespesas.ultimasDespesas.filter((d) => {
      if (despesaTipoFilter !== 'TODOS' && d.tipo !== despesaTipoFilter) return false;
      if (despesaSearch.trim() !== '') {
        const q = despesaSearch.toLowerCase();
        return (
          d.fornecedor.toLowerCase().includes(q) ||
          d.tipo.toLowerCase().includes(q) ||
          d.cnpjCpf.includes(q)
        );
      }
      return true;
    });
  }, [data?.evolucaoDespesas.ultimasDespesas, despesaTipoFilter, despesaSearch]);

  const filteredVotacoes = useMemo(() => {
    if (!data?.trabalhoLegislativo.historicoVotacoes) return [];
    return data.trabalhoLegislativo.historicoVotacoes.filter((v) => {
      if (votoTipoFilter !== 'TODOS' && v.voto.toLowerCase() !== votoTipoFilter.toLowerCase()) {
        return false;
      }
      if (votoSearch.trim() !== '') {
        return v.projeto.toLowerCase().includes(votoSearch.toLowerCase());
      }
      return true;
    });
  }, [data?.trabalhoLegislativo.historicoVotacoes, votoTipoFilter, votoSearch]);

  const filteredProposicoes = useMemo(() => {
    if (!data?.trabalhoLegislativo.listaProposicoes) return [];
    return data.trabalhoLegislativo.listaProposicoes.filter((p) => {
      if (propSearch.trim() !== '') {
        const q = propSearch.toLowerCase();
        return (
          p.ementa.toLowerCase().includes(q) ||
          `${p.siglaTipo} ${p.numero}/${p.ano}`.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.trabalhoLegislativo.listaProposicoes, propSearch]);

  return (
    <div className="space-y-8">
      {/* Selector Bar for Federal Deputies (API Dados Abertos Câmara v2) */}
      <div className="bg-card border border-rule p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-primary mb-1">
              <span className="h-[3px] w-6 bg-primary" aria-hidden="true" />
              Auditoria de Gastos e Trabalho Parlamentar • API Câmara v2
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
              Fiscalização de Despesas, Proposições e Votações
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Dados estritamente restritos ao gasto público (Cota Parlamentar CEAP e Notas Fiscais) e produção legislativa (sem notas subjetivas ou dados pessoais).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchParlamentar(selectedDepId)}
              disabled={loading}
              className="px-3 py-2 bg-background border border-border hover:border-primary text-xs font-semibold text-primary inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Recarregar API Câmara</span>
            </button>
          </div>
        </div>

        {/* Search & Select any of the 513 Deputies */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5 items-end">
          <div className="md:col-span-4">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              1. Filtrar por Nome ou Partido:
            </label>
            <div className="flex items-center bg-background border border-border px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                placeholder="Ex: Bilynskyj, Kim, Tabata, Nikolas..."
                className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              2. Filtrar UF:
            </label>
            <select
              value={depUfFilter}
              onChange={(e) => setDepUfFilter(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm text-foreground cursor-pointer"
            >
              <option value="TODAS">Todas UFs (27)</option>
              {ufsDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              3. Selecionar Parlamentar ({filteredDeputies.length} encontrados na Câmara):
            </label>
            <select
              value={selectedDepId}
              onChange={(e) => setSelectedDepId(Number(e.target.value))}
              className="w-full bg-background border border-primary px-3 py-2 text-xs sm:text-sm font-bold text-foreground cursor-pointer"
            >
              {filteredDeputies.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.siglaPartido}-{d.siglaUf}) — ID Câmara #{d.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Selected Parliamentarian Technical Header + Key Spending & Work KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-card border-l-4 border-l-primary border border-border p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground font-bold">
                    {data.parlamentar.siglaPartido} • {data.parlamentar.siglaUf}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ID Câmara: #{data.parlamentar.id}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-extrabold text-foreground">
                  {data.parlamentar.nomeParlamentar}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.parlamentar.cargo} • {data.parlamentar.legislatura} • Situação:{' '}
                  <strong className="text-foreground">{data.parlamentar.situacao}</strong>
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Fonte: dadosabertos.camara.leg.br</span>
                <a
                  href={`https://www.camara.leg.br/deputados/${data.parlamentar.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Página Oficial <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 4 Key Audit Metrics: Total Despesas Período, Média Mensal, Proposições de Autoria, Votações */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Gasto Acumulado (Período)
                </div>
                <div className="font-display text-2xl font-extrabold text-primary mt-2 tabular-nums">
                  {formatBRL(data.evolucaoDespesas.totalPeriodo)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Cota para o Exercício da Atividade Parlamentar (CEAP)
                </p>
              </div>

              <div className="bg-card border border-border p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Média Mensal de Despesa
                </div>
                <div className="font-display text-2xl font-extrabold text-foreground mt-2 tabular-nums">
                  {formatBRL(data.evolucaoDespesas.mediaMensal)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Desembolso médio mensal de recursos públicos
                </p>
              </div>

              <div className="bg-card border border-border p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Proposições de Autoria
                </div>
                <div className="font-display text-3xl font-extrabold text-primary mt-2 tabular-nums">
                  {formatNum(data.trabalhoLegislativo.totalProposicoesAutoria)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Projetos de Lei, PECs, Emendas e Requerimentos
                </p>
              </div>

              <div className="bg-card border border-border p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Votações Nominais
                </div>
                <div className="font-display text-3xl font-extrabold text-foreground mt-2 tabular-nums">
                  {formatNum(data.trabalhoLegislativo.resumoVotacoes.totalRegistradas)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Sim: <strong className="text-primary">{data.trabalhoLegislativo.resumoVotacoes.votosSim}</strong> •
                  Não: <strong className="text-destructive">{data.trabalhoLegislativo.resumoVotacoes.votosNao}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* =================================================================
              SECTION 1 (MAIN HIGHLIGHT): EVOLUÇÃO DE DESPESAS E GASTOS PÚBLICOS
             ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Monthly Expense Evolution Chart (7 cols) */}
            <div className="lg:col-span-7 bg-card border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-primary mb-1">
                    <span className="h-[2px] w-5 bg-primary" aria-hidden="true" />
                    Evolução Temporal de Gasto Público
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Evolução Mensal de Despesas (Cota Parlamentar — R$)
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-background text-primary border border-border font-semibold">
                  Total Período: {formatBRL(data.evolucaoDespesas.totalPeriodo)}
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.evolucaoDespesas.serieMensal}>
                    <defs>
                      <linearGradient id="colorDespesaParl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="mes" stroke={chartColors.axis} fontSize={11} />
                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={11}
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '0px',
                        color: chartColors.tooltipText,
                      }}
                      formatter={(value: unknown) => [
                        formatBRL(Number(value || 0)),
                        'Despesa Mensal',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke={chartColors.primary}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDespesaParl)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown by Category + Top Suppliers (5 cols) */}
            <div className="lg:col-span-5 bg-card border border-border p-6 flex flex-col justify-between">
              <div>
                <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                  <span className="h-[2px] w-5 bg-primary" aria-hidden="true" />
                  Natureza das Despesas (CEAP)
                </p>
                <h3 className="font-display text-lg font-bold text-foreground mb-4">
                  Gastos por Categoria de Despesa
                </h3>

                <div className="space-y-3">
                  {data.evolucaoDespesas.porCategoria.slice(0, 6).map((cat) => (
                    <div key={cat.tipoDespesa} className="space-y-1">
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-foreground font-medium truncate" title={cat.tipoDespesa}>
                          {cat.tipoDespesa}
                        </span>
                        <span className="font-mono text-primary font-bold shrink-0">
                          {formatBRL(cat.valor)} ({cat.percentual}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary overflow-hidden border border-border">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, cat.percentual * 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Suppliers Summary */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Principais Fornecedores Contratados (CNPJ/CPF):
                </div>
                <div className="space-y-2">
                  {data.evolucaoDespesas.maioresFornecedores.slice(0, 3).map((forn) => (
                    <div
                      key={`${forn.nomeFornecedor}-${forn.cnpjCpf}`}
                      className="flex items-center justify-between text-xs bg-background border border-border px-3 py-2"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-foreground">{forn.nomeFornecedor}</span>
                        {forn.cnpjCpf && (
                          <span className="text-[10px] text-muted-foreground ml-1.5">
                            ({forn.cnpjCpf})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {formatBRL(forn.valorTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              SECTION 2: EXTRATO AUDITÁVEL DE NOTAS FISCAIS E DESPESAS
             ================================================================= */}
          <div className="bg-card border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-border">
              <div>
                <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-primary mb-1">
                  <Receipt className="w-3.5 h-3.5" />
                  Prestação de Contas Documental
                </p>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Histórico Detalhado de Despesas e Notas Fiscais ({filteredDespesas.length})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={despesaSearch}
                  onChange={(e) => setDespesaSearch(e.target.value)}
                  placeholder="Buscar fornecedor, CNPJ ou tipo..."
                  className="bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <select
                  value={despesaTipoFilter}
                  onChange={(e) => setDespesaTipoFilter(e.target.value)}
                  className="bg-background border border-border px-3 py-1.5 text-xs text-foreground cursor-pointer max-w-[240px]"
                >
                  <option value="TODOS">Todas as Categorias</option>
                  {data.evolucaoDespesas.porCategoria.map((c) => (
                    <option key={c.tipoDespesa} value={c.tipoDespesa}>
                      {c.tipoDespesa}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Fornecedor / Razão Social</th>
                    <th className="py-2.5 px-3">Tipo de Despesa</th>
                    <th className="py-2.5 px-3 text-right">Valor Líquido</th>
                    <th className="py-2.5 px-3 text-center">Nota Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredDespesas.map((d, idx) => (
                    <tr key={`${d.id}-${idx}`} className="hover:bg-background/60">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {d.data.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <div>{d.fornecedor}</div>
                        {d.cnpjCpf && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            CNPJ/CPF: {d.cnpjCpf}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{d.tipo}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary whitespace-nowrap">
                        {formatBRL(d.valor)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {d.urlDocumento ? (
                          <a
                            href={d.urlDocumento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-background border border-border hover:border-primary text-primary text-[11px] font-medium"
                          >
                            Abrir NF <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">SIGEPA/Interno</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================================
              SECTION 3: HISTÓRICO DE VOTAÇÕES + PROPOSIÇÕES DE AUTORIA
             ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Histórico de Votações Nominais (6 cols) */}
            <div className="lg:col-span-6 bg-card border border-border p-6 flex flex-col">
              <div className="pb-4 mb-4 border-b border-border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-primary">
                    <Vote className="w-3.5 h-3.5" />
                    Plenário da Câmara
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground font-bold">
                      Sim: {data.trabalhoLegislativo.resumoVotacoes.votosSim}
                    </span>
                    <span className="px-2 py-0.5 bg-destructive text-destructive-foreground font-bold">
                      Não: {data.trabalhoLegislativo.resumoVotacoes.votosNao}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3">
                  Histórico de Votações ({filteredVotacoes.length})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={votoSearch}
                    onChange={(e) => setVotoSearch(e.target.value)}
                    placeholder="Buscar PL, PEC, PLP, MPV ou tema..."
                    className="flex-1 bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <select
                    value={votoTipoFilter}
                    onChange={(e) => setVotoTipoFilter(e.target.value)}
                    className="bg-background border border-border px-3 py-1.5 text-xs text-foreground cursor-pointer"
                  >
                    <option value="TODOS">Todos os Votos</option>
                    <option value="Sim">Votou: Sim</option>
                    <option value="Não">Votou: Não</option>
                    <option value="Não votou">Não votou</option>
                  </select>
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 divide-y divide-border">
                {filteredVotacoes.map((v, i) => {
                  const isSim = v.voto.toLowerCase() === 'sim';
                  const isNao = v.voto.toLowerCase() === 'não' || v.voto.toLowerCase() === 'nao';
                  return (
                    <div
                      key={`${v.id}-${i}`}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-background/60 text-xs"
                    >
                      <span className="font-medium text-foreground">{v.projeto}</span>
                      <span
                        className={`px-2.5 py-0.5 font-mono font-bold uppercase text-[11px] shrink-0 ${
                          isSim
                            ? 'bg-primary text-primary-foreground'
                            : isNao
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-secondary text-muted-foreground border border-border'
                        }`}
                      >
                        {v.voto}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proposições de Autoria + Comissões (6 cols) */}
            <div className="lg:col-span-6 bg-card border border-border p-6 flex flex-col">
              <div className="pb-4 mb-4 border-b border-border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-primary">
                    <FileText className="w-3.5 h-3.5" />
                    Produção Legislativa Oficial
                  </p>
                  <span className="px-2 py-0.5 bg-background border border-border text-xs font-mono font-bold text-primary">
                    Total de Autoria: {data.trabalhoLegislativo.totalProposicoesAutoria}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3">
                  Proposições Apresentadas pelo Parlamentar
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {data.trabalhoLegislativo.proposicoesPorTipo.map((pt) => (
                    <span
                      key={pt.siglaTipo}
                      className="text-[11px] font-mono px-2 py-0.5 bg-background border border-border text-foreground"
                    >
                      <strong>{pt.siglaTipo}:</strong> {pt.quantidade}
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  placeholder="Filtrar proposições por código ou palavra-chave da ementa..."
                  className="w-full bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="overflow-y-auto max-h-96 space-y-2.5">
                {filteredProposicoes.map((p) => (
                  <div key={p.id} className="p-3 bg-background border border-border text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display font-bold text-primary">
                        {p.siglaTipo} {p.numero}/{p.ano}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {p.dataApresentacao.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">{p.ementa}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comissões e Órgãos Legislativos */}
          {data.trabalhoLegislativo.comissoesOrgaos.length > 0 && (
            <div className="bg-card border border-border p-6">
              <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                <Landmark className="w-3.5 h-3.5 text-primary" />
                Atuação em Comissões da Câmara
              </p>
              <h3 className="font-display text-lg font-bold text-foreground mb-4">
                Comissões Permanentes, Especiais e Conselhos ({data.trabalhoLegislativo.comissoesOrgaos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.trabalhoLegislativo.comissoesOrgaos.slice(0, 12).map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className="p-3.5 bg-background border border-border flex flex-col justify-between gap-2"
                  >
                    <div className="text-xs font-medium text-foreground line-clamp-2" title={c.orgaoNome}>
                      {c.orgaoNome}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border">
                      <span className="px-2 py-0.5 bg-secondary text-primary font-semibold">
                        {c.papel}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Desde: {c.dataInicio.split('-').reverse().join('/')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
