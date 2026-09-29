import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { terminalContextoStub } from '../../../../testing/terminal-test-data';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { OperatorSessionService } from '../../services/operator-session.service';
import { OperadorLoginPageComponent } from './operador-login-page.component';

describe('OperadorLoginPageComponent', () => {
  let fixture: ComponentFixture<OperadorLoginPageComponent>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let router: Router;
  let navigateByUrlSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['login']);

    await TestBed.configureTestingModule({
      imports: [OperadorLoginPageComponent, RouterTestingModule.withRoutes([])],
      providers: [
        {
          provide: TerminalSessionService,
          useValue: { contexto: signal(terminalContextoStub).asReadonly() },
        },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
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

  it('credencial continua type password', () => {
    const password = fixture.debugElement.query(By.css('input[type="password"]'));

    expect(password).toBeTruthy();
  });

  it('desabilita autocomplete geral do formulario', () => {
    const form = fixture.debugElement.query(By.css('form.login-card'));

    expect(form.nativeElement.getAttribute('autocomplete')).toBe('off');
  });

  it('exibe botao Voltar a Home sem autenticar', () => {
    const link = fixture.debugElement.query(By.css('a.home-link'));

    expect(link).toBeTruthy();
    expect(link.nativeElement.textContent).toContain('Voltar à Home');
    expect(link.nativeElement.getAttribute('href')).toBe('/');
    expect(operatorSession.login).not.toHaveBeenCalled();
  });

  it('campo operador nao usa autocomplete username', () => {
    const operador = fixture.debugElement.query(By.css('input[name="operadorCodigoPdv"]'));

    expect(operador).toBeTruthy();
    expect(operador.nativeElement.getAttribute('autocomplete')).toBe('off');
    expect(operador.nativeElement.getAttribute('autocomplete')).not.toBe('username');
  });

  it('credencial usa configuracao anti-autofill sem current-password', () => {
    const credencial = fixture.debugElement.query(By.css('input[name="operadorCredencialPdv"]'));

    expect(credencial).toBeTruthy();
    expect(credencial.nativeElement.getAttribute('type')).toBe('password');
    expect(credencial.nativeElement.getAttribute('autocomplete')).toBe('new-password');
    expect(credencial.nativeElement.getAttribute('autocomplete')).not.toBe('current-password');
  });

  it('senha comeca vazia', () => {
    expect(fixture.componentInstance.senha).toBe('');
  });

  it('envia codigo e senha e navega para pdv no sucesso', () => {
    operatorSession.login.and.returnValue(of(true));
    const component = fixture.componentInstance;

    component.codigo = 'caixa.barra';
    component.senha = 'credencial-digitada';
    component.entrar(new Event('submit'));

    expect(operatorSession.login).toHaveBeenCalledWith('caixa.barra', 'credencial-digitada');
    expect(component.senha).toBe('');
    expect(localStorage.getItem('credencial-digitada')).toBeNull();
    expect(sessionStorage.getItem('credencial-digitada')).toBeNull();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/pdv');
  });

  it('apos autenticacao valida retorna ao modulo solicitado', () => {
    TestBed.resetTestingModule();
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['login']);
    operatorSession.login.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [OperadorLoginPageComponent, RouterTestingModule.withRoutes([])],
      providers: [
        {
          provide: TerminalSessionService,
          useValue: { contexto: signal(terminalContextoStub).asReadonly() },
        },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/consulta-vendas' }) } } },
      ],
    });

    router = TestBed.inject(Router);
    navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const localFixture = TestBed.createComponent(OperadorLoginPageComponent);
    const component = localFixture.componentInstance;
    component.codigo = 'caixa.barra';
    component.senha = 'credencial-digitada';
    component.entrar(new Event('submit'));

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/consulta-vendas');
  });

  it('erro 400 mostra mensagem generica e limpa senha', () => {
    operatorSession.login.and.returnValue(of(false));
    const component = fixture.componentInstance;

    component.codigo = 'caixa.barra';
    component.senha = 'credencial-incorreta';
    component.entrar(new Event('submit'));
    fixture.detectChanges();

    expect(component.senha).toBe('');
    expect(JSON.stringify(localStorage)).not.toContain('credencial-incorreta');
    expect(JSON.stringify(sessionStorage)).not.toContain('credencial-incorreta');
    expect(fixture.nativeElement.textContent).toContain('Operador ou credencial inválidos.');
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('nenhum storage guarda a senha digitada', () => {
    operatorSession.login.and.returnValue(of(false));
    const component = fixture.componentInstance;

    component.codigo = 'caixa.barra';
    component.senha = 'senha-nao-persistida';
    component.entrar(new Event('submit'));

    expect(Object.values(localStorage).join(' ')).not.toContain('senha-nao-persistida');
    expect(Object.values(sessionStorage).join(' ')).not.toContain('senha-nao-persistida');
  });

  it('nao contem chamadas ou textos de Central', () => {
    const text = fixture.nativeElement.textContent.toLowerCase();

    expect(text).not.toContain('central');
  });
});
