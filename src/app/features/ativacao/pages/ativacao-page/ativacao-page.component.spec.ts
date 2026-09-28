import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { HubAtivacaoStatus } from '../../models/hub-ativacao.models';
import { HubAtivacaoService } from '../../services/hub-ativacao.service';
import { AtivacaoPageComponent } from './ativacao-page.component';

describe('AtivacaoPageComponent', () => {
  let fixture: ComponentFixture<AtivacaoPageComponent>;
  let component: AtivacaoPageComponent;
  let service: jasmine.SpyObj<HubAtivacaoService>;
  let router: jasmine.SpyObj<Router>;

  const status = (overrides: Partial<HubAtivacaoStatus> = {}): HubAtivacaoStatus => ({
    ativado: false,
    possui_credencial: false,
    hub_uuid: 'hub-uuid',
    nome: 'Sysvar Hub',
    empresa_id: null,
    empresa_nome: '',
    loja_id: null,
    loja_nome: '',
    retaguarda_url: 'http://central.test',
    ativado_em: null,
    ...overrides,
  });

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    service = jasmine.createSpyObj<HubAtivacaoService>('HubAtivacaoService', ['status', 'ativar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    service.status.and.returnValue(of(status()));
    service.ativar.and.returnValue(of(status({ ativado: true, possui_credencial: true, empresa_nome: 'Empresa', loja_nome: 'Loja' })));

    await TestBed.configureTestingModule({
      imports: [AtivacaoPageComponent, ReactiveFormsModule],
      providers: [
        { provide: HubAtivacaoService, useValue: service },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AtivacaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('GET preenche URL existente e mostra nao ativado', () => {
    expect(service.status).toHaveBeenCalled();
    expect(component.form.controls.retaguarda_url.value).toBe('http://central.test');
    expect(fixture.nativeElement.textContent).toContain('Não ativado');
  });

  it('mostra ativado com empresa loja e uuid', async () => {
    service.status.and.returnValue(
      of(status({
        ativado: true,
        possui_credencial: true,
        empresa_nome: 'Empresa Teste',
        loja_nome: 'Filial 1',
        ativado_em: '2026-09-28T08:00:00-03:00',
      })),
    );

    fixture = TestBed.createComponent(AtivacaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Conectado/Ativado');
    expect(text).toContain('Empresa Teste');
    expect(text).toContain('Filial 1');
    expect(text).toContain('hub-uuid');
  });

  it('POST normaliza codigo, envia URL e mostra sucesso sem armazenar segredo', () => {
    component.form.setValue({ retaguarda_url: ' http://central.test/ ', codigo: ' abcd-efgh-ijkl ' });
    component.ativar();
    fixture.detectChanges();

    expect(service.ativar).toHaveBeenCalledWith({
      retaguarda_url: 'http://central.test/',
      codigo: 'ABCD-EFGH-IJKL',
    });
    expect(component.successMessage()).toBe('Sysvar Hub ativado com sucesso.');
    expect(component.form.controls.codigo.value).toBe('');
    expect(JSON.stringify(localStorage)).not.toContain('ABCD-EFGH-IJKL');
    expect(JSON.stringify(sessionStorage)).not.toContain('ABCD-EFGH-IJKL');
    expect(JSON.stringify(localStorage)).not.toContain('TOKEN');
    expect(JSON.stringify(sessionStorage)).not.toContain('TOKEN');
  });

  it('loading bloqueia duplo envio durante ativacao', () => {
    const pending = new Subject<HubAtivacaoStatus>();
    service.ativar.and.returnValue(pending.asObservable());
    component.form.setValue({ retaguarda_url: 'http://central.test', codigo: 'CODIGO' });

    component.ativar();
    component.ativar();

    expect(service.ativar).toHaveBeenCalledTimes(1);
    expect(component.saving()).toBeTrue();
    pending.next(status({ ativado: true, possui_credencial: true }));
    pending.complete();
  });

  it('erro controlado aparece sem stack trace', () => {
    service.ativar.and.returnValue(throwError(() => ({ error: { detail: 'Codigo invalido.' } })));
    component.form.setValue({ retaguarda_url: 'http://central.test', codigo: 'CODIGO' });

    component.ativar();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Codigo invalido.');
    expect(fixture.nativeElement.textContent).not.toContain('Traceback');
  });

  it('hub ativado permite reativar sem limpar estado anterior antes do sucesso', () => {
    const ativado = status({ ativado: true, possui_credencial: true, empresa_nome: 'Empresa Antiga', loja_nome: 'Loja Antiga' });
    component.status.set(ativado);
    component.form.controls.retaguarda_url.setValue(ativado.retaguarda_url);
    fixture.detectChanges();

    component.reativar();
    fixture.detectChanges();

    expect(component.status()?.empresa_nome).toBe('Empresa Antiga');
    expect(fixture.nativeElement.textContent).toContain('Empresa Antiga');
    expect(component.mostrarFormulario()).toBeTrue();
  });

  it('continua para o pdv', () => {
    component.continuar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/pdv');
  });
});
