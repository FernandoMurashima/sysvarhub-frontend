import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  ClientesConsultaApiResponse,
  ClientesConsultaResponse,
  mapClientes,
} from '../../../core/models/cliente.models';

@Injectable({ providedIn: 'root' })
export class HubClienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/clientes/`;

  listar(q = ''): Observable<ClientesConsultaResponse> {
    const termo = q.trim();
    const options = termo ? { params: new HttpParams().set('q', termo) } : {};
    return this.http.get<ClientesConsultaApiResponse>(this.url, options).pipe(map(mapClientes));
  }
}
