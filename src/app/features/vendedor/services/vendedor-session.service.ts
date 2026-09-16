import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';

import { VendedoresResponse } from '../../../core/models/vendedor.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendedorService } from './hub-vendedor.service';

export class VendedorSessionExpiredError extends Error {
  constructor() {
    super('Sessão de operador expirada.');
  }
}

@Injectable({ providedIn: 'root' })
export class VendedorSessionService {
  private readonly hubVendedorService = inject(HubVendedorService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly router = inject(Router);

  listar(q = ''): Observable<VendedoresResponse> {
    return this.hubVendedorService.consultar(q).pipe(
      catchError((error: unknown) => {
        if (this.isAuthenticationError(error)) return throwError(() => this.expirarSessao());
        return throwError(() => error);
      }),
    );
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private expirarSessao(): VendedorSessionExpiredError {
    this.operatorSession.invalidarSessao();
    void this.router.navigateByUrl('/operador');
    return new VendedorSessionExpiredError();
  }
}
