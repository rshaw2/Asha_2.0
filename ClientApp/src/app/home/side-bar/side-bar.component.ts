import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { MenuService } from 'src/app/angular-app-services/menu.service';
import { LogoutComponent } from 'src/app/logout/logout.component';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit, OnDestroy {
  isSidebarToggled = true;
  menuData: any;

  private destroy = new Subject();

  constructor(
    private menuService: MenuService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.menuService.getMenu()
      .pipe(takeUntil(this.destroy))
      .subscribe(data => {
        this.menuData = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  showSubMenu(event: MouseEvent): void {
    const targetAttr = (event.target as HTMLElement);
    const subMenuItem = (targetAttr.querySelector('.sub-nav-link') as HTMLElement);

    if (subMenuItem) {
      subMenuItem.style.top = targetAttr.getBoundingClientRect().top + 'px';
      subMenuItem.style.left = targetAttr.getBoundingClientRect().width - 2 + 'px';
    }
  }

  openLogoutDialog(event: any) {
    // active state for logout btn
    //this.isLogoutDialogOpen = true;

    let targetAttr = event.target.getBoundingClientRect();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = {
      left: targetAttr.x + targetAttr.width + 15 + "px",
      bottom: '15px'
    };

    const dialogRef = this.dialog.open(LogoutComponent, {
      width: '250px',
      panelClass: 'logout-dialog-wrapper',
      position: dialogConfig.position,
      autoFocus: false,
      backdropClass: 'no-back-drop',
    });

    // active state for logout btn
    //dialogRef.afterClosed().subscribe(() => this.isLogoutDialogOpen = false);
  }

}
