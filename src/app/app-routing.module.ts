import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/guards/auth/auth.guard';
import { LandingGuard } from '@app/guards/landing/landing.guard';
import { ModuloGuard } from '@app/guards/modulo/modulo.guard';
import { ClienteGuard } from '@app/guards/cliente/cliente.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        canLoad: [LandingGuard],
        loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingModule)
      },
      {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule)
      },
      {
        path: 'seleccionar-sucursal',
        canLoad: [AuthGuard],
        loadChildren: () => import('./pages/seleccionar-sucursal/seleccionar-sucursal.module').then(m => m.SeleccionarSucursalModule)
      },
      {
        path: 'static',
        canLoad: [AuthGuard],
        loadChildren: () => import('./pages/static/static.module').then(m => m.StaticModule)
      },
      {
        path: 'matriculas',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'MATRICULAS' },
        loadChildren: () => import('./pages/matriculas/matriculas.module').then(m => m.MatriculasModule)
      },
      {
        path: 'facturacion',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'PAGOS' },
        loadChildren: () => import('./pages/facturacion/facturacion.module').then(m => m.FacturacionModule)
      },
      {
        path: 'empleados',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EMPLEADOS' },
        loadChildren: () => import('./pages/empleados/empleados.module').then(m => m.EmpleadosModule)
      },
      {
        path: 'whatsapp',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'WHATSAPP' },
        loadChildren: () => import('./pages/whatsapp/whatsapp.module').then(m => m.WhatsappModule)
      },
      {
        path: 'academico',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'ACADEMICO' },
        loadChildren: () => import('./pages/academico/academico.module').then(m => m.AcademicoModule)
      },
      {
        path: 'cxc',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'CXC' },
        loadChildren: () => import('./pages/cxc/cxc.module').then(m => m.CxcModule)
      },
      {
        path: 'bitacora',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'BITACORA' },
        loadChildren: () => import('./pages/bitacora/bitacora.module').then(m => m.BitacoraModule)
      },
      {
        path: 'camaras',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'CAMARAS' },
        loadChildren: () => import('./pages/camaras/camaras.module').then(m => m.CamarasModule)
      },
      {
        path: 'catalogo',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EMPLEADOS' },
        loadChildren: () => import('./pages/catalogo/catalogo.module').then(m => m.CatalogoModule)
      },
      {
        path: 'egresos',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EGRESOS' },
        loadChildren: () => import('./pages/egresos/egresos.module').then(m => m.EgresosModule)
      },
      {
        path: 'inventario',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'INVENTARIO' },
        loadChildren: () => import('./pages/inventario/inventario.module').then(m => m.InventarioModule)
      },
      {
        path: 'compras',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'ENTRADAS' },
        loadChildren: () => import('./pages/compras/compras.module').then(m => m.ComprasModule)
      },
      {
        path: 'proveedores',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EGRESOS' },
        loadChildren: () => import('./pages/proveedores/proveedores.module').then(m => m.ProveedoresModule)
      },
      {
        path: 'cierre-mes',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EGRESOS' },
        loadChildren: () => import('./pages/cierre-mes/cierre-mes.module').then(m => m.CierreMesModule)
      },
      {
        path: 'sar-config',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EMPLEADOS' },
        loadChildren: () => import('./pages/sar-config/sar-config.module').then(m => m.SarConfigModule)
      },
      {
        path: 'reportes',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'REPORTES' },
        loadChildren: () => import('./pages/reportes/reportes.module').then(m => m.ReportesModule)
      },
      {
        path: 'inmueble',
        canLoad: [AuthGuard],
        loadChildren: () => import('./pages/inmueble/inmueble.module').then(m => m.InmuebleModule)
      },
      {
        path: 'activar-cuenta/:token',
        loadChildren: () => import('./pages/activar-cuenta/activar-cuenta.module').then(m => m.ActivarCuentaModule)
      },
      {
        path: 'portal-cliente',
        canLoad: [ClienteGuard],
        loadChildren: () => import('./pages/portal-cliente/portal-cliente.module').then(m => m.PortalClienteModule)
      },
    ]
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'static/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
