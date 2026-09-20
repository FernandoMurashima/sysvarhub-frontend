import { CatalogoResponse } from '../core/models/catalogo.models';
import { CaixaStatusResponse, SessaoCaixaHubResumo } from '../core/models/caixa.models';
import { OperadorContextoResponse, OperadorLoginResponse } from '../core/models/operador.models';
import { TerminalContexto } from '../core/models/terminal.models';
import { VendaAtualResponse } from '../core/models/venda.models';

export const terminalContextoStub: TerminalContexto = {
  terminal: {
    uuid: 'terminal-uuid-ficticio',
    codigo: 'PDV-01',
    nome: 'PDV-01',
    hostname: 'PDV-BARRA-01',
    ativo: true,
  },
  caixa: { id: 7, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
  loja: { id: 2, nome: 'Loja Barra', apelido: 'Filial 1', estado: 'RJ' },
  empresa: { id: 3, nome: 'Empresa Teste Ltda' },
};

export const catalogoResponseStub: CatalogoResponse = {
  catalogo_versao: 1,
  catalogo_sincronizado_em: '2026-09-13T10:01:00',
  tabela_preco: {
    codigo: 'PADRAO',
    nome: 'Tabela Padrão',
  },
  q: '7892701000013',
  total: 1,
  limit: 40,
  itens: [
    {
      produto_id: 2050,
      sku_id: 10825,
      tipo_produto: '1',
      referencia: '27-01-01001',
      descricao: 'Calça Jeans Reta Aurora',
      descricao_reduzida: 'Calça Jeans Reta Aurora',
      ean13: '7892701000013',
      codigo_item_ref: '00001',
      cor: { id: 113, descricao: 'Jeans' },
      tamanho: { id: 147, descricao: '34' },
      unidade: { id: 47, codigo: 'UN', descricao: 'Un' },
      preco: '199.9000',
      preco_promocional: null,
      preco_venda: '199.9000',
      estoque_fisico: '4.000',
      reserva: '0.000',
      estoque_disponivel: '4.000',
      vendavel: true,
      motivos_bloqueio: [],
      fiscal: { ncm: '62034200' },
    },
  ],
};

export const operadorLoginResponseStub: OperadorLoginResponse = {
  sessaoToken: 'sessao-operador-ficticia',
  sessao: {
    uuid: 'sessao-operador-uuid',
    iniciadaEm: '2026-09-13T10:30:00',
  },
  operador: {
    usuarioId: 99,
    codigo: 'caixa.barra',
    nome: 'Juliana Rocha',
    tipo: 'Caixa',
    perfil: { id: 4, nome: 'Operador de Caixa' },
  },
};

export const operadorContextoResponseStub: OperadorContextoResponse = {
  sessao: {
    uuid: 'sessao-operador-uuid',
    iniciadaEm: '2026-09-13T10:30:00',
    ultimaAtividadeEm: '2026-09-13T10:35:00',
  },
  operador: operadorLoginResponseStub.operador,
};

export const sessaoCaixaAbertaStub: SessaoCaixaHubResumo = {
  uuid: 'sessao-caixa-uuid',
  status: 'ABERTO',
  valorAbertura: '100.00',
  abertoEm: '2026-09-13T12:00:00',
  fechadoEm: null,
  caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
  terminalAbertura: { uuid: 'terminal-uuid-ficticio', codigo: 'PDV-01', nome: 'PDV 01' },
  operadorAbertura: operadorLoginResponseStub.operador,
  terminalFechamento: null,
  operadorFechamento: null,
};

export const caixaStatusFechadoStub: CaixaStatusResponse = {
  caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
  aberto: false,
  sessao: null,
};

export const caixaStatusAbertoStub: CaixaStatusResponse = {
  caixa: sessaoCaixaAbertaStub.caixa,
  aberto: true,
  sessao: sessaoCaixaAbertaStub,
};

export const vendaAbertaStub: VendaAtualResponse = {
  venda: {
    uuid: 'venda-hub-uuid',
    status: 'ABERTA',
    criadaEm: '2026-09-13T12:10:00',
    subtotal: '199.90',
    descontoItens: '0.00',
    descontoGeral: '0.00',
    total: '199.90',
    totalPago: '0.00',
    pendente: '199.90',
    troco: '0.00',
    cliente: null,
    vendedor: null,
    operadorCriacao: operadorLoginResponseStub.operador,
    fiscal: {
      emiteNfce: false,
      nfceUuid: null,
      status: null,
      numero: null,
      serie: null,
      chaveAcesso: null,
      tipoEmissao: '',
      contingencia: false,
      mensagem: '',
    },
    itens: [
      {
        uuid: 'item-venda-uuid',
        produtoId: 2050,
        skuId: 10825,
        ean13: '7892701000013',
        referencia: '27-01-01001',
        codigoItemRef: '00001',
        descricao: 'Calça Jeans Reta Aurora',
        descricaoReduzida: 'Calça Jeans',
        cor: 'Jeans',
        tamanho: '34',
        unidade: 'UN',
        quantidade: 1,
        precoUnitario: '199.9000',
        desconto: '0.00',
        totalItem: '199.90',
      },
    ],
    pagamentos: [],
  },
  clientePreselecionado: null,
  vendedorPreselecionado: null,
};

export const vendaAtualSemVendaStub: VendaAtualResponse = {
  venda: null,
  clientePreselecionado: null,
  vendedorPreselecionado: null,
};

export const clientePreselecionadoStub = {
  clienteUuid: 'cliente-uuid',
  retaguardaId: 123,
  tipoPessoa: 'PF' as const,
  documento: '12345678901',
  clientePadrao: false,
  nomeCliente: 'Maria Silva',
};

export const vendaAtualComClientePreselecionadoStub: VendaAtualResponse = {
  venda: null,
  clientePreselecionado: clientePreselecionadoStub,
  vendedorPreselecionado: null,
};

export const vendedorStub = {
  id: 501,
  matricula: '000501',
  nome: 'Ana Vendedora',
  apelido: 'Ana',
  cargo: { id: 5, codigo: 'VENDEDOR', descricao: 'Vendedor' },
  comissionado: true,
  comissaoPercentual: '3.00',
};

export const vendaAtualComVendedorPreselecionadoStub: VendaAtualResponse = {
  venda: null,
  clientePreselecionado: null,
  vendedorPreselecionado: vendedorStub,
};
