import { GdsAuthError } from '../../gds/errors/gds.errors';

export class TravelportAuthError extends GdsAuthError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'travelport');
    this.name = 'TravelportAuthError';
  }
}
