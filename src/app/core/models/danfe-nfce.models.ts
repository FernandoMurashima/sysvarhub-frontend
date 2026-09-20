export type DanfeVia = 'CONSUMIDOR' | 'ESTABELECIMENTO';

export interface DanfeNfce {
  nfceUuid: string;
  vendaUuid: string;
  status: string;
  imprimivel: boolean;
  motivoNaoImprimivel: string;
  via: DanfeVia;
  viaTexto: string;
  ambiente: string;
  homologacao: boolean;
  contingencia: boolean;
  emitente: DanfeEmitente;
  documento: DanfeDocumento;
  consumidor: DanfeConsumidor;
  itens: DanfeItem[];
  totais: DanfeTotais;
  pagamentos: DanfePagamento[];
  troco: string;
  mensagens: string[];
  protocolo: DanfeProtocolo | null;
  qrCodePayload: string;
  qrCodeDataUri: string | null;
}

export interface DanfeEmitente {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
}

export interface DanfeDocumento {
  modelo: string;
  serie: number | null;
  numero: number | null;
  emitidaEm: string;
  emitidaEmIso: string;
  ambiente: string;
  tipoEmissao: string;
  chaveAcesso: string;
  chaveAcessoFormatada: string;
  urlConsulta: string;
}

export interface DanfeConsumidor {
  identificado: boolean;
  tipoDocumento: string;
  documento: string;
  nome: string;
}

export interface DanfeItem {
  numero: number;
  codigo: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  valorUnitario: string;
  valorBruto: string;
  desconto: string;
  valorLiquido: string;
}

export interface DanfeTotais {
  quantidadeItens: number;
  valorProdutos: string;
  desconto: string;
  valorTotal: string;
  pis: string;
  cofins: string;
  icms: string;
}

export interface DanfePagamento {
  codigoFiscal: string;
  descricao: string;
  valor: string;
}

export interface DanfeProtocolo {
  numero: string;
  autorizadaEm: string;
  codigoRetorno: string;
  mensagemRetorno: string;
}

export interface DanfeNfceApi {
  nfce_uuid: string;
  venda_uuid: string;
  status: string;
  imprimivel: boolean;
  motivo_nao_imprimivel: string;
  via: DanfeVia;
  via_texto: string;
  ambiente: string;
  homologacao: boolean;
  contingencia: boolean;
  emitente: DanfeEmitenteApi;
  documento: DanfeDocumentoApi;
  consumidor: DanfeConsumidorApi;
  itens: DanfeItemApi[];
  totais: DanfeTotaisApi;
  pagamentos: DanfePagamentoApi[];
  troco: string;
  mensagens: string[];
  protocolo: DanfeProtocoloApi | null;
  qr_code_payload: string;
  qr_code_data_uri: string | null;
}

export interface DanfeEmitenteApi {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  endereco: string;
}

export interface DanfeDocumentoApi {
  modelo: string;
  serie: number | null;
  numero: number | null;
  emitida_em: string;
  emitida_em_iso: string;
  ambiente: string;
  tipo_emissao: string;
  chave_acesso: string;
  chave_acesso_formatada: string;
  url_consulta: string;
}

export interface DanfeConsumidorApi {
  identificado: boolean;
  tipo_documento: string;
  documento: string;
  nome: string;
}

export interface DanfeItemApi {
  numero: number;
  codigo: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
  valor_bruto: string;
  desconto: string;
  valor_liquido: string;
}

export interface DanfeTotaisApi {
  quantidade_itens: number;
  vProd: string;
  vDesc: string;
  vNF: string;
  vPIS: string;
  vCOFINS: string;
  vICMS: string;
}

export interface DanfePagamentoApi {
  tPag: string;
  descricao: string;
  valor: string;
}

export interface DanfeProtocoloApi {
  numero: string;
  autorizada_em: string;
  codigo_retorno: string;
  mensagem_retorno: string;
}

export function mapDanfeNfce(api: DanfeNfceApi): DanfeNfce {
  return {
    nfceUuid: api.nfce_uuid,
    vendaUuid: api.venda_uuid,
    status: api.status,
    imprimivel: api.imprimivel,
    motivoNaoImprimivel: api.motivo_nao_imprimivel,
    via: api.via,
    viaTexto: api.via_texto,
    ambiente: api.ambiente,
    homologacao: api.homologacao,
    contingencia: api.contingencia,
    emitente: {
      razaoSocial: api.emitente.razao_social,
      nomeFantasia: api.emitente.nome_fantasia,
      cnpj: api.emitente.cnpj,
      inscricaoEstadual: api.emitente.ie,
      endereco: api.emitente.endereco,
    },
    documento: {
      modelo: api.documento.modelo,
      serie: api.documento.serie,
      numero: api.documento.numero,
      emitidaEm: api.documento.emitida_em,
      emitidaEmIso: api.documento.emitida_em_iso,
      ambiente: api.documento.ambiente,
      tipoEmissao: api.documento.tipo_emissao,
      chaveAcesso: api.documento.chave_acesso,
      chaveAcessoFormatada: api.documento.chave_acesso_formatada,
      urlConsulta: api.documento.url_consulta,
    },
    consumidor: {
      identificado: api.consumidor.identificado,
      tipoDocumento: api.consumidor.tipo_documento,
      documento: api.consumidor.documento,
      nome: api.consumidor.nome,
    },
    itens: api.itens.map((item) => ({
      numero: item.numero,
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valor_unitario,
      valorBruto: item.valor_bruto,
      desconto: item.desconto,
      valorLiquido: item.valor_liquido,
    })),
    totais: {
      quantidadeItens: api.totais.quantidade_itens,
      valorProdutos: api.totais.vProd,
      desconto: api.totais.vDesc,
      valorTotal: api.totais.vNF,
      pis: api.totais.vPIS,
      cofins: api.totais.vCOFINS,
      icms: api.totais.vICMS,
    },
    pagamentos: api.pagamentos.map((pagamento) => ({
      codigoFiscal: pagamento.tPag,
      descricao: pagamento.descricao,
      valor: pagamento.valor,
    })),
    troco: api.troco,
    mensagens: api.mensagens,
    protocolo: api.protocolo ? {
      numero: api.protocolo.numero,
      autorizadaEm: api.protocolo.autorizada_em,
      codigoRetorno: api.protocolo.codigo_retorno,
      mensagemRetorno: api.protocolo.mensagem_retorno,
    } : null,
    qrCodePayload: api.qr_code_payload,
    qrCodeDataUri: api.qr_code_data_uri,
  };
}
