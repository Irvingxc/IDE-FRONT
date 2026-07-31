import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcademicoComponent } from './academico.component';

const routes: Routes = [
  { path: '', component: AcademicoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcademicoRoutingModule {}
