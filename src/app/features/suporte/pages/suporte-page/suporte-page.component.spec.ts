import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { catalogoResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { HubCatalogoService } from '../../../terminal/services/hub-catalogo.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { SuportePageComponent } from './suporte-page.component';

describe('SuportePageComponent', () => {
  let fixture: ComponentFixture<SuportePageComponent>;
  let component: SuportePageComponent;
  let catalogoService: jasmine.SpyObj<HubCatalogoService>;

  beforeEach(async () => {
    catalogoService = jasmine.createSpyObj<HubCatalogoService>('HubCatalogoService', ['buscar']);

    await TestBed.configureTestingModule({
      imports: [SuportePageComponent, ReactiveFormsModule],
      providers: [
        { provide: HubCatalogoService, useValue: catalogoService },
        {
          provide: TerminalSessionService,
          useValue: {
            contexto: signal(terminalContextoStub).asReadonly(),
            status: signal('contexto-carregado').asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuportePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mostra diagnostico local sem token', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('PDV-01');
    expect(text).toContain('Filial 1');
    expect(text).toContain('Empresa Teste Ltda');
    expect(text).not.toContain('token');
  });

  it('pesquisa catalogo e mostra item vendavel', () => {
    catalogoService.buscar.and.returnValue(of(catalogoResponseStub));

    component.form.setValue({ q: '7892701000013', limit: 20 });
    component.pesquisar();
    fixture.detectChanges();

    expect(catalogoService.buscar).toHaveBeenCalledWith('7892701000013', 20);
    expect(fixture.nativeElement.textContent).toContain('Tabela: PADRAO - Tabela Padrão');
    expect(fixture.nativeElement.textContent).toContain('27-01-01001');
    expect(fixture.nativeElement.textContent).toContain('199.9000');
    expect(fixture.nativeElement.textContent).toContain('4.000');
    expect(fixture.nativeElement.textContent).toContain('Sim');
  });

  it('mostra hifen quando preco de venda vier null', () => {
    catalogoService.buscar.and.returnValue(
      of({
        ...catalogoResponseStub,
        itens: [
          {
            ...catalogoResponseStub.itens[0],
            preco: null,
            preco_promocional: null,
            preco_venda: null,
            vendavel: false,
            motivos_bloqueio: ['SEM_PRECO'],
          },
        ],
      }),
    );

    component.form.setValue({ q: '7892701000013', limit: 20 });
    component.pesquisar();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tabela: PADRAO - Tabela Padrão');
    expect(text).toContain('SEM_PRECO');
    expect(text).toContain('Nao');
    expect(text).toContain('-');
    expect(text).not.toContain('null');
  });
});
