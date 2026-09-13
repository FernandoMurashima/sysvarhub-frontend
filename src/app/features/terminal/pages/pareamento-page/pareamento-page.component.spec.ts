import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { terminalContextoStub } from '../../../../testing/terminal-test-data';
import { HubTerminalService } from '../../services/hub-terminal.service';
import { TerminalSessionService } from '../../services/terminal-session.service';
import { PareamentoPageComponent } from './pareamento-page.component';

describe('PareamentoPageComponent', () => {
  let fixture: ComponentFixture<PareamentoPageComponent>;
  let component: PareamentoPageComponent;
  let hubTerminalService: jasmine.SpyObj<HubTerminalService>;
  let terminalSession: jasmine.SpyObj<TerminalSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    hubTerminalService = jasmine.createSpyObj<HubTerminalService>('HubTerminalService', ['parear']);
    terminalSession = jasmine.createSpyObj<TerminalSessionService>('TerminalSessionService', [
      'definirContextoPareado',
      'carregarContexto',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [PareamentoPageComponent, ReactiveFormsModule],
      providers: [
        { provide: HubTerminalService, useValue: hubTerminalService },
        { provide: TerminalSessionService, useValue: terminalSession },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PareamentoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria a tela de pareamento', () => {
    expect(component).toBeTruthy();
  });

  it('pareia sem exibir token e direciona para pdv', () => {
    hubTerminalService.parear.and.returnValue(of({ token: 'token-ficticio', contexto: terminalContextoStub }));

    component.form.setValue({ codigo_pareamento: 'ABC123', hostname: 'PDV-01' });
    component.parear();

    expect(hubTerminalService.parear).toHaveBeenCalledWith({
      codigo_pareamento: 'ABC123',
      hostname: 'PDV-01',
    });
    expect(terminalSession.definirContextoPareado).toHaveBeenCalledWith(terminalContextoStub);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pdv');
    expect(fixture.nativeElement.textContent).not.toContain('token-ficticio');
  });
});
