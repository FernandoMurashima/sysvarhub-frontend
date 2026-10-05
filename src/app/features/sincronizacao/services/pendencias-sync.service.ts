import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';

export type SyncStatus = 'PENDENTE' | 'PROCESSANDO' | 'SINCRONIZADO' | 'ERRO' | 'CONFLITO';
export type SyncStatusOperacional = SyncStatus | 'AGUARDANDO_DEPENDENCIA';

export interface PendenciaSyncEvento {
  id: number;
  evento_uuid: string;
  chave_idempotencia: string;
  tipo: string;
  status: SyncStatus;
  status_operacional: SyncStatusOperacional;
  criado_em: string | null;
  atualizado_em: string | null;
  sincronizado_em: string | null;
  tentativas: number;
  ultimo_erro: string;
  proxima_tentativa_em: string | null;
  documento: string;
  origem: string;
  dependencia: { resumo: string; itens: Array<{ tipo: string; uuid: string; documento: string; status: string; motivo: string }> } | null;
  bloqueado_por_dependencia: boolean;
  mensagem_operacional: string;
  resposta_central: unknown;
  payload_tecnico: unknown;
  acoes: { retry_permitido: boolean; sincronizar_agora_permitido: boolean };
}

export interface PendenciasSyncResponse {
  eventos: PendenciaSyncEvento[];
  resumo: {
    pendentes: number;
    processando: number;
    erros: number;
    conflitos: number;
    sincronizados: number;
  };
  central: { status: string; mensagem?: string; ultimo_contato_em?: string | null };
  paginacao: { page: number; page_size: number; total: number; pages: number };
  tipos: string[];
}

export interface PendenciasSyncFiltros {
  status?: string;
  tipo?: string;
  q?: string;
  problemas?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PendenciasSyncService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/pendencias-sync/`;

  listar(filtros: PendenciasSyncFiltros): Observable<PendenciasSyncResponse> {
    let params = new HttpParams()
      .set('page', String(filtros.page || 1))
      .set('page_size', String(filtros.pageSize || 20));
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.q?.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.problemas) params = params.set('problemas', '1');
    return this.http.get<PendenciasSyncResponse>(this.url, { params });
  }

  retry(eventoId: number): Observable<{ evento: PendenciaSyncEvento; resultado?: unknown }> {
    return this.http.post<{ evento: PendenciaSyncEvento; resultado?: unknown }>(`${this.url}${eventoId}/retry/`, {});
  }
}
