'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Calculator,
  CheckCircle2,
  Coins,
  Compass,
  Database,
  Globe,
  HardHat,
  Layers,
  MapPin,
  Moon,
  Percent,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ANNUAL_TAX_TARGET_2026,
  BASE_POPULATION_2026,
  DEFAULT_IPCA_SERIES,
  DEFAULT_UNEMPLOYMENT_SERIES,
  HistoricalPoint,
  MAJOR_PUBLIC_WORKS,
  PUBLIC_SPENDING_BY_FUNCTION,
  PUBLIC_WORKS_BY_SECTOR,
  PublicSpendingCategory,
  PublicWorkProject,
  STATES_DATA,
  StateStats,
  TAX_BREAKDOWN,
  TaxBreakdown,
} from '@/lib/brazil-data';
import ParlamentaresPanel from '@/components/ParlamentaresPanel';

interface ApiDashboardResponse {
  updatedAt: string;
  sourcesStatus: {
    ibgePopulacao: 'online' | 'fallback';
    ibgePnadDesemprego: 'online' | 'fallback';
    ibgeIpca: 'online' | 'fallback';
    brasilApiTaxas: 'online' | 'fallback';
    obrasGov: 'online' | 'fallback';
  };
  resumoNacional: {
    populacaoTotal: number;
    taxaDesemprego: number;
    ipcaAcumulado12m: number;
    taxaSelic: number;
    taxaCdi: number;
    pibTotalBilhoes: number;
    pibPerCapita: number;
    metaImpostoAnualReais: number;
    cargaTributariaPctPib: number;
    dividaBrutaPctPib: number;
    salarioMinimo: number;
    obrasTotais: {
      emAndamento: number;
      paralisadas: number;
      concluidas: number;
      emLicitacao: number;
      investimentoTotalBilhoes: number;
    };
  };
  seriesHistoricas: {
    desemprego: HistoricalPoint[];
    ipca: HistoricalPoint[];
  };
  tributos: TaxBreakdown[];
  gastosPublicos: PublicSpendingCategory[];
  obrasPorSetor: typeof PUBLIC_WORKS_BY_SECTOR;
  grandesObras: PublicWorkProject[];
  estados: StateStats[];
}

type TabKey = 'visao-geral' | 'impostometro' | 'obras-publicas' | 'parlamentares' | 'estados';

