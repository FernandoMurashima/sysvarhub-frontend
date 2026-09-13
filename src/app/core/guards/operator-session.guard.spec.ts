import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { OperatorSessionService } from '../../features/operador/services/operator-session.service';
import { operatorSessionGuard } from './operator-session.guard';

describe('operatorSessionGuard', () => {
  let session: jasmine.SpyObj<OperatorSessionService>;
  let router: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => operatorSessionGuard(...guardParameters));

  beforeEach(() => {
    session = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['bootstrap']);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OperatorSessionService, useValue: session },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('sem operador redireciona para /operador', (done) => {
    const tree = {} as UrlTree;
    session.bootstrap.and.returnValue(of(false));
    router.createUrlTree.and.returnValue(tree);

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/operador']);
      done();
    });
  });

  it('operador autenticado libera rota', (done) => {
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });
});
