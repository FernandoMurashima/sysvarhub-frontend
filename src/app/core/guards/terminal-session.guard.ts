import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';

import { TerminalSessionService } from '../../features/terminal/services/terminal-session.service';

export const terminalSessionGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const session = inject(TerminalSessionService);
  const router = inject(Router);

  return session.bootstrap().pipe(
    map((isValid) => (isValid ? true : router.createUrlTree(['/pareamento']))),
  );
};
