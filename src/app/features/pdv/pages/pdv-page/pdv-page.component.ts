import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';

@Component({
  selector: 'app-pdv-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pdv-page.component.html',
  styleUrl: './pdv-page.component.scss',
})
export class PdvPageComponent {
  private readonly terminalSession = inject(TerminalSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly loja = computed(() => this.contexto()?.loja.nome_loja ?? this.contexto()?.loja.nome ?? '-');
  readonly caixa = computed(() => this.contexto()?.caixa.descricao ?? this.contexto()?.caixa.codigo ?? '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome ?? this.contexto()?.terminal.codigo ?? '-');
}
