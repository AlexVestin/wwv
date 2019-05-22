import {Component,
        OnInit,
        AfterViewInit,
        ViewChild,
        ViewChildren,
        QueryList} from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { CategorySpec,
         DataTypeCodedText,
         DataTypeCodedTextOpt,
         DataTypeEnum} from '../../ehr/datatype';
import { DataPoint } from '../../ehr/datalist';
import { Conveyor } from '../../conveyor.service';
import { CompositionReceipt } from '../../ehr/ehr.service';

@Component({
  selector: 'app-inspection',
  templateUrl: './inspection.component.html',
  styleUrls: ['./inspection.component.scss']
})
export class InspectionComponent implements OnInit {
  categories: string[] = [];
  categorySpecs: Map<string, CategorySpec>;
  dataTypeEnum = DataTypeEnum;

  dataSent: boolean;
  receipt: CompositionReceipt;

  constructor(
    private snackBar: MatSnackBar,
    private conveyor: Conveyor,
  ) {}

  ngOnInit() {
    this.dataSent = false;

    // Reset all the internal lists.
    this.categories = this.conveyor.getCategoryIds();
    this.categorySpecs = new Map<string, CategorySpec>();
    for (const category of this.categories) {
      this.categorySpecs.set(category, this.conveyor.getCategorySpec(category));
    }
  }
  /**
   * Checks if a category is empty.
   * @param categoryId the category to check values from.
   * @returns whether the category has no points in its list.
   */
  isCategoryEmpty(categoryId: string): boolean {
    if (this.conveyor.getDataList(categoryId)) {
      return this.getNumberOfValues(categoryId) < 1;
    }
    return false;
  }

  /**
   * Get the number of values in a chosen category.
   * @param category the category to get values from
   * @returns the number of values in the chosen category
   */
  getNumberOfValues(category: string) {
    let values = 0;
    const pointMap = this.conveyor.getDataList(category).getPoints();
    for (const [_, points] of pointMap.entries()) {
      values += points.length;
    }
    return values;
  }

  /**
   * Send all the data stored in the conveyor.
   */
  sendData(pnr: string) {
    this.conveyor.sendData(pnr).
      subscribe(
        receipt => { this.dataSent = true; this.receipt = receipt; },
        e => this.snackBar.open(
          'Inrapporteringen misslyckades. Fel: "' + e.statusText + '"', 'OK',
          {
            duration: 10000,
            panelClass: 'error'
          })
        // TODO fix snackbar styling
        // TODO send composition id to confirmation screen
    );
  }

  /**
   * Calls the conveyor authenticate method
   * @param String for username
   * @param String for user password
   */
  authenticate(user: string, pass: string): void {
    this.conveyor.authenticateBasic(user, pass);
  }
}
