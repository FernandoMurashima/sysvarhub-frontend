import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { OperadorHubPublico } from '../models/operador.models';
import { HubAuthorizationService } from '../services/hub-authorization.service';
import { OperatorSessionService } from '../../features/operador/services/operator-session.service';
import { operatorSessionGuard } from './operator-session.guard';

describe('operatorSessionGuard', () => {
  let session: jasmine.SpyObj<OperatorSessionService>;
  let authorization: jasmine.SpyObj<HubAuthorizationService>;
  let router: jasmine.SpyObj<Router>;
  const operador = signal<OperadorHubPublico | null>({ usuarioId: 1, codigo: '001', nome: 'Operador', tipo: 'OPERADOR', perfil: null });

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => operatorSessionGuard(...guardParameters));

  beforeEach(() => {
    operador.set({ usuarioId: 1, codigo: '001', nome: 'Operador', tipo: 'OPERADOR', perfil: null });
    session = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['bootstrap'], {
      operador: operador.asReadonly(),
    });
    authorization = jasmine.createSpyObj<HubAuthorizationService>('HubAuthorizationService', ['canAccessModule']);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OperatorSessionService, useValue: session },
        { provide: HubAuthorizationService, useValue: authorization },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('sem operador redireciona para /operador preservando modulo solicitado', (done) => {
    const tree = {} as UrlTree;
    session.bootstrap.and.returnValue(of(false));
    router.createUrlTree.and.returnValue(tree);

    const result$ = executeGuard({ data: { moduleKey: 'pdv' } } as never, { url: '/pdv' } as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/operador'], { queryParams: { returnUrl: '/pdv' } });
      done();
    });
  });

  it('operador autenticado libera rota', (done) => {
    session.bootstrap.and.returnValue(of(true));
    authorization.canAccessModule.and.returnValue(true);

    const result$ = executeGuard({ data: { moduleKey: 'consulta-vendas' } } as never, { url: '/consulta-vendas' } as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBeTrue();
      expect(authorization.canAccessModule).toHaveBeenCalledWith(session.operador(), 'consulta-vendas');
      done();
    });
  });

  it('operador autenticado sem permissao recebe bloqueio amigavel sem logout', (done) => {
    const tree = {} as UrlTree;
    session.bootstrap.and.returnValue(of(true));
    authorization.canAccessModule.and.returnValue(false);
    router.createUrlTree.and.returnValue(tree);

    const result$ = executeGuard({ data: { moduleKey: 'vale-troca' } } as never, { url: '/vale-troca' } as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/acesso-negado'], { queryParams: { module: 'vale-troca' } });
      expect(session.bootstrap).toHaveBeenCalled();
      done();
    });
  });
});
