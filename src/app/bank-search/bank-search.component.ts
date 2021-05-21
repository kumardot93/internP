import { Component, OnInit } from '@angular/core';
import { CITY_LIST } from './../classes/city.const';
import { environment } from './../../environments/environment';

import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { Bank } from './../classes/bank.model';

import { BankComponent } from './../bank/bank.component';

@Component({
  selector: 'app-bank-search',
  templateUrl: './bank-search.component.html',
  styleUrls: ['./bank-search.component.css']
})
export class BankSearchComponent implements OnInit {

  allowedPageSizes: Array<number> = [10, 20, 30, 50, 100];

  cityCache: Array<string> = CITY_LIST.slice(0, 50);

  citySearchInput: string = '';
  searchInput: string = '';

  bankList: Array<Bank> = [];

  displayedColumns: string[] = ['fav', 'sno', 'bank_name', 'ifsc', 'branch', 'address', 'city', 'district', 'state'];
  matBankList: MatTableDataSource<Bank> = new MatTableDataSource<Bank>([]);

  pageSize: number = this.allowedPageSizes[0];

  myLocalStorage = window.localStorage;
  favouriteMappedById: { [key: number]: boolean; } = {};

  scheduledAPICallForBanks: any = -1;
  abortController: AbortController | null = null;

  scheduledCityCache: any = -1;

  hasNextPage: 0 | 1 = 1;
  isLoading: boolean = false;

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {

    this.favouriteMappedById = JSON.parse(this.myLocalStorage.getItem('favouriteBanks') || '{}');

    this.isLoading = true;
    const url = new URL(environment.DJANGO_SERVER + `/branches?q=${this.searchInput}&limit=${this.allowedPageSizes[0]}&offset=${this.bankList.length}`);
    fetch(url.toString()).then(response => response.json()).then((response: { branches: Array<Bank>; }) => {
      this.bankList = response.branches;
      this.matBankList = new MatTableDataSource<Bank>(this.bankList.map((b, i) => {
        return { ...b, sno: i + 1 };
      }));
      this.isLoading = false;
    });
    console.log('this: ', this);
  }

  updateCityCache = (limit: number = 20) => {
    let i = 0;
    this.cityCache = [];

    const searchInput = this.citySearchInput.toLocaleUpperCase();

    for (i = 0; i < CITY_LIST.length && this.cityCache.length <= limit; i++) {
      if (CITY_LIST[i].startsWith(searchInput)) {
        this.cityCache.push(CITY_LIST[i]);
      }
    }

    for (i = 0; i < CITY_LIST.length && this.cityCache.length <= limit; i++) {
      if (!CITY_LIST[i].startsWith(searchInput) && CITY_LIST[i].includes(searchInput)) {
        this.cityCache.push(CITY_LIST[i]);
      }
    }

  };

  handleCitySearchInputChange() {
    clearTimeout(this.scheduledCityCache);
    this.scheduledCityCache = setTimeout(this.updateCityCache, 500);
  }

  handleSearchInput() {
    clearTimeout(this.scheduledAPICallForBanks);
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isLoading = true;
    this.scheduledAPICallForBanks = setTimeout(() => {
      const url = new URL(environment.DJANGO_SERVER + `/branches?q=${this.searchInput}&limit=${this.pageSize}&offset=0`);
      this.abortController = new AbortController();
      fetch(url.toString(), { signal: this.abortController.signal })
        .then(response => response.json())
        .then((response: { branches: Array<Bank>; }) => {
          this.bankList = response.branches;
          this.matBankList = new MatTableDataSource<Bank>(this.bankList.map((b, i) => {
            return { ...b, sno: i + 1 };
          }));
          this.isLoading = false;
        })
        .catch(err => { });
    }, 500);
  }

  pageChange(event: any): void {
    const startIndex = event.pageSize * event.pageIndex;
    const endIndex = startIndex + event.pageSize;

    if (this.bankList.length >= endIndex) {
      this.matBankList = new MatTableDataSource<Bank>(this.bankList.slice(startIndex, endIndex).map((b, i) => {
        return { ...b, sno: i + 1 + startIndex };
      }));
    }
    else if (this.hasNextPage) {
      this.isLoading = true;
      this.matBankList = new MatTableDataSource<Bank>(this.bankList.slice(startIndex, endIndex).map((b, i) => {
        return { ...b, sno: i + 1 + startIndex };
      }));

      const url = new URL(environment.DJANGO_SERVER + `/branches?q=${this.searchInput}&limit=${endIndex - this.bankList.length}&offset=${this.bankList.length}`);
      fetch(url.toString())
        .then(response => response.json())
        .then((response: { branches: Array<Bank>; }) => {
          this.bankList.push(...response.branches);
          this.matBankList = new MatTableDataSource<Bank>(this.bankList.slice(startIndex, endIndex).map((b, i) => {
            return { ...b, sno: i + 1 + startIndex };
          }));
          if (response.branches.length < endIndex - this.bankList.length) {
            this.hasNextPage = 0;
          }
          this.isLoading = false;
        });
    }
    this.pageSize = event.pageSize;
  }

  toggleFavoutite(id: number) {
    if (this.favouriteMappedById[id]) {
      delete this.favouriteMappedById[id];
    }
    else {
      this.favouriteMappedById[id] = true;
    }
    this.myLocalStorage.setItem('favouriteBanks', JSON.stringify(this.favouriteMappedById));
  }

  log(msg: any) {
    console.log('LOG: ', msg);
  }

  openDialog(bank: Bank) {
    const dialogRef = this.dialog.open(BankComponent, {
      data: { bank }
    });
  }

}
