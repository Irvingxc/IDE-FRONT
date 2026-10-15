import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DocumentoEntregado, FichaAlumno, GuardarFichaAlumnoDto } from '@app/services/alumno/alumno.service';

/**
 * Datos complementarios de la hoja de matrícula: parentesco, salud, escuela
 * anterior, uniforme, transporte y documentos entregados.
 * Se usa en "Editar estudiante" y en "Nueva matrícula".
 * Pensado para personal no técnico: opciones como botones grandes, sin listas
 * escondidas, y cada respuesta se puede quitar tocándola otra vez.
 */
@Component({
  selector: 'app-ficha-alumno',
  templateUrl: './ficha-alumno.component.html',
  styleUrls: ['./ficha-alumno.component.scss']
})
export class FichaAlumnoComponent {

  @Input() form!: FormGroup;
  /** Documentos del catálogo con su marca de entregado; null = aún cargando. */
  @Input() documentos: DocumentoEntregado[] | null = null;
  @Input() anioDocumentos: number | null = null;

  readonly parentescos   = ['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor legal', 'Otro'];
  readonly tiposSangre   = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  readonly tiposCentro   = ['Público', 'Privado', 'No aplica'];
  readonly tallasCamisa  = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL'];
  readonly tallasPantalon = this.tallasCamisa;   // mismas tallas que la camisa
  readonly siNo: { valor: boolean; texto: string }[] = [
    { valor: true,  texto: 'Sí' },
    { valor: false, texto: 'No' },
  ];

  static crearForm(fb: FormBuilder): FormGroup {
    return fb.group({
      parentesco:            [null],
      tipoSangre:            [null],
      alergias:              [''],
      condicionEspecial:     [''],
      vacunado:              [null],
      repitente:             [null],
      centroProcedencia:     [''],
      tipoCentroProcedencia: [null],
      tallaCamisa:           [null],
      tallaPantalon:         [null],
      requiereTransporte:    [null],
    });
  }

  static cargar(form: FormGroup, ficha: FichaAlumno): void {
    form.patchValue({
      parentesco:            ficha.parentesco,
      tipoSangre:            ficha.tipoSangre,
      alergias:              ficha.alergias          ?? '',
      condicionEspecial:     ficha.condicionEspecial ?? '',
      vacunado:              ficha.vacunado,
      repitente:             ficha.repitente,
      centroProcedencia:     ficha.centroProcedencia ?? '',
      tipoCentroProcedencia: ficha.tipoCentroProcedencia,
      tallaCamisa:           ficha.tallaCamisa,
      tallaPantalon:         ficha.tallaPantalon,
      requiereTransporte:    ficha.requiereTransporte,
    });
    form.markAsPristine();
  }

  /** Arma el DTO para guardar. Si no se pasan documentos, no se modifican. */
  static aDto(form: FormGroup, documentos: DocumentoEntregado[] | null, anio: number | null): GuardarFichaAlumnoDto {
    const f = form.value;
    const texto = (v: string | null) => (v ?? '').trim() || null;
    const mayus = (v: string | null) => texto(v)?.toUpperCase() ?? null;
    return {
      parentesco:            f.parentesco,
      tipoSangre:            f.tipoSangre,
      alergias:              texto(f.alergias),
      condicionEspecial:     texto(f.condicionEspecial),
      vacunado:              f.vacunado,
      repitente:             f.repitente,
      centroProcedencia:     mayus(f.centroProcedencia),
      tipoCentroProcedencia: f.tipoCentroProcedencia,
      tallaCamisa:           f.tallaCamisa,
      tallaPantalon:         f.tallaPantalon,
      requiereTransporte:    f.requiereTransporte,
      anio,
      documentosEntregados:  documentos ? documentos.filter(d => d.entregado).map(d => d.idDocumento) : undefined,
    };
  }

  /** Selecciona una opción; si ya estaba seleccionada, la quita. */
  elegir(control: string, valor: unknown): void {
    const c = this.form.get(control);
    if (!c) return;
    c.setValue(c.value === valor ? null : valor);
    c.markAsDirty();
  }

  esta(control: string, valor: unknown): boolean {
    return this.form.get(control)?.value === valor;
  }

  alternarDocumento(d: DocumentoEntregado): void {
    d.entregado = !d.entregado;
    if (!d.entregado) d.fechaEntrega = null;
  }

  get entregados(): number {
    return this.documentos?.filter(d => d.entregado).length ?? 0;
  }

  marcarTodos(): void {
    this.documentos?.forEach(d => d.entregado = true);
  }

  iconoDocumento(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('partida'))    return 'child_care';
    if (n.includes('vacuna'))     return 'vaccines';
    if (n.includes('estudio'))    return 'school';
    if (n.includes('conducta'))   return 'verified';
    if (n.includes('solvencia'))  return 'receipt_long';
    if (n.includes('fotograf'))   return 'photo_camera';
    return 'description';
  }
}
