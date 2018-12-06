import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ApiServiceError, KuiCoreConfig } from '@knora/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from './session/session.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./session/session.service";
export class AuthenticationService {
    constructor(http, _session, config) {
        this.http = http;
        this._session = _session;
        this.config = config;
    }
    /**
     * validate if a user is logged in or not
     * and the session is active
     */
    session() {
        return this._session.validateSession();
    }
    /**
     * login process;
     * it's used by the login component
     *
     * @param identifier (email or username)
     * @param password
     * @returns
     */
    login(identifier, password) {
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map((response) => {
            return response;
        }), catchError((error) => {
            return this.handleRequestError(error);
        }));
    }
    logout() {
        // destroy the session
        localStorage.removeItem('session');
    }
    /**
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    handleRequestError(error) {
        const serviceError = new ApiServiceError();
        serviceError.status = error.status;
        serviceError.statusText = error.statusText;
        serviceError.errorInfo = error.message;
        serviceError.url = error.url;
        return throwError(serviceError);
    }
}
AuthenticationService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] },
];
/** @nocollapse */
AuthenticationService.ctorParameters = () => [
    { type: HttpClient },
    { type: SessionService },
    { type: KuiCoreConfig, decorators: [{ type: Inject, args: ['config',] }] }
];
AuthenticationService.ngInjectableDef = i0.defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(i0.inject(i1.HttpClient), i0.inject(i2.SessionService), i0.inject("config")); }, token: AuthenticationService, providedIn: "root" });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi8iLCJzb3VyY2VzIjpbImxpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQW1DLE1BQU0sc0JBQXNCLENBQUM7QUFDbkYsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0QsT0FBTyxFQUFjLFVBQVUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQzs7OztBQUszRCxNQUFNO0lBRUYsWUFBbUIsSUFBZ0IsRUFDZixRQUF3QixFQUNQLE1BQXFCO1FBRnZDLFNBQUksR0FBSixJQUFJLENBQVk7UUFDZixhQUFRLEdBQVIsUUFBUSxDQUFnQjtRQUNQLFdBQU0sR0FBTixNQUFNLENBQWU7SUFFMUQsQ0FBQztJQUVEOzs7T0FHRztJQUNILE9BQU87UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFrQixFQUFFLFFBQWdCO1FBRXRDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsb0JBQW9CLEVBQ3RDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLEVBQzVDLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUN2QixHQUFHLENBQUMsQ0FBQyxRQUEyQixFQUFPLEVBQUU7WUFDckMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNwQixDQUFDLENBQUMsRUFDRixVQUFVLENBQUMsQ0FBQyxLQUF3QixFQUFFLEVBQUU7WUFFcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FDTCxDQUFDO0lBQ1YsQ0FBQztJQUdELE1BQU07UUFDRixzQkFBc0I7UUFDdEIsWUFBWSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBR0Q7Ozs7O09BS0c7SUFDTyxrQkFBa0IsQ0FBQyxLQUF3QjtRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQzNDLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUNuQyxZQUFZLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDM0MsWUFBWSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7OztZQS9ESixVQUFVLFNBQUM7Z0JBQ1IsVUFBVSxFQUFFLE1BQU07YUFDckI7Ozs7WUFUUSxVQUFVO1lBS1YsY0FBYztZQUhHLGFBQWEsdUJBWXRCLE1BQU0sU0FBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCwgSHR0cEVycm9yUmVzcG9uc2UsIEh0dHBSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLdWlDb3JlQ29uZmlnIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciwgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvblNlcnZpY2Uge1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZykge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdmFsaWRhdGUgaWYgYSB1c2VyIGlzIGxvZ2dlZCBpbiBvciBub3RcbiAgICAgKiBhbmQgdGhlIHNlc3Npb24gaXMgYWN0aXZlXG4gICAgICovXG4gICAgc2Vzc2lvbigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9naW4gcHJvY2VzcztcbiAgICAgKiBpdCdzIHVzZWQgYnkgdGhlIGxvZ2luIGNvbXBvbmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGlkZW50aWZpZXIgKGVtYWlsIG9yIHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBwYXNzd29yZFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgbG9naW4oaWRlbnRpZmllcjogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogT2JzZXJ2YWJsZTxhbnk+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5odHRwLnBvc3QoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgICAgIHtpZGVudGlmaWVyOiBpZGVudGlmaWVyLCBwYXNzd29yZDogcGFzc3dvcmR9LFxuICAgICAgICAgICAge29ic2VydmU6ICdyZXNwb25zZSd9KS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcCgocmVzcG9uc2U6IEh0dHBSZXNwb25zZTxhbnk+KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNlc3Npb25cbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIGhhbmRsZSByZXF1ZXN0IGVycm9yIGluIGNhc2Ugb2Ygc2VydmVyIGVycm9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKTogT2JzZXJ2YWJsZTxBcGlTZXJ2aWNlRXJyb3I+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZUVycm9yID0gbmV3IEFwaVNlcnZpY2VFcnJvcigpO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzVGV4dCA9IGVycm9yLnN0YXR1c1RleHQ7XG4gICAgICAgIHNlcnZpY2VFcnJvci5lcnJvckluZm8gPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBzZXJ2aWNlRXJyb3IudXJsID0gZXJyb3IudXJsO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzZXJ2aWNlRXJyb3IpO1xuICAgIH1cbn1cbiJdfQ==