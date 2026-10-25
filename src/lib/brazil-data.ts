export interface StateStats {
  id: string; // IBGE code
  uf: string;
  nome: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  capital: string;
  populacao: number;
  taxaDesemprego: number; // %
  pibBilhoes: number; // R$ Bilhões
  pibPerCapita: number; // R$
  impostoAnualBilhoes: number; // R$ Bilhões (Federal + Estadual + Municipal gerados na UF)
  idh: number;
  saneamentoPct: number; // % atendimento água/esgoto
  obras: {
    emAndamento: number;
    paralisadas: number;
    concluidas: number;
    emLicitacao: number;
    investimentoTotalBilhoes: number;
  };
}

export interface PublicWorkProject {
  id: string;
  nome: string;
  uf: string;
  regiao: string;
  setor: 'Transportes e Logística' | 'Saúde' | 'Educação' | 'Saneamento e Água' | 'Energia' | 'Habitação e Mobilidade';
  orgao: string;
  programa: string;
  status: 'Em Execução' | 'Em Licitação' | 'Concluída' | 'Paralisada';
  percentualExecucao: number;
  orcamentoMilhoes: number;
  valorExecutadoMilhoes: number;
  previsaoConclusao: string;
  municipio: string;
}

export interface HistoricalPoint {
  periodo: string;
  valor: number;
}

export interface TaxBreakdown {
  nome: string;
  sigla: string;
  esfera: 'Federal' | 'Estadual' | 'Municipal';
  percentualTotal: number;
  descricao: string;
  cor: string;
}

export interface PublicSpendingCategory {
  funcao: string;
  percentual: number;
  valorBilhoes: number;
  cor: string;
}

// Ritmo anual de arrecadação tributária total no Brasil em 2026 (Federal + Estadual + Municipal)
// Estimativa baseada na evolução da carga tributária (~33,4% do PIB de R$ 11,65 trilhões)
export const ANNUAL_TAX_TARGET_2026 = 3_885_000_000_000; // R$ 3,885 Trilhões
export const BASE_POPULATION_2026 = 214_211_951; // IBGE Estimativa 2026

export const TAX_BREAKDOWN: TaxBreakdown[] = [
  {
    nome: 'Imposto sobre Circulação de Mercadorias e Serviços',
    sigla: 'ICMS',
    esfera: 'Estadual',
    percentualTotal: 21.4,
    descricao: 'Principal imposto estadual, incide sobre consumo, energia, combustíveis e telecomunicações.',
    cor: '#10b981',
  },
  {
    nome: 'Imposto de Renda (Pessoa Física e Jurídica)',
    sigla: 'IRPF / IRPJ',
    esfera: 'Federal',
    percentualTotal: 20.8,
    descricao: 'Tributação federal sobre salários, rendimentos financeiros e lucro das empresas.',
    cor: '#3b82f6',
  },
  {
    nome: 'Contribuição Previdenciária (INSS)',
    sigla: 'INSS / RGPS',
    esfera: 'Federal',
    percentualTotal: 18.9,
    descricao: 'Financiamento da Seguridade Social sobre folha de pagamento e contribuintes.',
    cor: '#6366f1',
  },
  {
    nome: 'PIS / PASEP e COFINS',
    sigla: 'PIS / COFINS',
    esfera: 'Federal',
    percentualTotal: 14.2,
    descricao: 'Contribuições federais sobre o faturamento das empresas (em transição para CBS).',
    cor: '#f59e0b',
  },
  {
    nome: 'Contribuição Social sobre o Lucro Líquido e IPI',
    sigla: 'CSLL / IPI',
    esfera: 'Federal',
    percentualTotal: 6.7,
    descricao: 'Tributos federais sobre o lucro líquido corporativo e produtos industrializados.',
    cor: '#8b5cf6',
  },
  {
    nome: 'Imposto sobre Serviços e IPTU',
    sigla: 'ISS / IPTU',
    esfera: 'Municipal',
    percentualTotal: 5.8,
    descricao: 'Principais fontes de arrecadação própria das prefeituras brasileiras.',
    cor: '#ec4899',
  },
  {
    nome: 'IPVA e ITCMD',
    sigla: 'IPVA / ITCMD',
    esfera: 'Estadual',
    percentualTotal: 4.1,
    descricao: 'Impostos estaduais sobre propriedade de veículos automotores e heranças/doações.',
    cor: '#14b8a6',
  },
  {
    nome: 'IOF, Imposto de Importação, Taxas e Outros',
    sigla: 'IOF / II / Taxas',
    esfera: 'Federal',
    percentualTotal: 8.1,
    descricao: 'Operações financeiras, comércio exterior, taxas regulatórias e contribuições diversas.',
    cor: '#64748b',
  },
];

