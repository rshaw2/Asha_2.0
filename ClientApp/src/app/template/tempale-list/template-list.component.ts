import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TemplateAddComponent } from '../template-add/template-add.component';
import { MatDialog } from '@angular/material/dialog';
import { EntityDataService } from 'src/app/angular-app-services/entity-data.service';
import { Subject, takeUntil } from 'rxjs';
import { SweetAlertService } from 'src/app/angular-app-services/sweet-alert.service';
import { DEFAULT_PAGESIZE, _toSentenceCase } from 'src/app/library/utils';
import { Option } from '../dynamic-layout/layout-models';
import { FormGroup } from '@angular/forms';
import { IDataState } from './idata-state.interface';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entityName: string = '';
  @Input() fieldOptions: { [key: string]: Option[]; } = {};
  @Input() filterFields: any[] = [];
  @Input() form?: FormGroup;
  @Input() isLoadMore: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() mappedData: any[] = [];
  @Input() selectedIndex: number | null = 0;

  @Output() previewRecord = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<IDataState>();

  @ViewChild('scrollWrapper') scrollWrapper: any;

  public filterData: any[] = [];
  public searchTerm: string = '';
  public sentenceCaseEntityName: string = '';
  public showFilterPanel: boolean = false;

  private destroy = new Subject();
  private filter: any[] = [];
  private pageNumber: number = 1;
  private pageSize = DEFAULT_PAGESIZE;

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
      this.clearAll();
      this.sentenceCaseEntityName = _toSentenceCase(this.entityName);
    }
    setTimeout(() => {
      const inline: ScrollIntoViewOptions = { inline: 'center' };
      if (this.mappedData?.length > 0) {
        const newRecordIndex = (this.pageNumber - 1) * this.pageSize,
          scrollToIndex = this.mappedData.length - 1 > newRecordIndex ? newRecordIndex : this.mappedData.length - 1,
          selectedDiv = document.getElementById('div-' + (scrollToIndex)) as HTMLElement;
        selectedDiv?.scrollIntoView(inline);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
    this.destroy.next(true);
    this.destroy.complete();
  }

  public addRecord(): void {
    const dialog = this.dialog.open(TemplateAddComponent, {
      width: '50vw',
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
            this.pageNumber = 1;
            this.setRefreshData();
          }
        }
      });
  }

  public clearAll(): boolean {
    this.form?.reset();
    this.searchTerm = '';
    this.filterData = [];
    this.pageNumber = 1;
    return true;
  }

  public clearSpecificFilter(key: string): void {
    this.form?.get(key)?.setValue(null);
    this.form?.get(key)?.updateValueAndValidity();
    this.filterData = this.filterData.filter(x => x.key !== key);
    this.onSearch();
  }

  public async confirmDelete(id: string): Promise<void> {
    const confirmed = await this.sweetAlertService.showDeleteConfirmationDialog();

    if (confirmed) {
      this.deleteData(id);
    }
  }

  public editRecordById(id: string): void {
    const dialog = this.dialog.open(TemplateAddComponent, {
      width: '50vw',
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
    dialog.componentInstance.id = id;
    dialog.componentInstance.saved
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: (status) => {
          dialog.close();
          if (status) {
            this.form?.reset();
            this.filterData = [];
            this.pageNumber = 1;
            this.setRefreshData();
          }
        }
      });
  }

  public onEnterPressed(): void {
    this.pageNumber = 1;
    this.searchTerm;
    this.setRefreshData();
  }

  public onLoadButtonClick(): void {
    this.pageNumber += 1;
    this.setRefreshData();
  }

  public onSearch(): void {
    this.filter = [];

    this.filterData = [];
    for (const [key, value] of Object.entries(this.form?.value)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        this.filter.push({ PropertyName: key, Operator: 'equals', Value: value });
        this.filterData.push({ key: key, value: value as string });
      }
    }
    this.selectedIndex = 0;
    this.pageNumber = 1;
    this.setRefreshData();
    this.showFilterPanel = false;
  }

  public onScroll(): void {
    const { scrollTop, scrollHeight, clientHeight } = this.scrollWrapper.nativeElement,
      result = scrollHeight - scrollTop - clientHeight;
    if ((result < 1 && result >= 0) && scrollTop > 0 && this.isLoadMore) {
      this.pageNumber += 1;
      this.setRefreshData();
    }
  }

  public previewSpecificRecord(index: number): void {
    this.selectedIndex = index;
    this.previewRecord.emit(index);
  }

  private deleteData(id: string): void {
    this.entityDataService.deleteRecordById(this.entityName, id)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: () => {
          this.pageNumber = 1;
          this.setRefreshData();
          this.sweetAlertService.showSuccess(_toSentenceCase(this.entityName) + ' has been deleted.');
        }
      });
  }

  private setRefreshData(): void {
    const refreshData = {
      pageNumber: this.pageNumber,
      searchTerm: this.searchTerm,
      filter: this.filter
    };

    this.refresh.emit(refreshData);
  }
}