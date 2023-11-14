import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private state: Record<string, BehaviorSubject<any>> = {};

  addSlice<T>(name: string, initialState: T): void {
    this.state[name] = new BehaviorSubject(initialState);
  }

  dispatch<T>(name: string, callback: (state: T) => T): void {
    this.state[name].next(callback(this.state[name].value));
  }

  select<T>(name: string): BehaviorSubject<T> {
    return this.state[name];
  }
}
