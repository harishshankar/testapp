import { Component, OnInit, ChangeDetectorRef, Directive, NgZone } from '@angular/core';
import { OpenURLOptions, AppLauncher } from '@capacitor/app-launcher';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { SendIntent } from 'send-intent';
import { FileServiceService } from './file-service.service';
import { App, URLOpenListenerEvent } from '@capacitor/app';

import { Platform, AlertController } from '@ionic/angular';
import {
  InAppPurchase2,
  IAPProduct,
} from '@ionic-native/in-app-purchase-2/ngx';

import 'cordova-plugin-purchase/www/store.d';
import { Router } from '@angular/router';

const PRODUCT_GEMS_KEY = 'devgems100';
const PRODUCT_PRO_KEY = 'devpro';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isVisible: boolean = false;
  imageUrl: string = '';
  appName: string = '';

  items: any[] = [];
  folderStructure: any[] = [];

  gems = 0;
  isPro = false;
  products: IAPProduct[] = [];

  addOns: any;

  constructor(
    private fileService: FileServiceService,
    private plt: Platform,
    private store: InAppPurchase2,
    private alertController: AlertController,
    private ref: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone
  ) {
    this.plt.ready().then(() => {
      // Only for debugging!
      this.store.verbosity = this.store.DEBUG;

      this.registerProducts();
      this.setupListeners();

      // Get the real product information
      this.store.ready(() => {
        this.products = this.store.products;
        this.ref.detectChanges();
      });
    });
  }

  initializeApp() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.zone.run(() => {
            // Example url: https://beerswift.app/tabs/tab2
            // slug = /tabs/tab2
            const slug = event.url.split(".app").pop();
            if (slug) {
                this.router.navigateByUrl(slug);
            }
            // If no match, do nothing - let regular routing
            // logic take over
        });
    });
}

  registerProducts() {
    this.store.register({
      id: PRODUCT_GEMS_KEY,
      type: this.store.CONSUMABLE,
    });

    this.store.register({
      id: PRODUCT_PRO_KEY,
      type: this.store.NON_CONSUMABLE,
    });

    this.store.refresh();
  }

  setupListeners() {
    // General query to all products
    this.store
      .when('product')
      .approved((p: IAPProduct) => {
        // Handle the product deliverable
        if (p.id === PRODUCT_PRO_KEY) {
          this.isPro = true;
        } else if (p.id === PRODUCT_GEMS_KEY) {
          this.gems += 100;
        }
        this.ref.detectChanges();

        return p.verify();
      })
      .verified((p: IAPProduct) => p.finish());

    // Specific query for one ID
    this.store.when(PRODUCT_PRO_KEY).owned((p: IAPProduct) => {
      this.isPro = true;
    });
  }

  purchase(product: IAPProduct) {
    this.store.order(product).then(
      (p: any) => {
        // Purchase in progress!
      },
      (e: any) => {
        this.presentAlert('Failed', `Failed to purchase: ${e}`);
      }
    );
  }

  // To comply with AppStore rules
  restore() {
    this.store.refresh();
  }

  async presentAlert(header: any, message: any) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  ngOnInit(): void {
    // this.fileService.doEverything()
    this.checkReady(); // check if plugins are loaded already

    this.handleData();
    this.getFiles();

    //   window.addEventListener("sendIntentReceived", () => {
    //     this.handleData();
    // });

    // this.handleData();
    console.log(
      'link = ',
      this.containsURL('https://en.wikipedia.org/wiki/Main_Page')
    );
    console.log(
      'file = ',
      this.containsURL(
        'file:///data/user/0/com.barytech.eino/files/IMG_20230821_191807.jpg'
      )
    );
  }

  checkReady() {
    if (!window.CdvPurchase) {
      setTimeout(this.checkReady, 100); // not loaded yet, check again in 100ms
      console.log('not ready');
    } else {
      this.onDeviceReady(); // plugin is available, call a "deviceReady()" function that you define.
      console.log('ready');
    }
  }

  onDeviceReady() {
    console.log('device ready called ');
    const store = CdvPurchase.store;
    console.log(`platform ready ${store}`);

    const ProductType = CdvPurchase.ProductType;
    const Platform = CdvPurchase.Platform;
    store.register([
      {
        id: 'android_whitelabeling_monthly',
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
    ]);

    store
      .when()
      .approved((transaction) => transaction.verify())
      .verified((receipt) => receipt.finish())
      .finished((transaction) =>
        console.log(
          'Products owned: ' + transaction.products.map((p) => p.id).join(',')
        )
      )
      .receiptUpdated((r) => updatePurchases(r))
      .productUpdated((p) => updateUI(p));

    const updatePurchases = (receipt: CdvPurchase.Receipt) => {
      receipt.transactions.forEach((transaction) => {
        transaction.products.forEach((trProduct) => {
          console.log(`product owned: ${trProduct.id}`);
        });
      });
    };

    const updateUI = (product: CdvPurchase.Product) => {
      console.log(`- title: ${product.title}`);
      const pricing = product.pricing;
      if (pricing) {
        console.log(`  price: ${pricing.price} ${pricing.currency}`);
      }
    };

    this.addOns = store.get(
      'android_whitelabeling_monthly',
      Platform.GOOGLE_PLAY
    );
    console.log('addons  = ', this.addOns);
  }

  getFiles() {
    this.fileService.view().subscribe((data: any) => {
      console.log('data = ', data);
      this.items = data;
    });
    setTimeout(() => {
      this.organizeDataIntoFolders();
    }, 3000);
  }

  organizeDataIntoFolders() {
    console.log('folder started ', this.items);

    this.items.forEach((item) => {
      const pathSegments = item.path.split('/');
      let currentFolder = this.folderStructure;

      pathSegments.forEach((segment: any) => {
        let folder = currentFolder.find((f) => f.name === segment);
        if (!segment.includes('.')) {
          if (!folder) {
            folder = { name: segment, children: [] };
            currentFolder.push(folder);
          }
          currentFolder = folder.children;
        }
      });

      currentFolder.push(item);
    });

    console.log('folder = ', this.folderStructure);
  }
  title = 'test';

  handleData() {
    SendIntent.checkSendIntentReceived()
      .then((result: any) => {
        console.log('working');
        if (result) {
          this.isVisible = true;
          console.log('SendIntent received');
          console.log(JSON.stringify(result));
        }
        if (result.url) {
          let resultUrl = decodeURIComponent(result.url);
          const filePath = resultUrl.replace('file://', '');

          const chunkData = this.fileService.checkFileSize(filePath, result);

          console.log('data fin========================', chunkData);
        }
      })
      .catch((err: any) => console.error(err));
  }

  containsURL(inputString: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(inputString);
  }

  onFolderSelected(event: any) {
    const files = event.target.files;
    console.log('files = ', files, JSON.stringify(files));
    for (let i of files) {
      console.log(i.name, i.webkitRelativePath);
      const formData = new FormData();
      formData.append('title', i.name);
      formData.append('path', i.webkitRelativePath);
      formData.append('document', i);

      console.log('form data = ', formData);
      this.fileService.create(formData).subscribe(
        (res: any) => {
          console.log('Upload successful:', res);
        },
        (error) => {
          console.error('Upload failed:', error);
        }
      );
    }
  }

  fileUpload(event: any) {
    const files = event.target.files;
    console.log('filec=c=', files);

    for (let i of files) {
      console.log(i.name, i.webkitRelativePath);
      const formData = new FormData();
      formData.append('title', i.name);
      formData.append('path', i.webkitRelativePath);
      formData.append('document', i);

      console.log('form data = ', formData);
      this.fileService.create(formData).subscribe(
        (res: any) => {
          console.log('Upload successful:', res);
        },
        (error) => {
          console.error('Upload failed:', error);
        }
      );
    }
  }

  checkCanOpenUrl = async () => {
    const { value } = await AppLauncher.canOpenUrl({ url: this.appName });
    console.log('Can open url: ', value);
  };

  launchApp() {
    var option: OpenURLOptions = {
      url: this.appName,
    };
    console.log('app name = ', this.appName);

    AppLauncher.openUrl(option);
  }

  async youtube() {
    const { value } = await AppLauncher.canOpenUrl({
      url: 'com.google.android.youtube',
    });
    if (value) {
      console.log('app value = ', value);

      await AppLauncher.openUrl({
        url: 'https://www.youtube.com/watch?v=videoId',
      });
    }
  }
}
