export type DanfeVia = 'CONSUMIDOR' | 'ESTABELECIMENTO';

export interface DanfeNfce {
  via: DanfeVia;
  imprimivel: boolean;
  motivoNaoImprimivel: string;
  contingencia: boolean;
  emitente: DanfeEmitente;
  nfce: DanfeIdentificacao;
  itens: DanfeItem[];
  totais: DanfeTotais;
  pagamentos: DanfePagamento[];
  troco: string;
  consumidor: DanfeConsumidor | null;
  mensagens: string[];
  qrCodeDataUri: string | null;
  chaveAcesso: string;
  urlConsulta: string;
  protocoloAutorizacao: string | null;
}

export interface DanfeEmitente {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
}

export interface DanfeIdentificacao {
  numero: number | null;
  serie: number | null;
  emitidaEm: string | null;
  ambiente: string;
  status: string;
}

export interface DanfeItem {
  codigo: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  valorUnitario: string;
  valorTotal: string;
}

export interface DanfeTotais {
  subtotal: string;
  desconto: string;
  total: string;
}

export interface DanfePagamento {
  descricao: string;
  valor: string;
}

export interface DanfeConsumidor {
  nome: string;
  documento: string;
}

export interface DanfeNfceApi {
  via: DanfeVia;
  imprimivel: boolean;
  motivo_nao_imprimivel?: string | null;
  contingencia?: boolean;
  emitente: DanfeEmitenteApi;
  nfce: DanfeIdentificacaoApi;
  itens: DanfeItemApi[];
  totais: DanfeTotaisApi;
  pagamentos: DanfePagamentoApi[];
  troco?: string | null;
  consumidor?: DanfeConsumidorApi | null;
  mensagens?: string[];
  qr_code_data_uri?: string | null;
  chave_acesso: string;
  url_consulta?: string | null;
  protocolo_autorizacao?: string | null;
}

export interface DanfeEmitenteApi {
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj: string;
  inscricao_estadual?: string | null;
  endereco?: string | null;
}

export interface DanfeIdentificacaoApi {
  numero?: number | null;
  serie?: number | null;
  emitida_em?: string | null;
  ambiente?: string | null;
  status?: string | null;
}

export interface DanfeItemApi {
  codigo?: string | null;
  descricao: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
  valor_total: string;
}

export interface DanfeTotaisApi {
  subtotal: string;
  desconto?: string | null;
  total: string;
}

export interface DanfePagamentoApi {
  descricao: string;
  valor: string;
}

export interface DanfeConsumidorApi {
  nome?: string | null;
  documento?: string | null;
}

export function mapDanfeNfce(api: DanfeNfceApi): DanfeNfce {
  return {
    via: api.via,
    imprimivel: api.imprimivel,
    motivoNaoImprimivel: api.motivo_nao_imprimivel ?? '',
    contingencia: Boolean(api.contingencia),
    emitente: {
      razaoSocial: api.emitente.razao_social,
      nomeFantasia: api.emitente.nome_fantasia ?? '',
      cnpj: api.emitente.cnpj,
      inscricaoEstadual: api.emitente.inscricao_estadual ?? '',
      endereco: api.emitente.endereco ?? '',
    },
    nfce: {
      numero: api.nfce.numero ?? null,
      serie: api.nfce.serie ?? null,
      emitidaEm: api.nfce.emitida_em ?? null,
      ambiente: api.nfce.ambiente ?? '',
      status: api.nfce.status ?? '',
    },
    itens: api.itens.map((item) => ({
      codigo: item.codigo ?? '',
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valor_unitario,
      valorTotal: item.valor_total,
    })),
    totais: {
      subtotal: api.totais.subtotal,
      desconto: api.totais.desconto ?? '0.00',
      total: api.totais.total,
    },
    pagamentos: api.pagamentos.map((pagamento) => ({ descricao: pagamento.descricao, valor: pagamento.valor })),
    troco: api.troco ?? '0.00',
    consumidor: api.consumidor ? { nome: api.consumidor.nome ?? '', documento: api.consumidor.documento ?? '' } : null,
    mensagens: api.mensagens ?? [],
    qrCodeDataUri: api.qr_code_data_uri ?? null,
    chaveAcesso: api.chave_acesso,
    urlConsulta: api.url_consulta ?? '',
    protocoloAutorizacao: api.protocolo_autorizacao ?? null,
  };
}
