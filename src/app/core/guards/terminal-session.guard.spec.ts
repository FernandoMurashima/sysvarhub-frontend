import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { HubAtivacaoStatus } from '../../features/ativacao/models/hub-ativacao.models';
import { HubAtivacaoService } from '../../features/ativacao/services/hub-ativacao.service';
import { TerminalSessionService } from '../../features/terminal/services/terminal-session.service';
import { terminalSessionGuard } from './terminal-session.guard';

describe('terminalSessionGuard', () => {
  let ativacao: jasmine.SpyObj<HubAtivacaoService>;
  let session: jasmine.SpyObj<TerminalSessionService>;
  let router: jasmine.SpyObj<Router>;
  let urlTrees: Record<string, UrlTree>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => terminalSessionGuard(...guardParameters));

  const statusAtivacao = (overrides: Partial<HubAtivacaoStatus> = {}): HubAtivacaoStatus => ({
    ativado: true,
    possui_credencial: true,
    hub_uuid: 'hub-uuid',
    nome: 'Sysvar Hub',
    empresa_id: 1,
    empresa_nome: 'Empresa',
    loja_id: 2,
    loja_nome: 'Loja',
    retaguarda_url: 'http://central.test',
    ativado_em: '2026-09-29T10:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    ativacao = jasmine.createSpyObj<HubAtivacaoService>('HubAtivacaoService', ['status']);
    session = jasmine.createSpyObj<TerminalSessionService>('TerminalSessionService', ['bootstrap']);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    urlTrees = {
      ativacao: {} as UrlTree,
      pareamento: {} as UrlTree,
    };
    router.createUrlTree.and.callFake((commands) => {
      const path = commands.join('/');
      return path === '/ativacao' ? urlTrees['ativacao'] : urlTrees['pareamento'];
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HubAtivacaoService, useValue: ativacao },
        { provide: TerminalSessionService, useValue: session },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('hub nao ativado e terminal sem token redireciona para ativacao', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao({ ativado: false, possui_credencial: false })));
    session.bootstrap.and.returnValue(of(false));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(urlTrees['ativacao']);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/ativacao']);
      expect(session.bootstrap).not.toHaveBeenCalled();
      done();
    });
  });

  it('hub nao ativado tem precedencia mesmo com terminal aparentemente valido', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao({ ativado: false, possui_credencial: false })));
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(urlTrees['ativacao']);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/ativacao']);
      expect(session.bootstrap).not.toHaveBeenCalled();
      done();
    });
  });

  it('hub ativado e terminal sem credencial recuperavel redireciona para pareamento', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao()));
    session.bootstrap.and.returnValue(of(false));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(urlTrees['pareamento']);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/pareamento']);
      done();
    });
  });

  it('hub ativado e token no browser valido libera rota operacional', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao()));
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('hub ativado e localStorage vazio com recuperacao local valida libera rota operacional', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao()));
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBeTrue();
      expect(session.bootstrap).toHaveBeenCalled();
      done();
    });
  });

  it('hub ativado e recuperacao local invalida redireciona para pareamento', (done) => {
    ativacao.status.and.returnValue(of(statusAtivacao()));
    session.bootstrap.and.returnValue(of(false));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(urlTrees['pareamento']);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/pareamento']);
      done();
    });
  });

  it('falha temporaria ao consultar ativacao redireciona para ativacao sem bootstrap terminal', (done) => {
    ativacao.status.and.returnValue(throwError(() => new Error('offline')));
    session.bootstrap.and.returnValue(of(true));

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;

    result$.subscribe((result) => {
      expect(result).toBe(urlTrees['ativacao']);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/ativacao']);
      expect(session.bootstrap).not.toHaveBeenCalled();
      done();
    });
  });
});
