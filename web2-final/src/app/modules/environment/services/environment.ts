import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EnvironmentStats {
  devicesListed: number;
  devicesPurchased: number;
  reusedDevicesPurchased: number;
  eWasteProcessedKg: number;
  co2eReferenceKg: number;
  co2eCountedDevices: number;
  co2eUncountedDevices: number;
  co2eNote: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  private readonly apiUrl = `${environment.apiUrl}/api/environment`;

  constructor(private http: HttpClient) {}

  getCommunityStats(): Observable<EnvironmentStats> {
    return this.http.get<EnvironmentStats>(
      `${this.apiUrl}/dashboard`
    );
  }

  getPersonalStats(): Observable<EnvironmentStats> {
    return this.http.get<EnvironmentStats>(
      `${this.apiUrl}/me`
    );
  }
}