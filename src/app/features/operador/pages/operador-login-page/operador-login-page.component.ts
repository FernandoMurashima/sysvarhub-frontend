import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { OperatorSessionService } from '../../services/operator-session.service';

@Component({
  selector: 'app-operador-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './operador-login-page.component.html',
  styleUrl: './operador-login-page.component.scss',
})
export class OperadorLoginPageComponent implements OnInit {
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('codigoInput') private codigoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('senhaInput') private senhaInput?: ElementRef<HTMLInputElement>;

  readonly contexto = this.terminalSession.contexto;

  codigo = '';
  senha = '';
  carregando = false;
  errorMessage = '';

  ngOnInit(): void {
    this.senha = '';
    queueMicrotask(() => this.codigoInput?.nativeElement.focus());
  }

  focarSenha(event: Event): void {
    event.preventDefault();
    this.senhaInput?.nativeElement.focus();
  }

  entrar(event?: Event): void {
    event?.preventDefault();
    if (this.carregando) return;

    const codigo = this.codigo.trim();
    const senha = this.senha;
    if (!codigo || !senha) {
      this.errorMessage = 'Informe operador e credencial.';
      return;
    }

    this.carregando = true;
    this.errorMessage = '';

    this.operatorSession
      .login(codigo, senha)
      .pipe(
        finalize(() => {
          this.senha = '';
          this.carregando = false;
        }),
      )
      .subscribe((autenticado) => {
        if (autenticado) {
          void this.router.navigateByUrl(this.returnUrl());
          return;
        }

        this.errorMessage = 'Operador ou credencial inválidos.';
      });
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/operador')) {
      return '/pdv';
    }

    return value;
  }
}
