import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HubAtivacaoPayload, HubAtivacaoStatus } from '../models/hub-ativacao.models';

@Injectable({ providedIn: 'root' })
export class HubAtivacaoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/hub/ativacao/';

  status(): Observable<HubAtivacaoStatus> {
    return this.http.get<HubAtivacaoStatus>(this.url);
  }

  ativar(payload: HubAtivacaoPayload): Observable<HubAtivacaoStatus> {
    return this.http.post<HubAtivacaoStatus>(this.url, payload);
  }
}
