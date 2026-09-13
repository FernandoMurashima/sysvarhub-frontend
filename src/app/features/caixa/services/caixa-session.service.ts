import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { CaixaHubResumo, CaixaSessionStatus, mapSessaoCaixa, SessaoCaixaHubResumo } from '../../../core/models/caixa.models';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubCaixaService } from './hub-caixa.service';

export interface CaixaAbrirResultado {
  ok: boolean;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class CaixaSessionService {
  private readonly hubCaixaService = inject(HubCaixaService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly router = inject(Router);

  private readonly statusSignal = signal<CaixaSessionStatus>('inicializando');
  private readonly caixaSignal = signal<CaixaHubResumo | null>(null);
  private readonly sessaoSignal = signal<SessaoCaixaHubResumo | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly caixa = this.caixaSignal.asReadonly();
  readonly sessao = this.sessaoSignal.asReadonly();

  bootstrap(): Observable<boolean> {
    return this.carregarStatus();
  }

  carregarStatus(): Observable<boolean> {
    this.statusSignal.set('inicializando');
    return this.hubCaixaService.status().pipe(
      tap((response) => {
        this.caixaSignal.set(response.caixa);
        this.sessaoSignal.set(response.sessao);
        this.statusSignal.set(response.aberto ? 'aberto' : 'fechado');
      }),
      map((response) => response.aberto),
      catchError((error: unknown) => this.tratarErroStatus(error)),
    );
  }

  abrir(valor: string): Observable<CaixaAbrirResultado> {
    return this.hubCaixaService.abrir(valor).pipe(
      tap((sessao) => this.definirAberto(sessao)),
      map(() => ({ ok: true })),
      catchError((error: unknown) => this.tratarErroAbertura(error)),
    );
  }

  limparEstado(): void {
    this.caixaSignal.set(null);
    this.sessaoSignal.set(null);
    this.statusSignal.set('inicializando');
  }

  private definirAberto(sessao: SessaoCaixaHubResumo): void {
    this.caixaSignal.set(sessao.caixa);
    this.sessaoSignal.set(sessao);
    this.statusSignal.set('aberto');
  }

  private tratarErroStatus(error: unknown): Observable<boolean> {
    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of(false);
    }

    this.statusSignal.set('erro');
    return of(false);
  }

  private tratarErroAbertura(error: unknown): Observable<CaixaAbrirResultado> {
    if (error instanceof HttpErrorResponse && error.status === 409 && error.error?.sessao) {
      this.definirAberto(mapSessaoCaixa(error.error.sessao));
      return of({ ok: true });
    }

    if (this.isAuthenticationError(error)) {
      this.tratarSessaoOperadorExpirada();
      return of({ ok: false, detail: 'Sessão de operador expirada.' });
    }

    if (error instanceof HttpErrorResponse && error.status === 400) {
      return of({ ok: false, detail: error.error?.detail || 'Valor de abertura inválido.' });
    }

    this.statusSignal.set('erro');
    return of({ ok: false, detail: 'Falha de comunicação com o Hub local.' });
  }

  private isAuthenticationError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private tratarSessaoOperadorExpirada(): void {
    this.operatorSession.invalidarSessao();
    this.limparEstado();
    void this.router.navigateByUrl('/operador');
  }
}