export const PUBLIC_SPENDING_BY_FUNCTION: PublicSpendingCategory[] = [
  { funcao: 'Previdência Social', percentual: 32.4, valorBilhoes: 1185.0, cor: '#3b82f6' },
  { funcao: 'Juros e Encargos da Dívida', percentual: 18.8, valorBilhoes: 687.5, cor: '#ef4444' },
  { funcao: 'Saúde Pública (SUS)', percentual: 11.6, valorBilhoes: 424.2, cor: '#10b981' },
  { funcao: 'Educação e Ciência', percentual: 10.9, valorBilhoes: 398.6, cor: '#f59e0b' },
  { funcao: 'Assistência Social (Bolsa Família / BPC)', percentual: 9.8, valorBilhoes: 358.4, cor: '#8b5cf6' },
  { funcao: 'Segurança Pública e Defesa', percentual: 5.9, valorBilhoes: 215.8, cor: '#06b6d4' },
  { funcao: 'Infraestrutura, Transporte e Habitação', percentual: 5.4, valorBilhoes: 197.5, cor: '#ec4899' },
  { funcao: 'Administração, Judiciário e Legislativo', percentual: 5.2, valorBilhoes: 190.2, cor: '#64748b' },
];

export const STATES_DATA: StateStats[] = [
  {
    id: '35', uf: 'SP', nome: 'São Paulo', regiao: 'Sudeste', capital: 'São Paulo',
    populacao: 46081801, taxaDesemprego: 5.1, pibBilhoes: 3540.5, pibPerCapita: 76830,
    impostoAnualBilhoes: 1412.8, idh: 0.806, saneamentoPct: 91.4,
    obras: { emAndamento: 3420, paralisadas: 890, concluidas: 4120, emLicitacao: 610, investimentoTotalBilhoes: 98.4 }
  },
  {
    id: '33', uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste', capital: 'Rio de Janeiro',
    populacao: 17223547, taxaDesemprego: 7.4, pibBilhoes: 1245.2, pibPerCapita: 72296,
    impostoAnualBilhoes: 518.4, idh: 0.762, saneamentoPct: 79.8,
    obras: { emAndamento: 1680, paralisadas: 640, concluidas: 1920, emLicitacao: 310, investimentoTotalBilhoes: 54.2 }
  },
  {
    id: '31', uf: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste', capital: 'Belo Horizonte',
    populacao: 21393441, taxaDesemprego: 4.6, pibBilhoes: 1098.4, pibPerCapita: 51342,
    impostoAnualBilhoes: 342.1, idh: 0.774, saneamentoPct: 81.2,
    obras: { emAndamento: 2890, paralisadas: 920, concluidas: 3410, emLicitacao: 540, investimentoTotalBilhoes: 62.7 }
  },
  {
    id: '41', uf: 'PR', nome: 'Paraná', regiao: 'Sul', capital: 'Curitiba',
    populacao: 11890517, taxaDesemprego: 3.7, pibBilhoes: 718.6, pibPerCapita: 60434,
    impostoAnualBilhoes: 229.5, idh: 0.769, saneamentoPct: 84.5,
    obras: { emAndamento: 1940, paralisadas: 380, concluidas: 2650, emLicitacao: 410, investimentoTotalBilhoes: 39.8 }
  },
  {
    id: '43', uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul', capital: 'Porto Alegre',
    populacao: 11233263, taxaDesemprego: 4.8, pibBilhoes: 706.3, pibPerCapita: 62875,
    impostoAnualBilhoes: 224.8, idh: 0.771, saneamentoPct: 76.4,
    obras: { emAndamento: 2410, paralisadas: 510, concluidas: 2380, emLicitacao: 690, investimentoTotalBilhoes: 51.6 }
  },
  {
    id: '42', uf: 'SC', nome: 'Santa Catarina', regiao: 'Sul', capital: 'Florianópolis',
    populacao: 8187029, taxaDesemprego: 2.8, pibBilhoes: 542.1, pibPerCapita: 66214,
    impostoAnualBilhoes: 178.6, idh: 0.792, saneamentoPct: 74.2,
    obras: { emAndamento: 1420, paralisadas: 290, concluidas: 1890, emLicitacao: 280, investimentoTotalBilhoes: 28.4 }
  },
  {
    id: '29', uf: 'BA', nome: 'Bahia', regiao: 'Nordeste', capital: 'Salvador',
    populacao: 14870907, taxaDesemprego: 8.9, pibBilhoes: 462.8, pibPerCapita: 31121,
    impostoAnualBilhoes: 128.4, idh: 0.691, saneamentoPct: 61.8,
    obras: { emAndamento: 2740, paralisadas: 1120, concluidas: 2980, emLicitacao: 590, investimentoTotalBilhoes: 49.3 }
  },
  {
    id: '53', uf: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste', capital: 'Brasília',
    populacao: 2996899, taxaDesemprego: 7.8, pibBilhoes: 365.4, pibPerCapita: 121926,
    impostoAnualBilhoes: 198.2, idh: 0.814, saneamentoPct: 90.8,
    obras: { emAndamento: 640, paralisadas: 140, concluidas: 890, emLicitacao: 150, investimentoTotalBilhoes: 16.5 }
  },
  {
    id: '52', uf: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste', capital: 'Goiânia',
    populacao: 7423629, taxaDesemprego: 4.5, pibBilhoes: 368.9, pibPerCapita: 49692,
    impostoAnualBilhoes: 102.3, idh: 0.737, saneamentoPct: 69.5,
    obras: { emAndamento: 1380, paralisadas: 490, concluidas: 1640, emLicitacao: 290, investimentoTotalBilhoes: 24.8 }
  },
  {
    id: '51', uf: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste', capital: 'Cuiabá',
    populacao: 3893659, taxaDesemprego: 2.6, pibBilhoes: 312.5, pibPerCapita: 80258,
    impostoAnualBilhoes: 78.4, idh: 0.736, saneamentoPct: 58.4,
    obras: { emAndamento: 1190, paralisadas: 370, concluidas: 1320, emLicitacao: 260, investimentoTotalBilhoes: 29.1 }
  },
  {
    id: '15', uf: 'PA', nome: 'Pará', regiao: 'Norte', capital: 'Belém',
    populacao: 8711196, taxaDesemprego: 6.2, pibBilhoes: 284.6, pibPerCapita: 32670,
    impostoAnualBilhoes: 69.8, idh: 0.690, saneamentoPct: 38.2,
    obras: { emAndamento: 1850, paralisadas: 840, concluidas: 1760, emLicitacao: 420, investimentoTotalBilhoes: 38.7 }
  },
  {
    id: '26', uf: 'PE', nome: 'Pernambuco', regiao: 'Nordeste', capital: 'Recife',
    populacao: 9562007, taxaDesemprego: 9.1, pibBilhoes: 278.4, pibPerCapita: 29115,
    impostoAnualBilhoes: 84.5, idh: 0.719, saneamentoPct: 60.4,
    obras: { emAndamento: 1790, paralisadas: 730, concluidas: 2040, emLicitacao: 380, investimentoTotalBilhoes: 34.2 }
  },
  {
    id: '23', uf: 'CE', nome: 'Ceará', regiao: 'Nordeste', capital: 'Fortaleza',
    populacao: 9268836, taxaDesemprego: 6.4, pibBilhoes: 246.2, pibPerCapita: 26562,
    impostoAnualBilhoes: 72.1, idh: 0.734, saneamentoPct: 59.1,
    obras: { emAndamento: 1920, paralisadas: 610, concluidas: 2310, emLicitacao: 410, investimentoTotalBilhoes: 36.9 }
  },
  {
    id: '32', uf: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste', capital: 'Vitória',
    populacao: 4126854, taxaDesemprego: 3.9, pibBilhoes: 224.8, pibPerCapita: 54472,
    impostoAnualBilhoes: 74.6, idh: 0.771, saneamentoPct: 77.5,
    obras: { emAndamento: 890, paralisadas: 210, concluidas: 1150, emLicitacao: 190, investimentoTotalBilhoes: 18.4 }
  },
  {
    id: '50', uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', capital: 'Campo Grande',
    populacao: 2924631, taxaDesemprego: 3.2, pibBilhoes: 198.4, pibPerCapita: 67837,
    impostoAnualBilhoes: 54.2, idh: 0.742, saneamentoPct: 68.9,
    obras: { emAndamento: 780, paralisadas: 220, concluidas: 980, emLicitacao: 170, investimentoTotalBilhoes: 17.6 }
  },
  {
    id: '13', uf: 'AM', nome: 'Amazonas', regiao: 'Norte', capital: 'Manaus',
    populacao: 4321616, taxaDesemprego: 7.6, pibBilhoes: 168.5, pibPerCapita: 38990,
    impostoAnualBilhoes: 58.9, idh: 0.700, saneamentoPct: 44.6,
    obras: { emAndamento: 940, paralisadas: 410, concluidas: 1020, emLicitacao: 230, investimentoTotalBilhoes: 19.2 }
  },
  {
    id: '21', uf: 'MA', nome: 'Maranhão', regiao: 'Nordeste', capital: 'São Luís',
    populacao: 7018211, taxaDesemprego: 6.5, pibBilhoes: 156.4, pibPerCapita: 22284,
    impostoAnualBilhoes: 38.4, idh: 0.676, saneamentoPct: 41.2,
    obras: { emAndamento: 1640, paralisadas: 780, concluidas: 1810, emLicitacao: 340, investimentoTotalBilhoes: 23.5 }
  },
  {
    id: '24', uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste', capital: 'Natal',
    populacao: 3455236, taxaDesemprego: 7.9, pibBilhoes: 104.2, pibPerCapita: 30157,
    impostoAnualBilhoes: 29.8, idh: 0.728, saneamentoPct: 56.4,
    obras: { emAndamento: 820, paralisadas: 340, concluidas: 960, emLicitacao: 180, investimentoTotalBilhoes: 13.8 }
  },
  {
    id: '25', uf: 'PB', nome: 'Paraíba', regiao: 'Nordeste', capital: 'João Pessoa',
    populacao: 4164468, taxaDesemprego: 7.4, pibBilhoes: 102.6, pibPerCapita: 24637,
    impostoAnualBilhoes: 28.4, idh: 0.698, saneamentoPct: 58.2,
    obras: { emAndamento: 1050, paralisadas: 390, concluidas: 1240, emLicitacao: 210, investimentoTotalBilhoes: 15.6 }
  },
  {
    id: '27', uf: 'AL', nome: 'Alagoas', regiao: 'Nordeste', capital: 'Maceió',
    populacao: 3220848, taxaDesemprego: 7.2, pibBilhoes: 89.4, pibPerCapita: 27756,
    impostoAnualBilhoes: 23.6, idh: 0.684, saneamentoPct: 52.8,
    obras: { emAndamento: 760, paralisadas: 290, concluidas: 890, emLicitacao: 160, investimentoTotalBilhoes: 12.4 }
  },
  {
    id: '22', uf: 'PI', nome: 'Piauí', regiao: 'Nordeste', capital: 'Teresina',
    populacao: 3384547, taxaDesemprego: 6.8, pibBilhoes: 84.1, pibPerCapita: 24848,
    impostoAnualBilhoes: 22.1, idh: 0.690, saneamentoPct: 48.5,
    obras: { emAndamento: 980, paralisadas: 360, concluidas: 1120, emLicitacao: 210, investimentoTotalBilhoes: 14.9 }
  },
  {
    id: '11', uf: 'RO', nome: 'Rondônia', regiao: 'Norte', capital: 'Porto Velho',
    populacao: 1757338, taxaDesemprego: 3.1, pibBilhoes: 76.8, pibPerCapita: 43702,
    impostoAnualBilhoes: 21.4, idh: 0.700, saneamentoPct: 45.2,
    obras: { emAndamento: 540, paralisadas: 210, concluidas: 680, emLicitacao: 120, investimentoTotalBilhoes: 9.8 }
  },
  {
    id: '28', uf: 'SE', nome: 'Sergipe', regiao: 'Nordeste', capital: 'Aracaju',
    populacao: 2299425, taxaDesemprego: 7.7, pibBilhoes: 64.5, pibPerCapita: 28050,
    impostoAnualBilhoes: 18.9, idh: 0.702, saneamentoPct: 57.6,
    obras: { emAndamento: 590, paralisadas: 240, concluidas: 710, emLicitacao: 130, investimentoTotalBilhoes: 9.4 }
  },
  {
    id: '17', uf: 'TO', nome: 'Tocantins', regiao: 'Norte', capital: 'Palmas',
    populacao: 1586859, taxaDesemprego: 4.9, pibBilhoes: 68.2, pibPerCapita: 42978,
    impostoAnualBilhoes: 16.8, idh: 0.731, saneamentoPct: 59.4,
    obras: { emAndamento: 620, paralisadas: 230, concluidas: 740, emLicitacao: 140, investimentoTotalBilhoes: 10.2 }
  },
  {
    id: '12', uf: 'AC', nome: 'Acre', regiao: 'Norte', capital: 'Rio Branco',
    populacao: 887794, taxaDesemprego: 6.9, pibBilhoes: 26.4, pibPerCapita: 29736,
    impostoAnualBilhoes: 7.8, idh: 0.710, saneamentoPct: 42.1,
    obras: { emAndamento: 380, paralisadas: 150, concluidas: 440, emLicitacao: 85, investimentoTotalBilhoes: 5.4 }
  },
  {
    id: '16', uf: 'AP', nome: 'Amapá', regiao: 'Norte', capital: 'Macapá',
    populacao: 806517, taxaDesemprego: 7.5, pibBilhoes: 25.8, pibPerCapita: 31989,
    impostoAnualBilhoes: 7.1, idh: 0.688, saneamentoPct: 39.8,
    obras: { emAndamento: 340, paralisadas: 160, concluidas: 390, emLicitacao: 75, investimentoTotalBilhoes: 4.9 }
  },
  {
    id: '14', uf: 'RR', nome: 'Roraima', regiao: 'Norte', capital: 'Boa Vista',
    populacao: 738772, taxaDesemprego: 5.8, pibBilhoes: 24.9, pibPerCapita: 33704,
    impostoAnualBilhoes: 6.9, idh: 0.699, saneamentoPct: 51.4,
    obras: { emAndamento: 310, paralisadas: 110, concluidas: 360, emLicitacao: 70, investimentoTotalBilhoes: 4.6 }
  },
];

