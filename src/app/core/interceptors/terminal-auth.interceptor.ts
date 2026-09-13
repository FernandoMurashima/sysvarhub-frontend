import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TERMINAL_CREDENTIAL_STORE } from '../auth/terminal-credential-store';

const AUTHENTICATED_TERMINAL_PATH = '/api/terminal/';
const PAIRING_PATH = '/api/terminal/parear/';
const OPERATOR_CONTEXT_PATH = '/api/terminal/operador/contexto/';
const OPERATOR_LOGOUT_PATH = '/api/terminal/operador/logout/';

export const terminalAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const credentialStore = inject(TERMINAL_CREDENTIAL_STORE);
  const router = inject(Router);
  const isExternalUrl = /^https?:\/\//i.test(req.url);
  const isAuthenticatedTerminalRequest =
    !isExternalUrl && req.url.startsWith(AUTHENTICATED_TERMINAL_PATH) && req.url !== PAIRING_PATH;

  const token = credentialStore.getToken();
  const request =
    isAuthenticatedTerminalRequest && token
      ? req.clone({ setHeaders: { Authorization: `Terminal ${token}` } })
      : req;
  const shouldInvalidateTerminalOnAuthError =
    isAuthenticatedTerminalRequest && req.url !== OPERATOR_CONTEXT_PATH && req.url !== OPERATOR_LOGOUT_PATH;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        shouldInvalidateTerminalOnAuthError &&
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403)
      ) {
        credentialStore.clearToken();
        void router.navigateByUrl('/pareamento');
      }

      return throwError(() => error);
    }),
  );
};
