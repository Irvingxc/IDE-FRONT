import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of, Subject, switchMap } from 'rxjs';
import { FacturacionService, Sar, CrearFacturaRequest, GradoPrecio } from '@app/services/facturacion/facturacion.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';
import { CxcService } from '@app/services/cxc/cxc.service';
import { toLocalDateStr, parseLocalDate } from '@app/utils/date.utils';

export interface ItemFacturaLocal {
  concepto:        string;
  mes:             string;
  idProducto:      string;
  precio:          number;
  cantidad:        number;
  fechaMensualidad: string | null;
  idCxc?:          number;
  descuento?:      number;
}

export interface NuevaFacturaDialogData {
  fromCxc:         boolean;
  alumnoIdentidad: string;
  alumnoNombre:    string;
  alumnoTutor:     string;
  gradoNombre:     string;
  items:           ItemFacturaLocal[];
  idsCxc:          number[];
}

@Component({
  selector: 'app-nueva-factura-dialog',
  templateUrl: './nueva-factura-dialog.component.html',
  styleUrls: ['./nueva-factura-dialog.component.scss']
})
export class NuevaFacturaDialogComponent implements OnInit {

  sar: Sar | null = null;
  cargandoSar = true;
  guardando   = false;

  // Campos del receptor
  fechaEmision = new Date();
  alumnoIdentidad = '';
  alumnoNombre    = '';
  alumnoTutor     = '';
  gradoNombre     = '';

  // Búsqueda de alumno (solo en modo directo)
  busquedaAlumno = '';
  alumnosSugeridos: AlumnoResponse[] = [];
  private busqueda$ = new Subject<string>();

  // Catálogo de productos del grado seleccionado
  idGradoAlumno: number | null = null;
  catalogoProductos: GradoPrecio[] = [];
  facturadosSet: Set<string> = new Set();
  mesesConCxc: Set<number> = new Set();
  cxcMontos: Map<number, number> = new Map();
  cxcProductoMontos: Map<number, number> = new Map();
  descuentoAlumno = 0;

  get productosSimples(): GradoPrecio[] {
    return this.catalogoProductos.filter(p => p.idProducto !== 2);
  }
  get precioMensualidadBase(): number {
    return this.catalogoProductos.find(p => p.idProducto === 2)?.precio ?? 0;
  }
  get precioMensualidad(): number {
    return this.precioMensualidadBase * (1 - this.descuentoAlumno / 100);
  }
  get tieneMensualidad(): boolean {
    return this.catalogoProductos.some(p => p.idProducto === 2);
  }

  readonly nombresMeses = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  items: ItemFacturaLocal[] = [];
  itemColumns = ['concepto', 'descuento', 'precio', 'cantidad', 'total', 'acciones'];

