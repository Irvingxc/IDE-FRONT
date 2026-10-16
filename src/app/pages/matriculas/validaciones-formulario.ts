import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PAISES_TELEFONO } from './telefono-mask.directive';

/**
 * Validaciones de los formularios de padre (Clientes) y estudiante (Alumnos),
 * alineadas con los límites de la base de datos para que un dato largo o mal
 * escrito se corrija en pantalla y no termine en un error al guardar.
 */
export const LIMITES = {
  /** Clientes/Alumnos.Nombres y .Apellidos: el SP guarda "primero + ' ' + segundo". */
  nombresJuntos:   500,
  lugarNacimiento: 100,
  direccion:       250,
  correo:          150,
  /** Alumnos.Telefono y el parámetro @Telefono de los SPs. */
  telefono:        20,
  motivoDescuento: 150,
  ocupacion:       100,
};

const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
const PATRON_NOMBRE   = new RegExp(`^[${LETRAS}][${LETRAS}' .-]*$`);
const PATRON_CORREO   = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const PATRON_DNI      = /^\d{4}-\d{4}-\d{5}$/;
const PATRON_PASAPORTE = /^[A-Z0-9]{5,15}$/;
export const TIPO_DNI = 'DNI / Identidad';

/** Valor del control como texto sin espacios a los lados. */
export const texto = (v: unknown): string => String(v ?? '').trim();

/** Solo letras, espacios, apóstrofo, punto y guion (vacío = válido; para obligatorio use required). */
export const nombreValidator: ValidatorFn = c =>
  !texto(c.value) || PATRON_NOMBRE.test(texto(c.value)) ? null : { nombre: true };

/**
 * El SP une primer y segundo nombre (o apellido) en una columna de 500 (SQL 038): se valida la suma.
 * Va en los dos controles del par, cada uno apuntando al otro (ver vincular()).
 */
export function juntoCon(otro: string, max = LIMITES.nombresJuntos): ValidatorFn {
  return c => {
    const a = texto(c.value);
    const b = texto(c.parent?.get(otro)?.value);
    const largo = [a, b].filter(Boolean).join(' ').length;
    return a && largo > max ? { nombresLargo: { max, actual: largo } } : null;
  };
}

/** Correo con dominio completo (Validators.email acepta "a@b" sin punto). */
export const correoValidator: ValidatorFn = c =>
  !texto(c.value) || PATRON_CORREO.test(texto(c.value)) ? null : { correo: true };

/** Identidad según el tipo elegido en el control hermano `tipoIdentificacion`. */
export function identidadValidator(tipoControl = 'tipoIdentificacion'): ValidatorFn {
  return c => {
    const v = texto(c.value);
    if (!v) return null;
    const tipo = c.parent?.get(tipoControl)?.value;
    if (tipo === TIPO_DNI)    return PATRON_DNI.test(v)       ? null : { dni: true };
    if (tipo === 'Pasaporte') return PATRON_PASAPORTE.test(v) ? null : { pasaporte: true };
    return v.length <= 15 ? null : { maxlength: { requiredLength: 15 } };
  };
}

/** Teléfono con máscara: debe tener todos los dígitos del formato del país elegido. */
export function telefonoCompletoValidator(paisControl = 'paisTelefono'): ValidatorFn {
  return c => {
    const digitos = texto(c.value).replace(/\D/g, '').length;
    if (!digitos) return null;
    const codigo = c.parent?.get(paisControl)?.value ?? '+504';
    const pais = PAISES_TELEFONO.find(p => p.codigo === codigo) ?? PAISES_TELEFONO[0];
    const esperados = (pais.formato.match(/9/g) ?? []).length;
    return digitos === esperados ? null : { telefono: { esperados } };
  };
}

/** Teléfono escrito a mano (estudiante): solo dígitos, espacios, +, -, ( ), mínimo 8 dígitos. */
export const telefonoLibreValidator: ValidatorFn = c => {
  const v = texto(c.value);
  if (!v) return null;
  return /^[0-9+()\- ]+$/.test(v) && v.replace(/\D/g, '').length >= 8 ? null : { telefonoLibre: true };
};

