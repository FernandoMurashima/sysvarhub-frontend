import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  ClienteCadastroApiResponse,
  ClienteCadastroRequest,
  ClienteHubResumo,
  ClientesConsultaApiResponse,
  ClientesConsultaResponse,
  mapCliente,
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

  cadastrar(payload: ClienteCadastroRequest): Observable<ClienteHubResumo> {
    return this.http
      .post<ClienteCadastroApiResponse>(this.url, payload)
      .pipe(map((response) => mapCliente(response.cliente)));
  }
}
