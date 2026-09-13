import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import { OPERATOR_SESSION_STORE } from '../../../core/auth/operator-session-store';
import {
  mapOperadorContextoResponse,
  mapOperadorLoginResponse,
  OperadorContextoResponse,
  OperadorContextoResponseApi,
  OperadorLoginResponse,
  OperadorLoginResponseApi,
} from '../../../core/models/operador.models';

@Injectable({ providedIn: 'root' })
export class HubOperadorService {
  private readonly http = inject(HttpClient);
  private readonly sessionStore = inject(OPERATOR_SESSION_STORE);

  login(codigo: string, senha: string): Observable<OperadorLoginResponse> {
    return this.http
      .post<OperadorLoginResponseApi>(`${HUB_TERMINAL_API_PATH}/operador/login/`, { codigo, senha })
      .pipe(
        map(mapOperadorLoginResponse),
        tap((response) => {
          this.sessionStore.setToken(response.sessaoToken);
        }),
      );
  }

  contexto(): Observable<OperadorContextoResponse> {
    return this.http
      .get<OperadorContextoResponseApi>(`${HUB_TERMINAL_API_PATH}/operador/contexto/`)
      .pipe(map(mapOperadorContextoResponse));
  }

  logout(): Observable<{ status: 'ok' }> {
    return this.http.post<{ status: 'ok' }>(`${HUB_TERMINAL_API_PATH}/operador/logout/`, {});
  }
}
