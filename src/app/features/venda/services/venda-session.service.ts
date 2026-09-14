import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { VendaHubResumo, VendaSessionStatus } from '../../../core/models/venda.models';
import { AdicionarPagamentoRequest, FormasPagamentoResponse } from '../../../core/models/pagamento.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendaService } from './hub-venda.service';

export interface VendaOperacaoResultado {
  ok: boolean;
  detail?: string;
  estoqueDisponivel?: string;
}

export interface PagamentoIntencao {
  operacaoUuid: string;
  formaPagamentoId: number;
  valor: string;
  autorizacao: string;
}

@Injectable({ providedIn: 'root' })
export class VendaSessionService {
  private readonly hubVendaService = inject(HubVendaService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly router = inject(Router);

  private readonly statusSignal = signal<VendaSessionStatus>('inicializando');
  private readonly vendaSignal = signal<VendaHubResumo | null>(null);
  private readonly loadingOperacaoSignal = signal(false);
  private intencaoPagamentoPendente: PagamentoIntencao | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly venda = this.vendaSignal.asReadonly();
  readonly loadingOperacao = this.loadingOperacaoSignal.asReadonly();

  bootstrap(): Observable<boolean> {
    return this.carregarAtual();
  }

  carregarAtual(): Observable<boolean> {
    this.statusSignal.set('inicializando');
    return this.hubVendaService.atual().pipe(
      tap((response) => this.definirVenda(response.venda)),
      map((response) => response.venda !== null),
      catchError((error: unknown) => this.tratarErroCarregamento(error)),
    );
  }

  adicionarItem(skuId: number, quantidade = 1): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.adicionarItem(skuId, quantidade));
  }

  alterarQuantidade(itemUuid: string, quantidade: number): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.alterarQuantidade(itemUuid, quantidade));
  }

  removerItem(itemUuid: string): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.removerItem(itemUuid));
  }

  cancelarVenda(): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.cancelar().pipe(
      tap(() => this.limparEstado()),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroOperacao(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  listarFormasPagamento(): Observable<FormasPagamentoResponse> {
    return this.hubVendaService.listarFormasPagamento();
  }

  adicionarPagamento(vendaUuid: string, formaPagamentoId: number, valor: string, autorizacao = ''): Observable<VendaOperacaoResultado> {
    const intencao = this.obterIntencaoPagamento(formaPagamentoId, valor, autorizacao);
    const request: AdicionarPagamentoRequest = {
      vendaUuid,
      operacaoUuid: intencao.operacaoUuid,
      formaPagamentoId,
      valor,
      autorizacao,
    };
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.adicionarPagamento(request).pipe(
      tap((response) => {
        this.intencaoPagamentoPendente = null;
        this.definirVenda(response.venda);
      }),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroPagamento(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  removerPagamento(pagamentoUuid: string): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.removerPagamento(pagamentoUuid));
  }

  finalizarVenda(vendaUuid: string): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.finalizarVenda(vendaUuid).pipe(
      tap((response) => {
        if (response.venda?.status === 'FINALIZADA') {
          this.vendaSignal.set(null);
          this.statusSignal.set('sem-venda');
          return;
        }
        this.definirVenda(response.venda);
      }),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroFinalizacao(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  limparEstado(): void {
    this.vendaSignal.set(null);
    this.statusSignal.set('sem-venda');
    this.loadingOperacaoSignal.set(false);
    this.intencaoPagamentoPendente = null;
  }

  private obterIntencaoPagamento(formaPagamentoId: number, valor: string, autorizacao: string): PagamentoIntencao {
    const atual = this.intencaoPagamentoPendente;
    if (atual && atual.formaPagamentoId === formaPagamentoId && atual.valor === valor && atual.autorizacao === autorizacao) {
      return atual;
    }
    const nova = { operacaoUuid: crypto.randomUUID(), formaPagamentoId, valor, autorizacao };
    this.intencaoPagamentoPendente = nova;
    return nova;
  }

  private executarOperacao(request$: Observable<{ venda: VendaHubResumo | null }>): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return request$.pipe(
      tap((response) => this.definirVenda(response.venda)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroOperacao(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  private definirVenda(venda: VendaHubResumo | null): void {
    this.vendaSignal.set(venda);
    this.statusSignal.set(venda ? 'aberta' : 'sem-venda');
  }

  private tratarErroCarregamento(error: unknown): Observable<boolean> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of(false);
    }

    this.statusSignal.set('erro');
    return of(false);
  }

  private tratarErroOperacao(error: unknown): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }

    if (error instanceof HttpErrorResponse && error.status === 409) {
      return of({
        ok: false,
        detail: error.error?.detail || 'Conflito operacional na venda.',
        estoqueDisponivel: error.error?.estoque_disponivel,
      });
    }

    this.carregarAtual().subscribe();
    return of({ ok: false, detail: 'Falha de comunicação com o Hub local. Atualizando estado da venda.' });
  }

  private tratarErroPagamento(error: unknown): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return of({ ok: false, detail: error.error?.detail || 'Conflito operacional na venda.' });
    }
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return of({ ok: false, detail: error.error?.detail || 'Pagamento inválido.' });
    }
    this.carregarAtual().subscribe();
    return of({ ok: false, detail: 'Não foi possível confirmar o pagamento. O estado da venda foi atualizado; tente novamente sem alterar os dados.' });
  }

  private tratarErroFinalizacao(error: unknown): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return of({ ok: false, detail: error.error?.detail || 'Conflito operacional na venda.' });
    }
    this.carregarAtual().subscribe();
    return of({ ok: false, detail: 'A venda não está mais em andamento. Atualize o estado antes de repetir a operação.' });
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private tratarSessaoOperadorExpirada(): void {
    this.operatorSession.invalidarSessao();
    this.limparEstado();
    void this.router.navigateByUrl('/operador');
  }
}
