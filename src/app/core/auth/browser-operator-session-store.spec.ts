import { BrowserOperatorSessionStore } from './browser-operator-session-store';

describe('BrowserOperatorSessionStore', () => {
  let store: BrowserOperatorSessionStore;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    store = new BrowserOperatorSessionStore();
  });

  it('usa sessionStorage para preservar refresh sem persistir entre abas', () => {
    store.setToken('sessao-operador-ficticia');

    expect(store.getToken()).toBe('sessao-operador-ficticia');
    expect(sessionStorage.getItem('sysvar.hub.operator.session')).toBe('sessao-operador-ficticia');
    expect(localStorage.getItem('sysvar.hub.operator.session')).toBeNull();
  });

  it('set get clear e hasToken funcionam', () => {
    store.setToken('sessao-operador-ficticia');
    expect(store.hasToken()).toBeTrue();

    store.clearToken();
    expect(store.getToken()).toBeNull();
    expect(store.hasToken()).toBeFalse();
  });

  it('nao armazena senha nem usa storage do Terminal', () => {
    store.setToken('sessao-operador-ficticia');

    expect(sessionStorage.getItem('sysvar.hub.terminal.token')).toBeNull();
    expect(sessionStorage.getItem('senha')).toBeNull();
    expect(JSON.stringify(sessionStorage)).not.toContain('credencial');
  });
});
