import { Component, Input } from '@angular/core';
import { TemplateAddComponent } from '../template-add/template-add/template-add.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent {
  @Input() mappedData: any[] = [];
  @Input() entityName: string = '';

  constructor(
    protected dialog: MatDialog
  ) {
  }

  toSentenceCase(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  openDialog(): void {
    this.dialog.open(TemplateAddComponent, {
      width: '800px',
      height: '100vh',
      position: {
        top: '0px',
        right: '0px',
      },
      panelClass: [
        'animate__animated',
        'animate__slideInRight',
        'no-border-wrapper',
      ],
      autoFocus: false,
      disableClose: true,
    });
  }
}
