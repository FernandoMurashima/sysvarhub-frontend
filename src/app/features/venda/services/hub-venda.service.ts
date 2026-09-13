import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  mapVendaAtual,
  VendaAtualResponse,
  VendaApiResponse,
  VendaItemAdicionarRequest,
  VendaQuantidadeRequest,
} from '../../../core/models/venda.models';

@Injectable({ providedIn: 'root' })
export class HubVendaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${HUB_TERMINAL_API_PATH}/venda`;

  atual(): Observable<VendaAtualResponse> {
    return this.http.get<VendaApiResponse>(`${this.baseUrl}/atual/`).pipe(map(mapVendaAtual));
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

  cancelar(): Observable<VendaAtualResponse> {
    return this.http.post<VendaApiResponse>(`${this.baseUrl}/cancelar/`, {}).pipe(map(mapVendaAtual));
  }
}
