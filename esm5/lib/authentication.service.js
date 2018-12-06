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
var AuthenticationService = /** @class */ (function () {
    function AuthenticationService(http, _session, config) {
        this.http = http;
        this._session = _session;
        this.config = config;
    }
    /**
     * validate if a user is logged in or not
     * and the session is active
     */
    /**
     * validate if a user is logged in or not
     * and the session is active
     * @return {?}
     */
    AuthenticationService.prototype.session = /**
     * validate if a user is logged in or not
     * and the session is active
     * @return {?}
     */
    function () {
        return this._session.validateSession();
    };
    /**
     * login process;
     * it's used by the login component
     *
     * @param identifier (email or username)
     * @param password
     * @returns
     */
    /**
     * login process;
     * it's used by the login component
     *
     * @param {?} identifier (email or username)
     * @param {?} password
     * @return {?}
     */
    AuthenticationService.prototype.login = /**
     * login process;
     * it's used by the login component
     *
     * @param {?} identifier (email or username)
     * @param {?} password
     * @return {?}
     */
    function (identifier, password) {
        var _this = this;
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map(function (response) {
            console.log('authentication service: ', response);
            return response;
        }), catchError(function (error) {
            return _this.handleRequestError(error);
        }));
    };
    /**
     * @return {?}
     */
    AuthenticationService.prototype.logout = /**
     * @return {?}
     */
    function () {
        // destroy the session
        localStorage.removeItem('session');
    };
    /**
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    /**
     * handle request error in case of server error
     *
     * @param {?} error
     * @return {?}
     */
    AuthenticationService.prototype.handleRequestError = /**
     * handle request error in case of server error
     *
     * @param {?} error
     * @return {?}
     */
    function (error) {
        /** @type {?} */
        var serviceError = new ApiServiceError();
        serviceError.status = error.status;
        serviceError.statusText = error.statusText;
        serviceError.errorInfo = error.message;
        serviceError.url = error.url;
        return throwError(serviceError);
    };
    AuthenticationService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root'
                },] },
    ];
    /** @nocollapse */
    AuthenticationService.ctorParameters = function () { return [
        { type: HttpClient },
        { type: SessionService },
        { type: KuiCoreConfig, decorators: [{ type: Inject, args: ['config',] }] }
    ]; };
    /** @nocollapse */ AuthenticationService.ngInjectableDef = i0.defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(i0.inject(i1.HttpClient), i0.inject(i2.SessionService), i0.inject("config")); }, token: AuthenticationService, providedIn: "root" });
    return AuthenticationService;
}());
export { AuthenticationService };
if (false) {
    /** @type {?} */
    AuthenticationService.prototype.http;
    /** @type {?} */
    AuthenticationService.prototype._session;
    /** @type {?} */
    AuthenticationService.prototype.config;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi8iLCJzb3VyY2VzIjpbImxpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFtQyxNQUFNLHNCQUFzQixDQUFDO0FBQ25GLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzdELE9BQU8sRUFBYyxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDOUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7Ozs7O0lBT3ZELCtCQUFtQixJQUFnQixFQUNmLFVBQ2lCLE1BQXFCO1FBRnZDLFNBQUksR0FBSixJQUFJLENBQVk7UUFDZixhQUFRLEdBQVIsUUFBUTtRQUNTLFdBQU0sR0FBTixNQUFNLENBQWU7S0FFekQ7SUFFRDs7O09BR0c7Ozs7OztJQUNILHVDQUFPOzs7OztJQUFQO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7S0FDMUM7SUFFRDs7Ozs7OztPQU9HOzs7Ozs7Ozs7SUFDSCxxQ0FBSzs7Ozs7Ozs7SUFBTCxVQUFNLFVBQWtCLEVBQUUsUUFBZ0I7UUFBMUMsaUJBZUM7UUFiRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLG9CQUFvQixFQUN0QyxFQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxFQUM1QyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FDdkIsR0FBRyxDQUFDLFVBQUMsUUFBMkI7WUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ25CLENBQUMsRUFDRixVQUFVLENBQUMsVUFBQyxLQUF3QjtZQUVoQyxNQUFNLENBQUMsS0FBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pDLENBQUMsQ0FDTCxDQUFDO0tBQ1Q7Ozs7SUFHRCxzQ0FBTTs7O0lBQU47O1FBRUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN0QztJQUdEOzs7OztPQUtHOzs7Ozs7O0lBQ08sa0RBQWtCOzs7Ozs7SUFBNUIsVUFBNkIsS0FBd0I7O1FBQ2pELElBQU0sWUFBWSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7UUFDM0MsWUFBWSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ25DLFlBQVksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUMzQyxZQUFZLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDdkMsWUFBWSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDbkM7O2dCQWhFSixVQUFVLFNBQUM7b0JBQ1IsVUFBVSxFQUFFLE1BQU07aUJBQ3JCOzs7O2dCQVRRLFVBQVU7Z0JBS1YsY0FBYztnQkFIRyxhQUFhLHVCQVl0QixNQUFNLFNBQUMsUUFBUTs7O2dDQWRoQzs7U0FVYSxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEt1aUNvcmVDb25maWcgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uU2VydmljZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB2YWxpZGF0ZSBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdFxuICAgICAqIGFuZCB0aGUgc2Vzc2lvbiBpcyBhY3RpdmVcbiAgICAgKi9cbiAgICBzZXNzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2dpbiBwcm9jZXNzO1xuICAgICAqIGl0J3MgdXNlZCBieSB0aGUgbG9naW4gY29tcG9uZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRlbnRpZmllciAoZW1haWwgb3IgdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBsb2dpbihpZGVudGlmaWVyOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nLFxuICAgICAgICAgICAge2lkZW50aWZpZXI6IGlkZW50aWZpZXIsIHBhc3N3b3JkOiBwYXNzd29yZH0sXG4gICAgICAgICAgICB7b2JzZXJ2ZTogJ3Jlc3BvbnNlJ30pLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKChyZXNwb25zZTogSHR0cFJlc3BvbnNlPGFueT4pOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gc2VydmljZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIHJlcXVlc3QgZXJyb3IgaW4gY2FzZSBvZiBzZXJ2ZXIgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvclxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpOiBPYnNlcnZhYmxlPEFwaVNlcnZpY2VFcnJvcj4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlRXJyb3IgPSBuZXcgQXBpU2VydmljZUVycm9yKCk7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXMgPSBlcnJvci5zdGF0dXM7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXNUZXh0ID0gZXJyb3Iuc3RhdHVzVGV4dDtcbiAgICAgICAgc2VydmljZUVycm9yLmVycm9ySW5mbyA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIHNlcnZpY2VFcnJvci51cmwgPSBlcnJvci51cmw7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHNlcnZpY2VFcnJvcik7XG4gICAgfVxufVxuIl19