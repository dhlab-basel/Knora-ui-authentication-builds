import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiServiceError, KuiCoreConfig } from '@knora/core';
import { Observable } from 'rxjs';
import { SessionService } from './session/session.service';
export declare class AuthenticationService {
    http: HttpClient;
    private _session;
    config: KuiCoreConfig;
    constructor(http: HttpClient, _session: SessionService, config: KuiCoreConfig);
    /**
     * validate if a user is logged in or not
     * and the session is active
     */
    session(): boolean;
    /**
     * login process;
     * it's used by the login component
     *
     * @param identifier (email or username)
     * @param password
     * @returns
     */
    login(identifier: string, password: string): Observable<any>;
    logout(): void;
    /**
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    protected handleRequestError(error: HttpErrorResponse): Observable<ApiServiceError>;
}
