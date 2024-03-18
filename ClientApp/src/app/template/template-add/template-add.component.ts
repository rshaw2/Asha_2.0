import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import { EntityDataService } from 'src/app/angular-app-services/entity-data.service';
import { LayoutService } from 'src/app/angular-app-services/layout.service';
import { Option } from '../dynamic-layout/layout-models';
import { SweetAlertService } from 'src/app/angular-app-services/sweet-alert.service';
import { _camelCase, _toSentenceCase } from 'src/app/library/utils';

@Component({
  selector: 'app-template-add',
  templateUrl: './template-add.component.html',
  styleUrl: './template-add.component.scss'
})
export class TemplateAddComponent implements OnInit {
  @Input() entityName: string = '';
  @Input() id: string = '';
  @Output() saved = new EventEmitter<boolean>();

  fieldOptions: { [key: string]: Option[]; } = {};
  form?: FormGroup;
  layoutData: any[] = [];

  private destroy = new Subject();

  constructor(
    private dialogRef: MatDialogRef<TemplateAddComponent>,
    private entityDataService: EntityDataService,
    private layoutService: LayoutService,
    private sweetAlertService: SweetAlertService
  ) {
  }

  ngOnInit(): void {
    this.getLayout(this.entityName, this.id ? 'Edit' : 'Add');
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  closeDialog(status: boolean = false): void {
    this.dialogRef.close(status);
  }

  onSubmit(): void {
    const data = this.form?.value;
    if (this.id) {
      data.id = this.id;
    }
    const apiCall = this.id ? this.entityDataService.editRecordById(this.entityName, this.id, data) : this.entityDataService.addRecord(this.entityName, data);

    apiCall.pipe(takeUntil(this.destroy))
      .subscribe({
        next: data => {
          if (data) {
            this.sweetAlertService.showSuccess(`${_toSentenceCase(this.entityName)} has been ${this.id ? 'updated' : 'added'}.`);
            this.saved.emit(true);
          }
        }
      });
  }

  private getDefaultValue(field: any): any {
    switch (field.dataType.toLowerCase()) {
      case 'numeric':
      case 'guid':
      case 'date':
      case 'datetime':
        return null;
      case 'boolean':
        return false;
      default:
        return '';
    }
  }

  private getLayout(entityName: string, layoutType: string): void {
    this.layoutService.getLayout(entityName, layoutType)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: data => {
          this.layoutData = data;
          if (this.id) {
            this.getRecord(this.id);
          } else {
            this.form = new FormGroup({});
            const apis = this.initializeForm(data);
            this.getOptions(null, apis);
          }
        }
      });
  }

  private getOptions(data: any, apis: Array<Observable<any[]>>): void {
    const fields: string[] = [];
    Object.keys(this.fieldOptions).forEach(key => {
      fields.push(key);
    });
    this.form?.patchValue(data);
    if (!apis || apis.length === 0) return;

    forkJoin(apis)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: data => {
          fields.forEach((fieldName, index) => {
            this.fieldOptions[fieldName] = data[index].map(item => { return { value: item.id, text: item.name }; });
          });
        }
      });
  }

  private getRecord(id: string): void {
    this.entityDataService.getRecordById(this.entityName, id)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: data => {
          this.form = new FormGroup({});
          const apis = this.initializeForm(this.layoutData);
          this.getOptions(data, apis);
        }
      });
  }

  private initializeForm(fields: any[]): Array<Observable<any[]>> {
    const apis: Array<Observable<any[]>> = [];
    // Loop through the fields and add form controls
    fields.forEach(field => {
      if (field.type === 'section') {
        apis.push(...this.initializeForm(field.fields));
      } else {
        field.fieldName = _camelCase(field.fieldName);
        const defaultValue = this.getDefaultValue(field),
          validators: any[] = [];
        if (
          (typeof field.required === 'boolean' && field.required) ||
          (typeof field.required === 'string' && field.required.toLowerCase() === 'true')
        ) {
          validators.push(Validators.required);
        }

        if (field.dataType.toLowerCase() === 'numeric') {
          if (field.scale) {
            const scale = parseInt(field.scale),
              regEx = RegExp("^-?[0-9]+(\\.[0-9]{0," + scale + "}){0,1}$");
            validators.push(Validators.pattern(regEx));
          } else {
            validators.push(Validators.pattern(/^-?\d+$/));
          }
        }

        this.form?.addControl(field.fieldName, new FormControl(defaultValue, validators));
        if (field.dataType.toLowerCase() === 'guid' && !this.fieldOptions[field.fieldName]) {
          this.fieldOptions[field.fieldName] = [];
          apis.push(this.entityDataService.getRecordByUrl(field.optionsEndpoint));
        }
      }
    });
    return apis;
  }
}
