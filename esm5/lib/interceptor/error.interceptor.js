import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { AuthenticationService } from './authentication.service';
var ErrorInterceptor = /** @class */ (function () {
    function ErrorInterceptor() {
    }
    /*
    constructor(private _authService: AuthenticationService) {
    }
*/
    ErrorInterceptor.prototype.intercept = function (request, next) {
        return next.handle(request).pipe(catchError(function (err) {
            // console.log('authentication -- error.interceptor', err);
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                //                this._authService.logout();
                // the following location.reload is used for the auth.guard in app routing
                // to go to the login page
                //                location.reload(true);
            }
            var error = err.error.message || err.statusText;
            return throwError(error);
        }));
    };
    ErrorInterceptor.decorators = [
        { type: Injectable },
    ];
    return ErrorInterceptor;
}());
export { ErrorInterceptor };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuaW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQWMsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU1QyxvRUFBb0U7QUFFcEU7SUFBQTtJQXdCQSxDQUFDO0lBdEJHOzs7RUFHRjtJQUNFLG9DQUFTLEdBQVQsVUFBVSxPQUF5QixFQUFFLElBQWlCO1FBQ2xELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQUEsR0FBRztZQUUzQywyREFBMkQ7WUFFM0QsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRTtnQkFDcEIsZ0RBQWdEO2dCQUNoRSw2Q0FBNkM7Z0JBQ3pCLDBFQUEwRTtnQkFDOUUsMEJBQTBCO2dCQUMxQyx3Q0FBd0M7YUFDM0I7WUFHRCxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDO1lBQ2xELE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDOztnQkF2QkosVUFBVTs7SUF3QlgsdUJBQUM7Q0FBQSxBQXhCRCxJQXdCQztTQXZCWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLy8gaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEVycm9ySW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuICAgIC8qXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aFNlcnZpY2U6IEF1dGhlbnRpY2F0aW9uU2VydmljZSkge1xuICAgIH1cbiovXG4gICAgaW50ZXJjZXB0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCkucGlwZShjYXRjaEVycm9yKGVyciA9PiB7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdhdXRoZW50aWNhdGlvbiAtLSBlcnJvci5pbnRlcmNlcHRvcicsIGVycik7XG5cbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAvLyBhdXRvIGxvZ291dCBpZiA0MDEgcmVzcG9uc2UgcmV0dXJuZWQgZnJvbSBhcGlcbi8vICAgICAgICAgICAgICAgIHRoaXMuX2F1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGxvY2F0aW9uLnJlbG9hZCBpcyB1c2VkIGZvciB0aGUgYXV0aC5ndWFyZCBpbiBhcHAgcm91dGluZ1xuICAgICAgICAgICAgICAgIC8vIHRvIGdvIHRvIHRoZSBsb2dpbiBwYWdlXG4vLyAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBlcnIuZXJyb3IubWVzc2FnZSB8fCBlcnIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKGVycm9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbiJdfQ==