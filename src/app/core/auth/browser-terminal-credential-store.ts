import { Injectable } from '@angular/core';

import { TerminalCredentialStore } from './terminal-credential-store';

const TERMINAL_TOKEN_STORAGE_KEY = 'sysvar.hub.terminal.token';

@Injectable()
export class BrowserTerminalCredentialStore implements TerminalCredentialStore {
  getToken(): string | null {
    return localStorage.getItem(TERMINAL_TOKEN_STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TERMINAL_TOKEN_STORAGE_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TERMINAL_TOKEN_STORAGE_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
