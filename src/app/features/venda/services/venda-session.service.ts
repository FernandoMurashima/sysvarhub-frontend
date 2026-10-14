import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { VendaAtualResponse, VendaClienteResumo, VendaDevolucaoConsulta, VendaDevolucaoResultado, VendaHubResumo, VendaSessionStatus } from '../../../core/models/venda.models';
import { AdicionarPagamentoRequest, ContextoTrocaProvisoria, FormasPagamentoResponse } from '../../../core/models/pagamento.models';
import { VendedorHubResumo } from '../../../core/models/vendedor.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendaService } from './hub-venda.service';
import { normalizarValorPagamento } from './pagamento-valor.parser';

export interface VendaOperacaoResultado {
  ok: boolean;
  detail?: string;
  estoqueDisponivel?: string;
  vendaFinalizada?: VendaHubResumo;
}

export interface PagamentoIntencao {
  identidade: string;
  operacaoUuid: string;
  formaPagamentoId: number;
  prazoPagamentoId: number | null;
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
  private readonly trocaSignal = signal<ContextoTrocaProvisoria | null>(null);
  private intencaoTrocaPendente: { vendaUuid: string; devolucaoUuid: string; documento: string; valor: string; operacaoUuid: string } | null = null;
  readonly troca = this.trocaSignal.asReadonly();
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
      tap(() => {
        if (this.trocaSignal()?.vendaUuid) this.limparTroca();
        this.limparEstado();
      }),
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

