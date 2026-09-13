import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../../../core/auth/terminal-credential-store';
import { catalogoResponseStub, terminalContextoStub } from '../../../testing/terminal-test-data';
import { HubCatalogoService } from '../../terminal/services/hub-catalogo.service';
import { HubTerminalService } from '../../terminal/services/hub-terminal.service';
import { TerminalSessionService } from '../../terminal/services/terminal-session.service';
import { PdvHubFacade } from './pdv-hub.facade';

describe('PdvHubFacade', () => {
  let facade: PdvHubFacade;
  let catalogoService: jasmine.SpyObj<HubCatalogoService>;

  beforeEach(() => {
    catalogoService = jasmine.createSpyObj<HubCatalogoService>('HubCatalogoService', ['buscar']);
    catalogoService.buscar.and.returnValue(of(catalogoResponseStub));

    TestBed.configureTestingModule({
      providers: [
        PdvHubFacade,
        { provide: HubCatalogoService, useValue: catalogoService },
        {
          provide: TerminalSessionService,
          useValue: {
            contexto: signal(terminalContextoStub).asReadonly(),
          },
        },
        {
          provide: TERMINAL_CREDENTIAL_STORE,
          useValue: jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', [
            'getToken',
            'setToken',
            'clearToken',
            'hasToken',
          ]),
        },
        { provide: HubTerminalService, useValue: jasmine.createSpyObj<HubTerminalService>('HubTerminalService', ['contexto']) },
      ],
    });

    facade = TestBed.inject(PdvHubFacade);
  });

  it('expoe contexto da sessao do terminal', () => {
    expect(facade.loja()).toBe('Filial 1');
    expect(facade.caixa()).toBe('Caixa 01');
    expect(facade.terminal()).toBe('PDV-01');
  });

  it('usa HubCatalogoService com q correto e limit 40', (done) => {
    facade.buscarCatalogo('7892701000013', 40).subscribe(() => {
      expect(catalogoService.buscar).toHaveBeenCalledWith('7892701000013', 40);
      done();
    });
  });

  it('mapeia CatalogoItem para produto do PDV preservando contrato', (done) => {
    facade.buscarCatalogo('7892701000013', 40).subscribe((resultado) => {
      const produto = resultado.itens[0];

      expect(resultado.tabelaPrecoCodigo).toBe('PADRAO');
      expect(resultado.tabelaPrecoNome).toBe('Tabela Padrão');
      expect(produto.produtoId).toBe(2050);
      expect(produto.skuId).toBe(10825);
      expect(produto.ean13).toBe('7892701000013');
      expect(produto.precoVenda).toBe('199.9000');
      expect(produto.estoqueDisponivel).toBe('4.000');
      expect(produto.vendavel).toBeTrue();
      done();
    });
  });
});
