import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  HeartbeatRequest,
  HeartbeatResponse,
  PareamentoRequest,
  PareamentoResponse,
  TerminalContexto,
} from '../../../core/models/terminal.models';
import { TERMINAL_CREDENTIAL_STORE } from '../../../core/auth/terminal-credential-store';

@Injectable({ providedIn: 'root' })
export class HubTerminalService {
  private readonly http = inject(HttpClient);
  private readonly credentialStore = inject(TERMINAL_CREDENTIAL_STORE);

  parear(payload: PareamentoRequest): Observable<PareamentoResponse> {
    return this.http.post<PareamentoResponse>(`${HUB_TERMINAL_API_PATH}/parear/`, payload).pipe(
      tap((response) => {
        this.credentialStore.setToken(response.token);
      }),
    );
  }

  contexto(): Observable<TerminalContexto> {
    return this.http.get<TerminalContexto>(`${HUB_TERMINAL_API_PATH}/contexto/`);
  }

  heartbeat(payload: HeartbeatRequest = {}): Observable<HeartbeatResponse> {
    return this.http.post<HeartbeatResponse>(`${HUB_TERMINAL_API_PATH}/heartbeat/`, payload);
  }
}
