import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/guards/auth/auth.guard';
import { ModuloGuard } from '@app/guards/modulo/modulo.guard';

const routes: Routes = [
  {
    path: '',
    children: [
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
        path: 'catalogo',
        canLoad: [AuthGuard, ModuloGuard],
        data: { modulo: 'EMPLEADOS' },
        loadChildren: () => import('./pages/catalogo/catalogo.module').then(m => m.CatalogoModule)
      },
      {
        path: 'inmueble',
        canLoad: [AuthGuard],
        loadChildren: () => import('./pages/inmueble/inmueble.module').then(m => m.InmuebleModule)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'static/welcome'
      }
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
