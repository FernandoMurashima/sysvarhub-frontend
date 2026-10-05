import { Routes } from '@angular/router';

import { operatorSessionGuard } from './core/guards/operator-session.guard';
import { terminalSessionGuard } from './core/guards/terminal-session.guard';
import { AtivacaoPageComponent } from './features/ativacao/pages/ativacao-page/ativacao-page.component';
import { HubAccessDeniedPageComponent } from './features/hub/pages/hub-access-denied-page/hub-access-denied-page.component';
import { HubHomePageComponent } from './features/hub/pages/hub-home-page/hub-home-page.component';
import { HubModulePageComponent } from './features/hub/pages/hub-module-page/hub-module-page.component';
import { OperadorLoginPageComponent } from './features/operador/pages/operador-login-page/operador-login-page.component';
import { PendenciasSincronizacaoPageComponent } from './features/sincronizacao/pages/pendencias-sincronizacao-page/pendencias-sincronizacao-page.component';
import { PareamentoPageComponent } from './features/terminal/pages/pareamento-page/pareamento-page.component';
import { PdvPageComponent } from './features/pdv/pages/pdv-page/pdv-page.component';
import { SuportePageComponent } from './features/suporte/pages/suporte-page/suporte-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HubHomePageComponent,
    canActivate: [terminalSessionGuard],
  },
  {
    path: 'pareamento',
    component: PareamentoPageComponent,
  },
  {
    path: 'ativacao',
    component: AtivacaoPageComponent,
  },
  {
    path: 'pdv',
    component: PdvPageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
    data: { moduleKey: 'pdv' },
  },
  {
    path: 'devolucao-troca',
    component: HubModulePageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
    data: { moduleKey: 'devolucao-troca' },
  },
  {
    path: 'consulta-vendas',
    component: HubModulePageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
    data: { moduleKey: 'consulta-vendas' },
  },
  {
    path: 'vale-troca',
    component: HubModulePageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
    data: { moduleKey: 'vale-troca' },
  },
  {
    path: 'pendencias-sincronizacao',
    component: PendenciasSincronizacaoPageComponent,
    canActivate: [terminalSessionGuard, operatorSessionGuard],
    data: { moduleKey: 'pendencias-sincronizacao' },
  },
  {
    path: 'acesso-negado',
    component: HubAccessDeniedPageComponent,
    canActivate: [terminalSessionGuard],
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