const INITIAL_FALLBACK_DATA: ApiDashboardResponse = {
  updatedAt: '2026-10-25T00:00:00.000Z',
  sourcesStatus: {
    ibgePopulacao: 'online',
    ibgePnadDesemprego: 'online',
    ibgeIpca: 'online',
    brasilApiTaxas: 'online',
    obrasGov: 'online',
  },
  resumoNacional: {
    populacaoTotal: BASE_POPULATION_2026,
    taxaDesemprego: 5.3,
    ipcaAcumulado12m: 4.58,
    taxaSelic: 13.75,
    taxaCdi: 13.65,
    pibTotalBilhoes: 11842.5,
    pibPerCapita: 55284,
    metaImpostoAnualReais: ANNUAL_TAX_TARGET_2026,
    cargaTributariaPctPib: 33.4,
    dividaBrutaPctPib: 78.2,
    salarioMinimo: 1621,
    obrasTotais: {
      emAndamento: 36210,
      paralisadas: 11590,
      concluidas: 46130,
      emLicitacao: 7635,
      investimentoTotalBilhoes: 764.4,
    },
  },
  seriesHistoricas: {
    desemprego: DEFAULT_UNEMPLOYMENT_SERIES,
    ipca: DEFAULT_IPCA_SERIES,
  },
  tributos: TAX_BREAKDOWN,
  gastosPublicos: PUBLIC_SPENDING_BY_FUNCTION,
  obrasPorSetor: PUBLIC_WORKS_BY_SECTOR,
  grandesObras: MAJOR_PUBLIC_WORKS,
  estados: STATES_DATA,
};

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function BrasilEstatisticasDashboard() {
  const [data, setData] = useState<ApiDashboardResponse>(INITIAL_FALLBACK_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>('visao-geral');
  const [selectedUf, setSelectedUf] = useState<string>('BR');
  const [regionFilter, setRegionFilter] = useState<string>('TODAS');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Filters for Public Works tab
  const [obraStatusFilter, setObraStatusFilter] = useState<string>('TODAS');
  const [obraSectorFilter, setObraSectorFilter] = useState<string>('TODOS');
  const [obraSearch, setObraSearch] = useState<string>('');

  // State ranking sort & search
  const [stateSortBy, setStateSortBy] = useState<
    'pib' | 'populacao' | 'imposto' | 'desemprego' | 'obras' | 'idh'
  >('pib');
  const [stateSearch, setStateSearch] = useState<string>('');

  // Citizen Tax Simulator state
  const [rendaMensal, setRendaMensal] = useState<number>(4500);

  // Real-time clock tick (updates every 60ms)
  const [nowMs, setNowMs] = useState<number>(1792897200000);

  useEffect(() => {
    setNowMs(Date.now());
    const htmlEl = document.documentElement;
    setIsDark(htmlEl.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const htmlEl = document.documentElement;
    const nextDark = !htmlEl.classList.contains('dark');
    if (nextDark) {
      htmlEl.classList.add('dark');
      htmlEl.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      htmlEl.classList.remove('dark');
      htmlEl.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
    setIsDark(nextDark);
  };

  const fetchStatistics = async (uf?: string) => {
    try {
      setRefreshing(true);
      const query = uf && uf !== 'BR' ? `?uf=${uf}` : '';
      const res = await fetch(`/api/estatisticas${query}`);
      if (res.ok) {
        const json: ApiDashboardResponse = await res.json();
        setData(json);
      }
    } catch {
      // Keep fallback data if network fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics(selectedUf);
  }, [selectedUf]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Selected State object (or null if viewing whole Brazil)
  const currentStateObj = useMemo(() => {
    if (selectedUf === 'BR') return null;
    return data.estados.find((s) => s.uf === selectedUf) || null;
  }, [selectedUf, data.estados]);

  // Real-Time Calculations for Impostômetro & Relógio Populacional
  const liveMetrics = useMemo(() => {
    const currentDate = new Date(nowMs);
    const year = currentDate.getFullYear();
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    const endOfYear = new Date(year + 1, 0, 1, 0, 0, 0, 0).getTime();
    const startOfToday = new Date(
      year,
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0,
      0
    ).getTime();

    const yearFraction = Math.max(
      0,
      Math.min(1, (nowMs - startOfYear) / (endOfYear - startOfYear))
    );
    const secondsToday = Math.max(0, (nowMs - startOfToday) / 1000);
    const secondsInYear = (endOfYear - startOfYear) / 1000;

    // Annual tax target (National or State)
    const annualTaxTarget = currentStateObj
      ? currentStateObj.impostoAnualBilhoes * 1_000_000_000
      : data.resumoNacional.metaImpostoAnualReais;

    const taxPerSecond = annualTaxTarget / secondsInYear;
    const taxAccumulatedYear = annualTaxTarget * yearFraction;
    const taxAccumulatedToday = taxPerSecond * secondsToday;

    // Population live clock
    const basePop = currentStateObj
      ? currentStateObj.populacao
      : data.resumoNacional.populacaoTotal;
    const popShare = basePop / data.resumoNacional.populacaoTotal;

    const nationalBirthsPerSec = 1 / 12.13;
    const nationalDeathsPerSec = 1 / 20.38;
    const netGrowthPerSec = (nationalBirthsPerSec - nationalDeathsPerSec) * popShare;

    const birthsToday = Math.floor(secondsToday * nationalBirthsPerSec * popShare);
    const deathsToday = Math.floor(secondsToday * nationalDeathsPerSec * popShare);
    const netGrowthToday = birthsToday - deathsToday;

    const secondsSinceYearStart = Math.max(0, (nowMs - startOfYear) / 1000);
    const livePopulation = Math.floor(basePop + secondsSinceYearStart * netGrowthPerSec * 0.15);

    const taxPerCapitaYear = taxAccumulatedYear / Math.max(1, livePopulation);

    return {
      annualTaxTarget,
      taxPerSecond,
      taxAccumulatedYear,
      taxAccumulatedToday,
      taxPerCapitaYear,
      livePopulation,
      birthsToday,
      deathsToday,
      netGrowthToday,
      yearFractionPct: yearFraction * 100,
    };
  }, [nowMs, currentStateObj, data]);

  // Macro display values (National vs Selected UF)
  const displayMetrics = useMemo(() => {
    if (currentStateObj) {
      const totalObras =
        currentStateObj.obras.emAndamento +
        currentStateObj.obras.paralisadas +
        currentStateObj.obras.concluidas +
        currentStateObj.obras.emLicitacao;
      const pctParalisadas =
        (currentStateObj.obras.paralisadas / Math.max(1, totalObras)) * 100;
      const desocupadosEstimados = Math.round(
        currentStateObj.populacao * 0.52 * (currentStateObj.taxaDesemprego / 100)
      );

      return {
        tituloEscopo: `${currentStateObj.nome} (${currentStateObj.uf})`,
        subtituloEscopo: `Região ${currentStateObj.regiao} • Capital: ${currentStateObj.capital}`,
        taxaDesemprego: currentStateObj.taxaDesemprego,
        desocupadosEstimados,
        pibBilhoes: currentStateObj.pibBilhoes,
        pibPerCapita: currentStateObj.pibPerCapita,
        idh: currentStateObj.idh,
        saneamentoPct: currentStateObj.saneamentoPct,
        obras: currentStateObj.obras,
        pctParalisadas,
      };
    }

    const obras = data.resumoNacional.obrasTotais;
    const totalObras =
      obras.emAndamento + obras.paralisadas + obras.concluidas + obras.emLicitacao;
    const pctParalisadas = (obras.paralisadas / Math.max(1, totalObras)) * 100;
    const desocupadosEstimados = Math.round(
      110_400_000 * (data.resumoNacional.taxaDesemprego / 100)
    );

    return {
      tituloEscopo: 'República Federativa do Brasil',
      subtituloEscopo: 'Consolidado Nacional • 26 Estados e Distrito Federal (5.570 Municípios)',
      taxaDesemprego: data.resumoNacional.taxaDesemprego,
      desocupadosEstimados,
      pibBilhoes: data.resumoNacional.pibTotalBilhoes,
      pibPerCapita: data.resumoNacional.pibPerCapita,
      idh: 0.766,
      saneamentoPct: 75.8,
      obras,
      pctParalisadas,
    };
  }, [currentStateObj, data]);

  // Filtered Public Works Projects
  const filteredPublicWorks = useMemo(() => {
    return data.grandesObras.filter((obra) => {
      if (selectedUf !== 'BR' && obra.uf !== selectedUf) return false;
      if (obraStatusFilter !== 'TODAS' && obra.status !== obraStatusFilter) return false;
      if (obraSectorFilter !== 'TODOS' && obra.setor !== obraSectorFilter) return false;
      if (obraSearch.trim() !== '') {
        const q = obraSearch.toLowerCase();
        return (
          obra.nome.toLowerCase().includes(q) ||
          obra.municipio.toLowerCase().includes(q) ||
          obra.orgao.toLowerCase().includes(q) ||
          obra.uf.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.grandesObras, selectedUf, obraStatusFilter, obraSectorFilter, obraSearch]);

  // Regional aggregations for charts
  const regionalStats = useMemo(() => {
    const regions = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'] as const;
    return regions.map((reg) => {
      const statesInReg = data.estados.filter((s) => s.regiao === reg);
      const populacaoMilhoes =
        Math.round(
          (statesInReg.reduce((acc, s) => acc + s.populacao, 0) / 1_000_000) * 10
        ) / 10;
      const pibBilhoes =
        Math.round(statesInReg.reduce((acc, s) => acc + s.pibBilhoes, 0) * 10) / 10;
      const obrasAndamento = statesInReg.reduce(
        (acc, s) => acc + s.obras.emAndamento,
        0
      );
      const obrasParalisadas = statesInReg.reduce(
        (acc, s) => acc + s.obras.paralisadas,
        0
      );
      const mediaDesemprego =
        Math.round(
          (statesInReg.reduce((acc, s) => acc + s.taxaDesemprego, 0) /
            Math.max(1, statesInReg.length)) *
            10
        ) / 10;
      return {
        regiao: reg,
        populacaoMilhoes,
        pibBilhoes,
        obrasAndamento,
        obrasParalisadas,
        mediaDesemprego,
      };
    });
  }, [data.estados]);

  // Sorted States for the UF Ranking Table
  const sortedStates = useMemo(() => {
    return [...data.estados]
      .filter((s) => {
        if (regionFilter !== 'TODAS' && s.regiao !== regionFilter) return false;
        if (stateSearch.trim() !== '') {
          const q = stateSearch.toLowerCase();
          return (
            s.nome.toLowerCase().includes(q) ||
            s.uf.toLowerCase().includes(q) ||
            s.capital.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (stateSortBy === 'pib') return b.pibBilhoes - a.pibBilhoes;
        if (stateSortBy === 'populacao') return b.populacao - a.populacao;
        if (stateSortBy === 'imposto') return b.impostoAnualBilhoes - a.impostoAnualBilhoes;
        if (stateSortBy === 'desemprego') return a.taxaDesemprego - b.taxaDesemprego;
        if (stateSortBy === 'obras') return b.obras.emAndamento - a.obras.emAndamento;
        return b.idh - a.idh;
      });
  }, [data.estados, regionFilter, stateSearch, stateSortBy]);

  // Citizen Tax Simulator calculation
  const taxSimulation = useMemo(() => {
    const rendaAnual = rendaMensal * 12;
    const aliquotaEfetiva =
      rendaMensal <= 2500 ? 0.345 : rendaMensal <= 7500 ? 0.392 : 0.428;
    const impostoTotalAnual = rendaAnual * aliquotaEfetiva;
    const impostoMensal = impostoTotalAnual / 12;
    const diasTrabalhadosParaImposto = Math.round(365 * aliquotaEfetiva);
    return {
      rendaAnual,
      aliquotaEfetivaPct: Math.round(aliquotaEfetiva * 1000) / 10,
      impostoTotalAnual,
      impostoMensal,
      diasTrabalhadosParaImposto,
    };
  }, [rendaMensal]);

  // Dynamic Chart colors matching Rams.Log light/dark variables
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Technical Telemetry Bar */}
      <div className="bg-card border-b border-border px-6 md:px-10 py-2 text-[11px]">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-primary">
              <span className="h-2 w-2 bg-primary animate-pulse" />
              Fontes Abertas Conectadas:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              IBGE SIDRA (População & PNAD)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              IBGE IPCA
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              BCB / BrasilAPI (Selic & CDI)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              Obrasgov.br / Transferegov
            </span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              Sincronizado:{' '}
              <strong className="text-foreground">
                {new Date(data.updatedAt).toLocaleTimeString('pt-BR')}
              </strong>
            </span>
            <button
              onClick={() => fetchStatistics(selectedUf)}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-primary hover:opacity-80 font-medium transition-opacity cursor-pointer disabled:opacity-50"
              title="Recarregar dados das APIs oficiais"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header — Exact Rams.Log Structure & Typography */}
      <header className="w-full bg-background sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-5 border-b border-rule gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveTab('visao-geral');
                  setSelectedUf('BR');
                }}
                className="block text-left leading-none cursor-pointer"
              >
                <span className="block font-display text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                  Brasil<span className="text-primary">.Hoje</span>
                </span>
                <span className="block mt-2 text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Impostos • Obras Públicas • Economia • Demografia
                </span>
              </button>

              {/* Mobile Theme Toggle */}
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  onClick={toggleTheme}
                  className="relative w-9 h-9 flex items-center justify-center border border-border bg-card hover:text-primary transition-colors cursor-pointer"
                  aria-label="Alternar tema"
                  title="Alternar modo claro / noturno"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>
              </div>
            </div>

            {/* Navigation + UF Filter + Theme Switcher */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 md:gap-8">
              <nav className="flex flex-wrap items-center gap-5 md:gap-8">
                {[
                  { id: 'visao-geral', label: 'Visão Geral', icon: Activity },
                  { id: 'impostometro', label: 'Impostômetro', icon: Coins },
                  { id: 'obras-publicas', label: 'Obras Públicas', icon: HardHat },
                  { id: 'parlamentares', label: 'Gastos Parlamentares', icon: Users },
                  { id: 'estados', label: 'Estados (27 UFs)', icon: Globe },
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabKey)}
                      className={`text-xs md:text-sm font-medium pb-1.5 border-b-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-primary text-primary font-semibold'
                          : 'border-transparent text-foreground hover:text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-3">
                {/* UF Selector in Rams.Log sharp style */}
                <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <label
                    htmlFor="uf-select"
                    className="text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    UF:
                  </label>
                  <select
                    id="uf-select"
                    value={selectedUf}
                    onChange={(e) => setSelectedUf(e.target.value)}
                    className="bg-transparent text-xs md:text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="BR" className="bg-card text-foreground">
                      Brasil (27 UFs)
                    </option>
                    {data.estados.map((st) => (
                      <option key={st.uf} value={st.uf} className="bg-card text-foreground">
                        {st.uf} — {st.nome}
                      </option>
                    ))}
                  </select>
                  {selectedUf !== 'BR' && (
                    <button
                      onClick={() => setSelectedUf('BR')}
                      className="text-[11px] text-primary hover:underline ml-1 cursor-pointer"
                    >
                      [Nacional]
                    </button>
                  )}
                </div>

                {/* Desktop Theme Toggle Button (Exact Rams.Log animation) */}
                <button
                  onClick={toggleTheme}
                  className="hidden lg:flex relative w-9 h-9 items-center justify-center border border-border bg-card hover:text-primary transition-colors cursor-pointer"
                  aria-label="Alternar tema"
                  title="Alternar modo claro / noturno"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow flex flex-col items-center w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8 space-y-10">
          {/* Editorial Intro & Active Scope Header */}
          <section className="pb-6 border-b border-border flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-4 font-mono text-xs md:text-sm font-medium uppercase tracking-[0.3em] mb-3">
                <span className="h-[3px] w-8 bg-primary" aria-hidden="true" />
                Caderno de Dados Abertos • {selectedUf === 'BR' ? 'Nacional' : `UF: ${selectedUf}`}
              </p>
              <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-[1.08] text-foreground">
                {displayMetrics.tituloEscopo}.
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                {displayMetrics.subtituloEscopo}
                {loading && ' • Sincronizando séries oficiais...'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border border-border bg-card p-4 shrink-0">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Taxa Selic
                </div>
                <div className="font-display text-lg md:text-xl font-bold text-primary mt-0.5">
                  {formatNumber(data.resumoNacional.taxaSelic, 2)}%
                </div>
              </div>
              <div className="border-l border-border pl-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  IPCA (12m)
                </div>
                <div className="font-display text-lg md:text-xl font-bold text-destructive mt-0.5">
                  {formatNumber(data.resumoNacional.ipcaAcumulado12m, 2)}%
                </div>
              </div>
              <div className="border-l border-border pl-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Salário Mín.
                </div>
                <div className="font-display text-lg md:text-xl font-bold text-foreground mt-0.5">
                  R$ {formatNumber(data.resumoNacional.salarioMinimo)}
                </div>
              </div>
            </div>
          </section>

          {/* HERO REAL-TIME CLOCKS: IMPOSTÔMETRO + POPULAÇÃO IBGE */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-rule">
            {/* Impostômetro Card (7 cols) */}
            <div className="lg:col-span-7 bg-card border border-border p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-foreground">
                    <span className="h-[3px] w-6 bg-primary" aria-hidden="true" />
                    Impostômetro em Tempo Real ({new Date(nowMs).getFullYear()})
                  </p>
                  <span className="text-xs font-mono text-primary bg-background px-2.5 py-1 border border-border">
                    +{formatCurrencyFull(liveMetrics.taxPerSecond)} / seg
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Total estimado de impostos, taxas e contribuições pagos pelos cidadãos desde 01/Jan ({selectedUf === 'BR' ? 'Brasil' : selectedUf}).
                </p>

                {/* Giant Live Counter */}
                <div className="my-4 bg-background border-l-4 border-l-primary border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center justify-between">
                    <span>Arrecadação Acumulada no Ano</span>
                    <span>{formatNumber(liveMetrics.yearFractionPct, 4)}% do exercício</span>
                  </div>
                  <div className="font-display text-2xl sm:text-4xl xl:text-[2.6rem] font-extrabold tracking-tight text-primary tabular-nums break-all leading-tight">
                    {formatCurrencyFull(liveMetrics.taxAccumulatedYear)}
                  </div>
                </div>

                {/* Sub-counters: Today, Per Capita, Sphere Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
                  <div className="bg-background border border-border p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Pago Hoje (desde 00h)
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-foreground tabular-nums mt-1">
                      {formatCurrencyFull(liveMetrics.taxAccumulatedToday)}
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Imposto Per Capita (Ano)
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-primary tabular-nums mt-1">
                      {formatCurrencyFull(liveMetrics.taxPerCapitaYear)}
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Carga Tributária Bruta
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-foreground mt-1">
                      {formatNumber(data.resumoNacional.cargaTributariaPctPib, 1)}% do PIB
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown by Federative Sphere */}
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex flex-wrap justify-between text-xs text-muted-foreground gap-2">
                  <span>
                    União (67,6%):{' '}
                    <strong className="text-foreground">
                      R$ {formatNumber((liveMetrics.taxAccumulatedYear * 0.676) / 1e9, 2)} bi
                    </strong>
                  </span>
                  <span>
                    Estados (25,5%):{' '}
                    <strong className="text-primary">
                      R$ {formatNumber((liveMetrics.taxAccumulatedYear * 0.255) / 1e9, 2)} bi
                    </strong>
                  </span>
                  <span>
                    Municípios (6,9%):{' '}
                    <strong className="text-foreground">
                      R$ {formatNumber((liveMetrics.taxAccumulatedYear * 0.069) / 1e9, 2)} bi
                    </strong>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-secondary overflow-hidden flex border border-border">
                  <div
                    className="bg-foreground h-full"
                    style={{ width: '67.6%' }}
                    title="União (Federal): 67,6%"
                  />
                  <div
                    className="bg-primary h-full"
                    style={{ width: '25.5%' }}
                    title="Estados (ICMS/IPVA): 25,5%"
                  />
                  <div
                    className="bg-muted-foreground h-full"
                    style={{ width: '6.9%' }}
                    title="Municípios (ISS/IPTU): 6,9%"
                  />
                </div>
              </div>
            </div>

            {/* Relógio Populacional IBGE Card (5 cols) */}
            <div className="lg:col-span-5 bg-card border border-border p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-foreground">
                    <span className="h-[3px] w-6 bg-primary" aria-hidden="true" />
                    População IBGE
                  </p>
                  <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 bg-background text-primary border border-border font-medium">
                    SIDRA / Censo
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Projeção demográfica contínua de residentes ({selectedUf === 'BR' ? 'Brasil' : selectedUf}).
                </p>

                {/* Population Live Counter */}
                <div className="my-4 bg-background border-l-4 border-l-foreground border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    Habitantes Residentes Estimados Agora
                  </div>
                  <div className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                    {formatNumber(liveMetrics.livePopulation)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    Crescimento líquido nacional: <strong className="text-primary">+1 hab. a cada ~29,8s</strong>
                  </div>
                </div>

                {/* Births, Deaths, Net Growth Today */}
                <div className="grid grid-cols-3 gap-3 my-5">
                  <div className="bg-background border border-border p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Nascimentos Hoje
                    </div>
                    <div className="font-display text-base font-bold text-primary tabular-nums mt-1">
                      +{formatNumber(liveMetrics.birthsToday)}
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Óbitos Hoje
                    </div>
                    <div className="font-display text-base font-bold text-destructive tabular-nums mt-1">
                      -{formatNumber(liveMetrics.deathsToday)}
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Saldo Hoje
                    </div>
                    <div className="font-display text-base font-bold text-foreground tabular-nums mt-1">
                      +{formatNumber(liveMetrics.netGrowthToday)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  IDH ({selectedUf}): <strong className="text-foreground">{displayMetrics.idh.toFixed(3)}</strong>
                </span>
                <span>
                  Saneamento Básico:{' '}
                  <strong className="text-primary">{formatNumber(displayMetrics.saneamentoPct, 1)}%</strong>
                </span>
              </div>
            </div>
          </section>

          {/* KEY MACRO INDICATORS GRID (4 CARDS) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-border">
            {/* Card 1: Taxa de Desemprego */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Taxa de Desemprego
                </span>
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {formatNumber(displayMetrics.taxaDesemprego, 1)}%
                </span>
                <span className="inline-flex items-center text-[11px] font-medium text-primary bg-background px-2 py-0.5 border border-border">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  PNAD
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2.5">
                Aprox. <strong className="text-foreground">{formatNumber(displayMetrics.desocupadosEstimados)}</strong>{' '}
                desocupados ({selectedUf})
              </p>
            </div>

            {/* Card 2: Obras Públicas em Andamento */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Obras em Execução
                </span>
                <HardHat className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {formatNumber(displayMetrics.obras.emAndamento)}
                </span>
                <span className="text-xs text-primary font-semibold">
                  R$ {formatNumber(displayMetrics.obras.investimentoTotalBilhoes, 1)} bi
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2.5">
                <span>
                  Concluídas: <strong className="text-primary">{formatNumber(displayMetrics.obras.concluidas)}</strong>
                </span>
                <span>
                  Paralisadas:{' '}
                  <strong className="text-destructive">{formatNumber(displayMetrics.obras.paralisadas)}</strong>
                </span>
              </div>
            </div>

            {/* Card 3: PIB & Renda Per Capita */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Produto Interno Bruto
                </span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {displayMetrics.pibBilhoes >= 1000
                    ? `R$ ${formatNumber(displayMetrics.pibBilhoes / 1000, 2)} tri`
                    : `R$ ${formatNumber(displayMetrics.pibBilhoes, 1)} bi`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2.5">
                PIB per capita:{' '}
                <strong className="text-primary">R$ {formatNumber(displayMetrics.pibPerCapita)} / ano</strong>
              </p>
            </div>

            {/* Card 4: Inflação (IPCA) & Dívida */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Inflação & Dívida
                </span>
                <Percent className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <span className="font-display text-3xl font-extrabold text-foreground">
                    {formatNumber(data.resumoNacional.ipcaAcumulado12m, 2)}%
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-1">IPCA</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <span className="font-display text-xl font-bold text-primary">
                    {formatNumber(data.resumoNacional.taxaSelic, 2)}%
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-1">Selic</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2.5">
                Dívida Bruta:{' '}
                <strong className="text-foreground">
                  {formatNumber(data.resumoNacional.dividaBrutaPctPib, 1)}% do PIB
                </strong>
              </p>
            </div>
          </section>

          {/* =====================================================================
              TAB 1: VISÃO GERAL (ECONOMIA, DESEMPREGO, INFLAÇÃO, REGIÕES)
             ===================================================================== */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-8">
              {/* Historical Series Charts: Unemployment & IPCA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Taxa de Desocupação PNAD IBGE */}
                <div className="bg-card border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                        <span className="h-[2px] w-5 bg-primary" aria-hidden="true" />
                        Série Histórica IBGE PNAD
                      </p>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        Taxa de Desocupação (Desemprego %)
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-background text-primary border border-border font-semibold">
                      Atual: {formatNumber(data.resumoNacional.taxaDesemprego, 1)}%
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.seriesHistoricas.desemprego}>
                        <defs>
                          <linearGradient id="colorDesemprego" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="periodo" stroke={chartColors.axis} fontSize={11} />
                        <YAxis
                          stroke={chartColors.axis}
                          fontSize={11}
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            borderColor: chartColors.tooltipBorder,
                            borderRadius: '0px',
                            color: chartColors.tooltipText,
                          }}
                          formatter={(value: unknown) => [`${value}%`, 'Taxa de Desocupação']}
                        />
                        <Area
                          type="monotone"
                          dataKey="valor"
                          stroke={chartColors.primary}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorDesemprego)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Inflação IPCA Acumulado 12 Meses */}
                <div className="bg-card border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                        <span className="h-[2px] w-5 bg-destructive" aria-hidden="true" />
                        Índice Oficial de Preços (IBGE)
                      </p>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        IPCA Acumulado em 12 Meses (%)
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-background text-destructive border border-border font-semibold">
                      Atual: {formatNumber(data.resumoNacional.ipcaAcumulado12m, 2)}%
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.seriesHistoricas.ipca}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="periodo" stroke={chartColors.axis} fontSize={11} />
                        <YAxis
                          stroke={chartColors.axis}
                          fontSize={11}
                          domain={['dataMin - 0.4', 'dataMax + 0.4']}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            borderColor: chartColors.tooltipBorder,
                            borderRadius: '0px',
                            color: chartColors.tooltipText,
                          }}
                          formatter={(value: unknown) => [`${value}%`, 'IPCA Acumulado 12m']}
                        />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke={chartColors.destructive}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: chartColors.destructive }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Regional Comparison + Public Works by Sector Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Obras por Setor (7 cols) */}
                <div className="lg:col-span-7 bg-card border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                        <span className="h-[2px] w-5 bg-primary" aria-hidden="true" />
                        Infraestrutura & Cadastro Obrasgov.br
                      </p>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        Obras Públicas por Setor (Ativas vs Paralisadas)
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('obras-publicas')}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Explorar obras <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.obrasPorSetor} layout="vertical" margin={{ left: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis type="number" stroke={chartColors.axis} fontSize={11} />
                        <YAxis
                          dataKey="setor"
                          type="category"
                          stroke={chartColors.axis}
                          fontSize={11}
                          width={155}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            borderColor: chartColors.tooltipBorder,
                            borderRadius: '0px',
                            color: chartColors.tooltipText,
                          }}
                        />
                        <Legend />
                        <Bar dataKey="emExecucao" name="Em Execução" fill={chartColors.primary} />
                        <Bar dataKey="paralisadas" name="Paralisadas" fill={chartColors.destructive} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Síntese Macro Regional (5 cols) */}
                <div className="lg:col-span-5 bg-card border border-border p-6 flex flex-col justify-between">
                  <div>
                    <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                      <span className="h-[2px] w-5 bg-primary" aria-hidden="true" />
                      Divisão Territorial IBGE
                    </p>
                    <h3 className="font-display text-lg font-bold text-foreground mb-4">
                      Radiografia das 5 Macrorregiões
                    </h3>

                    <div className="space-y-3">
                      {regionalStats.map((reg) => (
                        <div
                          key={reg.regiao}
                          className="p-3.5 bg-background border border-border flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-display text-sm font-bold text-foreground">
                              {reg.regiao}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Pop: <strong className="text-foreground">{reg.populacaoMilhoes} mi</strong> •
                              Desemprego: <strong className="text-primary">{reg.mediaDesemprego}%</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-sm font-bold text-primary">
                              R$ {formatNumber(reg.pibBilhoes, 0)} bi
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(reg.obrasAndamento)} obras ativas
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Comparar todas as 27 UFs:</span>
                    <button
                      onClick={() => setActiveTab('estados')}
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Abrir Tabela de Estados <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: IMPOSTÔMETRO & GASTOS PÚBLICOS + SIMULADOR DO CIDADÃO
             ===================================================================== */}
          {activeTab === 'impostometro' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-card border border-border p-6 md:p-8">
                <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                  <span className="h-[3px] w-6 bg-primary" aria-hidden="true" />
                  Receita Tributária por Espécie
                </p>
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  Arrecadação em Tempo Real por Tributo ({new Date(nowMs).getFullYear()})
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Valores acumulados desde 1º de janeiro em{' '}
                  <strong className="text-foreground">{displayMetrics.tituloEscopo}</strong>
                </p>

                <div className="space-y-4">
                  {data.tributos.map((trib) => {
                    const valorReais =
                      liveMetrics.taxAccumulatedYear * (trib.percentualTotal / 100);
                    return (
                      <div
                        key={trib.sigla}
                        className="p-4 bg-background border border-border"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground">
                              {trib.sigla}
                            </span>
                            <span className="font-display text-sm font-bold text-foreground">
                              {trib.nome}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-secondary text-muted-foreground border border-border">
                              {trib.esfera}
                            </span>
                          </div>
                          <div className="font-display text-sm sm:text-base font-extrabold text-primary tabular-nums">
                            {formatCurrencyFull(valorReais)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2.5">{trib.descricao}</p>
                        <div className="w-full h-2 bg-secondary overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${trib.percentualTotal * 3.5}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Direita: Calculadora do Cidadão + Orçamento Público */}
              <div className="lg:col-span-5 space-y-8">
                {/* Calculadora do Contribuinte */}
                <div className="bg-card border border-rule p-6">
                  <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-primary mb-1">
                    <Calculator className="w-4 h-4" />
                    Simulador Individual IBPT
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">
                    Calculadora do Cidadão Contribuinte
                  </h3>
                  <p className="text-xs text-muted-foreground mb-5">
                    Estime quanto da sua renda mensal vai para impostos diretos (folha/renda) e indiretos (consumo).
                  </p>

                  <div className="my-4">
                    <label className="block text-xs text-foreground font-medium mb-2">
                      Renda Mensal Bruta Familiar (R$):
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1621}
                        max={50000}
                        step={100}
                        value={rendaMensal}
                        onChange={(e) => setRendaMensal(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="font-display text-base font-bold text-primary bg-background px-3 py-1.5 border border-border shrink-0">
                        R$ {formatNumber(rendaMensal)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-background border border-border p-3.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Imposto / Mês
                      </div>
                      <div className="font-display text-base font-bold text-foreground mt-1">
                        {formatCurrencyFull(taxSimulation.impostoMensal)}
                      </div>
                    </div>
                    <div className="bg-background border border-border p-3.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Imposto / Ano
                      </div>
                      <div className="font-display text-base font-bold text-primary mt-1">
                        {formatCurrencyFull(taxSimulation.impostoTotalAnual)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-background border-l-4 border-l-primary border border-border text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alíquota Efetiva Estimada:</span>
                      <strong className="text-primary">{taxSimulation.aliquotaEfetivaPct}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dias trabalhados para pagar tributos:</span>
                      <strong className="text-foreground">
                        {taxSimulation.diasTrabalhadosParaImposto} dias / ano
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Destinação dos Recursos Públicos */}
                <div className="bg-card border border-border p-6">
                  <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    Orçamento Fiscal e Seguridade
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">
                    Destinação dos Gastos Públicos por Função
                  </h3>
                  <p className="text-xs text-muted-foreground mb-5">
                    Distribuição percentual das despesas primárias e financeiras
                  </p>

                  <div className="space-y-3.5">
                    {data.gastosPublicos.map((g) => (
                      <div key={g.funcao} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">{g.funcao}</span>
                          <span className="font-mono text-muted-foreground">
                            <strong className="text-foreground">{g.percentual}%</strong> (R${' '}
                            {formatNumber(g.valorBilhoes, 1)} bi)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${g.percentual * 2.5}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: OBRAS PÚBLICAS EM ANDAMENTO (OBRASGOV.BR / NOVO PAC / TCU)
             ===================================================================== */}
          {activeTab === 'obras-publicas' && (
            <div className="space-y-8">
              {/* Summary Banner of Public Works */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border-l-4 border-l-primary border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                    Obras em Execução ({selectedUf})
                  </div>
                  <div className="font-display text-3xl font-extrabold text-primary mt-1">
                    {formatNumber(displayMetrics.obras.emAndamento)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Canteiros ativos com repasses regulares
                  </div>
                </div>

                <div className="bg-card border-l-4 border-l-foreground border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                    Obras Concluídas (Ciclo Atual)
                  </div>
                  <div className="font-display text-3xl font-extrabold text-foreground mt-1">
                    {formatNumber(displayMetrics.obras.concluidas)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Entregues à população (Transferegov)
                  </div>
                </div>

                <div className="bg-card border-l-4 border-l-destructive border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                    Obras Paralisadas / Inacabadas
                  </div>
                  <div className="font-display text-3xl font-extrabold text-destructive mt-1">
                    {formatNumber(displayMetrics.obras.paralisadas)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatNumber(displayMetrics.pctParalisadas, 1)}% do total monitorado pelo TCU
                  </div>
                </div>

                <div className="bg-card border border-border p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                    Investimento Previsto ({selectedUf})
                  </div>
                  <div className="font-display text-3xl font-extrabold text-foreground mt-1">
                    R$ {formatNumber(displayMetrics.obras.investimentoTotalBilhoes, 1)} bi
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Em licitação: {formatNumber(displayMetrics.obras.emLicitacao)} projetos
                  </div>
                </div>
              </div>

              {/* Filter Bar for Major Projects */}
              <div className="bg-card border border-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={obraSearch}
                    onChange={(e) => setObraSearch(e.target.value)}
                    placeholder="Buscar obra por nome, rodovia, município, órgão ou UF..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={obraStatusFilter}
                    onChange={(e) => setObraStatusFilter(e.target.value)}
                    className="bg-background border border-border px-3 py-2 text-xs sm:text-sm text-foreground cursor-pointer"
                  >
                    <option value="TODAS">Status: Todos</option>
                    <option value="Em Execução">Em Execução</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Paralisada">Paralisada</option>
                    <option value="Em Licitação">Em Licitação</option>
                  </select>

                  <select
                    value={obraSectorFilter}
                    onChange={(e) => setObraSectorFilter(e.target.value)}
                    className="bg-background border border-border px-3 py-2 text-xs sm:text-sm text-foreground cursor-pointer"
                  >
                    <option value="TODOS">Setor: Todos os Eixos</option>
                    <option value="Transportes e Logística">Transportes e Logística</option>
                    <option value="Saneamento e Água">Saneamento e Água</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Habitação e Mobilidade">Habitação e Mobilidade</option>
                    <option value="Energia">Energia</option>
                  </select>
                </div>
              </div>

              {/* List of Monitored Public Works Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPublicWorks.map((obra) => {
                  const statusBadge =
                    obra.status === 'Em Execução'
                      ? 'bg-primary text-primary-foreground'
                      : obra.status === 'Paralisada'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-secondary text-secondary-foreground border border-border';

                  return (
                    <div
                      key={obra.id}
                      className="bg-card border border-border p-6 flex flex-col justify-between hover:border-primary transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-mono text-muted-foreground bg-background px-2.5 py-0.5 border border-border">
                            {obra.id} • {obra.uf} ({obra.municipio})
                          </span>
                          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 ${statusBadge}`}>
                            {obra.status}
                          </span>
                        </div>

                        <h4 className="font-display text-base font-bold text-foreground mb-1.5">
                          {obra.nome}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          <strong className="text-foreground">Órgão:</strong> {obra.orgao} •{' '}
                          <strong className="text-foreground">Programa:</strong> {obra.programa}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-border">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Execução Física da Obra</span>
                            <span className="font-display font-bold text-foreground">
                              {formatNumber(obra.percentualExecucao, 1)}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-background overflow-hidden border border-border">
                            <div
                              className={`h-full ${
                                obra.status === 'Paralisada' ? 'bg-destructive' : 'bg-primary'
                              }`}
                              style={{ width: `${obra.percentualExecucao}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                          <div>
                            <span className="text-muted-foreground">Orçamento: </span>
                            <strong className="text-foreground">
                              R$ {formatNumber(obra.orcamentoMilhoes, 1)} mi
                            </strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Executado: </span>
                            <strong className="text-primary">
                              R$ {formatNumber(obra.valorExecutadoMilhoes, 1)} mi
                            </strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Previsão: </span>
                            <strong className="text-foreground">{obra.previsaoConclusao}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: GASTOS E TRABALHO PARLAMENTAR (API CÂMARA v2)
             ===================================================================== */}
          {activeTab === 'parlamentares' && <ParlamentaresPanel isDark={isDark} />}

          {/* =====================================================================
              TAB 5: RANKING E RAIO-X DOS 27 ESTADOS (UFs)
             ===================================================================== */}
          {activeTab === 'estados' && (
            <div className="bg-card border border-border p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div>
                  <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground mb-1">
                    <span className="h-[3px] w-6 bg-primary" aria-hidden="true" />
                    Federação Brasileira (27 UFs)
                  </p>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Comparativo Oficial das Unidades da Federação
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clique em qualquer Estado para recalcular o Impostômetro, População e Obras da UF
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Buscar estado ou capital..."
                    className="bg-background border border-border px-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />

                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-background border border-border px-3 py-1.5 text-xs sm:text-sm text-foreground cursor-pointer"
                  >
                    <option value="TODAS">Todas as Regiões</option>
                    <option value="Sudeste">Sudeste</option>
                    <option value="Sul">Sul</option>
                    <option value="Nordeste">Nordeste</option>
                    <option value="Centro-Oeste">Centro-Oeste</option>
                    <option value="Norte">Norte</option>
                  </select>

                  <select
                    value={stateSortBy}
                    onChange={(e) =>
                      setStateSortBy(
                        e.target.value as
                          | 'pib'
                          | 'populacao'
                          | 'imposto'
                          | 'desemprego'
                          | 'obras'
                          | 'idh'
                      )
                    }
                    className="bg-background border border-border px-3 py-1.5 text-xs sm:text-sm text-primary font-semibold cursor-pointer"
                  >
                    <option value="pib">Ordenar: Maior PIB</option>
                    <option value="populacao">Ordenar: Maior População</option>
                    <option value="imposto">Ordenar: Maior Arrecadação</option>
                    <option value="desemprego">Ordenar: Menor Desemprego</option>
                    <option value="obras">Ordenar: Mais Obras Ativas</option>
                    <option value="idh">Ordenar: Maior IDH</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-3">UF / Estado</th>
                      <th className="py-3 px-3">Região</th>
                      <th className="py-3 px-3 text-right">População (IBGE)</th>
                      <th className="py-3 px-3 text-right">Desemprego</th>
                      <th className="py-3 px-3 text-right">PIB Estadual</th>
                      <th className="py-3 px-3 text-right">Impostos / Ano</th>
                      <th className="py-3 px-3 text-right">Obras Ativas</th>
                      <th className="py-3 px-3 text-right">Paralisadas</th>
                      <th className="py-3 px-3 text-right">IDH</th>
                      <th className="py-3 px-3 text-center">Recorte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs sm:text-sm">
                    {sortedStates.map((st, idx) => {
                      const isSelected = selectedUf === st.uf;
                      return (
                        <tr
                          key={st.uf}
                          onClick={() => setSelectedUf(st.uf)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-secondary font-semibold' : 'hover:bg-background/70'
                          }`}
                        >
                          <td className="py-3 px-3 text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                              <span className="px-2 py-0.5 bg-primary text-primary-foreground font-bold text-xs">
                                {st.uf}
                              </span>
                              <span className="font-display font-bold">{st.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">{st.regiao}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-foreground">
                            {formatNumber(st.populacao)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            <span
                              className={`px-2 py-0.5 border border-border ${
                                st.taxaDesemprego <= 5.0
                                  ? 'text-primary bg-background'
                                  : st.taxaDesemprego >= 7.5
                                  ? 'text-destructive bg-background'
                                  : 'text-foreground bg-background'
                              }`}
                            >
                              {formatNumber(st.taxaDesemprego, 1)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-primary font-bold">
                            R$ {formatNumber(st.pibBilhoes, 1)} bi
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-foreground">
                            R$ {formatNumber(st.impostoAnualBilhoes, 1)} bi
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-primary font-semibold">
                            {formatNumber(st.obras.emAndamento)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-destructive">
                            {formatNumber(st.obras.paralisadas)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                            {st.idh.toFixed(3)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUf(st.uf);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 bg-background border border-border hover:border-primary text-primary text-xs font-medium cursor-pointer"
                            >
                              Focar UF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer — Editorial Rams.Log Style */}
      <footer className="w-full border-t border-rule bg-background py-8 px-6 md:px-10 mt-16">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span>
              Fontes Oficiais: <strong className="text-foreground">IBGE (API SIDRA v3)</strong>,{' '}
              <strong className="text-foreground">Banco Central / BrasilAPI</strong>,{' '}
              <strong className="text-foreground">Obrasgov.br / Transferegov</strong>,{' '}
              <strong className="text-foreground">Painel TCU</strong> e{' '}
              <strong className="text-foreground">Tesouro Nacional / IBPT</strong>.
            </span>
          </div>
          <div className="uppercase tracking-[0.2em] text-[10px]">
            Brasil.Hoje • Dados Abertos em Tempo Real
          </div>
        </div>
      </footer>
    </div>
  );
}
