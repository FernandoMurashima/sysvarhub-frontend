import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { OPERATOR_SESSION_STORE } from '../../../core/auth/operator-session-store';
import {
  OperadorHubPublico,
  OperatorSessionStatus,
  SessaoOperadorResumo,
} from '../../../core/models/operador.models';
import { HubOperadorService } from './hub-operador.service';

@Injectable({ providedIn: 'root' })
export class OperatorSessionService {
  private readonly sessionStore = inject(OPERATOR_SESSION_STORE);
  private readonly hubOperadorService = inject(HubOperadorService);

  private readonly statusSignal = signal<OperatorSessionStatus>('inicializando');
  private readonly operadorSignal = signal<OperadorHubPublico | null>(null);
  private readonly sessaoSignal = signal<SessaoOperadorResumo | null>(null);
  private bootstrapRequest$: Observable<boolean> | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly operador = this.operadorSignal.asReadonly();
  readonly sessao = this.sessaoSignal.asReadonly();
  readonly hasValidSession = computed(() => this.statusSignal() === 'autenticado' && !!this.operadorSignal());

  bootstrap(): Observable<boolean> {
    if (!this.sessionStore.hasToken()) {
      this.clearState('nao-autenticado');
      return of(false);
    }

    if (this.hasValidSession()) {
      return of(true);
    }

    if (!this.bootstrapRequest$) {
      this.statusSignal.set('inicializando');
      this.bootstrapRequest$ = this.hubOperadorService.contexto().pipe(
        tap((contexto) => this.setAuthenticated(contexto.operador, contexto.sessao)),
        map(() => true),
        catchError((error: unknown) => {
          if (this.isAuthenticationError(error)) {
            this.invalidarSessao();
            return of(false);
          }

          this.statusSignal.set('erro');
          this.operadorSignal.set(null);
          this.sessaoSignal.set(null);
          return of(false);
        }),
        finalize(() => {
          this.bootstrapRequest$ = null;
        }),
      );
    }

    return this.bootstrapRequest$;
  }

  login(codigo: string, senha: string): Observable<boolean> {
    this.statusSignal.set('inicializando');

    return this.hubOperadorService.login(codigo, senha).pipe(
      tap((response) => this.setAuthenticated(response.operador, response.sessao)),
      map(() => true),
      catchError((error: unknown) => {
        this.clearState('nao-autenticado');
        return of(false);
      }),
    );
  }

  logout(): Observable<boolean> {
    return this.hubOperadorService.logout().pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.invalidarSessao()),
    );
  }

  invalidarSessao(): void {
    this.sessionStore.clearToken();
    this.clearState('nao-autenticado');
  }

  private setAuthenticated(operador: OperadorHubPublico, sessao: SessaoOperadorResumo): void {
    this.operadorSignal.set(operador);
    this.sessaoSignal.set(sessao);
    this.statusSignal.set('autenticado');
  }

  private clearState(status: OperatorSessionStatus): void {
    this.operadorSignal.set(null);
    this.sessaoSignal.set(null);
    this.statusSignal.set(status);
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }
}
