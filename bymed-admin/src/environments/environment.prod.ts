import { AppEnvironment } from '../app/core/config/app-environment';

/**
 * Hosted production API. For Docker/local stacks use the `docker` Angular configuration
 * (`environment.docker.ts` + `ADMIN_API_PUBLIC_URL` build arg), not this file.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://api.bymed.co.zw/api/v1',
  enableVerboseLogging: false
};
