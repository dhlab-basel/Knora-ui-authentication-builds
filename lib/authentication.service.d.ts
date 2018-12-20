import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiServiceError, KuiCoreConfig } from '@knora/core';
import { Observable } from 'rxjs';
import { SessionService } from './session/session.service';
/**
 * Authentication service includes the login, logout method and a session method to check if a user is logged in or not.
 */
export declare class AuthenticationService {
    http: HttpClient;
    private _session;
    config: KuiCoreConfig;
    constructor(http: HttpClient, _session: SessionService, config: KuiCoreConfig);
    /**
     * validate if a user is logged in or not
     * returns true if the session is active
     *
     * @returns boolean
     */
    session(): boolean;
    /**
     * login process;
     * it's used by the login component
     *
     * @param {string} identifier email or username
     * @param {string} password
     * @returns Observable<any>
     */
    login(identifier: string, password: string): Observable<any>;
    /**
     * logout the user by destroying the session
     *
     * @param
     */
    logout(): void;
    /**
     * @ignore
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    protected handleRequestError(error: HttpErrorResponse): Observable<ApiServiceError>;
}
