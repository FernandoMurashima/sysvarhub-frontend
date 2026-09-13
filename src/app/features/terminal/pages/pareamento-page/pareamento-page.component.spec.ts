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
    terminalSession = jasmine.createSpyObj<TerminalSessionService>('TerminalSessionService', ['carregarContexto']);
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
    hubTerminalService.parear.and.returnValue(
      of({
        token: 'token-ficticio',
        terminal: {
          uuid: 'terminal-uuid-ficticio',
          codigo: 'PDV-01',
          nome: 'PDV-01',
        },
        caixa: terminalContextoStub.caixa,
        loja: terminalContextoStub.loja,
        empresa: terminalContextoStub.empresa,
      }),
    );
    terminalSession.carregarContexto.and.returnValue(of(terminalContextoStub));

    component.form.setValue({ codigo: 'XXXX-XXXX-XXXX', hostname: 'PDV-BARRA-01' });
    component.parear();

    expect(hubTerminalService.parear).toHaveBeenCalledWith({
      codigo: 'XXXX-XXXX-XXXX',
      hostname: 'PDV-BARRA-01',
    });
    expect(hubTerminalService.parear.calls.mostRecent().args[0]).not.toEqual(
      jasmine.objectContaining({ codigo_pareamento: jasmine.any(String) }),
    );
    expect(terminalSession.carregarContexto).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pdv');
    expect(fixture.nativeElement.textContent).not.toContain('token-ficticio');
  });
});
