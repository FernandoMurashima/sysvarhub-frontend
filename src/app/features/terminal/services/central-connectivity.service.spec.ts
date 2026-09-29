import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { HubTerminalService } from './hub-terminal.service';
import { CentralConnectivityService } from './central-connectivity.service';

describe('CentralConnectivityService', () => {
  let service: CentralConnectivityService;
  let hubTerminalService: jasmine.SpyObj<HubTerminalService>;

  beforeEach(() => {
    hubTerminalService = jasmine.createSpyObj<HubTerminalService>('HubTerminalService', ['centralStatus']);
    hubTerminalService.centralStatus.and.returnValue(of({
      status: 'ONLINE',
      online: true,
      ultimo_contato_em: '2026-09-29T10:20:30Z',
      ultima_tentativa_em: '2026-09-29T10:20:30Z',
    }));

    TestBed.configureTestingModule({
      providers: [
        CentralConnectivityService,
        { provide: HubTerminalService, useValue: hubTerminalService },
      ],
    });

    service = TestBed.inject(CentralConnectivityService);
  });

  afterEach(() => service.stopPolling());

  it('inicia em verificando e atualiza para online sem duplicar polling', fakeAsync(() => {
    expect(service.status()).toBe('VERIFICANDO');

    service.startPolling();
    service.startPolling();
    tick(0);

    expect(hubTerminalService.centralStatus).toHaveBeenCalledTimes(1);
    expect(service.status()).toBe('ONLINE');
    expect(service.online()).toBeTrue();

    tick(15_000);
    expect(hubTerminalService.centralStatus).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));

  it('transiciona para offline em erro de comunicacao local', fakeAsync(() => {
    hubTerminalService.centralStatus.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.startPolling();
    tick(0);

    expect(service.status()).toBe('OFFLINE');
    expect(service.online()).toBeFalse();
    discardPeriodicTasks();
  }));
});
