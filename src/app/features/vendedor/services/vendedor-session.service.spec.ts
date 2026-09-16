import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendedorService } from './hub-vendedor.service';
import { VendedorSessionExpiredError, VendedorSessionService } from './vendedor-session.service';

describe('VendedorSessionService', () => {
  let service: VendedorSessionService;
  let hubVendedorService: jasmine.SpyObj<HubVendedorService>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    hubVendedorService = jasmine.createSpyObj<HubVendedorService>('HubVendedorService', ['consultar']);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['invalidarSessao']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        VendedorSessionService,
        { provide: HubVendedorService, useValue: hubVendedorService },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(VendedorSessionService);
  });

  it('lista vendedores normalmente', (done) => {
    hubVendedorService.consultar.and.returnValue(of({
      vendedoresVersao: 1,
      vendedoresSincronizadoEm: null,
      q: '',
      total: 0,
      limit: 50,
      vendedores: [],
    }));

    service.listar().subscribe((response) => {
      expect(response.limit).toBe(50);
      expect(hubVendedorService.consultar).toHaveBeenCalledWith('');
      done();
    });
  });

  [401, 403].forEach((status) => {
    it(`invalida somente operador em ${status}`, (done) => {
      hubVendedorService.consultar.and.returnValue(throwError(() => new HttpErrorResponse({ status })));

      service.listar('Ana').subscribe({
        error: (error: unknown) => {
          expect(error).toEqual(jasmine.any(VendedorSessionExpiredError));
          expect(operatorSession.invalidarSessao).toHaveBeenCalledTimes(1);
          expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
          expect(hubVendedorService.consultar).toHaveBeenCalledWith('Ana');
          done();
        },
      });
    });
  });

  it('erro de rede nao invalida operador automaticamente', (done) => {
    const erroRede = new HttpErrorResponse({ status: 0 });
    hubVendedorService.consultar.and.returnValue(throwError(() => erroRede));

    service.listar().subscribe({
      error: (error: unknown) => {
        expect(error).toBe(erroRede);
        expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
