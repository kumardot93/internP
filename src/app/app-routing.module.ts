import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BankSearchComponent } from './bank-search/bank-search.component';

const routes: Routes = [
  { path: '', component: BankSearchComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