  constructor(
    public  dialogRef: MatDialogRef<NuevaFacturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NuevaFacturaDialogData,
    private facturacionService: FacturacionService,
    private alumnoService: AlumnoService,
    private cxcService: CxcService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.facturacionService.getSar().subscribe({
      next:  (s) => { this.sar = s; this.cargandoSar = false; },
      error: ()  => { this.cargandoSar = false; this.snack.open('No hay CAI vigente para esta sucursal', '', { duration: 4000 }); }
    });

    if (this.data.fromCxc) {
      this.alumnoIdentidad = this.data.alumnoIdentidad;
      this.alumnoNombre    = this.data.alumnoNombre;
      this.alumnoTutor     = this.data.alumnoTutor;
      this.gradoNombre     = this.data.gradoNombre;
      this.items           = [...this.data.items];
    } else {
      this.items = [{ concepto: '', mes: 'N/A', idProducto: 'N/A', precio: 0, cantidad: 1, fechaMensualidad: null }];
    }

    // Autocomplete para búsqueda de alumno en modo directo
    this.busqueda$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.alumnoService.getAlumnos(1, 8, term))
    ).subscribe(res => { this.alumnosSugeridos = res ?? []; });
  }

  onBusquedaChange(term: string): void {
    if (term.length > 1) this.busqueda$.next(term);
    else this.alumnosSugeridos = [];
  }

  seleccionarAlumno(alumno: AlumnoResponse): void {
    this.alumnoIdentidad  = alumno.identidad;
    this.alumnoNombre     = alumno.nombreCompleto;
    this.alumnoTutor      = alumno.nombreTutor ?? '';
    this.gradoNombre      = alumno.grado ?? '';
    this.idGradoAlumno    = alumno.idGrado;
    this.descuentoAlumno  = alumno.descuento ?? 0;
    this.busquedaAlumno   = alumno.nombreCompleto;
    this.alumnosSugeridos = [];
    this.items            = [];
    this.catalogoProductos  = [];
    this.facturadosSet      = new Set();
    this.mesesConCxc        = new Set();
    this.cxcMontos          = new Map();
    this.cxcProductoMontos  = new Map();

    const anio = this.fechaEmision.getFullYear();

    if (alumno.idGrado) {
      forkJoin({
        precios:    this.facturacionService.getGradoPrecios(alumno.idGrado),
        facturados: this.facturacionService.getProductosFacturados(alumno.identidad, anio).pipe(
          catchError(() => of([] as { idProducto: string; mes: string }[]))
        ),
        cxcPendientes: this.cxcService.getDetalle(alumno.identidad, anio, true).pipe(
          catchError(() => of([]))
        ),
      }).subscribe(({ precios, facturados, cxcPendientes }) => {
        this.catalogoProductos = precios;
        this.facturadosSet = new Set(
          facturados.map(f =>
            f.idProducto === '2' && f.mes && f.mes !== 'N/A'
              ? `2:${f.mes.toLowerCase()}`
              : f.idProducto
          )
        );
        const mensualidadesCxc = cxcPendientes.filter(c => c.idProducto === 2);
        this.mesesConCxc       = new Set(mensualidadesCxc.map(c => c.mes));
        this.cxcMontos         = new Map(mensualidadesCxc.map(c => [c.mes, c.monto]));
        this.descuentoAlumno   = mensualidadesCxc[0]?.descuento ?? alumno.descuento ?? 0;

        const productosCxc = cxcPendientes.filter(c => c.idProducto !== 2);
        this.cxcProductoMontos = new Map(productosCxc.map(c => [c.idProducto, c.monto]));
      });
    }
  }

  estaFacturado(idProducto: number, mesNombre?: string): boolean {
    if (idProducto === 2 && mesNombre) return this.facturadosSet.has(`2:${mesNombre.toLowerCase()}`);
    return this.facturadosSet.has(String(idProducto));
  }

  agregarProducto(producto: GradoPrecio): void {
    const yaEnLista = this.items.some(i => i.idProducto === String(producto.idProducto));
    if (yaEnLista) return;
    const anio  = this.fechaEmision.getFullYear();
    const cxcMonto  = this.cxcProductoMontos.get(producto.idProducto);
    this.items = [...this.items, {
      concepto:         producto.productoNombre,
      mes:              'N/A',
      idProducto:       String(producto.idProducto),
      precio:           cxcMonto ?? producto.precio,
      cantidad:         1,
      fechaMensualidad: `${anio}-01-01`,
      descuento:        0,
    }];
  }

  agregarMensualidad(mes: number): void {
    const mesNombre = this.nombresMeses[mes];
    const yaEnLista = this.items.some(i => i.idProducto === '2' && i.mes === mesNombre.toLowerCase());
    if (yaEnLista) return;
    const anio = this.fechaEmision.getFullYear();
    this.items = [...this.items, {
      concepto: `Mensualidad ${mesNombre}`, mes: mesNombre.toLowerCase(), idProducto: '2',
      precio: this.cxcMontos.get(mes) ?? this.precioMensualidad, cantidad: 1,
      fechaMensualidad: `${anio}-${String(mes).padStart(2, '0')}-01`,
      descuento: this.descuentoAlumno,
    }];
  }

  agregarItem(): void {
    this.items = [...this.items, { concepto: '', mes: 'N/A', idProducto: 'N/A', precio: 0, cantidad: 1, fechaMensualidad: null }];
  }

  eliminarItem(i: number): void {
    if (this.items.length > 1) this.items = this.items.filter((_, idx) => idx !== i);
  }

  totalItem(item: ItemFacturaLocal): number {
    return item.precio * item.cantidad;
  }

  get subtotal(): number {
    return this.items.reduce((s, i) => s + this.totalItem(i), 0);
  }

  get nextInvoiceNumber(): string {
    if (!this.sar) return '—';
    const seq    = this.sar.secuenciaSar;
    const prefix = seq.slice(0, seq.length - 8);
    const num    = parseInt(seq.slice(-8), 10) + 1;
    return prefix + String(num).padStart(8, '0');
  }

  get puedeGuardar(): boolean {
    return !!this.sar && !!this.alumnoIdentidad && this.items.length > 0
      && this.items.every(i => i.precio > 0);
  }

  guardar(): void {
    if (this.guardando || !this.puedeGuardar || !this.sar) return;
    this.guardando = true;

    const dto: CrearFacturaRequest = {
      alumno:          this.alumnoIdentidad,
      idSar:           this.sar.idSar,
      fechaEmision:    toLocalDateStr(this.fechaEmision),
      total:           this.subtotal,
      impuestoGravado: 0,
      items: this.items.map(i => ({
        precio:           i.precio,
        mes:              i.mes,
        idProducto:       i.idProducto,
        fechaMensualidad: i.fechaMensualidad,
        cantidad:         i.cantidad,
        descuento:        i.descuento ?? 0,
      })),
      idsCxc: this.data.idsCxc?.length ? this.data.idsCxc : undefined,
    };

    this.facturacionService.crearFactura(dto).subscribe({
      next: (creada) => {
        this.dialogRef.close(true);
        this.imprimirFactura(creada.noFactura, creada.idPago);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message ?? 'Error al guardar la factura';
        this.snack.open(msg, '', { duration: 5000 });
      }
    });
  }

  private imprimirFactura(_noFactura: string, idPago: number): void {
    this.facturacionService.getDetalle(idPago).subscribe(detalle => {
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(this.facturacionService.buildFacturaHtml(detalle));
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 500);
    });
  }

  private fmt(v: number): string {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get hoyStr(): string {
    return toLocalDateStr(new Date());
  }

  get sarFechaLimStr(): string {
    if (!this.sar?.fechaLim) return '—';
    return parseLocalDate(this.sar.fechaLim).toLocaleDateString('es-HN');
  }

  formatLps(v: number): string {
    return 'L. ' + this.fmt(v);
  }
}
