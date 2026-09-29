import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';

import { HubProtectedModule } from '../auth/hub-module-access';
import { HubAuthorizationService } from '../services/hub-authorization.service';
import { OperatorSessionService } from '../../features/operador/services/operator-session.service';

export const operatorSessionGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const session = inject(OperatorSessionService);
  const router = inject(Router);
  const authorization = inject(HubAuthorizationService);

  return session.bootstrap().pipe(
    map((isValid) => {
      if (!isValid) {
        return router.createUrlTree(['/operador'], { queryParams: { returnUrl: state.url } });
      }

      const module = route.data?.['moduleKey'] as HubProtectedModule | undefined;
      if (module && !authorization.canAccessModule(session.operador(), module)) {
        return router.createUrlTree(['/acesso-negado'], { queryParams: { module } });
      }

      return true;
    }),
  );
};
