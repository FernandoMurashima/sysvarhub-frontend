import { computed, inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CatalogoItem } from '../../../core/models/catalogo.models';
import { HubCatalogoService } from '../../terminal/services/hub-catalogo.service';
import { TerminalSessionService } from '../../terminal/services/terminal-session.service';
import { PdvCatalogoConsulta, PdvProdutoConsulta } from '../models/pdv-produto-consulta.model';

@Injectable({ providedIn: 'root' })
export class PdvHubFacade {
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly catalogoService = inject(HubCatalogoService);

  readonly contexto = this.terminalSession.contexto;
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly caixa = computed(() => this.contexto()?.caixa?.descricao || this.contexto()?.caixa?.codigo || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');
  readonly empresa = computed(() => this.contexto()?.empresa.nome || '-');

  buscarCatalogo(q: string, limit = 40): Observable<PdvCatalogoConsulta> {
    return this.catalogoService.buscar(q, limit).pipe(
      map((response) => ({
        catalogoVersao: response.catalogo_versao,
        catalogoSincronizadoEm: response.catalogo_sincronizado_em,
        tabelaPrecoCodigo: response.tabela_preco.codigo,
        tabelaPrecoNome: response.tabela_preco.nome,
        q: response.q,
        total: response.total,
        limit: response.limit,
        itens: response.itens.map((item) => this.mapearProduto(item)),
      })),
    );
  }

  mapearProduto(item: CatalogoItem): PdvProdutoConsulta {
    return {
      produtoId: item.produto_id,
      skuId: item.sku_id,
      tipoProduto: item.tipo_produto,
      referencia: item.referencia,
      codigo: item.ean13 || item.codigo_item_ref || item.referencia,
      ean13: item.ean13,
      codigoItemRef: item.codigo_item_ref,
      descricao: item.descricao,
      descricaoReduzida: item.descricao_reduzida,
      cor: item.cor.descricao,
      tamanho: item.tamanho.descricao,
      unidade: item.unidade.codigo || item.unidade.descricao,
      preco: item.preco,
      precoPromocional: item.preco_promocional,
      precoVenda: item.preco_venda,
      estoqueFisico: item.estoque_fisico,
      reserva: item.reserva,
      estoqueDisponivel: item.estoque_disponivel,
      vendavel: item.vendavel,
      motivosBloqueio: item.motivos_bloqueio,
    };
  }
}
