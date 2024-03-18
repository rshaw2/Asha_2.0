import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { TemplateAddComponent } from '../template-add/template-add.component';
import { MatDialog } from '@angular/material/dialog';
import { EntityDataService } from 'src/app/angular-app-services/entity-data.service';
import { Subject, takeUntil } from 'rxjs';
import { SweetAlertService } from 'src/app/angular-app-services/sweet-alert.service';
import { _toSentenceCase } from 'src/app/library/utils';
import { Option } from '../dynamic-layout/layout-models';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entityName: string = '';
  @Input() form?: FormGroup;
  @Input() fieldOptions: { [key: string]: Option[]; } = {};
  @Input() filterFields: any[] = [];
  @Input() mappedData: any[] = [];
  @Input() selectedIndex: number | null = 0;
  @Output() refresh = new EventEmitter<void>();
  @Output() filter = new EventEmitter<any[]>();
  @Output() previewRecord = new EventEmitter<number>();

  searchText: string = '';
  sentenceCaseEntityName: string = '';
  showFilterPanel: boolean = false;
  filterData: any[] = [];

  private destroy = new Subject();

  constructor(
    private dialog: MatDialog,
    private entityDataService: EntityDataService,
    private sweetAlertService: SweetAlertService
  ) {
  }

  ngOnInit(): void {
    this.sentenceCaseEntityName = _toSentenceCase(this.entityName);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityName']) {
      this.sentenceCaseEntityName = _toSentenceCase(this.entityName);
    }
    setTimeout(() => {
      let selectedDiv = document.getElementById('div-' + this.selectedIndex) as HTMLElement;
      selectedDiv?.scrollIntoView();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  addRecord(): void {
    const dialog = this.dialog.open(TemplateAddComponent, {
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
      disableClose: true
    });
    dialog.componentInstance.entityName = this.entityName;
    dialog.componentInstance.id = '';
    dialog.componentInstance.saved
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: (status) => {
          dialog.close();
          if (status) {
            this.refresh.emit();
          }
        }
      });
  }

  clearAll(): void {
    this.form?.reset();
    this.filterData = [];
    this.onSearch();
  }

  clearSpecificFilter(key: string): void {
    this.form?.get(key)?.setValue(null);
    this.form?.get(key)?.updateValueAndValidity();
    this.filterData = this.filterData.filter(x => x.key !== key);
    this.onSearch();
  }

  async confirmDelete(id: string): Promise<void> {
    const confirmed = await this.sweetAlertService.showDeleteConfirmationDialog();

    if (confirmed) {
      this.deleteData(id);
    }
  }

  onSearch(): void {
    const filter = [];
    this.filterData = [];
    for (const [key, value] of Object.entries(this.form?.value)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        filter.push({ PropertyName: key, Operator: 'equals', Value: value });
        this.filterData.push({ key: key, value: value as string });
      }
    }
    this.selectedIndex = 0;
    this.filter.emit(filter);
    this.showFilterPanel = false;
  }

  previewSpecificRecord(index: number): void {
    this.selectedIndex = index;
    this.previewRecord.emit(index);
  }

  private deleteData(id: string): void {
    this.entityDataService.deleteRecordById(this.entityName, id)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: () => {
          this.sweetAlertService.showSuccess(_toSentenceCase(this.entityName) + ' has been deleted.');
          this.refresh.emit();
        }
      });
  }
}