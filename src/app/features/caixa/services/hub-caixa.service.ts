import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  CaixaStatusResponse,
  CaixaStatusResponseApi,
  mapCaixaStatus,
  mapSessaoCaixa,
  SessaoCaixaHubResumo,
  SessaoCaixaHubResumoApi,
} from '../../../core/models/caixa.models';

@Injectable({ providedIn: 'root' })
export class HubCaixaService {
  private readonly http = inject(HttpClient);

  status(): Observable<CaixaStatusResponse> {
    return this.http
      .get<CaixaStatusResponseApi>(`${HUB_TERMINAL_API_PATH}/caixa/status/`)
      .pipe(map(mapCaixaStatus));
  }

  abrir(valorAbertura: string): Observable<SessaoCaixaHubResumo> {
    return this.http
      .post<SessaoCaixaHubResumoApi>(`${HUB_TERMINAL_API_PATH}/caixa/abrir/`, {
        valor_abertura: valorAbertura,
      })
      .pipe(map(mapSessaoCaixa));
  }

  fechar(): Observable<{ status: 'ok'; sessao: SessaoCaixaHubResumo }> {
    return this.http
      .post<{ status: 'ok'; sessao: SessaoCaixaHubResumoApi }>(`${HUB_TERMINAL_API_PATH}/caixa/fechar/`, {})
      .pipe(map((response) => ({ status: response.status, sessao: mapSessaoCaixa(response.sessao) })));
  }
}
