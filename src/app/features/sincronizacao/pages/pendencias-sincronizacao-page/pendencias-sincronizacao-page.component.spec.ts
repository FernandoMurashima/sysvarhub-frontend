import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { PendenciasSyncResponse, PendenciasSyncService } from '../../services/pendencias-sync.service';
import { PendenciasSincronizacaoPageComponent } from './pendencias-sincronizacao-page.component';

describe('PendenciasSincronizacaoPageComponent', () => {
  let fixture: ComponentFixture<PendenciasSincronizacaoPageComponent>;
  let service: jasmine.SpyObj<PendenciasSyncService>;

  const respostaBase = (statusCentral: 'ONLINE' | 'OFFLINE'): PendenciasSyncResponse => ({
    resumo: { pendentes: 1, processando: 0, erros: 1, conflitos: 0, sincronizados: 0 },
    central: { status: statusCentral },
    paginacao: { page: 1, page_size: 20, total: 1, pages: 1 },
    tipos: ['VENDA_FINALIZADA'],
    eventos: [
      {
        id: 10,
        evento_uuid: 'evt-10',
        chave_idempotencia: 'VENDA:10',
        tipo: 'VENDA_FINALIZADA',
        status: 'ERRO',
        status_operacional: 'ERRO',
        criado_em: '2026-10-05T08:00:00',
        atualizado_em: '2026-10-05T08:01:00',
        sincronizado_em: null,
        tentativas: 2,
        ultimo_erro: 'timeout',
        proxima_tentativa_em: null,
        documento: 'NFC-e 42 · Série 3',
        origem: 'Hub local',
        dependencia: null,
        bloqueado_por_dependencia: false,
        mensagem_operacional: 'timeout',
        resposta_central: {},
        payload_tecnico: {},
        acoes: { retry_permitido: true, sincronizar_agora_permitido: false },
      },
    ],
  });

  async function montar(statusCentral: 'ONLINE' | 'OFFLINE') {
    service = jasmine.createSpyObj<PendenciasSyncService>('PendenciasSyncService', ['listar', 'retry']);
    service.listar.and.returnValue(of(respostaBase(statusCentral)));
    service.retry.and.returnValue(of({ evento: respostaBase(statusCentral).eventos[0] }));

    await TestBed.configureTestingModule({
      imports: [PendenciasSincronizacaoPageComponent],
      providers: [
        provideRouter([]),
        { provide: PendenciasSyncService, useValue: service },
        {
          provide: TerminalSessionService,
          useValue: {
            contexto: signal(terminalContextoStub).asReadonly(),
          },
        },
        {
          provide: OperatorSessionService,
          useValue: {
            operador: signal(operadorLoginResponseStub.operador).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendenciasSincronizacaoPageComponent);
    fixture.detectChanges();
  }

  it('mantem pagina acessivel e retry habilitado com Central online', async () => {
    await montar('ONLINE');

    const retry = fixture.nativeElement.querySelector('.retry') as HTMLButtonElement;
    expect(fixture.nativeElement.textContent).toContain('Pendências de Sincronização');
    expect(fixture.nativeElement.textContent).toContain('ONLINE');
    expect(retry.disabled).toBeFalse();

    retry.click();
    expect(service.retry).toHaveBeenCalledWith(10);
  });

  it('mantem pagina acessivel e desabilita retry com Central offline', async () => {
    await montar('OFFLINE');

    const retry = fixture.nativeElement.querySelector('.retry') as HTMLButtonElement;
    expect(fixture.nativeElement.textContent).toContain('OFFLINE');
    expect(fixture.nativeElement.textContent).toContain('Disponível quando a Central retornar');
    expect(retry.disabled).toBeTrue();

    fixture.componentInstance.retry(respostaBase('OFFLINE').eventos[0]);
    expect(service.retry).not.toHaveBeenCalled();
    expect(fixture.componentInstance.mensagem).toBe('Central OFFLINE. A ação ficará disponível quando a Central retornar.');
  });
});
