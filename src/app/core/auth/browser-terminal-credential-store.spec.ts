import { BrowserTerminalCredentialStore } from './browser-terminal-credential-store';

describe('BrowserTerminalCredentialStore', () => {
  let store: BrowserTerminalCredentialStore;

  beforeEach(() => {
    localStorage.clear();
    store = new BrowserTerminalCredentialStore();
  });

  it('salva e recupera o token', () => {
    store.setToken('token-ficticio');

    expect(store.getToken()).toBe('token-ficticio');
    expect(store.hasToken()).toBeTrue();
  });

  it('remove o token', () => {
    store.setToken('token-ficticio');
    store.clearToken();

    expect(store.getToken()).toBeNull();
    expect(store.hasToken()).toBeFalse();
  });

  it('nao expoe token fora do armazenamento esperado', () => {
    store.setToken('token-ficticio');

    expect(Object.keys(store)).not.toContain('token-ficticio');
  });
});
