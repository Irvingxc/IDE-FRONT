import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcademicoComponent } from './academico.component';
import { FichaPrebasicaComponent } from './ficha-prebasica/ficha-prebasica.component';

const routes: Routes = [
  { path: '', component: AcademicoComponent },
  // Se abre en otra pestaña desde Notas al elegir una clase de prebásica
  { path: 'ficha-prebasica', component: FichaPrebasicaComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcademicoRoutingModule {}
