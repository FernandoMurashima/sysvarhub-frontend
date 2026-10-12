export type HubProtectedModule = 'pdv' | 'devolucao-troca' | 'consulta-vendas' | 'recebimento-loja' | 'pendencias-sincronizacao';

export interface HubModuleAccessRule {
  module: HubProtectedModule;
  title: string;
}

export const HUB_PROTECTED_MODULES: Record<HubProtectedModule, HubModuleAccessRule> = {
  pdv: {
    module: 'pdv',
    title: 'PDV',
  },
  'devolucao-troca': {
    module: 'devolucao-troca',
    title: 'Devolução / Troca',
  },
  'consulta-vendas': {
    module: 'consulta-vendas',
    title: 'Consulta de Vendas',
  },
  'recebimento-loja': {
    module: 'recebimento-loja',
    title: 'Recebimento de Loja',
  },
  'pendencias-sincronizacao': {
    module: 'pendencias-sincronizacao',
    title: 'Pendências de Sincronização',
  },
};
