import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';

import { ClientesConsultaResponse } from '../../../core/models/cliente.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubClienteService } from './hub-cliente.service';

export class ClienteSessionExpiredError extends Error {
  constructor() {
    super('Sessão de operador expirada.');
  }
}

@Injectable({ providedIn: 'root' })
export class ClienteSessionService {
  private readonly hubClienteService = inject(HubClienteService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly router = inject(Router);

  listar(q = ''): Observable<ClientesConsultaResponse> {
    return this.hubClienteService.listar(q).pipe(
      catchError((error: unknown) => {
        if (this.isAuthenticationError(error)) {
          this.operatorSession.invalidarSessao();
          void this.router.navigateByUrl('/operador');
          return throwError(() => new ClienteSessionExpiredError());
        }
        return throwError(() => error);
      }),
    );
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }
}
