import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { BrowserOperatorSessionStore } from './core/auth/browser-operator-session-store';
import { BrowserTerminalCredentialStore } from './core/auth/browser-terminal-credential-store';
import { OPERATOR_SESSION_STORE } from './core/auth/operator-session-store';
import { TERMINAL_CREDENTIAL_STORE } from './core/auth/terminal-credential-store';
import { operatorSessionInterceptor } from './core/interceptors/operator-session.interceptor';
import { terminalAuthInterceptor } from './core/interceptors/terminal-auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([terminalAuthInterceptor, operatorSessionInterceptor])),
    {
      provide: TERMINAL_CREDENTIAL_STORE,
      useClass: BrowserTerminalCredentialStore,
    },
    {
      provide: OPERATOR_SESSION_STORE,
      useClass: BrowserOperatorSessionStore,
    },
  ],
};
