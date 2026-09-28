import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { HubAtivacaoStatus } from '../../models/hub-ativacao.models';
import { HubAtivacaoService } from '../../services/hub-ativacao.service';

@Component({
  selector: 'app-ativacao-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ativacao-page.component.html',
  styleUrl: './ativacao-page.component.scss',
})
export class AtivacaoPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ativacaoService = inject(HubAtivacaoService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editando = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly status = signal<HubAtivacaoStatus | null>(null);

  readonly form = this.fb.nonNullable.group({
    retaguarda_url: ['', [Validators.required]],
    codigo: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.carregarStatus();
  }

  ativar(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = {
      retaguarda_url: this.form.controls.retaguarda_url.value.trim(),
      codigo: this.form.controls.codigo.value.trim().toUpperCase(),
    };

    this.ativacaoService
      .ativar(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (status) => {
          this.status.set(status);
          this.form.controls.codigo.setValue('');
          this.form.controls.retaguarda_url.setValue(status.retaguarda_url || payload.retaguarda_url);
          this.editando.set(false);
          this.successMessage.set('Sysvar Hub ativado com sucesso.');
        },
        error: (err) => {
          this.errorMessage.set(this.erroControlado(err));
        },
      });
  }

  reativar(): void {
    this.editando.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  continuar(): void {
    void this.router.navigateByUrl('/pdv');
  }

  mostrarFormulario(): boolean {
    const status = this.status();
    return !status?.ativado || this.editando();
  }

  codigoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = input.value.toUpperCase();
    if (input.value !== normalized) {
      this.form.controls.codigo.setValue(normalized, { emitEvent: false });
    }
  }

  private carregarStatus(): void {
    this.loading.set(true);
    this.ativacaoService
      .status()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (status) => {
          this.status.set(status);
          this.form.controls.retaguarda_url.setValue(status.retaguarda_url || '');
          this.editando.set(!status.ativado);
        },
        error: (err) => {
          this.errorMessage.set(this.erroControlado(err));
          this.editando.set(true);
        },
      });
  }

  private erroControlado(err: unknown): string {
    const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
    return typeof detail === 'string' && detail.trim()
      ? detail
      : 'Nao foi possivel ativar o Sysvar Hub. Confira os dados e tente novamente.';
  }
}
