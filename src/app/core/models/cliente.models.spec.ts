import { formatarDocumentoCliente, mapCliente, mapClientes } from './cliente.models';

describe('cliente models', () => {
  it('mapeia cliente snake_case para camelCase preservando nulos e flags', () => {
    const cliente = mapCliente({
      cliente_uuid: 'cliente-uuid',
      retaguarda_id: null,
      origem: 'LOCAL',
      tipo_pessoa: 'PF',
      documento: null,
      cliente_padrao: true,
      nome_cliente: 'Cliente Local',
      apelido: '',
      telefone1: '',
      telefone2: '21988887777',
      email: '',
      aniversario: '1990-01-02',
      endereco: 'Rua A',
      numero: '10',
      complemento: 'Sala 2',
      cep: '20000000',
      bairro: 'Centro',
      cidade: '',
      estado: '',
      bloqueio: false,
      motivo_bloqueio: null,
      ativo: true,
      presente_retaguarda: false,
      pendente_sincronizacao: true,
    });

    expect(cliente.clienteUuid).toBe('cliente-uuid');
    expect(cliente.retaguardaId).toBeNull();
    expect(cliente.documento).toBeNull();
    expect(cliente.clientePadrao).toBeTrue();
    expect(cliente.ativo).toBeTrue();
    expect(cliente.bloqueio).toBeFalse();
    expect(cliente.presenteRetaguarda).toBeFalse();
    expect(cliente.telefone2).toBe('21988887777');
    expect(cliente.aniversario).toBe('1990-01-02');
    expect(cliente.endereco).toBe('Rua A');
    expect(cliente.numero).toBe('10');
    expect(cliente.complemento).toBe('Sala 2');
    expect(cliente.cep).toBe('20000000');
    expect(cliente.bairro).toBe('Centro');
    expect(cliente.pendenteSincronizacao).toBeTrue();
  });

  it('mapeia resposta de consulta', () => {
    const response = mapClientes({
      clientes_versao: 1,
      clientes_sincronizado_em: '2026-09-14T10:00:00',
      q: 'maria',
      total: 1,
      limit: 50,
      clientes: [{
        cliente_uuid: 'cliente-uuid',
        retaguarda_id: 123,
        origem: 'RETAGUARDA',
        tipo_pessoa: 'PJ',
        documento: '12345678000190',
        cliente_padrao: false,
        nome_cliente: 'Cliente PJ',
        apelido: 'PJ',
        telefone1: '21999990000',
        telefone2: '',
        email: 'cliente@example.com',
        aniversario: null,
        endereco: '',
        numero: '',
        complemento: '',
        cep: '',
        bairro: '',
        cidade: 'Rio',
        estado: 'RJ',
        bloqueio: true,
        motivo_bloqueio: 'Bloqueado',
        ativo: false,
        presente_retaguarda: true,
        pendente_sincronizacao: false,
      }],
    });

    expect(response.clientesVersao).toBe(1);
    expect(response.q).toBe('maria');
    expect(response.clientes[0].retaguardaId).toBe(123);
    expect(response.clientes[0].motivoBloqueio).toBe('Bloqueado');
  });

  it('formata cpf e cnpj apenas para exibicao', () => {
    expect(formatarDocumentoCliente('PF', '12345678901')).toBe('123.456.789-01');
    expect(formatarDocumentoCliente('PJ', '12345678000190')).toBe('12.345.678/0001-90');
    expect(formatarDocumentoCliente('PF', null)).toBe('Sem documento');
  });
});
