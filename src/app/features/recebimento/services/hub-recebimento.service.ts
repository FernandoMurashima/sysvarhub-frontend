import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';

export type RecebimentoStatusLocal = 'PENDENTE' | 'CONFERIDO' | 'SINCRONIZADO' | 'CONFLITO';

export interface RecebimentoPessoa {
  id: number | null;
  nome: string;
  apelido?: string;
  documento?: string;
}

export interface RecebimentoDocumentoFiscal {
  xml_fornecedor_id?: number | null;
  modelo?: string;
  serie?: string;
  numero?: string;
  chave_acesso?: string;
  situacao_fiscal?: string;
  status_operacional?: string;
  emitente_nome?: string;
  emitente_documento?: string;
  quantidade_total_faturada?: string | number | null;
  valor_total?: string | number | null;
  dh_emissao?: string | null;
  emitida_em?: string | null;
}

export interface RecebimentoResumo {
  quantidade_esperada_total?: string | number | null;
  quantidade_enviada_total?: string | number | null;
  quantidade_recebida_total?: string | number | null;
  diferenca_total?: string | number | null;
  quantidade_skus?: number | null;
  quantidade_itens?: number | null;
  quantidade_skus_com_divergencia?: number | null;
  estoque_efetivado?: boolean;
}

export interface RecebimentoItem {
  conferencia_item_id: number;
  pedido_id?: number | null;
  pedido_item_id?: number | null;
  produto_retaguarda_id?: number | null;
  sku_retaguarda_id: number;
  ean?: string;
  referencia?: string;
  descricao: string;
  cor?: RecebimentoPessoa | null;
  tamanho?: RecebimentoPessoa | null;
  quantidade_esperada: string | number;
  quantidade_enviada?: string | number | null;
  quantidade_recebida: string | number;
  diferenca: string | number;
  situacao?: string;
}

export interface RecebimentoLoja {
  local_id: number;
  id?: number | null;
  retaguarda_id?: number | null;
  recebimento_uuid: string;
  origem: string;
  status_retaguarda?: string;
  status_local: RecebimentoStatusLocal;
  loja?: RecebimentoPessoa | null;
  unidade_origem?: RecebimentoPessoa | null;
  loja_origem?: RecebimentoPessoa | null;
  fornecedor?: RecebimentoPessoa | null;
  documento_fiscal?: RecebimentoDocumentoFiscal | null;
  pedidos?: Array<number | string | { id?: number | string | null; numero?: string | null; codigo?: string | null; documento?: string | null }>;
  resumo?: RecebimentoResumo | null;
  observacao_divergencia?: string;
  conferido_em?: string | null;
  estoque_efetivado_em?: string | null;
  confirmado_central_em?: string | null;
  mensagem_sync?: string;
  itens?: RecebimentoItem[];
  contrato_retorno?: unknown;
  resposta_central?: unknown;
}

export interface RecebimentosResponse {
  total: number;
  recebimentos: RecebimentoLoja[];
}

export interface RecebimentoDetalheResponse {
  recebimento: RecebimentoLoja;
}

export interface RecebimentoFinalizarItemRequest {
  conferencia_item_id: number;
  sku_retaguarda_id: number;
  ean?: string;
  quantidade_recebida: string;
}

export interface RecebimentoFinalizarRequest {
  itens: RecebimentoFinalizarItemRequest[];
  observacao_divergencia?: string;
}

@Injectable({ providedIn: 'root' })
export class HubRecebimentoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${HUB_TERMINAL_API_PATH}/recebimentos/`;

  listar(): Observable<RecebimentosResponse> {
    return this.http.get<RecebimentosResponse>(this.url);
  }

  detalhar(recebimentoId: number): Observable<RecebimentoDetalheResponse> {
    return this.http.get<RecebimentoDetalheResponse>(`${this.url}${recebimentoId}/`);
  }

  finalizar(recebimentoId: number, request: RecebimentoFinalizarRequest): Observable<RecebimentoDetalheResponse> {
    return this.http.post<RecebimentoDetalheResponse>(`${this.url}${recebimentoId}/finalizar/`, request);
  }
}
