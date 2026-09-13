import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { VendaHubResumo, VendaSessionStatus } from '../../../core/models/venda.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendaService } from './hub-venda.service';

export interface VendaOperacaoResultado {
  ok: boolean;
  detail?: string;
  estoqueDisponivel?: string;
}

@Injectable({ providedIn: 'root' })
export class VendaSessionService {
  private readonly hubVendaService = inject(HubVendaService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly router = inject(Router);

  private readonly statusSignal = signal<VendaSessionStatus>('inicializando');
  private readonly vendaSignal = signal<VendaHubResumo | null>(null);
  private readonly loadingOperacaoSignal = signal(false);

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

  limparEstado(): void {
    this.vendaSignal.set(null);
    this.statusSignal.set('sem-venda');
    this.loadingOperacaoSignal.set(false);
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

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private tratarSessaoOperadorExpirada(): void {
    this.operatorSession.invalidarSessao();
    this.limparEstado();
    void this.router.navigateByUrl('/operador');
  }
}
