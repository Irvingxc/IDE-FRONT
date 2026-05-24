import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CxcComponent } from './cxc.component';

const routes: Routes = [{ path: '', component: CxcComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CxcRoutingModule {}
