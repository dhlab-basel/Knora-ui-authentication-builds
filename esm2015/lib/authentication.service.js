import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ApiServiceError, KuiCoreConfig } from '@knora/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from './session/session.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./session/session.service";
/**
 * Authentication service includes the login, logout method and a session method to check if a user is logged in or not.
 */
export class AuthenticationService {
    constructor(http, _session, config) {
        this.http = http;
        this._session = _session;
        this.config = config;
    }
    /**
     * validate if a user is logged in or not
     * returns true if the session is active
     *
     * @returns boolean
     */
    session() {
        return this._session.validateSession();
    }
    /**
     * login process;
     * it's used by the login component
     *
     * @param {string} identifier email or username
     * @param {string} password
     * @returns Observable<any>
     */
    login(identifier, password) {
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map((response) => {
            return response;
        }), catchError((error) => {
            return this.handleRequestError(error);
        }));
    }
    /**
     * logout the user by destroying the session
     *
     * @param
     */
    logout() {
        // destroy the session
        localStorage.removeItem('session');
    }
    /**
     * @ignore
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi8iLCJzb3VyY2VzIjpbImxpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQW1DLE1BQU0sc0JBQXNCLENBQUM7QUFDbkYsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0QsT0FBTyxFQUFjLFVBQVUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQzs7OztBQUUzRDs7R0FFRztBQUlILE1BQU07SUFFRixZQUFtQixJQUFnQixFQUNmLFFBQXdCLEVBQ1AsTUFBcUI7UUFGdkMsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUNmLGFBQVEsR0FBUixRQUFRLENBQWdCO1FBQ1AsV0FBTSxHQUFOLE1BQU0sQ0FBZTtJQUMxRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxPQUFPO1FBQ0gsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQWtCLEVBQUUsUUFBZ0I7UUFFdEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsb0JBQW9CLEVBQ3RDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLEVBQzVDLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUN2QixHQUFHLENBQUMsQ0FBQyxRQUEyQixFQUFPLEVBQUU7WUFDckMsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQyxDQUFDLEVBQ0YsVUFBVSxDQUFDLENBQUMsS0FBd0IsRUFBRSxFQUFFO1lBRXBDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUNMLENBQUM7SUFDVixDQUFDO0lBR0Q7Ozs7T0FJRztJQUNILE1BQU07UUFDRixzQkFBc0I7UUFDdEIsWUFBWSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBR0Q7Ozs7OztPQU1HO0lBQ08sa0JBQWtCLENBQUMsS0FBd0I7UUFDakQsTUFBTSxZQUFZLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUMzQyxZQUFZLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDbkMsWUFBWSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQzNDLFlBQVksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN2QyxZQUFZLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDN0IsT0FBTyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEMsQ0FBQzs7O1lBdEVKLFVBQVUsU0FBQztnQkFDUixVQUFVLEVBQUUsTUFBTTthQUNyQjs7OztZQVpRLFVBQVU7WUFLVixjQUFjO1lBSEcsYUFBYSx1QkFldEIsTUFBTSxTQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEt1aUNvcmVDb25maWcgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG4vKipcbiAqIEF1dGhlbnRpY2F0aW9uIHNlcnZpY2UgaW5jbHVkZXMgdGhlIGxvZ2luLCBsb2dvdXQgbWV0aG9kIGFuZCBhIHNlc3Npb24gbWV0aG9kIHRvIGNoZWNrIGlmIGEgdXNlciBpcyBsb2dnZWQgaW4gb3Igbm90LlxuICovXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uU2VydmljZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdmFsaWRhdGUgaWYgYSB1c2VyIGlzIGxvZ2dlZCBpbiBvciBub3RcbiAgICAgKiByZXR1cm5zIHRydWUgaWYgdGhlIHNlc3Npb24gaXMgYWN0aXZlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgc2Vzc2lvbigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9naW4gcHJvY2VzcztcbiAgICAgKiBpdCdzIHVzZWQgYnkgdGhlIGxvZ2luIGNvbXBvbmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkZW50aWZpZXIgZW1haWwgb3IgdXNlcm5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmRcbiAgICAgKiBAcmV0dXJucyBPYnNlcnZhYmxlPGFueT5cbiAgICAgKi9cbiAgICBsb2dpbihpZGVudGlmaWVyOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nLFxuICAgICAgICAgICAge2lkZW50aWZpZXI6IGlkZW50aWZpZXIsIHBhc3N3b3JkOiBwYXNzd29yZH0sXG4gICAgICAgICAgICB7b2JzZXJ2ZTogJ3Jlc3BvbnNlJ30pLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKChyZXNwb25zZTogSHR0cFJlc3BvbnNlPGFueT4pOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIGxvZ291dCB0aGUgdXNlciBieSBkZXN0cm95aW5nIHRoZSBzZXNzaW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW1cbiAgICAgKi9cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNlc3Npb25cbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBpZ25vcmVcbiAgICAgKiBoYW5kbGUgcmVxdWVzdCBlcnJvciBpbiBjYXNlIG9mIHNlcnZlciBlcnJvclxuICAgICAqXG4gICAgICogQHBhcmFtIGVycm9yXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSk6IE9ic2VydmFibGU8QXBpU2VydmljZUVycm9yPiB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2VFcnJvciA9IG5ldyBBcGlTZXJ2aWNlRXJyb3IoKTtcbiAgICAgICAgc2VydmljZUVycm9yLnN0YXR1cyA9IGVycm9yLnN0YXR1cztcbiAgICAgICAgc2VydmljZUVycm9yLnN0YXR1c1RleHQgPSBlcnJvci5zdGF0dXNUZXh0O1xuICAgICAgICBzZXJ2aWNlRXJyb3IuZXJyb3JJbmZvID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgc2VydmljZUVycm9yLnVybCA9IGVycm9yLnVybDtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3Ioc2VydmljZUVycm9yKTtcbiAgICB9XG59XG4iXX0=