import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { CategorySpec,
         DataTypeCodedText,
         DataTypeCodedTextOpt,
         DataTypeEnum} from '../../ehr/datatype';
import { DataPoint } from '../../ehr/datalist';
import {Conveyor} from '../../conveyor.service';
import {AddDataPointComponent} from '../add-data-point/add-data-point.component';
import {MatDialog, MatPaginator, MatTableDataSource} from '@angular/material';


@Component({
  selector: 'app-health-list-items',
  templateUrl: './health-list-items.component.html',
  styleUrls: ['./health-list-items.component.scss']
})
export class HealthListItemsComponent implements OnInit {

  selectedCategory: string;
  isEditable = false;

  @Input() set selectCategory(value: string) {
    if (this.selectedCategory) {
      this.selectedCategory = value;
      this.ngOnInit();
    } else {
      this.selectedCategory = value;
    }
  }

  @Input() set editable(value: boolean) {
    this.isEditable = value;
  }

  dataTypeEnum = DataTypeEnum;
  categorySpec: CategorySpec;
  pointDataList: DataPoint[];
  displayedColumns: string[];
  options: Map<string, DataTypeCodedTextOpt[]>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataList: MatTableDataSource<DataPoint>;

  /**
   * Gets a string representation of the date correctly formatted to be read by a human.
   * @param date the date to format
   * @returns a formatted string representing a date
   */
  static getDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Gets a string representation of the time correctly formatted to be read by a human.
   * @param date the date to get the time from to format
   * @returns a formatted string representing a time
   */
  static getTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Sets the data category in the dataPoint to the set option
   * @param key the data category to set
   * @param point the point to set data in
   * @param option the option to set
   */
  static setOption(key: string, point: DataPoint, option: string) {
    point.set(key, option);
  }

  /**
   * Gets the data to be displayed from the point
   * @param point the datapoint to get the data from
   * @param key the data category to get
   * @returns a string of the value to show
   */
  getPointData(point: DataPoint, key: string): string {
    if (key === 'date') {
      return HealthListItemsComponent.getDate(point.get('time'));
    }
    if (key === 'time') {
      return HealthListItemsComponent.getTime(point.get('time'));
    }
    return point.get(key);
  }

  constructor(private conveyor: Conveyor, public dialog: MatDialog) {
  }

  ngOnInit() {
    if (this.selectedCategory) {
      // Reset all the internal lists.
      this.categorySpec = this.conveyor.getCategorySpec(this.selectedCategory);
      this.pointDataList = this.conveyor.getDataList(this.selectedCategory).getPoints();
      this.displayedColumns = this.getDisplayedColumns();
      this.options = new Map<string, DataTypeCodedTextOpt[]>();

      // Fill options and visibleStrings
      for (const key of Array.from(this.categorySpec.dataTypes.keys())) {

        // Fill options
        if (this.categorySpec.dataTypes.get(key).type === DataTypeEnum.CODED_TEXT) {
          const datatypes: DataTypeCodedText = this.conveyor.getDataList(this.selectedCategory).getDataType(key) as DataTypeCodedText;
          this.options.set(key, datatypes.options);
        }
      }
    }
    console.log(this.options);
    this.dataList = new MatTableDataSource<DataPoint>(this.pointDataList);
    this.dataList.paginator = this.paginator;
  }

  trackItem(index, item) {
    return item ? index : undefined;
  }

  /**
   * Opens the dialog to add an item in the list stored in the conveyor.
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(AddDataPointComponent, {
      data: this.selectedCategory
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.ngOnInit();
    });
  }

  /**
   * Gets all data points from the facade
   * @returns a list of all datapoints in the category
   */
  getData(): DataPoint[] {
    if (this.selectedCategory) {
      return this.pointDataList;
    }
    return [];
  }

  /**
   * Get the label for the category.
   * @returns the label for the category.
   */
  getCategoryLabel(): string {
    if (this.categorySpec) {
      return this.categorySpec.label;
    }
    return '';
  }

  /**
   * Returns the columns which should be displayed in the table depending on which
   * category it is.
   * @returns a list of labels for the specified category
   */
  getDisplayedColumns(): string[] {
    const result: string[] = [];
    if (this.selectedCategory) {
      for (const column of Array.from(this.conveyor.getDataList(this.selectedCategory).spec.dataTypes.keys())) {
        if (column === 'time') {
          result.push('date');
          result.push('time');
        } else {
          result.push(column);
        }
      }
    }
    return result;
  }

  /**
   * Set all unset data types in a category
   * @param key the data category to be set
   * @param option the option to set
   */
  setAllOptions(key: string, option: string) {
    let allData = true;
    for (const point of this.getData()) {
      if (!point.has(key)) {
        HealthListItemsComponent.setOption(key, point, option);
        allData = false;
      }
    }
    if (allData) {
      for (const point of this.getData()) {
        HealthListItemsComponent.setOption(key, point, option);
      }
    }
  }

}
