import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { EZUIKitPlayer } from 'ezuikit-js';
import { forkJoin } from 'rxjs';
import { CamarasService, CamaraDto } from '@app/services/camaras/camaras.service';

const EZVIZ_DOMAIN = 'https://iusopen.ezvizlife.com';

@Component({
  selector: 'app-camaras',
  templateUrl: './camaras.component.html',
  styleUrls: ['./camaras.component.scss']
})
export class CamarasComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren('videoContainer') contenedores!: QueryList<ElementRef<HTMLDivElement>>;

  camaras: CamaraDto[] = [];
  cargando = true;
  error: string | null = null;

  private players: any[] = [];
  private accessToken = '';

  constructor(private camarasService: CamarasService) {}

  ngOnInit(): void {
    forkJoin({
      camaras: this.camarasService.listarDispositivos(),
      token: this.camarasService.obtenerToken(),
    }).subscribe({
      next: ({ camaras, token }) => {
        this.camaras = camaras;
        this.accessToken = token.accessToken;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo conectar con el servicio de cámaras. Verifica que las credenciales de EZVIZ ya estén configuradas en el servidor.';
        this.cargando = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.contenedores.changes.subscribe(() => this.iniciarPlayers());
  }

  private iniciarPlayers(): void {
    if (!this.accessToken || this.players.length) return;

    this.contenedores.forEach((ref, i) => {
      const camara = this.camaras[i];
      if (!camara) return;

      const player = new EZUIKitPlayer({
        id: ref.nativeElement.id,
        accessToken: this.accessToken,
        url: `ezopen://open.ys7.com/${camara.deviceSerial}/1.live`,
        width: ref.nativeElement.clientWidth || 480,
        height: 320,
        env: { domain: EZVIZ_DOMAIN },
      });
      this.players.push(player);
    });
  }

  ngOnDestroy(): void {
    this.players.forEach(p => {
      try { p.stop?.(); } catch { /* noop */ }
    });
  }
}