  adicionarPagamento(vendaUuid: string, formaPagamentoId: number, valor: string, autorizacao = '', prazoPagamentoId: number | null = null): Observable<VendaOperacaoResultado> {
    const intencao = this.obterIntencaoPagamento(`FORMA:${formaPagamentoId}`, formaPagamentoId, valor, autorizacao, prazoPagamentoId);
    const request: AdicionarPagamentoRequest = {
      vendaUuid,
      operacaoUuid: intencao.operacaoUuid,
      formaPagamentoId,
      prazoPagamentoId,
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

  adicionarPagamentoValeTroca(vendaUuid: string, documento: string, valor: string): Observable<VendaOperacaoResultado> {
    const intencao = this.obterIntencaoPagamento('VALE_TROCA', 0, valor, documento, null);
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.adicionarPagamentoValeTroca(vendaUuid, intencao.operacaoUuid, documento, valor).pipe(
      tap((response) => {
        this.intencaoPagamentoPendente = null;
        this.definirEstado(response);
      }),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroPagamento(error)),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  prepararTroca(devolucao: VendaDevolucaoResultado, origem: VendaDevolucaoConsulta): Observable<VendaOperacaoResultado> {
    const vale = devolucao.vale_troca;
    if (!vale?.provisorio || !/^VT-HUB-[0-9a-f]{20}$/i.test(vale.documento_tecnico || '')
      || !devolucao.uuid || !origem.uuid || devolucao.venda_uuid !== origem.uuid
      || !(origem.cliente.uuid || origem.cliente.id) || !normalizarValorPagamento(vale.saldo)) {
      return of({ ok: false, detail: 'Crédito provisório ou identidade da devolução inválidos. Utilize somente o retorno do Hub.' });
    }
    const atual = this.trocaSignal();
    if (atual) {
      return of(atual.devolucaoUuid === devolucao.uuid
        ? { ok: true } : { ok: false, detail: 'Conclua a troca vinculada antes de iniciar outra devolução no PDV.' });
    }
    if (devolucao.venda_troca_uuid || Number(vale.valor_consumido || 0) > 0) {
      return of({ ok: false, detail: 'Crédito provisório já vinculado ou consumido em outra operação.' });
    }
    return this.hubVendaService.atual().pipe(
      tap((response) => {
        this.definirEstado(response);
        this.trocaSignal.set({
          devolucaoUuid: devolucao.uuid, documentoDevolucao: devolucao.documento || devolucao.uuid,
          documentoVendaOrigem: origem.documento || origem.uuid, vendaOrigemUuid: origem.uuid,
          documentoTecnico: vale.documento_tecnico!, credito: vale.saldo, cliente: { ...origem.cliente },
          vendaAnteriorUuid: response.venda?.uuid || null, vendaUuid: null,
        });
      }),
      map(() => ({ ok: true })),
      catchError(() => of({ ok: false, detail: 'Não foi possível consultar a venda atual no Hub. Tente novamente antes de iniciar a troca.' })),
    );
  }

  erroCreditoTroca(valor?: string): string {
    const troca = this.trocaSignal();
    const venda = this.vendaSignal();
    if (!troca) return 'Não há devolução vinculada a esta troca.';
    if (troca.bloqueio) return troca.bloqueio;
    if (!/^VT-HUB-[0-9a-f]{20}$/i.test(troca.documentoTecnico)) return 'Documento técnico do crédito inválido.';
    if (!venda || venda.status !== 'ABERTA') return 'Inicie uma nova venda para esta troca.';
    if (!troca.vendaUuid || troca.vendaUuid !== venda.uuid || venda.uuid === troca.vendaOrigemUuid || venda.uuid === troca.vendaAnteriorUuid) {
      return 'Conclua ou cancele a venda anterior e inicie uma nova venda para esta troca. O crédito não pode ser reutilizado em outra venda.';
    }
    const cliente = venda.cliente;
    if (!cliente || cliente.clientePadrao || (troca.cliente.uuid && troca.cliente.uuid !== cliente.clienteUuid)
      || (troca.cliente.id && troca.cliente.id !== cliente.retaguardaId)) return 'Selecione o mesmo cliente da devolução original.';
    if (!venda.itens.length) return 'Inclua produtos na nova venda de troca.';
    if (!venda.vendedor) return 'Selecione um vendedor antes de registrar pagamentos.';
    if (venda.pagamentos.some((pagamento) => pagamento.devolucaoUuid || /^VT-HUB-/i.test(pagamento.valeTrocaDocumento || pagamento.autorizacao))) {
      return 'Já existe crédito provisório aplicado ou consumo incompatível nesta venda.';
    }
    if (valor !== undefined) {
      const normalizado = normalizarValorPagamento(valor);
      if (!normalizado) return 'Valor do crédito da troca inválido.';
      if (this.centavosTroca(normalizado) > this.centavosTroca(troca.credito)) return 'Crédito desta troca insuficiente para o valor informado.';
      if (this.centavosTroca(normalizado) > this.centavosTroca(venda.pendente)) return 'Valor do crédito excede o saldo pendente da venda.';
    }
    return '';
  }

  sugestaoCreditoTroca(): string {
    if (this.intencaoTrocaPendente) return this.intencaoTrocaPendente.valor;
    const credito = normalizarValorPagamento(this.trocaSignal()?.credito) || '0.00';
    const pendente = normalizarValorPagamento(this.vendaSignal()?.pendente) || '0.00';
    return this.centavosTroca(credito) < this.centavosTroca(pendente) ? credito : pendente;
  }

  adicionarCreditoTroca(valor: string): Observable<VendaOperacaoResultado> {
    if (this.loadingOperacaoSignal()) return of({ ok: false, detail: 'Aguarde o pagamento em andamento.' });
    const troca = this.trocaSignal();
    const venda = this.vendaSignal();
    const normalizado = normalizarValorPagamento(valor);
    const pendente = this.intencaoTrocaPendente;
    if (pendente && pendente.valor !== normalizado) {
      return of({ ok: false, detail: `Confirme a tentativa anterior repetindo o valor ${pendente.valor}, sem alterar os dados.` });
    }
    const erro = this.erroCreditoTroca(valor);
    if (erro || !troca || !venda || !normalizado) return of({ ok: false, detail: erro });
    const intencao = pendente || {
      vendaUuid: venda.uuid, devolucaoUuid: troca.devolucaoUuid, documento: troca.documentoTecnico,
      valor: normalizado, operacaoUuid: this.uuidTroca(),
    };
    this.intencaoTrocaPendente = intencao;
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.adicionarPagamentoValeTroca(venda.uuid, intencao.operacaoUuid, intencao.documento, intencao.valor, intencao.devolucaoUuid).pipe(
      tap((response) => {
        if (!this.pagamentoTrocaConfirmado(response.venda, intencao)) throw new Error('Resposta do pagamento da troca inválida.');
        this.intencaoTrocaPendente = null;
        this.definirEstado(response);
      }),
      map(() => ({ ok: true })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && [400, 401, 403, 409].includes(error.status)) {
          const detail = String(error.error?.detail || '');
          if (/devolução já enviada à central/i.test(detail)) this.trocaSignal.update((atual) => atual ? { ...atual, bloqueio: detail } : null);
          return this.tratarErroPagamento(error);
        }
        return this.hubVendaService.atual().pipe(
          tap((response) => this.definirEstado(response)),
          map((response) => {
            if (this.pagamentoTrocaConfirmado(response.venda, intencao)) {
              this.intencaoTrocaPendente = null;
              return { ok: true };
            }
            return { ok: false, detail: 'Não foi possível confirmar o crédito da troca. Repita a tentativa sem alterar o valor.' };
          }),
          catchError(() => of({ ok: false, detail: 'Falha de comunicação com o Hub. O contexto da troca foi preservado; repita a mesma tentativa.' })),
        );
      }),
      tap(() => this.loadingOperacaoSignal.set(false)),
    );
  }

  private centavosTroca(valor: string): bigint {
    const normalizado = normalizarValorPagamento(valor);
    return normalizado ? BigInt(normalizado.replace('.', '')) : 0n;
  }

  private pagamentoTrocaConfirmado(venda: VendaHubResumo | null, intencao: { vendaUuid: string; devolucaoUuid: string; documento: string; valor: string }): boolean {
    return !!venda && venda.uuid === intencao.vendaUuid && venda.pagamentos.some((pagamento) =>
      pagamento.devolucaoUuid === intencao.devolucaoUuid
      && (pagamento.valeTrocaDocumento || pagamento.autorizacao).toUpperCase() === intencao.documento.toUpperCase()
      && pagamento.valor === intencao.valor);
  }

  private reconciliarTroca(venda: VendaHubResumo | null): void {
    const troca = this.trocaSignal();
    if (!troca) return;
    if (troca.vendaUuid) {
      if (!venda || venda.uuid !== troca.vendaUuid || venda.status !== 'ABERTA') this.limparTroca();
    } else if (venda?.status === 'ABERTA' && venda.uuid !== troca.vendaAnteriorUuid && venda.uuid !== troca.vendaOrigemUuid) {
      this.trocaSignal.set({ ...troca, vendaUuid: venda.uuid });
    }
  }

  private limparTroca(): void {
    this.trocaSignal.set(null);
    this.intencaoTrocaPendente = null;
  }

  private uuidTroca(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (letra) => {
      const valor = Math.floor(Math.random() * 16);
      return (letra === 'x' ? valor : (valor & 3) | 8).toString(16);
    });
  }

