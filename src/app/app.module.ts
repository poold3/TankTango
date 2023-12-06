import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';

import { AppComponent } from './app.component';
import { MenuComponent } from './components/menu/menu.component';
import { LoadingComponent } from './components/loading/loading.component';
import { WaitingroomComponent } from './components/waitingroom/waitingroom.component';
import { GameroomComponent } from './components/gameroom/gameroom.component';
import { TankselectionComponent } from './components/tankselection/tankselection.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    LoadingComponent,
    WaitingroomComponent,
    GameroomComponent,
    TankselectionComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ClipboardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
