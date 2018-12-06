import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { KnoraConstants, KuiCoreConfig, UsersService } from '@knora/core';
import * as momentImported from 'moment';
import { map } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "@knora/core";
const moment = momentImported;
export class SessionService {
    constructor(_http, config, _users) {
        this._http = _http;
        this.config = config;
        this._users = _users;
        /**
         * max session time in milliseconds
         * default value (24h): 86400000
         *
         */
        this.MAX_SESSION_TIME = 86400000; // 1d = 24 * 60 * 60 * 1000
    }
    /**
     * set the session by using the json web token (jwt) and the user object;
     * it will be used in the login process
     *
     * @param jwt
     * @param username
     */
    setSession(jwt, username) {
        // get user information
        this._users.getUser(username).subscribe((result) => {
            let sysAdmin = false;
            const permissions = result.permissions;
            if (permissions.groupsPerProject[KnoraConstants.SystemProjectIRI]) {
                sysAdmin = permissions.groupsPerProject[KnoraConstants.SystemProjectIRI]
                    .indexOf(KnoraConstants.SystemAdminGroupIRI) > -1;
            }
            // define a session id, which is the timestamp of login
            this.session = {
                id: this.setTimestamp(),
                user: {
                    name: username,
                    jwt: jwt,
                    lang: result.lang,
                    sysAdmin: sysAdmin
                }
            };
            // store in the localStorage
            localStorage.setItem('session', JSON.stringify(this.session));
        }, (error) => {
            console.error(error);
        });
    }
    setTimestamp() {
        return (moment().add(0, 'second')).valueOf();
    }
    getSession() {
    }
    updateSession() {
    }
    validateSession() {
        // mix of checks with session.validation and this.authenticate
        this.session = JSON.parse(localStorage.getItem('session'));
        const tsNow = this.setTimestamp();
        if (this.session) {
            // the session exists
            // check if the session is still valid:
            // if session.id + MAX_SESSION_TIME > now: _session.validateSession()
            if (this.session.id + this.MAX_SESSION_TIME < tsNow) {
                // the internal session has expired
                // check if the api v2/authentication is still valid
                if (this.authenticate()) {
                    // the api authentication is valid;
                    // update the session.id
                    this.session.id = tsNow;
                    console.log('new session id', this.session.id);
                    // localStorage.removeItem('session');
                    localStorage.setItem('session', JSON.stringify(this.session));
                    return true;
                }
                else {
                    // console.error('session.service -- validateSession -- authenticate: the session expired on API side');
                    // a user is not authenticated anymore!
                    this.destroySession();
                    return false;
                }
            }
            else {
                return true;
            }
        }
        return false;
    }
    authenticate() {
        return this._http.get(this.config.api + '/v2/authentication').pipe(map((result) => {
            console.log('AuthenticationService - authenticate - result: ', result);
            // return true || false
            return result.status === 200;
        }));
    }
    destroySession() {
        localStorage.removeItem('session');
    }
}
SessionService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] },
];
/** @nocollapse */
SessionService.ctorParameters = () => [
    { type: HttpClient },
    { type: KuiCoreConfig, decorators: [{ type: Inject, args: ['config',] }] },
    { type: UsersService }
];
SessionService.ngInjectableDef = i0.defineInjectable({ factory: function SessionService_Factory() { return new SessionService(i0.inject(i1.HttpClient), i0.inject("config"), i0.inject(i2.UsersService)); }, token: SessionService, providedIn: "root" });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uLyIsInNvdXJjZXMiOlsibGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQW1CLGNBQWMsRUFBRSxhQUFhLEVBQWlCLFlBQVksRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUUxRyxPQUFPLEtBQUssY0FBYyxNQUFNLFFBQVEsQ0FBQztBQUV6QyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUFFckMsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBTTlCLE1BQU07SUFXRixZQUNZLEtBQWlCLEVBQ0EsTUFBcUIsRUFDdEMsTUFBb0I7UUFGcEIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNBLFdBQU0sR0FBTixNQUFNLENBQWU7UUFDdEMsV0FBTSxHQUFOLE1BQU0sQ0FBYztRQVZoQzs7OztXQUlHO1FBQ00scUJBQWdCLEdBQVcsUUFBUSxDQUFDLENBQUMsMkJBQTJCO0lBTXpFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxVQUFVLENBQUMsR0FBVyxFQUFFLFFBQWdCO1FBRXBDLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQ25DLENBQUMsTUFBWSxFQUFFLEVBQUU7WUFDYixJQUFJLFFBQVEsR0FBWSxLQUFLLENBQUM7WUFFOUIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxRQUFRLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztxQkFDbkUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFFRCx1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLE9BQU8sR0FBRztnQkFDWCxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDdkIsSUFBSSxFQUFFO29CQUNGLElBQUksRUFBRSxRQUFRO29CQUNkLEdBQUcsRUFBRSxHQUFHO29CQUNSLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsUUFBUSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0osQ0FBQztZQUNGLDRCQUE0QjtZQUM1QixZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWxFLENBQUMsRUFDRCxDQUFDLEtBQXNCLEVBQUUsRUFBRTtZQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FDSixDQUFDO0lBQ04sQ0FBQztJQUVPLFlBQVk7UUFDaEIsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCxVQUFVO0lBRVYsQ0FBQztJQUVELGFBQWE7SUFFYixDQUFDO0lBRUQsZUFBZTtRQUNYLDhEQUE4RDtRQUM5RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRTNELE1BQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUUxQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLHFCQUFxQjtZQUNyQix1Q0FBdUM7WUFDdkMscUVBQXFFO1lBQ3JFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxtQ0FBbUM7Z0JBQ25DLG9EQUFvRDtnQkFFcEQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdEIsbUNBQW1DO29CQUNuQyx3QkFBd0I7b0JBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztvQkFFeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMvQyxzQ0FBc0M7b0JBQ3RDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBRWhCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osd0dBQXdHO29CQUN4Ryx1Q0FBdUM7b0JBQ3ZDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQztZQUVMLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBR08sWUFBWTtRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQzlELEdBQUcsQ0FBQyxDQUFDLE1BQVcsRUFBRSxFQUFFO1lBRWhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaURBQWlELEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkUsdUJBQXVCO1lBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FDTCxDQUFDO0lBQ04sQ0FBQztJQUVELGNBQWM7UUFDVixZQUFZLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7OztZQTVISixVQUFVLFNBQUM7Z0JBQ1IsVUFBVSxFQUFFLE1BQU07YUFDckI7Ozs7WUFiUSxVQUFVO1lBRXVCLGFBQWEsdUJBeUI5QyxNQUFNLFNBQUMsUUFBUTtZQXpCZ0QsWUFBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0dHBDbGllbnQgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgS25vcmFDb25zdGFudHMsIEt1aUNvcmVDb25maWcsIFNlc3Npb24sIFVzZXIsIFVzZXJzU2VydmljZSB9IGZyb20gJ0Brbm9yYS9jb3JlJztcblxuaW1wb3J0ICogYXMgbW9tZW50SW1wb3J0ZWQgZnJvbSAnbW9tZW50JztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuY29uc3QgbW9tZW50ID0gbW9tZW50SW1wb3J0ZWQ7XG5cblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBTZXNzaW9uU2VydmljZSB7XG5cbiAgICBwdWJsaWMgc2Vzc2lvbjogU2Vzc2lvbjtcblxuICAgIC8qKlxuICAgICAqIG1heCBzZXNzaW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzXG4gICAgICogZGVmYXVsdCB2YWx1ZSAoMjRoKTogODY0MDAwMDBcbiAgICAgKlxuICAgICAqL1xuICAgIHJlYWRvbmx5IE1BWF9TRVNTSU9OX1RJTUU6IG51bWJlciA9IDg2NDAwMDAwOyAvLyAxZCA9IDI0ICogNjAgKiA2MCAqIDEwMDBcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIF9odHRwOiBIdHRwQ2xpZW50LFxuICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnLFxuICAgICAgICBwcml2YXRlIF91c2VyczogVXNlcnNTZXJ2aWNlKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0IHRoZSBzZXNzaW9uIGJ5IHVzaW5nIHRoZSBqc29uIHdlYiB0b2tlbiAoand0KSBhbmQgdGhlIHVzZXIgb2JqZWN0O1xuICAgICAqIGl0IHdpbGwgYmUgdXNlZCBpbiB0aGUgbG9naW4gcHJvY2Vzc1xuICAgICAqXG4gICAgICogQHBhcmFtIGp3dFxuICAgICAqIEBwYXJhbSB1c2VybmFtZVxuICAgICAqL1xuICAgIHNldFNlc3Npb24oand0OiBzdHJpbmcsIHVzZXJuYW1lOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBnZXQgdXNlciBpbmZvcm1hdGlvblxuICAgICAgICB0aGlzLl91c2Vycy5nZXRVc2VyKHVzZXJuYW1lKS5zdWJzY3JpYmUoXG4gICAgICAgICAgICAocmVzdWx0OiBVc2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN5c0FkbWluOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IHJlc3VsdC5wZXJtaXNzaW9ucztcbiAgICAgICAgICAgICAgICBpZiAocGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXSkge1xuICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbiA9IHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKEtub3JhQ29uc3RhbnRzLlN5c3RlbUFkbWluR3JvdXBJUkkpID4gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGEgc2Vzc2lvbiBpZCwgd2hpY2ggaXMgdGhlIHRpbWVzdGFtcCBvZiBsb2dpblxuICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXMuc2V0VGltZXN0YW1wKCksXG4gICAgICAgICAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgand0OiBqd3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiByZXN1bHQubGFuZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5c0FkbWluOiBzeXNBZG1pblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzdG9yZSBpbiB0aGUgbG9jYWxTdG9yYWdlXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb24nLCBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24pKTtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUaW1lc3RhbXAoKSB7XG4gICAgICAgIHJldHVybiAobW9tZW50KCkuYWRkKDAsICdzZWNvbmQnKSkudmFsdWVPZigpO1xuICAgIH1cblxuICAgIGdldFNlc3Npb24oKSB7XG5cbiAgICB9XG5cbiAgICB1cGRhdGVTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdmFsaWRhdGVTZXNzaW9uKCkge1xuICAgICAgICAvLyBtaXggb2YgY2hlY2tzIHdpdGggc2Vzc2lvbi52YWxpZGF0aW9uIGFuZCB0aGlzLmF1dGhlbnRpY2F0ZVxuICAgICAgICB0aGlzLnNlc3Npb24gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpO1xuXG4gICAgICAgIGNvbnN0IHRzTm93OiBudW1iZXIgPSB0aGlzLnNldFRpbWVzdGFtcCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnNlc3Npb24pIHtcbiAgICAgICAgICAgIC8vIHRoZSBzZXNzaW9uIGV4aXN0c1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHNlc3Npb24gaXMgc3RpbGwgdmFsaWQ6XG4gICAgICAgICAgICAvLyBpZiBzZXNzaW9uLmlkICsgTUFYX1NFU1NJT05fVElNRSA+IG5vdzogX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKClcbiAgICAgICAgICAgIGlmICh0aGlzLnNlc3Npb24uaWQgKyB0aGlzLk1BWF9TRVNTSU9OX1RJTUUgPCB0c05vdykge1xuICAgICAgICAgICAgICAgIC8vIHRoZSBpbnRlcm5hbCBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGFwaSB2Mi9hdXRoZW50aWNhdGlvbiBpcyBzdGlsbCB2YWxpZFxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXV0aGVudGljYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFwaSBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzZXNzaW9uLmlkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbi5pZCA9IHRzTm93O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCduZXcgc2Vzc2lvbiBpZCcsIHRoaXMuc2Vzc2lvbi5pZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcignc2Vzc2lvbi5zZXJ2aWNlIC0tIHZhbGlkYXRlU2Vzc2lvbiAtLSBhdXRoZW50aWNhdGU6IHRoZSBzZXNzaW9uIGV4cGlyZWQgb24gQVBJIHNpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYSB1c2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkIGFueW1vcmUhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveVNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGF1dGhlbnRpY2F0ZSgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2h0dHAuZ2V0KHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nKS5waXBlKFxuICAgICAgICAgICAgbWFwKChyZXN1bHQ6IGFueSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1dGhlbnRpY2F0aW9uU2VydmljZSAtIGF1dGhlbnRpY2F0ZSAtIHJlc3VsdDogJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdHJ1ZSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuc3RhdHVzID09PSAyMDA7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGRlc3Ryb3lTZXNzaW9uKCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG59XG4iXX0=