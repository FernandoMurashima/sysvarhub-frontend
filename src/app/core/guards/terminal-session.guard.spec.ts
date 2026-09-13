import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { TerminalSessionService } from '../../features/terminal/services/terminal-session.service';
import { terminalSessionGuard } from './terminal-session.guard';

describe('terminalSessionGuard', () => {
  let session: jasmine.SpyObj<TerminalSessionService>;
  let router: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => terminalSessionGuard(...guardParameters));

  beforeEach(() => {
    session = jasmine.createSpyObj<TerminalSessionService>('TerminalSessionService', ['bootstrap']);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: TerminalSessionService, useValue: session },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('sem sessao redireciona para pareamento', (done) => {
    const tree = {} as UrlTree;
    session.bootstrap.and.returnValue(of(false));
    router.createUrlTree.and.returnValue(tree);

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/pareamento']);
      done();
    });
  });

  it('sessao valida libera rota operacional', (done) => {
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });
});
