export interface HubAtivacaoStatus {
  ativado: boolean;
  possui_credencial: boolean;
  hub_uuid: string | null;
  nome: string;
  empresa_id: number | null;
  empresa_nome: string;
  loja_id: number | null;
  loja_nome: string;
  retaguarda_url: string;
  ativado_em: string | null;
}

export interface HubAtivacaoPayload {
  codigo: string;
  retaguarda_url: string;
}
