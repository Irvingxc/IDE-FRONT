import { Component, Input } from '@angular/core';

/** Franja de bienvenida con el arte "La casa de nuestras Panteras"; al hacer clic muestra el póster completo. */
@Component({
  selector: 'app-franja-panteras',
  templateUrl: './franja-panteras.component.html',
  styleUrls: ['./franja-panteras.component.scss']
})
export class FranjaPanterasComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';

  posterAbierto = false;
}
