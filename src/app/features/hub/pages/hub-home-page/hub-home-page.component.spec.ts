import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionStatus } from '../../../../core/models/operador.models';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubHomePageComponent } from './hub-home-page.component';

describe('HubHomePageComponent', () => {
  let fixture: ComponentFixture<HubHomePageComponent>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let centralConnectivity: jasmine.SpyObj<CentralConnectivityService>;
  const operadorSignal = signal(null as typeof operadorLoginResponseStub.operador | null);
  const operatorStatusSignal = signal<OperatorSessionStatus>('nao-autenticado');
  const centralStatusSignal = signal<'VERIFICANDO' | 'ONLINE' | 'OFFLINE'>('VERIFICANDO');
  const centralUltimoContatoSignal = signal('');

  beforeEach(async () => {
    operadorSignal.set(null);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['bootstrap', 'logout'], {
      operador: operadorSignal.asReadonly(),
      status: operatorStatusSignal.asReadonly(),
    });
    operatorSession.bootstrap.and.returnValue(of(false));
    operatorSession.logout.and.returnValue(of(true));
    centralStatusSignal.set('VERIFICANDO');
    centralUltimoContatoSignal.set('');
    centralConnectivity = jasmine.createSpyObj<CentralConnectivityService>('CentralConnectivityService', ['startPolling'], {
      status: centralStatusSignal.asReadonly(),
      lastContactLabel: centralUltimoContatoSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [HubHomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: TerminalSessionService,
          useValue: {
            contexto: signal(terminalContextoStub).asReadonly(),
            status: signal('contexto-carregado').asReadonly(),
          },
        },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: CentralConnectivityService, useValue: centralConnectivity },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HubHomePageComponent);
    fixture.detectChanges();
  });

  it('Home fica acessivel sem operador autenticado', () => {
    expect(fixture.nativeElement.textContent).toContain('Nenhum operador autenticado');
    expect(fixture.nativeElement.textContent).toContain('Hub operacional');
    expect(operatorSession.bootstrap).toHaveBeenCalled();
    expect(centralConnectivity.startPolling).toHaveBeenCalled();
  });

  it('exibe transicoes da Central sem recarregar a Home', () => {
    expect(fixture.nativeElement.textContent).toContain('VERIFICANDO');

    centralStatusSignal.set('ONLINE');
    centralUltimoContatoSignal.set('10:20:30');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ONLINE · 10:20:30');

    centralStatusSignal.set('OFFLINE');
    centralUltimoContatoSignal.set('');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('OFFLINE');
  });

  it('exibe operador autenticado e permite logout sem acionar terminal', () => {
    operadorSignal.set(operadorLoginResponseStub.operador);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(operadorLoginResponseStub.operador.nome);

    fixture.componentInstance.sairOperador();

    expect(operatorSession.logout).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(terminalContextoStub.terminal.codigo);
  });
});
