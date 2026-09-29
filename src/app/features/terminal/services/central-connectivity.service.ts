import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, Subscription, switchMap, timer } from 'rxjs';

import { CentralConnectivityResponse, CentralConnectivityStatus } from '../../../core/models/terminal.models';
import { HubTerminalService } from './hub-terminal.service';

@Injectable({ providedIn: 'root' })
export class CentralConnectivityService {
  private readonly hubTerminalService = inject(HubTerminalService);
  private readonly statusSignal = signal<CentralConnectivityStatus>('VERIFICANDO');
  private readonly ultimoContatoSignal = signal<string | null>(null);
  private readonly ultimaTentativaSignal = signal<string | null>(null);
  private pollingSubscription: Subscription | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly online = computed(() => this.statusSignal() === 'ONLINE');
  readonly ultimoContatoEm = this.ultimoContatoSignal.asReadonly();
  readonly ultimaTentativaEm = this.ultimaTentativaSignal.asReadonly();
  readonly label = computed(() => this.statusSignal());
  readonly lastContactLabel = computed(() => this.formatarHorario(this.ultimoContatoSignal()));

  startPolling(): void {
    if (this.pollingSubscription) return;

    this.pollingSubscription = timer(0, 15_000)
      .pipe(
        switchMap(() =>
          this.hubTerminalService.centralStatus().pipe(
            catchError((error: unknown) => {
              this.tratarErro(error);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((status) => this.aplicarStatus(status));
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  private aplicarStatus(response: CentralConnectivityResponse): void {
    this.statusSignal.set(response.status);
    this.ultimoContatoSignal.set(response.ultimo_contato_em);
    this.ultimaTentativaSignal.set(response.ultima_tentativa_em);
  }

  private tratarErro(error: unknown): void {
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      this.statusSignal.set('VERIFICANDO');
      return;
    }
    this.statusSignal.set('OFFLINE');
  }

  private formatarHorario(valor: string | null): string {
    if (!valor) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(valor));
  }
}
