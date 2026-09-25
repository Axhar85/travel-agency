import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { TravelportAuthError } from './errors/travelport.errors';
import {
  TRAVELPORT_AUTH_URLS,
  TravelportEnvironment,
} from './travelport.constants';

interface TravelportTokenResponse {
  access_token: string;
  expires_in?: number;
}

/** Travelport tokens live 24h; used when the response omits expires_in. */
const DEFAULT_TOKEN_LIFETIME_SECONDS = 86_400;

/**
 * Travelport asks callers to cache and reuse a token for its whole lifetime
 * and to request a new one "just under every 24 hours" - never per API call.
 * Refresh 5 minutes early so an in-flight request never carries a token that
 * expires mid-call.
 */
const EXPIRY_SAFETY_MARGIN_SECONDS = 300;

@Injectable()
export class TravelportAuthService {
  private readonly logger = new Logger(TravelportAuthService.name);
  private cachedToken?: { accessToken: string; expiresAt: number };
  private pendingFetch?: Promise<string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.accessToken;
    }

    // Coalesce concurrent callers into a single token request.
    if (!this.pendingFetch) {
      this.pendingFetch = this.fetchToken().finally(() => {
        this.pendingFetch = undefined;
      });
    }
    return this.pendingFetch;
  }

  private async fetchToken(): Promise<string> {
    const clientId = this.config.get<string>('TRAVELPORT_CLIENT_ID');
    const clientSecret = this.config.get<string>('TRAVELPORT_CLIENT_SECRET');
    const username = this.config.get<string>('TRAVELPORT_USERNAME');
    const password = this.config.get<string>('TRAVELPORT_PASSWORD');

    if (!clientId || !clientSecret || !username || !password) {
      throw new TravelportAuthError(
        'Travelport credentials are not configured (set TRAVELPORT_CLIENT_ID / TRAVELPORT_CLIENT_SECRET / TRAVELPORT_USERNAME / TRAVELPORT_PASSWORD)',
      );
    }

    const environment = this.config.get<TravelportEnvironment>(
      'TRAVELPORT_ENV',
      'preproduction',
    );
    // Documented request: grant_type=password plus the four credentials
    // Travelport issues at trial/provisioning time.
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<TravelportTokenResponse>(
          TRAVELPORT_AUTH_URLS[environment],
          body.toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        ),
      );

      const { access_token, expires_in } = response.data;
      this.cachedToken = {
        accessToken: access_token,
        expiresAt:
          Date.now() +
          ((expires_in ?? DEFAULT_TOKEN_LIFETIME_SECONDS) -
            EXPIRY_SAFETY_MARGIN_SECONDS) *
            1000,
      };
      this.logger.log(
        `Fetched new Travelport OAuth2 access token (${environment})`,
      );
      return access_token;
    } catch (error) {
      const axiosError = error as AxiosError;
      // Deliberately only the message + upstream body: the request body holds
      // the password/client secret and must never reach a log line.
      throw new TravelportAuthError(
        `Failed to authenticate with Travelport: ${axiosError.message}`,
        axiosError.response?.data ?? axiosError.message,
      );
    }
  }
}
