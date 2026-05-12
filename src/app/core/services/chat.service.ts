import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClientSessionService } from './client-session.service';

export interface ChatRequest {
  message: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
}

export interface ConversationHistory {
  conversationId: string;
  createdAt: string;
  messages: {
    role: string;
    content: string;
    timestamp: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly BASE_URL = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private clientSession: ClientSessionService
  ) {}

  private getClientHeaders(): HttpHeaders {
    const clientId = this.clientSession.getClientId();
    if (!clientId) {
      throw new Error('No hay sesion de cliente activa. Por favor inicia sesion.');
    }
    return new HttpHeaders({ 'X-Client-Id': clientId });
  }

  enviarMensaje(request: ChatRequest): Observable<ChatResponse> {
    const headers = this.getClientHeaders();
    return this.http.post<ChatResponse>(`${this.BASE_URL}/chat`, request, { headers });
  }

  obtenerHistorial(): Observable<ConversationHistory> {
    const headers = this.getClientHeaders();
    return this.http.get<ConversationHistory>(`${this.BASE_URL}/chat/history`, { headers });
  }
}