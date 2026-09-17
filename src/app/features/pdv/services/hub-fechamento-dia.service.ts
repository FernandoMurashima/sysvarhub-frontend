import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  FechamentoDiaPayload,
  FechamentoDiaPrevia,
  FechamentoDiaPreviaApi,
  FechamentoDiaRegistro,
  FechamentoDiaResponseApi,
  mapFechamentoDiaPayload,
  mapFechamentoDiaPrevia,
  mapFechamentoDiaRegistro,
} from '../../../core/models/fechamento-dia.models';

@Injectable({ providedIn: 'root' })
export class HubFechamentoDiaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/fechamento-dia/`;

  obterPrevia(data: string): Observable<FechamentoDiaPrevia> {
    const params = new HttpParams().set('data', data);
    return this.http
      .get<FechamentoDiaPreviaApi>(this.url, { params })
      .pipe(map(mapFechamentoDiaPrevia));
  }

  fechar(payload: FechamentoDiaPayload): Observable<FechamentoDiaRegistro> {
    return this.http
      .post<FechamentoDiaResponseApi>(this.url, mapFechamentoDiaPayload(payload))
      .pipe(map((response) => mapFechamentoDiaRegistro(response.fechamento)));
  }
}