/** Fecha de nacimiento: no futura y con una edad razonable. */
export function fechaNacimientoValidator(edadMaxima: number): ValidatorFn {
  return c => {
    if (!c.value) return null;
    const f = new Date(c.value);
    if (isNaN(f.getTime())) return { fecha: true };
    const hoy = new Date();
    if (f > hoy) return { fechaFutura: true };
    if (hoy.getFullYear() - f.getFullYear() > edadMaxima) return { fechaAntigua: { edadMaxima } };
    return null;
  };
}

/** El año de la fecha debe estar entre `desde` y `hasta` (inclusive). */
export function anioEntreValidator(desde: number, hasta: number): ValidatorFn {
  return c => {
    if (!c.value) return null;
    const f = new Date(c.value);
    if (isNaN(f.getTime())) return { fecha: true };
    const anio = f.getFullYear();
    return anio >= desde && anio <= hasta ? null : { anioFuera: { desde, hasta } };
  };
}

/** Obligatorio cuando el control hermano `descuentoControl` es mayor que 0. */
export function motivoDescuentoValidator(descuentoControl = 'descuento'): ValidatorFn {
  return c => Number(c.parent?.get(descuentoControl)?.value) > 0 && !texto(c.value)
    ? { motivoRequerido: true } : null;
}

/**
 * En pantallas de edición: no bloquea el guardado por datos viejos con otro formato
 * (identidades sin guiones, teléfonos "    -    "...). Solo valida si el usuario cambió el valor.
 */
export function siCambia(original: unknown, validador: ValidatorFn): ValidatorFn {
  const inicial = texto(original);
  return c => texto(c.value) === inicial ? null : validador(c);
}

/** Revalida `destino` cada vez que cambia `origen` (validadores que miran al control hermano). */
export function vincular(form: FormGroup, origen: string, ...destinos: string[]): void {
  form.get(origen)?.valueChanges.subscribe(() => {
    for (const d of destinos) {
      const ctrl = form.get(d);
      ctrl?.updateValueAndValidity({ emitEvent: false });
      if (ctrl?.invalid) ctrl.markAsTouched();
    }
  });
}

/** Texto para <mat-error> según el primer error del control. */
export function mensajeError(c: AbstractControl | null): string {
  const e: ValidationErrors | null | undefined = c?.errors;
  if (!e) return '';
  if (e['required'])        return 'Requerido';
  if (e['nombre'])          return 'Solo letras (sin números ni símbolos)';
  if (e['nombresLargo'])    return `Junto con el otro campo pasa de ${e['nombresLargo'].max} letras (lleva ${e['nombresLargo'].actual})`;
  if (e['maxlength'])       return `Máximo ${e['maxlength'].requiredLength} caracteres`;
  if (e['dni'])             return 'DNI incompleto: deben ser 13 dígitos (0000-0000-00000)';
  if (e['pasaporte'])       return 'Pasaporte: de 5 a 15 letras o números';
  if (e['identidadDuplicada']) return 'Ya existe un estudiante con esta identidad';
  if (e['correo'] || e['email']) return 'Correo inválido (ejemplo: nombre@gmail.com)';
  if (e['telefono'])        return `Teléfono incompleto: deben ser ${e['telefono'].esperados} dígitos`;
  if (e['telefonoLibre'])   return 'Teléfono inválido: al menos 8 dígitos, sin letras';
  if (e['pattern'])         return 'Formato inválido';
  if (e['fechaFutura'])     return 'No puede ser una fecha futura';
  if (e['fechaAntigua'])    return `Revise el año: más de ${e['fechaAntigua'].edadMaxima} años de edad`;
  if (e['anioFuera'])       return `El año debe ser ${e['anioFuera'].desde} o ${e['anioFuera'].hasta}`;
  if (e['fecha'] || e['matDatepickerParse']) return 'Fecha inválida (use el calendario)';
  if (e['min'])             return `Mínimo ${e['min'].min}`;
  if (e['max'])             return `Máximo ${e['max'].max}`;
  if (e['motivoRequerido']) return 'Indique el motivo del descuento';
  return 'Dato inválido';
}

/** Mensaje del backend (validaciones de negocio y errores de datos de SQL) o el genérico. */
export function mensajeApi(err: any, generico: string): string {
  if (!err?.status || err.status >= 500) return generico;   // 500: el backend no da detalle en producción
  const e = err?.error?.errores;
  if (typeof e === 'string' && e.trim()) return e;
  return e?.mensaje ?? err?.error?.mensaje ?? generico;
}
