import { Injectable } from '@angular/core';

import { OperatorSessionStore } from './operator-session-store';

const OPERATOR_SESSION_STORAGE_KEY = 'sysvar.hub.operator.session';

@Injectable()
export class BrowserOperatorSessionStore implements OperatorSessionStore {
  getToken(): string | null {
    return sessionStorage.getItem(OPERATOR_SESSION_STORAGE_KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(OPERATOR_SESSION_STORAGE_KEY, token);
  }

  clearToken(): void {
    sessionStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
