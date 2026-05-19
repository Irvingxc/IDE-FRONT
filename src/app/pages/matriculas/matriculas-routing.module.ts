import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatriculasComponent } from './matriculas.component';
import { NuevaMatriculaComponent } from './nueva-matricula/nueva-matricula.component';

const routes: Routes = [
  { path: '',       component: MatriculasComponent },
  { path: 'nueva',  component: NuevaMatriculaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MatriculasRoutingModule { }
