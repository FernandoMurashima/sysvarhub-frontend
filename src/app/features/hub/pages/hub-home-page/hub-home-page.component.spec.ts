import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionStatus } from '../../../../core/models/operador.models';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubHomePageComponent } from './hub-home-page.component';

describe('HubHomePageComponent', () => {
  let fixture: ComponentFixture<HubHomePageComponent>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  const operadorSignal = signal(null as typeof operadorLoginResponseStub.operador | null);
  const operatorStatusSignal = signal<OperatorSessionStatus>('nao-autenticado');

  beforeEach(async () => {
    operadorSignal.set(null);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['bootstrap', 'logout'], {
      operador: operadorSignal.asReadonly(),
      status: operatorStatusSignal.asReadonly(),
    });
    operatorSession.bootstrap.and.returnValue(of(false));
    operatorSession.logout.and.returnValue(of(true));

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HubHomePageComponent);
    fixture.detectChanges();
  });

  it('Home fica acessivel sem operador autenticado', () => {
    expect(fixture.nativeElement.textContent).toContain('Nenhum operador autenticado');
    expect(fixture.nativeElement.textContent).toContain('Hub operacional');
    expect(operatorSession.bootstrap).toHaveBeenCalled();
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
