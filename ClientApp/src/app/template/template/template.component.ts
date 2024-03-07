import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { EntityDataService } from 'src/app/angular-app-services/entity-data.service';
import { LayoutService } from 'src/app/angular-app-services/layout.service';
import { _camelCase } from 'src/app/library/utils';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent implements OnInit {
  entityName: string = '';
  mappedData: any[] = [];

  private layoutType: string = 'List';
  private records: any[] = [];
  private layout: any;
  private destroy$ = new Subject();

  constructor(
    private route: ActivatedRoute,
    private entityDataService: EntityDataService,
    private layoutService: LayoutService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.entityName = params['entityName'];
      console.log('Entity Name:', this.entityName);
      this.getList();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private getFormattedData(record: any, fieldInfo: any): any {
    if (!fieldInfo?.dataType || !fieldInfo?.fieldName || !record) return '';
    const fieldName = _camelCase(fieldInfo.fieldName),
      data = record[fieldName] || '';
    switch (fieldInfo.dataType.toLowerCase()) {
      case 'datetime':
        const date = Date.parse(data + 'Z');
        return isNaN(date) ? data : new Date(data + 'Z').toLocaleString();
      case 'numeric':
        return new Intl.NumberFormat().format(Number(data));
      case 'guid':
        const refPropertyName = fieldName.replace('Id', ''),
          refObject = record[refPropertyName];
        return refObject?.name || data;
      default:
        return data;
    }
  }

  private getList(): void {
    const apis = [
      this.layoutService.getLayout(this.entityName, this.layoutType),
      this.entityDataService.getData(this.entityName)
    ];
    forkJoin(apis)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([layout, records]) => {
          this.layout = layout;
          this.records = records;

          this.prepareMappedData();

          console.log('Layout Data:', this.layout);
          console.log('Entity Data:', this.records);
        }
      });
  }

  private prepareMappedData(): void {
    if (this.records?.length > 0 && this.layout) {
      this.mappedData = this.records.map((record) => {
        const titles = this.layout.cardTitle?.fields?.map(
          (title: any) => {
            return {
              label: title.label,
              value: this.getFormattedData(record, title)
            };
          }) || [],
          details = this.layout.cardDetail?.fields?.map(
            (detail: any) => {
              return {
                label: detail.label,
                value: this.getFormattedData(record, detail)
              };
            }) || [],
          status = this.layout.cardStatus?.fields?.map(
            (status: any) => {
              return {
                label: status.label,
                value: this.getFormattedData(record, status)
              };
            }) || [];
        return {
          cardTitle: titles ? { fields: titles } : null,
          cardDetail: details ? { fields: details } : null,
          cardStatus: status ? { fields: status } : null
        };
      });
    }
    else
      this.mappedData = [];
  }
}
