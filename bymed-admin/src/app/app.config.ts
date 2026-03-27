import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authTokenInterceptor } from '@core/interceptors/auth-token.interceptor';
import { apiErrorInterceptor } from '@core/interceptors/api-error.interceptor';
import { provideQuillConfig } from 'ngx-quill/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor, apiErrorInterceptor])),
    provideAnimationsAsync(),
    provideQuillConfig({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ header: [1, 2, 3, false] }],
          ['link', 'clean']
        ]
      },
      placeholder: 'Describe the product…'
    })
  ]
};
