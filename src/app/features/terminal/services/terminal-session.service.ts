import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { TERMINAL_CREDENTIAL_STORE } from '../../../core/auth/terminal-credential-store';
import { TerminalContexto, TerminalSessionStatus } from '../../../core/models/terminal.models';
import { HubTerminalService } from './hub-terminal.service';

@Injectable({ providedIn: 'root' })
export class TerminalSessionService {
  private readonly credentialStore = inject(TERMINAL_CREDENTIAL_STORE);
  private readonly hubTerminalService = inject(HubTerminalService);

  private readonly statusSignal = signal<TerminalSessionStatus>('inicializando');
  private readonly contextoSignal = signal<TerminalContexto | null>(null);
  private bootstrapRequest$: Observable<boolean> | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly contexto = this.contextoSignal.asReadonly();
  readonly hasValidSession = computed(() => this.statusSignal() === 'contexto-carregado');

  bootstrap(): Observable<boolean> {
    if (!this.credentialStore.hasToken()) {
      this.clearSession('nao-pareado');
      return of(false);
    }

    if (this.statusSignal() === 'contexto-carregado' && this.contextoSignal()) {
      return of(true);
    }

    if (!this.bootstrapRequest$) {
      this.statusSignal.set('pareado');
      this.bootstrapRequest$ = this.hubTerminalService.contexto().pipe(
        tap((contexto) => {
          this.contextoSignal.set(contexto);
          this.statusSignal.set('contexto-carregado');
        }),
        map(() => true),
        catchError((error: unknown) => {
          if (this.isAuthenticationError(error)) {
            this.clearSession('nao-pareado');
            return of(false);
          }

          this.statusSignal.set('erro');
          return of(false);
        }),
        finalize(() => {
          this.bootstrapRequest$ = null;
        }),
      );
    }

    return this.bootstrapRequest$;
  }

  carregarContexto(): Observable<TerminalContexto> {
    this.statusSignal.set('pareado');

    return this.hubTerminalService.contexto().pipe(
      tap((contexto) => {
        this.contextoSignal.set(contexto);
        this.statusSignal.set('contexto-carregado');
      }),
    );
  }

  definirContextoPareado(contexto: TerminalContexto): void {
    this.contextoSignal.set(contexto);
    this.statusSignal.set('contexto-carregado');
  }

  invalidarSessao(): void {
    this.clearSession('nao-pareado');
  }

  logoutLocal(): void {
    this.clearSession('nao-pareado');
  }

  private clearSession(status: TerminalSessionStatus): void {
    this.credentialStore.clearToken();
    this.contextoSignal.set(null);
    this.statusSignal.set(status);
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }
}
