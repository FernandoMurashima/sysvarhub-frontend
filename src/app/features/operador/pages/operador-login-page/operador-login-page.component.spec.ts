import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { terminalContextoStub } from '../../../../testing/terminal-test-data';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { OperatorSessionService } from '../../services/operator-session.service';
import { OperadorLoginPageComponent } from './operador-login-page.component';

describe('OperadorLoginPageComponent', () => {
  let fixture: ComponentFixture<OperadorLoginPageComponent>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['login']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [OperadorLoginPageComponent],
      providers: [
        {
          provide: TerminalSessionService,
          useValue: { contexto: signal(terminalContextoStub).asReadonly() },
        },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperadorLoginPageComponent);
    fixture.detectChanges();
  });

  it('renderiza contexto Loja/Caixa/Terminal', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Empresa Teste Ltda');
    expect(text).toContain('Loja Barra');
    expect(text).toContain('Caixa 01');
    expect(text).toContain('PDV-01');
  });

  it('credencial e password', () => {
    const password = fixture.debugElement.query(By.css('input[type="password"]'));

    expect(password).toBeTruthy();
  });

  it('envia codigo e senha e navega para pdv no sucesso', () => {
    operatorSession.login.and.returnValue(of(true));
    const component = fixture.componentInstance;

    component.codigo = 'caixa.barra';
    component.senha = 'credencial-digitada';
    component.entrar(new Event('submit'));

    expect(operatorSession.login).toHaveBeenCalledWith('caixa.barra', 'credencial-digitada');
    expect(component.senha).toBe('');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pdv');
  });

  it('erro 400 mostra mensagem generica e limpa senha', () => {
    operatorSession.login.and.returnValue(of(false));
    const component = fixture.componentInstance;

    component.codigo = 'caixa.barra';
    component.senha = 'credencial-incorreta';
    component.entrar(new Event('submit'));
    fixture.detectChanges();

    expect(component.senha).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Operador ou credencial inválidos.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('nao contem chamadas ou textos de Central', () => {
    const text = fixture.nativeElement.textContent.toLowerCase();

    expect(text).not.toContain('central');
  });
});
