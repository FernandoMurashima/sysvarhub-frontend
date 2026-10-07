import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  AdicionarPagamentoRequest,
  FormasPagamentoApiResponse,
  FormasPagamentoResponse,
  mapFormasPagamento,
  ValeTrocaConsultaResponse,
  ValesTrocaDisponiveisResponse,
} from '../../../core/models/pagamento.models';
import { DanfeNfce, DanfeNfceApi, DanfeVia, mapDanfeNfce } from '../../../core/models/danfe-nfce.models';
import {
  mapVendaAtual,
  BeneficiosClienteResponse,
  DevolucaoClientesResponse,
  DevolucaoClienteVendasResponse,
  VendaAtualResponse,
  VendaApiResponse,
  VendaDevolucaoConsultaResponse,
  VendaDevolucaoResultadoResponse,
  VendaItemAdicionarRequest,
  VendaQuantidadeRequest,
} from '../../../core/models/venda.models';

@Injectable({ providedIn: 'root' })
export class HubVendaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${HUB_TERMINAL_API_PATH}/venda`;
  private readonly terminalUrl = HUB_TERMINAL_API_PATH;

  atual(): Observable<VendaAtualResponse> {
    return this.http.get<VendaApiResponse>(`${this.baseUrl}/atual/`).pipe(map(mapVendaAtual));
  }

  iniciarVenda(): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/iniciar/`, {}).pipe(map(mapVendaAtual));
  }

  adicionarItem(skuId: number, quantidade = 1): Observable<VendaAtualResponse> {
    const body: VendaItemAdicionarRequest = { sku_id: skuId, quantidade };
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/item/`, body).pipe(map(mapVendaAtual));
  }

  alterarQuantidade(itemUuid: string, quantidade: number): Observable<VendaAtualResponse> {
    const body: VendaQuantidadeRequest = { quantidade };
    return this.http.patch<VendaApiResponse>(`${this.baseUrl}/item/${itemUuid}/`, body).pipe(map(mapVendaAtual));
  }

  removerItem(itemUuid: string): Observable<VendaAtualResponse> {
    return this.http.delete<VendaApiResponse>(`${this.baseUrl}/item/${itemUuid}/`).pipe(map(mapVendaAtual));
  }

  selecionarCliente(clienteUuid: string): Observable<VendaAtualResponse> {
    return this.http.put<VendaApiResponse>(`${this.baseUrl}/cliente/`, { cliente_uuid: clienteUuid }).pipe(map(mapVendaAtual));
  }

  removerCliente(): Observable<VendaAtualResponse> {
    return this.http.delete<VendaApiResponse>(`${this.baseUrl}/cliente/`).pipe(map(mapVendaAtual));
  }

  selecionarVendedor(vendedorId: number): Observable<VendaAtualResponse> {
    return this.http.put<VendaApiResponse>(`${this.baseUrl}/vendedor/`, { vendedor_id: vendedorId }).pipe(map(mapVendaAtual));
  }

  removerVendedor(): Observable<VendaAtualResponse> {
    return this.http.delete<VendaApiResponse>(`${this.baseUrl}/vendedor/`).pipe(map(mapVendaAtual));
  }

  cancelar(): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/cancelar/`, {}).pipe(map(mapVendaAtual));
  }

  listarFormasPagamento(): Observable<FormasPagamentoResponse> {
    return this.http.get<FormasPagamentoApiResponse>(`${this.terminalUrl}/formas-pagamento/`).pipe(map(mapFormasPagamento));
  }

  adicionarPagamento(request: AdicionarPagamentoRequest): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/pagamento/`, {
      venda_uuid: request.vendaUuid,
      operacao_uuid: request.operacaoUuid,
      forma_pagamento_id: request.formaPagamentoId,
      prazo_pagamento_id: request.prazoPagamentoId ?? null,
      valor: request.valor,
      autorizacao: request.autorizacao,
    }).pipe(map(mapVendaAtual));
  }

  consultarValeTroca(documento: string): Observable<ValeTrocaConsultaResponse> {
    return this.http.get<ValeTrocaConsultaResponse>(`${this.terminalUrl}/vale-troca/consultar/?documento=${encodeURIComponent(documento)}`);
  }

  listarValesTrocaDisponiveis(vendaUuid: string): Observable<ValesTrocaDisponiveisResponse> {
    return this.http.get<ValesTrocaDisponiveisResponse>(`${this.terminalUrl}/vale-troca/disponiveis/?venda_uuid=${encodeURIComponent(vendaUuid)}`);
  }

  adicionarPagamentoValeTroca(vendaUuid: string, operacaoUuid: string, documento: string, valor: string): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/pagamento/vale-troca/`, {
      venda_uuid: vendaUuid,
      operacao_uuid: operacaoUuid,
      documento,
      valor,
    }).pipe(map(mapVendaAtual));
  }

  removerPagamento(pagamentoUuid: string): Observable<VendaAtualResponse> {
    return this.http.delete<VendaApiResponse>(`${this.baseUrl}/pagamento/${pagamentoUuid}/`).pipe(map(mapVendaAtual));
  }

  finalizarVenda(vendaUuid: string): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/finalizar/`, { venda_uuid: vendaUuid }).pipe(map(mapVendaAtual));
  }

  obterDanfeNfce(vendaUuid: string, via: DanfeVia): Observable<DanfeNfce> {
    return this.http.get<DanfeNfceApi>(`${this.baseUrl}/${vendaUuid}/danfe-nfce/?via=${via}`).pipe(map(mapDanfeNfce));
  }

  consultarBeneficiosCliente(clienteUuid: string): Observable<BeneficiosClienteResponse> {
    return this.http.get<BeneficiosClienteResponse>(`${this.terminalUrl}/clientes/${clienteUuid}/beneficios/`);
  }

  consultarDevolucao(documento: string): Observable<VendaDevolucaoConsultaResponse> {
    return this.http.get<VendaDevolucaoConsultaResponse>(`${this.terminalUrl}/devolucoes/vendas/?documento=${encodeURIComponent(documento)}`);
  }

  consultarDevolucaoPorVendaId(vendaId: number): Observable<VendaDevolucaoConsultaResponse> {
    return this.http.get<VendaDevolucaoConsultaResponse>(`${this.terminalUrl}/devolucoes/vendas/${vendaId}/`);
  }

  pesquisarClientesDevolucao(termo: string): Observable<DevolucaoClientesResponse> {
    return this.http.get<DevolucaoClientesResponse>(`${this.terminalUrl}/devolucoes/clientes/?q=${encodeURIComponent(termo)}`);
  }

  listarVendasClienteDevolucao(clienteId: number): Observable<DevolucaoClienteVendasResponse> {
    return this.http.get<DevolucaoClienteVendasResponse>(`${this.terminalUrl}/devolucoes/clientes/${clienteId}/vendas/`);
  }

  finalizarDevolucao(vendaUuid: string, itens: { item_uuid?: string; venda_item?: number; quantidade: number }[], motivo: string, devolucaoUuid?: string, vendaId?: number): Observable<VendaDevolucaoResultadoResponse> {
    const body: { venda_uuid: string; itens: { item_uuid?: string; venda_item?: number; quantidade: number }[]; motivo: string; devolucao_uuid?: string; venda_id?: number } = {
      venda_uuid: vendaUuid,
      itens,
      motivo,
    };
    if (devolucaoUuid) body.devolucao_uuid = devolucaoUuid;
    if (vendaId) body.venda_id = vendaId;
    return this.http.post<VendaDevolucaoResultadoResponse>(`${this.terminalUrl}/devolucoes/finalizar/`, body);
  }
}
