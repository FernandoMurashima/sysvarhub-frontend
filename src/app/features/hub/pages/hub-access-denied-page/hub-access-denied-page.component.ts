import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { HUB_PROTECTED_MODULES, HubProtectedModule } from '../../../../core/auth/hub-module-access';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';

@Component({
  selector: 'app-hub-access-denied-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hub-access-denied-page.component.html',
  styleUrl: './hub-access-denied-page.component.scss',
})
export class HubAccessDeniedPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly operatorSession = inject(OperatorSessionService);

  readonly operador = this.operatorSession.operador;
  readonly moduleTitle = computed(() => {
    const module = this.route.snapshot.queryParamMap.get('module') as HubProtectedModule | null;

    return module && HUB_PROTECTED_MODULES[module] ? HUB_PROTECTED_MODULES[module].title : 'módulo solicitado';
  });
}
