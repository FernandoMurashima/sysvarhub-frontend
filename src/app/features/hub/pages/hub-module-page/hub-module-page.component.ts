import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';

type HubModuleKey = 'devolucao-troca' | 'consulta-vendas' | 'vale-troca' | 'pendencias-sincronizacao';

const MODULE_CONTENT: Record<HubModuleKey, { title: string; eyebrow: string; description: string }> = {
  'devolucao-troca': {
    title: 'Devolução / Troca',
    eyebrow: 'Módulo operacional',
    description: 'Estrutura dedicada ao fluxo de devoluções e trocas da loja.',
  },
  'consulta-vendas': {
    title: 'Consulta de Vendas',
    eyebrow: 'Módulo operacional',
    description: 'Base para localização e acompanhamento de vendas realizadas no Hub.',
  },
  'vale-troca': {
    title: 'Vale-Troca',
    eyebrow: 'Módulo operacional',
    description: 'Área reservada ao acompanhamento de vales-troca da operação local.',
  },
  'pendencias-sincronizacao': {
    title: 'Pendências de Sincronização',
    eyebrow: 'Monitor operacional',
    description: 'Base visual para acompanhar eventos locais pendentes de envio ou tratamento.',
  },
};

@Component({
  selector: 'app-hub-module-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hub-module-page.component.html',
  styleUrl: './hub-module-page.component.scss',
})
export class HubModulePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly operatorSession = inject(OperatorSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly operador = this.operatorSession.operador;
  readonly moduleKey = this.route.snapshot.data['moduleKey'] as HubModuleKey | undefined;
  readonly content = computed(() => MODULE_CONTENT[this.moduleKey || 'devolucao-troca']);
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');
  readonly operadorPerfil = computed(() => this.operador()?.perfil?.nome || this.operador()?.tipo || '-');
}
