import { Injectable } from '@angular/core';

import { HubProtectedModule } from '../auth/hub-module-access';
import { OperadorHubPublico } from '../models/operador.models';

@Injectable({ providedIn: 'root' })
export class HubAuthorizationService {
  canAccessModule(operador: OperadorHubPublico | null, module: HubProtectedModule): boolean {
    if (!operador) {
      return false;
    }

    return this.modulesFor(operador).has(module);
  }

  modulesFor(operador: OperadorHubPublico): ReadonlySet<HubProtectedModule> {
    const normalizedProfile = `${operador.tipo} ${operador.perfil?.nome || ''}`.toLowerCase();

    if (this.isRestrictedProfile(normalizedProfile)) {
      return new Set<HubProtectedModule>();
    }

    return new Set<HubProtectedModule>([
      'pdv',
      'devolucao-troca',
      'consulta-vendas',
      'vale-troca',
      'pendencias-sincronizacao',
    ]);
  }

  private isRestrictedProfile(profile: string): boolean {
    return profile.includes('sem acesso') || profile.includes('bloqueado') || profile.includes('inativo');
  }
}
