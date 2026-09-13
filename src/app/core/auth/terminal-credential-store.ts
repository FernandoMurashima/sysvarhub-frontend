import { InjectionToken } from '@angular/core';

export interface TerminalCredentialStore {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  hasToken(): boolean;
}

export const TERMINAL_CREDENTIAL_STORE = new InjectionToken<TerminalCredentialStore>(
  'TerminalCredentialStore',
);
