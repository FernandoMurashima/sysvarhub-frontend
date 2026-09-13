import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import { CatalogoResponse } from '../../../core/models/catalogo.models';

@Injectable({ providedIn: 'root' })
export class HubCatalogoService {
  private readonly http = inject(HttpClient);

  buscar(q?: string, limit?: number): Observable<CatalogoResponse> {
    let params = new HttpParams();

    if (q) {
      params = params.set('q', q);
    }

    if (limit !== undefined) {
      params = params.set('limit', String(limit));
    }

    return this.http.get<CatalogoResponse>(`${HUB_TERMINAL_API_PATH}/catalogo/`, { params });
  }
}