export const MAJOR_PUBLIC_WORKS: PublicWorkProject[] = [
  {
    id: 'OBR-001',
    nome: 'Linha 6-Laranja do Metrô de São Paulo (Brasilândia - São Joaquim)',
    uf: 'SP',
    regiao: 'Sudeste',
    setor: 'Habitação e Mobilidade',
    orgao: 'Governo do Estado de SP / BNDES / Novo PAC',
    programa: 'Mobilidade Urbana Sustentável',
    status: 'Em Execução',
    percentualExecucao: 74.5,
    orcamentoMilhoes: 17200,
    valorExecutadoMilhoes: 12814,
    previsaoConclusao: 'Out/2027',
    municipio: 'São Paulo',
  },
  {
    id: 'OBR-002',
    nome: 'Ferrovia Transnordestina (Trecho Eliseu Martins/PI - Porto do Pecém/CE)',
    uf: 'CE',
    regiao: 'Nordeste',
    setor: 'Transportes e Logística',
    orgao: 'Ministério dos Transportes / ANTT / Sudene',
    programa: 'Novo PAC - Transporte Eficiente',
    status: 'Em Execução',
    percentualExecucao: 68.2,
    orcamentoMilhoes: 14800,
    valorExecutadoMilhoes: 10093,
    previsaoConclusao: 'Dez/2027',
    municipio: 'Caucaia / Quixeramobim',
  },
  {
    id: 'OBR-003',
    nome: 'Duplicação e Modernização da BR-381/MG (Belo Horizonte - Governador Valadares)',
    uf: 'MG',
    regiao: 'Sudeste',
    setor: 'Transportes e Logística',
    orgao: 'DNIT / Ministério dos Transportes',
    programa: 'Novo PAC - Eixo Rodoviário',
    status: 'Em Execução',
    percentualExecucao: 59.4,
    orcamentoMilhoes: 9450,
    valorExecutadoMilhoes: 5613,
    previsaoConclusao: 'Jun/2028',
    municipio: 'Ipatinga / Caeté',
  },
  {
    id: 'OBR-004',
    nome: 'Ramal do Salgado e Adutora do Agreste (Integração do Rio São Francisco)',
    uf: 'PE',
    regiao: 'Nordeste',
    setor: 'Saneamento e Água',
    orgao: 'MIDR / Compesa',
    programa: 'Novo PAC - Água para Todos',
    status: 'Em Execução',
    percentualExecucao: 64.0,
    orcamentoMilhoes: 6120,
    valorExecutadoMilhoes: 3916,
    previsaoConclusao: 'Nov/2027',
    municipio: 'Caruaru / Arcoverde',
  },
  {
    id: 'OBR-005',
    nome: 'Ponte de Guaratuba e Acessos Viários (PR-412)',
    uf: 'PR',
    regiao: 'Sul',
    setor: 'Transportes e Logística',
    orgao: 'DER-PR / Governo do Paraná',
    programa: 'Infraestrutura Estadual PR',
    status: 'Concluída',
    percentualExecucao: 100.0,
    orcamentoMilhoes: 412,
    valorExecutadoMilhoes: 412,
    previsaoConclusao: 'Abr/2026',
    municipio: 'Guaratuba / Matinhos',
  },
  {
    id: 'OBR-006',
    nome: 'Túnel Imerso Santos - Guarujá e Acessos Portuários',
    uf: 'SP',
    regiao: 'Sudeste',
    setor: 'Transportes e Logística',
    orgao: 'Ministério de Portos e Aeroportos / Governo SP',
    programa: 'Novo PAC - Portos e Hidrovias',
    status: 'Em Execução',
    percentualExecucao: 22.8,
    orcamentoMilhoes: 5960,
    valorExecutadoMilhoes: 1358,
    previsaoConclusao: 'Dez/2029',
    municipio: 'Santos / Guarujá',
  },
  {
    id: 'OBR-007',
    nome: 'Sistema de Proteção Contra Cheias e Reconstrução Viária da Região Metropolitana',
    uf: 'RS',
    regiao: 'Sul',
    setor: 'Saneamento e Água',
    orgao: 'Casa Civil / Ministério das Cidades / Governo RS',
    programa: 'Plano Rio Grande / Novo PAC',
    status: 'Em Execução',
    percentualExecucao: 51.5,
    orcamentoMilhoes: 8900,
    valorExecutadoMilhoes: 4583,
    previsaoConclusao: 'Ago/2027',
    municipio: 'Porto Alegre / Canoas',
  },
  {
    id: 'OBR-008',
    nome: 'Ferrovia de Integração Centro-Oeste (FICO - Mara Rosa/GO a Água Boa/MT)',
    uf: 'MT',
    regiao: 'Centro-Oeste',
    setor: 'Transportes e Logística',
    orgao: 'Ministério dos Transportes / Infra S.A.',
    programa: 'Novo PAC - Malha Ferroviária',
    status: 'Em Execução',
    percentualExecucao: 47.6,
    orcamentoMilhoes: 10400,
    valorExecutadoMilhoes: 4950,
    previsaoConclusao: 'Mai/2028',
    municipio: 'Água Boa',
  },
  {
    id: 'OBR-009',
    nome: 'Complexo Hospitalar Universitário e Maternidades de Alta Complexidade',
    uf: 'BA',
    regiao: 'Nordeste',
    setor: 'Saúde',
    orgao: 'Ministério da Saúde / Ebserh / SESAB',
    programa: 'Novo PAC Saúde',
    status: 'Em Execução',
    percentualExecucao: 82.0,
    orcamentoMilhoes: 980,
    valorExecutadoMilhoes: 803,
    previsaoConclusao: 'Mar/2027',
    municipio: 'Salvador / Feira de Santana',
  },
  {
    id: 'OBR-010',
    nome: 'Expansão dos Campi dos Institutos Federais de Educação e Ciência (100 Novos Campi)',
    uf: 'PA',
    regiao: 'Norte',
    setor: 'Educação',
    orgao: 'Ministério da Educação (MEC) / FNDE',
    programa: 'Novo PAC Educação',
    status: 'Em Execução',
    percentualExecucao: 71.3,
    orcamentoMilhoes: 2500,
    valorExecutadoMilhoes: 1782,
    previsaoConclusao: 'Fev/2027',
    municipio: 'Belém / Santarém / Marabá',
  },
  {
    id: 'OBR-011',
    nome: 'Linhão de Transmissão HVDC Graça Aranha (MA) - Silvânia (GO)',
    uf: 'MA',
    regiao: 'Nordeste',
    setor: 'Energia',
    orgao: 'Ministério de Minas e Energia / ANEEL',
    programa: 'Transição Energética Nacional',
    status: 'Em Execução',
    percentualExecucao: 44.0,
    orcamentoMilhoes: 18100,
    valorExecutadoMilhoes: 7964,
    previsaoConclusao: 'Set/2028',
    municipio: 'Graça Aranha',
  },
  {
    id: 'OBR-012',
    nome: 'Anel Viário de Campo Grande e Corredor Bioceânico (Ponte Porto Murtinho)',
    uf: 'MS',
    regiao: 'Centro-Oeste',
    setor: 'Transportes e Logística',
    orgao: 'DNIT / Governo MS',
    programa: 'Rota Bioceânica Sul-Americana',
    status: 'Em Execução',
    percentualExecucao: 89.5,
    orcamentoMilhoes: 1420,
    valorExecutadoMilhoes: 1270,
    previsaoConclusao: 'Dez/2026',
    municipio: 'Porto Murtinho / Campo Grande',
  },
  {
    id: 'OBR-013',
    nome: 'Dragagem e Modernização do Canal de Acesso ao Complexo Portuário de Itaguaí e Rio',
    uf: 'RJ',
    regiao: 'Sudeste',
    setor: 'Transportes e Logística',
    orgao: 'PortosRio / Ministério de Portos e Aeroportos',
    programa: 'Novo PAC Portuário',
    status: 'Em Licitação',
    percentualExecucao: 12.0,
    orcamentoMilhoes: 1850,
    valorExecutadoMilhoes: 222,
    previsaoConclusao: 'Nov/2028',
    municipio: 'Rio de Janeiro / Itaguaí',
  },
  {
    id: 'OBR-014',
    nome: 'Recuperação de Creches e Escolas de Tempo Integral (Pacto Nacional pela Retomada)',
    uf: 'MG',
    regiao: 'Sudeste',
    setor: 'Educação',
    orgao: 'FNDE / Ministério da Educação',
    programa: 'Pacto Retomada de Obras da Educação',
    status: 'Paralisada',
    percentualExecucao: 48.0,
    orcamentoMilhoes: 640,
    valorExecutadoMilhoes: 307,
    previsaoConclusao: 'Em repactuação',
    municipio: 'Diversos Municípios',
  },
];

