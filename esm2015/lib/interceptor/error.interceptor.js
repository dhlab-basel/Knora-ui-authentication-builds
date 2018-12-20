import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { AuthenticationService } from './authentication.service';
export class ErrorInterceptor {
    /*
    constructor(private _authService: AuthenticationService) {
    }
*/
    intercept(request, next) {
        return next.handle(request).pipe(catchError(err => {
            // console.log('authentication -- error.interceptor', err);
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                //                this._authService.logout();
                // the following location.reload is used for the auth.guard in app routing
                // to go to the login page
                //                location.reload(true);
            }
            const error = err.error.message || err.statusText;
            return throwError(error);
        }));
    }
}
ErrorInterceptor.decorators = [
    { type: Injectable },
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuaW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQWMsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU1QyxvRUFBb0U7QUFHcEUsTUFBTTtJQUNGOzs7RUFHRjtJQUNFLFNBQVMsQ0FBQyxPQUF5QixFQUFFLElBQWlCO1FBQ2xELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBRTlDLDJEQUEyRDtZQUUzRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRyxFQUFFO2dCQUNwQixnREFBZ0Q7Z0JBQ2hFLDZDQUE2QztnQkFDekIsMEVBQTBFO2dCQUM5RSwwQkFBMEI7Z0JBQzFDLHdDQUF3QzthQUMzQjtZQUdELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFDbEQsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNSLENBQUM7OztZQXZCSixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8vIGltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBFcnJvckludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgICAvKlxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGhTZXJ2aWNlOiBBdXRoZW50aWNhdGlvblNlcnZpY2UpIHtcbiAgICB9XG4qL1xuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpLnBpcGUoY2F0Y2hFcnJvcihlcnIgPT4ge1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gLS0gZXJyb3IuaW50ZXJjZXB0b3InLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgLy8gYXV0byBsb2dvdXQgaWYgNDAxIHJlc3BvbnNlIHJldHVybmVkIGZyb20gYXBpXG4vLyAgICAgICAgICAgICAgICB0aGlzLl9hdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBsb2NhdGlvbi5yZWxvYWQgaXMgdXNlZCBmb3IgdGhlIGF1dGguZ3VhcmQgaW4gYXBwIHJvdXRpbmdcbiAgICAgICAgICAgICAgICAvLyB0byBnbyB0byB0aGUgbG9naW4gcGFnZVxuLy8gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZXJyLmVycm9yLm1lc3NhZ2UgfHwgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG4iXX0=