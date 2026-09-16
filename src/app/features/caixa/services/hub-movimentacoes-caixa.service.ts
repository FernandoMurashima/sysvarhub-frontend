import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  mapMovimentacaoCaixa,
  mapMovimentacoesCaixaResponse,
  MovimentacaoCaixa,
  MovimentacoesCaixaResponse,
  MovimentacoesCaixaResponseApi,
  MovimentacaoCaixaResponseApi,
  RegistrarMovimentacaoCaixaRequest,
} from '../../../core/models/movimentacao-caixa.models';

@Injectable({ providedIn: 'root' })
export class HubMovimentacoesCaixaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/caixa/movimentacoes/`;

  registrar(request: RegistrarMovimentacaoCaixaRequest): Observable<MovimentacaoCaixa> {
    return this.http
      .post<MovimentacaoCaixaResponseApi>(this.url, request)
      .pipe(map((response) => mapMovimentacaoCaixa(response.movimentacao)));
  }

  listar(): Observable<MovimentacoesCaixaResponse> {
    return this.http
      .get<MovimentacoesCaixaResponseApi>(this.url)
      .pipe(map((response) => mapMovimentacoesCaixaResponse(response)));
  }
}