export const DEFAULT_UNEMPLOYMENT_SERIES: HistoricalPoint[] = [
  { periodo: 'Set/25', valor: 6.4 },
  { periodo: 'Out/25', valor: 6.2 },
  { periodo: 'Nov/25', valor: 6.1 },
  { periodo: 'Dez/25', valor: 6.2 },
  { periodo: 'Jan/26', valor: 6.5 },
  { periodo: 'Fev/26', valor: 6.4 },
  { periodo: 'Mar/26', valor: 6.1 },
  { periodo: 'Abr/26', valor: 5.8 },
  { periodo: 'Mai/26', valor: 5.6 },
  { periodo: 'Jun/26', valor: 5.4 },
  { periodo: 'Jul/26', valor: 5.3 },
  { periodo: 'Ago/26', valor: 5.3 },
];

export const DEFAULT_IPCA_SERIES: HistoricalPoint[] = [
  { periodo: 'Out/25', valor: 4.76 },
  { periodo: 'Nov/25', valor: 4.87 },
  { periodo: 'Dez/25', valor: 4.83 },
  { periodo: 'Jan/26', valor: 4.56 },
  { periodo: 'Fev/26', valor: 4.50 },
  { periodo: 'Mar/26', valor: 4.48 },
  { periodo: 'Abr/26', valor: 4.39 },
  { periodo: 'Mai/26', valor: 4.72 },
  { periodo: 'Jun/26', valor: 4.64 },
  { periodo: 'Jul/26', valor: 4.44 },
  { periodo: 'Ago/26', valor: 4.22 },
  { periodo: 'Set/26', valor: 4.58 },
];

export const PUBLIC_WORKS_BY_SECTOR = [
  { setor: 'Transportes e Rodovias', emExecucao: 8420, paralisadas: 1840, concluidas: 9120, investimentoBilhoes: 268.4 },
  { setor: 'Saúde (UBS e Hospitais)', emExecucao: 7650, paralisadas: 2410, concluidas: 11400, investimentoBilhoes: 74.2 },
  { setor: 'Educação (Creches e Escolas)', emExecucao: 9180, paralisadas: 3890, concluidas: 12850, investimentoBilhoes: 68.9 },
  { setor: 'Saneamento e Recursos Hídricos', emExecucao: 5430, paralisadas: 1920, concluidas: 5980, investimentoBilhoes: 142.6 },
  { setor: 'Habitação e Mobilidade Urbana', emExecucao: 4120, paralisadas: 1210, concluidas: 4890, investimentoBilhoes: 118.5 },
  { setor: 'Energia e Telecomunicações', emExecucao: 1410, paralisadas: 320, concluidas: 1890, investimentoBilhoes: 91.8 },
];
