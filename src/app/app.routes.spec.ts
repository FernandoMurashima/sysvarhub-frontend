import { routes } from './app.routes';
import { operatorSessionGuard } from './core/guards/operator-session.guard';
import { terminalSessionGuard } from './core/guards/terminal-session.guard';

describe('routes', () => {
  it('redireciona raiz para pdv sem canActivate', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBe('pdv');
    expect(rootRoute?.canActivate).toBeUndefined();
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

  it('nao combina redirectTo com canActivate em nenhuma rota', () => {
    const invalidRoute = routes.find((route) => route.redirectTo && route.canActivate);

    expect(invalidRoute).toBeUndefined();
  });
});
