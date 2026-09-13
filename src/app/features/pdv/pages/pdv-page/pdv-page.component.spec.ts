import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { terminalContextoStub } from '../../../../testing/terminal-test-data';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { PdvPageComponent } from './pdv-page.component';

describe('PdvPageComponent', () => {
  let fixture: ComponentFixture<PdvPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdvPageComponent, RouterTestingModule],
      providers: [
        {
          provide: TerminalSessionService,
          useValue: {
            contexto: signal(terminalContextoStub).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PdvPageComponent);
    fixture.detectChanges();
  });

  it('mostra placeholder do PDV com contexto resumido', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('PDV Sysvar Hub');
    expect(text).toContain('Filial 1');
    expect(text).toContain('Caixa 01');
    expect(text).toContain('PDV-01');
  });
});
