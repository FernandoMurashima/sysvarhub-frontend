import { routes } from './app.routes';
import { operatorSessionGuard } from './core/guards/operator-session.guard';
import { terminalSessionGuard } from './core/guards/terminal-session.guard';

describe('routes', () => {
  it('usa Home do Hub na raiz com sessao de terminal', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBeUndefined();
    expect(rootRoute?.canActivate).toEqual([terminalSessionGuard]);
  });

  it('mantem guard nas rotas operacionais', () => {
    const pdvRoute = routes.find((route) => route.path === 'pdv');
    const operadorRoute = routes.find((route) => route.path === 'operador');
    const suporteRoute = routes.find((route) => route.path === 'suporte');

    expect(pdvRoute?.canActivate).toContain(terminalSessionGuard);
    expect(pdvRoute?.canActivate).toContain(operatorSessionGuard);
    expect(pdvRoute?.canActivate).toEqual([terminalSessionGuard, operatorSessionGuard]);
    expect(operadorRoute?.canActivate).toEqual([terminalSessionGuard]);
    expect(suporteRoute?.canActivate).toContain(terminalSessionGuard);
    expect(suporteRoute?.canActivate).not.toContain(operatorSessionGuard);
  });

  it('cria rotas dos modulos operacionais do Hub', () => {
    for (const path of ['devolucao-troca', 'consulta-vendas', 'vale-troca', 'pendencias-sincronizacao']) {
      const route = routes.find((item) => item.path === path);

      expect(route).toBeTruthy();
      expect(route?.canActivate).toEqual([terminalSessionGuard]);
      expect(route?.data?.['moduleKey']).toBe(path);
    }
  });

  it('existe rota publica de ativacao sem guards', () => {
    const ativacaoRoute = routes.find((route) => route.path === 'ativacao');

    expect(ativacaoRoute).toBeTruthy();
    expect(ativacaoRoute?.canActivate).toBeUndefined();
  });

  it('nao combina redirectTo com canActivate em nenhuma rota', () => {
    const invalidRoute = routes.find((route) => route.redirectTo && route.canActivate);

    expect(invalidRoute).toBeUndefined();
  });
});
