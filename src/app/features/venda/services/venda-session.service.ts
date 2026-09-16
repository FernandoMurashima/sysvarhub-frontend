import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { VendaAtualResponse, VendaClienteResumo, VendaHubResumo, VendaSessionStatus } from '../../../core/models/venda.models';
import { AdicionarPagamentoRequest, FormasPagamentoResponse } from '../../../core/models/pagamento.models';
import { VendedorHubResumo } from '../../../core/models/vendedor.models';
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
  private readonly clientePreselecionadoSignal = signal<VendaClienteResumo | null>(null);
  private readonly vendedorPreselecionadoSignal = signal<VendedorHubResumo | null>(null);
  private readonly loadingOperacaoSignal = signal(false);
  private intencaoPagamentoPendente: PagamentoIntencao | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly venda = this.vendaSignal.asReadonly();
  readonly clientePreselecionado = this.clientePreselecionadoSignal.asReadonly();
  readonly vendedorPreselecionado = this.vendedorPreselecionadoSignal.asReadonly();
  readonly loadingOperacao = this.loadingOperacaoSignal.asReadonly();

  bootstrap(): Observable<boolean> {
    return this.carregarAtual();
  }

  carregarAtual(): Observable<boolean> {
    this.statusSignal.set('inicializando');
    return this.hubVendaService.atual().pipe(
      tap((response) => this.definirEstado(response)),
      map((response) => response.venda !== null),
      catchError((error: unknown) => this.tratarErroCarregamento(error)),
    );
  }

  adicionarItem(skuId: number, quantidade = 1): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.adicionarItem(skuId, quantidade));
  }

  iniciarVenda(): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.iniciarVenda().pipe(
      tap((response) => this.definirEstado(response)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroInicioVenda(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  alterarQuantidade(itemUuid: string, quantidade: number): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.alterarQuantidade(itemUuid, quantidade));
  }

  removerItem(itemUuid: string): Observable<VendaOperacaoResultado> {
    return this.executarOperacao(this.hubVendaService.removerItem(itemUuid));
  }

  selecionarCliente(clienteUuid: string): Observable<VendaOperacaoResultado> {
    return this.executarOperacaoCliente(this.hubVendaService.selecionarCliente(clienteUuid));
  }

  removerCliente(): Observable<VendaOperacaoResultado> {
    return this.executarOperacaoCliente(this.hubVendaService.removerCliente());
  }

  selecionarVendedor(vendedorId: number): Observable<VendaOperacaoResultado> {
    return this.executarOperacaoVendedor(this.hubVendaService.selecionarVendedor(vendedorId), 'selecionar', vendedorId);
  }

  removerVendedor(): Observable<VendaOperacaoResultado> {
    return this.executarOperacaoVendedor(this.hubVendaService.removerVendedor(), 'remover');
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
    return this.hubVendaService.listarFormasPagamento().pipe(
      catchError((error: unknown) => {
        if (this.isAuthenticationError(error)) {
          this.tratarSessaoOperadorExpirada();
        }
        return throwError(() => error);
      }),
    );
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
        this.definirEstado(response);
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
          this.clientePreselecionadoSignal.set(null);
          this.vendedorPreselecionadoSignal.set(null);
          this.statusSignal.set('sem-venda');
          return;
        }
        this.definirEstado(response);
      }),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroFinalizacao(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  limparEstado(): void {
    this.vendaSignal.set(null);
    this.clientePreselecionadoSignal.set(null);
    this.vendedorPreselecionadoSignal.set(null);
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

  private executarOperacao(request$: Observable<VendaAtualResponse>): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return request$.pipe(
      tap((response) => this.definirEstado(response)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroOperacao(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  private definirEstado(response: VendaAtualResponse): void {
    this.vendaSignal.set(response.venda);
    this.clientePreselecionadoSignal.set(response.venda ? null : response.clientePreselecionado);
    this.vendedorPreselecionadoSignal.set(response.venda ? null : response.vendedorPreselecionado);
    this.statusSignal.set(response.venda ? 'aberta' : 'sem-venda');
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

  private tratarErroInicioVenda(error: unknown): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }

    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      return of({ ok: false, detail: error.error?.detail || 'Não foi possível iniciar a venda.' });
    }

    return this.hubVendaService.atual().pipe(
      tap((response) => this.definirEstado(response)),
      map((response) => response.venda
        ? { ok: true }
        : { ok: false, detail: 'Não foi possível confirmar o início da venda. Tente novamente.' }),
      catchError((erroReconciliacao: unknown) => {
        if (this.isAuthenticationError(erroReconciliacao)) {
          this.tratarSessaoOperadorExpirada();
          return of({ ok: false, detail: 'Sessão de operador expirada.' });
        }
        return of({ ok: false, detail: 'Falha de comunicação com o Hub local.' });
      }),
    );
  }

  private executarOperacaoCliente(request$: Observable<VendaAtualResponse>): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return request$.pipe(
      switchMap((response) => (response.venda ? of(response) : this.hubVendaService.atual())),
      tap((response) => this.definirEstado(response)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroCliente(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  private tratarErroCliente(error: unknown): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      return of({ ok: false, detail: error.error?.detail || 'Cliente inválido para a venda.' });
    }
    this.carregarAtual().subscribe();
    return of({ ok: false, detail: 'Não foi possível confirmar a alteração do cliente. O estado da venda foi atualizado.' });
  }

  private executarOperacaoVendedor(request$: Observable<VendaAtualResponse>, tipo: 'selecionar' | 'remover', vendedorId?: number): Observable<VendaOperacaoResultado> {
    this.loadingOperacaoSignal.set(true);
    return request$.pipe(
      switchMap((response) => (response.venda ? of(response) : this.hubVendaService.atual())),
      tap((response) => this.definirEstado(response)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroVendedor(error, tipo, vendedorId)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  private tratarErroVendedor(error: unknown, tipo: 'selecionar' | 'remover', vendedorId?: number): Observable<VendaOperacaoResultado> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      return of({ ok: false, detail: error.error?.detail || 'Vendedor inválido para a venda.' });
    }
    return this.hubVendaService.atual().pipe(
      tap((response) => this.definirEstado(response)),
      map((response) => this.vendedorReconciliado(response, tipo, vendedorId)
        ? { ok: true }
        : { ok: false, detail: 'Não foi possível confirmar a alteração do vendedor.' }),
      catchError((erroReconciliacao: unknown) => {
        if (this.isAuthenticationError(erroReconciliacao)) {
          this.tratarSessaoOperadorExpirada();
          return of({ ok: false, detail: 'Sessão de operador expirada.' });
        }
        return of({ ok: false, detail: 'Não foi possível confirmar a alteração do vendedor.' });
      }),
    );
  }

  private vendedorReconciliado(response: VendaAtualResponse, tipo: 'selecionar' | 'remover', vendedorId?: number): boolean {
    const vendedorAtual = response.venda ? response.venda.vendedor : response.vendedorPreselecionado;
    if (tipo === 'remover') return vendedorAtual === null;
    return vendedorAtual?.id === vendedorId;
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