  adicionarPagamentoCashback(vendaUuid: string, valor: string): Observable<VendaOperacaoResultado> {
    return of({ ok: false, detail: 'Cashback exige autorização online da Central. Utilize a opção Cashback.' });
  }

  adicionarPagamentoCashbackOnline(vendaUuid: string, valor: string): Observable<VendaOperacaoResultado> {
    const intencao = this.obterIntencaoPagamento(`CASHBACK_CENTRAL:${vendaUuid}:${this.venda()?.cliente?.clienteUuid || ''}:${this.venda()?.cliente?.retaguardaId || ''}`, -2, valor, 'CASHBACK_CENTRAL', null);
    this.loadingOperacaoSignal.set(true);
    return this.hubVendaService.adicionarPagamentoCashbackOnline(vendaUuid, intencao.operacaoUuid, valor).pipe(
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
          this.reconciliarTroca(response.venda);
          this.vendaSignal.set(null);
          this.clientePreselecionadoSignal.set(null);
          this.vendedorPreselecionadoSignal.set(null);
          this.statusSignal.set('sem-venda');
          return;
        }
        this.definirEstado(response);
      }),
      map((response) => response.venda?.status === 'FINALIZADA'
        ? { ok: true, vendaFinalizada: response.venda }
        : { ok: false, detail: 'Não foi possível confirmar a finalização da venda.' }),
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

  private obterIntencaoPagamento(identidade: string, formaPagamentoId: number, valor: string, autorizacao: string, prazoPagamentoId: number | null): PagamentoIntencao {
    const atual = this.intencaoPagamentoPendente;
    if (atual && atual.identidade === identidade && atual.formaPagamentoId === formaPagamentoId && atual.prazoPagamentoId === prazoPagamentoId && atual.valor === valor && atual.autorizacao === autorizacao) {
      return atual;
    }
    const nova = { identidade, operacaoUuid: crypto.randomUUID(), formaPagamentoId, prazoPagamentoId, valor, autorizacao };
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
    this.reconciliarTroca(response.venda);
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
    this.limparTroca();
    this.operatorSession.invalidarSessao();
    this.limparEstado();
    void this.router.navigateByUrl('/operador');
  }
}
