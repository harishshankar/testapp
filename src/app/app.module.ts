import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppFolderViewComponent } from './app-folder-view/app-folder-view.component'
import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2/ngx';
import { PreviewComponent } from './preview/preview.component';


@NgModule({
  declarations: [			
    AppComponent,
    AppFolderViewComponent,
      PreviewComponent
   ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [InAppPurchase2],
  bootstrap: [AppComponent]
})
export class AppModule { }
