import { mapCaixaStatus } from './caixa.models';

describe('caixa models', () => {
  it('adapta snake_case para camelCase mantendo valor_abertura como string', () => {
    const response = mapCaixaStatus({
      caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
      aberto: true,
      sessao: {
        uuid: 'sessao-caixa-uuid',
        status: 'ABERTO',
        valor_abertura: '100.00',
        aberto_em: '2026-09-13T12:00:00',
        fechado_em: null,
        caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
        terminal_abertura: { uuid: 'terminal-uuid', codigo: 'PDV-01', nome: 'PDV 01' },
        operador_abertura: {
          usuario_id: 90,
          codigo: 'caixa.barra',
          nome: 'Juliana Rocha',
          tipo: 'Caixa',
          perfil: null,
        },
        terminal_fechamento: null,
        operador_fechamento: null,
      },
    });

    expect(response.sessao?.valorAbertura).toBe('100.00');
    expect(response.sessao?.abertoEm).toBe('2026-09-13T12:00:00');
    expect(response.sessao?.operadorAbertura.nome).toBe('Juliana Rocha');
  });
});
