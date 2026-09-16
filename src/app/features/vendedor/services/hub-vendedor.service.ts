import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import { mapVendedores, VendedoresApiResponse, VendedoresResponse } from '../../../core/models/vendedor.models';

@Injectable({ providedIn: 'root' })
export class HubVendedorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/vendedores/`;

  consultar(q = ''): Observable<VendedoresResponse> {
    const termo = q.trim();
    const options = termo ? { params: new HttpParams().set('q', termo) } : {};
    return this.http.get<VendedoresApiResponse>(this.url, options).pipe(map(mapVendedores));
  }
}
