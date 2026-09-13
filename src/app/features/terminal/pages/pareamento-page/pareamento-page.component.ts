import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { HubTerminalService } from '../../services/hub-terminal.service';
import { TerminalSessionService } from '../../services/terminal-session.service';

@Component({
  selector: 'app-pareamento-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pareamento-page.component.html',
  styleUrl: './pareamento-page.component.scss',
})
export class PareamentoPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly hubTerminalService = inject(HubTerminalService);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    hostname: [''],
  });

  parear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const payload = {
      codigo: this.form.controls.codigo.value.trim(),
      hostname: this.form.controls.hostname.value.trim() || undefined,
    };

    this.hubTerminalService
      .parear(payload)
      .pipe(
        switchMap(() => this.terminalSession.carregarContexto()),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/pdv'),
        error: () => {
          this.errorMessage.set('Nao foi possivel parear este terminal. Confira o codigo e tente novamente.');
        },
      });
  }
}
