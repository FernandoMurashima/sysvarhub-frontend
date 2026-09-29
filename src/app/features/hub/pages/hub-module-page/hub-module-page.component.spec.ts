import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubModulePageComponent } from './hub-module-page.component';

describe('HubModulePageComponent', () => {
  let fixture: ComponentFixture<HubModulePageComponent>;
  let centralConnectivity: jasmine.SpyObj<CentralConnectivityService>;
  const centralStatusSignal = signal<'VERIFICANDO' | 'ONLINE' | 'OFFLINE'>('OFFLINE');
  const centralUltimoContatoSignal = signal('');

  beforeEach(async () => {
    centralStatusSignal.set('OFFLINE');
    centralUltimoContatoSignal.set('');
    centralConnectivity = jasmine.createSpyObj<CentralConnectivityService>('CentralConnectivityService', ['startPolling'], {
      status: centralStatusSignal.asReadonly(),
      lastContactLabel: centralUltimoContatoSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [HubModulePageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { moduleKey: 'devolucao-troca' } } } },
        { provide: TerminalSessionService, useValue: { contexto: signal(terminalContextoStub).asReadonly() } },
        { provide: OperatorSessionService, useValue: { operador: signal(operadorLoginResponseStub.operador).asReadonly() } },
        { provide: CentralConnectivityService, useValue: centralConnectivity },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HubModulePageComponent);
    fixture.detectChanges();
  });

  it('Devolucao Troca mostra estado da Central sem implementar funcionalidade', () => {
    expect(fixture.nativeElement.textContent).toContain('Devolução / Troca');
    expect(fixture.nativeElement.textContent).toContain('Central');
    expect(fixture.nativeElement.textContent).toContain('OFFLINE');
    expect(centralConnectivity.startPolling).toHaveBeenCalled();

    centralStatusSignal.set('ONLINE');
    centralUltimoContatoSignal.set('10:20:30');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ONLINE · 10:20:30');
  });
});
