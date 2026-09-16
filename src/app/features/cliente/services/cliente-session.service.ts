import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';

import { ClienteCadastroRequest, ClienteHubResumo, ClientesConsultaResponse } from '../../../core/models/cliente.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubClienteService } from './hub-cliente.service';

export class ClienteSessionExpiredError extends Error {
  constructor() {
    super('Sessão de operador expirada.');
  }
}

export class ClienteCadastroComunicacaoIncertError extends Error {
  constructor() {
    super('Falha de comunicação com o Hub local.');
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
        if (this.isAuthenticationError(error)) return throwError(() => this.expirarSessao());
        return throwError(() => error);
      }),
    );
  }

  cadastrar(payload: ClienteCadastroRequest): Observable<ClienteHubResumo> {
    return this.hubClienteService.cadastrar(payload).pipe(
      catchError((error: unknown) => {
        if (this.isAuthenticationError(error)) return throwError(() => this.expirarSessao());
        if (!this.isErroComunicacaoIncerta(error)) return throwError(() => error);

        const documento = normalizarDocumento(payload.documento);
        return this.hubClienteService.listar(documento).pipe(
          map((response) => {
            const reconciliado = response.clientes.find((cliente) => normalizarDocumento(cliente.documento || '') === documento);
            if (!reconciliado) throw new ClienteCadastroComunicacaoIncertError();
            return reconciliado;
          }),
          catchError((reconciliacaoError: unknown) => {
            if (this.isAuthenticationError(reconciliacaoError)) return throwError(() => this.expirarSessao());
            if (this.isErroComunicacaoIncerta(reconciliacaoError)) return throwError(() => new ClienteCadastroComunicacaoIncertError());
            return throwError(() => reconciliacaoError);
          }),
        );
      }),
    );
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private isErroComunicacaoIncerta(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 0;
  }

  private expirarSessao(): ClienteSessionExpiredError {
    this.operatorSession.invalidarSessao();
    void this.router.navigateByUrl('/operador');
    return new ClienteSessionExpiredError();
  }
}

function normalizarDocumento(documento: string): string {
  return documento.replace(/\D/g, '');
}
