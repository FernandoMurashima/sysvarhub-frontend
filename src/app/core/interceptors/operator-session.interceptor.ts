import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { OPERATOR_SESSION_STORE } from '../auth/operator-session-store';

const OPERATOR_LOGIN_PATH = '/api/terminal/operador/login/';
const OPERATOR_SESSION_PATHS = [
  '/api/terminal/operador/contexto/',
  '/api/terminal/operador/logout/',
  '/api/terminal/caixa/',
  '/api/terminal/venda/',
  '/api/terminal/formas-pagamento/',
];

export const operatorSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(OPERATOR_SESSION_STORE);
  const isExternalUrl = /^https?:\/\//i.test(req.url);
  const requiresOperatorSession =
    !isExternalUrl && req.url !== OPERATOR_LOGIN_PATH && OPERATOR_SESSION_PATHS.some((path) => req.url.startsWith(path));
  const token = sessionStore.getToken();

  const request =
    requiresOperatorSession && token
      ? req.clone({ setHeaders: { 'X-Sysvar-Operador-Session': token } })
      : req;

  return next(request);
};
