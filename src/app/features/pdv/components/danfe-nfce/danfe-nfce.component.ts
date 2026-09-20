import { Component, Input } from '@angular/core';

import { DanfeNfce } from '../../../../core/models/danfe-nfce.models';

@Component({
  selector: 'app-danfe-nfce',
  standalone: true,
  templateUrl: './danfe-nfce.component.html',
  styleUrl: './danfe-nfce.component.scss',
})
export class DanfeNfceComponent {
  @Input({ required: true }) danfe!: DanfeNfce;

  textoNfce(): string {
    const numero = this.danfe.documento.numero === null ? '-' : String(this.danfe.documento.numero);
    const serie = this.danfe.documento.serie === null ? '-' : String(this.danfe.documento.serie);
    return `NFC-e n. ${numero} serie ${serie}`;
  }
}
