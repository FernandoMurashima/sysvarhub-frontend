import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TERMINAL_CREDENTIAL_STORE } from '../auth/terminal-credential-store';

const AUTHENTICATED_TERMINAL_PATH = '/api/terminal/';
const PAIRING_PATH = '/api/terminal/parear/';

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

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        isAuthenticatedTerminalRequest &&
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
