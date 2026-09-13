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
    expect(fixture.nativeElement.textContent).toContain('27-01-01001');
    expect(fixture.nativeElement.textContent).toContain('199.9000');
    expect(fixture.nativeElement.textContent).toContain('4.000');
    expect(fixture.nativeElement.textContent).toContain('Sim');
  });
});
