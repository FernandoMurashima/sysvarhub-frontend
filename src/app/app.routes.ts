import { Routes } from '@angular/router';

import { terminalSessionGuard } from './core/guards/terminal-session.guard';
import { PareamentoPageComponent } from './features/terminal/pages/pareamento-page/pareamento-page.component';
import { PdvPageComponent } from './features/pdv/pages/pdv-page/pdv-page.component';
import { SuportePageComponent } from './features/suporte/pages/suporte-page/suporte-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [terminalSessionGuard],
    redirectTo: 'pdv',
  },
  {
    path: 'pareamento',
    component: PareamentoPageComponent,
  },
  {
    path: 'pdv',
    component: PdvPageComponent,
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
