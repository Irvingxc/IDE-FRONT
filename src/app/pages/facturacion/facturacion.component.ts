import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ItemFactura {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  exento: boolean;
}

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss']
})
export class FacturacionComponent implements OnInit {

  form!: FormGroup;

  // Datos del emisor (normalmente vendrían de configuración/backend)
  emisor = {
    nombre: 'Instituto Educativo EduGestión HN',
    rtn: '0801-1990-00123',
    direccion: 'Col. Kennedy, Tegucigalpa, Francisco Morazán',
    telefono: '2234-5678',
    cai: 'A1B2C3-D4E5F6-G7H8I9-J0K1L2-M3N4O5-P6',
    rangoDesde: '001-001-01-00000001',
    rangoHasta: '001-001-01-00000200',
    fechaLimiteEmision: '31/12/2026',
    numeroFactura: '001-001-01-00000001',
  };

  ISV_RATE = 0.15;

  items: ItemFactura[] = [
    { concepto: '', cantidad: 1, precioUnitario: 0, exento: true }
  ];

  itemsColumns = ['concepto', 'cantidad', 'precio', 'exento', 'total', 'acciones'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombreCliente: ['', Validators.required],
      rtnCliente: [''],
      fechaEmision: [new Date(), Validators.required],
    });
  }

  addItem(): void {
    this.items = [...this.items, { concepto: '', cantidad: 1, precioUnitario: 0, exento: true }];
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items = this.items.filter((_, i) => i !== index);
    }
  }

  totalItem(item: ItemFactura): number {
    return item.cantidad * item.precioUnitario;
  }

  get subtotalExento(): number {
    return this.items
      .filter(i => i.exento)
      .reduce((sum, i) => sum + this.totalItem(i), 0);
  }

  get subtotalGravado(): number {
    return this.items
      .filter(i => !i.exento)
      .reduce((sum, i) => sum + this.totalItem(i), 0);
  }

  get isv(): number {
    return this.subtotalGravado * this.ISV_RATE;
  }

  get totalPagar(): number {
    return this.subtotalExento + this.subtotalGravado + this.isv;
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log({ emisor: this.emisor, cliente: this.form.value, items: this.items });
    // TODO: llamar endpoint del backend
  }

  onLimpiar(): void {
    this.form.reset({ fechaEmision: new Date() });
    this.items = [{ concepto: '', cantidad: 1, precioUnitario: 0, exento: true }];
  }
}
