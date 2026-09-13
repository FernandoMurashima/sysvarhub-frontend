import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { BrowserTerminalCredentialStore } from './core/auth/browser-terminal-credential-store';
import { TERMINAL_CREDENTIAL_STORE } from './core/auth/terminal-credential-store';
import { terminalAuthInterceptor } from './core/interceptors/terminal-auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([terminalAuthInterceptor])),
    {
      provide: TERMINAL_CREDENTIAL_STORE,
      useClass: BrowserTerminalCredentialStore,
    },
  ],
};
