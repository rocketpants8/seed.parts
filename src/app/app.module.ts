import { NgModule, Injector, ChangeDetectorRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './components/app/app.component';
import { HomeComponent } from './components/home/home.component';
import { CreateComponent } from './components/secret/create/create.component';
import { TypeaheadComponent } from './components/typeahead/typeahead.component';
import { DonateComponent } from './components/donate/donate.component';
import * as CreateSteps from './components/secret/create/steps';
import { NotificationComponent } from './components/notifications/notifications.component';
import { DecryptComponent } from './components/decrypt/decrypt.component';
import { SeedphraseComponent } from './components/secret/create/step1/seedphrase/seedphrase.component';
import { TextDataComponent } from './components/secret/create/step1/textData/textData.component';
import { PasswordComponent } from './components/password/password.component';
import { initIconLibrary } from './icons';
import { ServiceLocator } from './classes/serviceLocator';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DonateComponent,
    CreateComponent,
    TypeaheadComponent,
    CreateSteps.Step1,
    CreateSteps.Step2,
    CreateSteps.Step3,
    CreateSteps.Step4,
    SeedphraseComponent,
    TextDataComponent,
    PasswordComponent,
    NotificationComponent,
    DecryptComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  providers: [{"provide": ChangeDetectorRef, "useValue": ChangeDetectorRef}],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector, library: FaIconLibrary) {
    ServiceLocator.injector = injector;
    initIconLibrary(library);
  }
}
