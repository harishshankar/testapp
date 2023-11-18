import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFolderViewComponent } from './app-folder-view.component';

describe('AppFolderViewComponent', () => {
  let component: AppFolderViewComponent;
  let fixture: ComponentFixture<AppFolderViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppFolderViewComponent]
    });
    fixture = TestBed.createComponent(AppFolderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
