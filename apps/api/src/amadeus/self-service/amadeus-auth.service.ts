import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AmadeusAuthError } from '../errors/amadeus.errors';

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/** Refresh this many seconds before actual expiry to avoid races with in-flight requests. */
const EXPIRY_SAFETY_MARGIN_SECONDS = 60;

@Injectable()
export class AmadeusAuthService {
  private readonly logger = new Logger(AmadeusAuthService.name);
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
    const clientId = this.config.get<string>('AMADEUS_CLIENT_ID');
    const clientSecret = this.config.get<string>('AMADEUS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new AmadeusAuthError(
        'Amadeus credentials are not configured (set AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET)',
      );
    }

    const baseUrl = this.config.getOrThrow<string>('AMADEUS_API_BASE_URL');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<AmadeusTokenResponse>(
          `${baseUrl}/v1/security/oauth2/token`,
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
          Date.now() + (expires_in - EXPIRY_SAFETY_MARGIN_SECONDS) * 1000,
      };
      this.logger.log('Fetched new Amadeus OAuth2 access token');
      return access_token;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new AmadeusAuthError(
        `Failed to authenticate with Amadeus: ${axiosError.message}`,
        axiosError.response?.data ?? axiosError,
      );
    }
  }
}
