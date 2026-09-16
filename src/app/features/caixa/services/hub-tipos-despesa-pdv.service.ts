import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import {
  mapTiposDespesaPdvResponse,
  TiposDespesaPdvApiResponse,
  TiposDespesaPdvResponse,
} from '../../../core/models/tipo-despesa-pdv.models';

@Injectable({ providedIn: 'root' })
export class HubTiposDespesaPdvService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/tipos-despesa-pdv/`;

  listar(): Observable<TiposDespesaPdvResponse> {
    return this.http.get<TiposDespesaPdvApiResponse>(this.url).pipe(map(mapTiposDespesaPdvResponse));
  }
}
