/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
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
    /**
     * @param {?} http
     * @param {?} _session
     * @param {?} config
     */
    constructor(http, _session, config) {
        this.http = http;
        this._session = _session;
        this.config = config;
    }
    /**
     * validate if a user is logged in or not
     * and the session is active
     * @return {?}
     */
    session() {
        return this._session.validateSession();
    }
    /**
     * login process;
     * it's used by the login component
     *
     * @param {?} identifier (email or username)
     * @param {?} password
     * @return {?}
     */
    login(identifier, password) {
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map((response) => {
            return response;
        }), catchError((error) => {
            return this.handleRequestError(error);
        }));
    }
    /**
     * @return {?}
     */
    logout() {
        // destroy the session
        localStorage.removeItem('session');
    }
    /**
     * handle request error in case of server error
     *
     * @param {?} error
     * @return {?}
     */
    handleRequestError(error) {
        /** @type {?} */
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
/** @nocollapse */ AuthenticationService.ngInjectableDef = i0.defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(i0.inject(i1.HttpClient), i0.inject(i2.SessionService), i0.inject("config")); }, token: AuthenticationService, providedIn: "root" });
if (false) {
    /** @type {?} */
    AuthenticationService.prototype.http;
    /** @type {?} */
    AuthenticationService.prototype._session;
    /** @type {?} */
    AuthenticationService.prototype.config;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi8iLCJzb3VyY2VzIjpbImxpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFtQyxNQUFNLHNCQUFzQixDQUFDO0FBQ25GLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzdELE9BQU8sRUFBYyxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDOUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7Ozs7QUFLM0QsTUFBTTs7Ozs7O0lBRUYsWUFBbUIsSUFBZ0IsRUFDZixVQUNpQixNQUFxQjtRQUZ2QyxTQUFJLEdBQUosSUFBSSxDQUFZO1FBQ2YsYUFBUSxHQUFSLFFBQVE7UUFDUyxXQUFNLEdBQU4sTUFBTSxDQUFlO0tBRXpEOzs7Ozs7SUFNRCxPQUFPO1FBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7S0FDMUM7Ozs7Ozs7OztJQVVELEtBQUssQ0FBQyxVQUFrQixFQUFFLFFBQWdCO1FBRXRDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsb0JBQW9CLEVBQ3RDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLEVBQzVDLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUN2QixHQUFHLENBQUMsQ0FBQyxRQUEyQixFQUFPLEVBQUU7WUFDckMsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNuQixDQUFDLEVBQ0YsVUFBVSxDQUFDLENBQUMsS0FBd0IsRUFBRSxFQUFFO1lBRXBDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDekMsQ0FBQyxDQUNMLENBQUM7S0FDVDs7OztJQUdELE1BQU07O1FBRUYsWUFBWSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN0Qzs7Ozs7OztJQVNTLGtCQUFrQixDQUFDLEtBQXdCOztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQzNDLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUNuQyxZQUFZLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDM0MsWUFBWSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ25DOzs7WUEvREosVUFBVSxTQUFDO2dCQUNSLFVBQVUsRUFBRSxNQUFNO2FBQ3JCOzs7O1lBVFEsVUFBVTtZQUtWLGNBQWM7WUFIRyxhQUFhLHVCQVl0QixNQUFNLFNBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBFcnJvclJlc3BvbnNlLCBIdHRwUmVzcG9uc2UgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgS3VpQ29yZUNvbmZpZyB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25TZXJ2aWNlIHtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBodHRwOiBIdHRwQ2xpZW50LFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHZhbGlkYXRlIGlmIGEgdXNlciBpcyBsb2dnZWQgaW4gb3Igbm90XG4gICAgICogYW5kIHRoZSBzZXNzaW9uIGlzIGFjdGl2ZVxuICAgICAqL1xuICAgIHNlc3Npb24oKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvZ2luIHByb2Nlc3M7XG4gICAgICogaXQncyB1c2VkIGJ5IHRoZSBsb2dpbiBjb21wb25lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZGVudGlmaWVyIChlbWFpbCBvciB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmRcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGxvZ2luKGlkZW50aWZpZXI6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IE9ic2VydmFibGU8YW55PiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5wb3N0KFxuICAgICAgICAgICAgdGhpcy5jb25maWcuYXBpICsgJy92Mi9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgICAgICB7aWRlbnRpZmllcjogaWRlbnRpZmllciwgcGFzc3dvcmQ6IHBhc3N3b3JkfSxcbiAgICAgICAgICAgIHtvYnNlcnZlOiAncmVzcG9uc2UnfSkucGlwZShcbiAgICAgICAgICAgICAgICBtYXAoKHJlc3BvbnNlOiBIdHRwUmVzcG9uc2U8YW55Pik6IGFueSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBjYXRjaEVycm9yKChlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgIH1cblxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICAvLyBkZXN0cm95IHRoZSBzZXNzaW9uXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBoYW5kbGUgcmVxdWVzdCBlcnJvciBpbiBjYXNlIG9mIHNlcnZlciBlcnJvclxuICAgICAqXG4gICAgICogQHBhcmFtIGVycm9yXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSk6IE9ic2VydmFibGU8QXBpU2VydmljZUVycm9yPiB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2VFcnJvciA9IG5ldyBBcGlTZXJ2aWNlRXJyb3IoKTtcbiAgICAgICAgc2VydmljZUVycm9yLnN0YXR1cyA9IGVycm9yLnN0YXR1cztcbiAgICAgICAgc2VydmljZUVycm9yLnN0YXR1c1RleHQgPSBlcnJvci5zdGF0dXNUZXh0O1xuICAgICAgICBzZXJ2aWNlRXJyb3IuZXJyb3JJbmZvID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgc2VydmljZUVycm9yLnVybCA9IGVycm9yLnVybDtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3Ioc2VydmljZUVycm9yKTtcbiAgICB9XG59XG4iXX0=