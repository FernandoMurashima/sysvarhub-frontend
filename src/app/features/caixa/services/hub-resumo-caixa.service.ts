import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import { mapResumoCaixa, ResumoCaixa, ResumoCaixaApi } from '../../../core/models/resumo-caixa.models';

@Injectable({ providedIn: 'root' })
export class HubResumoCaixaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/caixa/resumo/`;

  obter(): Observable<ResumoCaixa> {
    return this.http.get<ResumoCaixaApi>(this.url).pipe(map(mapResumoCaixa));
  }
}
