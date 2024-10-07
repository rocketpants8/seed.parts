import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreateComponent } from './components/secret/create/create.component';
import { DonateComponent } from './components/donate/donate.component';
import { DecryptComponent } from './components/decrypt/decrypt.component';

const routes: Routes = [
  { "path": "", "component": HomeComponent },
  { "path": "create", "component": CreateComponent },
  { "path": "decrypt", "component": DecryptComponent },
  { "path": "about", "component": DonateComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
