import { InjectionToken } from '@angular/core';

export interface OperatorSessionStore {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  hasToken(): boolean;
}

export const OPERATOR_SESSION_STORE = new InjectionToken<OperatorSessionStore>(
  'OperatorSessionStore',
);
