import { Routes } from '@angular/router';

import { operatorSessionGuard } from './core/guards/operator-session.guard';
import { terminalSessionGuard } from './core/guards/terminal-session.guard';
import { OperadorLoginPageComponent } from './features/operador/pages/operador-login-page/operador-login-page.component';
import { PareamentoPageComponent } from './features/terminal/pages/pareamento-page/pareamento-page.component';
import { PdvPageComponent } from './features/pdv/pages/pdv-page/pdv-page.component';
import { SuportePageComponent } from './features/suporte/pages/suporte-page/suporte-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pdv',
  },
  {
    path: 'pareamento',
    component: PareamentoPageComponent,
  },
  {
    path: 'pdv',
    component: PdvPageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
  },
  {
    path: 'operador',
    component: OperadorLoginPageComponent,
    canActivate: [terminalSessionGuard],
  },
  {
    path: 'suporte',
    component: SuportePageComponent,
    canActivate: [terminalSessionGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
