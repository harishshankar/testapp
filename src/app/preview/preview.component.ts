import { Component, Renderer2, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements AfterViewInit {
  @ViewChild('resizeHandle', { static: false }) resizeHandle: ElementRef = {} as ElementRef;
  @ViewChild('previewTab', { static: false }) previewTab: ElementRef = {} as ElementRef;

  isResizing = false;
  initialMouseX: any;
  initialWidth: any;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    fromEvent(this.resizeHandle.nativeElement, 'mousedown')
      .subscribe((e: any) => {
        this.isResizing = true;
        this.initialMouseX = e.clientX;
        this.initialWidth = parseFloat(getComputedStyle(this.previewTab.nativeElement).width);
      });

    fromEvent(document, 'mousemove')
      .pipe(takeUntil(fromEvent(document, 'mouseup')))
      .pipe(takeUntil(fromEvent(document, 'mouseleave')))
      .subscribe((e: any) => {
        if (!this.isResizing) return;
        const width = this.initialWidth - (e.clientX - this.initialMouseX);
        this.renderer.setStyle(this.previewTab.nativeElement, 'width', `${width}px`);
      });

    fromEvent(document, 'mouseup').subscribe(() => this.isResizing = false);
    fromEvent(document, 'mouseleave').subscribe(() => this.isResizing = false);
  }
}
