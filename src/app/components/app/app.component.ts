import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  "selector": "app-root",
  "templateUrl": "./app.component.html",
  "styleUrl": "./app.component.scss"
})
export class AppComponent {

  private _menuActive: boolean = false;

  public get menuActive() {
    return this._menuActive;
  }

  public toggleMenu(isActive?: boolean) {
    this._menuActive = isActive !== undefined ? !!isActive : !this._menuActive;
  }

  public readonly title = 'Seed.Parts';
}
