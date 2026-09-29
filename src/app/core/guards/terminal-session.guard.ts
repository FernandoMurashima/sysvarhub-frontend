import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

import { HubAtivacaoService } from '../../features/ativacao/services/hub-ativacao.service';
import { TerminalSessionService } from '../../features/terminal/services/terminal-session.service';

export const terminalSessionGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const ativacao = inject(HubAtivacaoService);
  const session = inject(TerminalSessionService);
  const router = inject(Router);

  return ativacao.status().pipe(
    switchMap((status) => {
      if (!status.ativado) {
        return of(router.createUrlTree(['/ativacao']));
      }

      return session.bootstrap().pipe(
        map((isValid) => (isValid ? true : router.createUrlTree(['/pareamento']))),
      );
    }),
    catchError(() => of(router.createUrlTree(['/ativacao']))),
  );
};
