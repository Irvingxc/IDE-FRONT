import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { KardexService, KardexDto } from '@app/services/kardex/kardex.service';
import { InventarioService, InventarioDto } from '@app/services/inventario/inventario.service';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-kardex',
  templateUrl: './kardex.component.html',
  styleUrls: ['./kardex.component.scss']
})
export class KardexComponent implements OnInit {

  columns    = ['fecha', 'tipo', 'concepto', 'cantidad', 'valorUnitario', 'total', 'saldo'];
  dataSource = new MatTableDataSource<KardexDto>();
  cargando   = false;

  items:           InventarioDto[] = [];
  idInventario:    number | undefined;
  filtroTipo       = '';

  constructor(
    private kardexService: KardexService,
    private invService: InventarioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.invService.listar().subscribe(i => this.items = i ?? []);
    const id = this.route.snapshot.queryParamMap.get('item');
    if (id) this.idInventario = +id;
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.kardexService.listar(this.idInventario, this.filtroTipo || undefined).subscribe({
      next: (data) => { this.dataSource.data = (data ?? []).sort((a, b) => a.id - b.id); this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  get nombreItemSeleccionado(): string {
    if (!this.idInventario) return 'Todos los ítems';
    return this.items.find(i => i.id === this.idInventario)?.nombre ?? '';
  }

  tipoClass(tipo: string): string {
    return tipo === 'ENTRADA' ? 'chip-verde' : tipo === 'SALIDA' ? 'chip-rojo' : 'chip-amarillo';
  }

  formatLps(v: number): string { return this.kardexService.formatLps(v); }

  formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }
}
