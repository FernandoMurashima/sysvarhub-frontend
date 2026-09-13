import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CatalogoResponse } from '../../../../core/models/catalogo.models';
import { HubCatalogoService } from '../../../terminal/services/hub-catalogo.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';

@Component({
  selector: 'app-suporte-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './suporte-page.component.html',
  styleUrl: './suporte-page.component.scss',
})
export class SuportePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogoService = inject(HubCatalogoService);
  private readonly terminalSession = inject(TerminalSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly status = this.terminalSession.status;
  readonly loadingCatalogo = signal(false);
  readonly catalogo = signal<CatalogoResponse | null>(null);
  readonly catalogoError = signal<string | null>(null);

  readonly loja = computed(() => this.contexto()?.loja.nome_loja ?? this.contexto()?.loja.nome ?? '-');
  readonly empresa = computed(() => this.contexto()?.empresa.razao_social ?? this.contexto()?.empresa.nome ?? '-');
  readonly caixa = computed(() => this.contexto()?.caixa.descricao ?? this.contexto()?.caixa.codigo ?? '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome ?? this.contexto()?.terminal.codigo ?? '-');

  readonly form = this.fb.nonNullable.group({
    q: [''],
    limit: [20],
  });

  pesquisar(): void {
    this.loadingCatalogo.set(true);
    this.catalogoError.set(null);

    const q = this.form.controls.q.value.trim() || undefined;
    const limit = this.form.controls.limit.value || undefined;

    this.catalogoService
      .buscar(q, limit)
      .pipe(finalize(() => this.loadingCatalogo.set(false)))
      .subscribe({
        next: (response) => this.catalogo.set(response),
        error: () => this.catalogoError.set('Nao foi possivel consultar o catalogo local.'),
      });
  }
}
