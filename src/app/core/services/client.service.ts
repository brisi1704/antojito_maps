import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ClientSessionService } from './client-session.service';

export interface ClientLoginResponse {
  uuid: string;
  mail: string;
  fullName: string;
  phone: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly BASE_URL = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private clientSession: ClientSessionService
  ) {}

  registry(idToken: string, fullName: string, phone: string): Observable<ClientLoginResponse> {
    return this.http.post<ClientLoginResponse>(`${this.BASE_URL}/client/registry`, {
      idToken,
      fullName,
      phone
    }).pipe(
      tap(res => this.clientSession.setSession({
        clientId: res.uuid,
        mail: res.mail,
        fullName: res.fullName,
        phone: res.phone
      }))
    );
  }

  login(idToken: string): Observable<ClientLoginResponse> {
    return this.http.post<ClientLoginResponse>(`${this.BASE_URL}/client/login`, { idToken }).pipe(
      tap(res => this.clientSession.setSession({
        clientId: res.uuid,
        mail: res.mail,
        fullName: res.fullName,
        phone: res.phone
      }))
    );
  }

  logout(mail: string): Observable<{ message: string }> {
    this.clientSession.clearSession();
    return this.http.post<{ message: string }>(`${this.BASE_URL}/client/logout`, { mail });
  }
}
