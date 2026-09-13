import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';

import { OperatorSessionService } from '../../features/operador/services/operator-session.service';

export const operatorSessionGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const session = inject(OperatorSessionService);
  const router = inject(Router);

  return session.bootstrap().pipe(
    map((isValid) => (isValid ? true : router.createUrlTree(['/operador']))),
  );
};
