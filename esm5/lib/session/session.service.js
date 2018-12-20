import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { KnoraConstants, KuiCoreConfig, UsersService } from '@knora/core';
import * as momentImported from 'moment';
import { map } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "@knora/core";
var moment = momentImported;
var SessionService = /** @class */ (function () {
    function SessionService(_http, config, _users) {
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
    SessionService.prototype.setSession = function (jwt, username) {
        var _this = this;
        // get user information
        this._users.getUser(username).subscribe(function (result) {
            var sysAdmin = false;
            var permissions = result.permissions;
            if (permissions.groupsPerProject[KnoraConstants.SystemProjectIRI]) {
                sysAdmin = permissions.groupsPerProject[KnoraConstants.SystemProjectIRI]
                    .indexOf(KnoraConstants.SystemAdminGroupIRI) > -1;
            }
            // define a session id, which is the timestamp of login
            _this.session = {
                id: _this.setTimestamp(),
                user: {
                    name: result.username,
                    jwt: jwt,
                    lang: result.lang,
                    sysAdmin: sysAdmin
                }
            };
            // store in the localStorage
            localStorage.setItem('session', JSON.stringify(_this.session));
        }, function (error) {
            console.error(error);
        });
    };
    SessionService.prototype.setTimestamp = function () {
        return (moment().add(0, 'second')).valueOf();
    };
    SessionService.prototype.getSession = function () {
    };
    SessionService.prototype.updateSession = function () {
    };
    SessionService.prototype.validateSession = function () {
        // mix of checks with session.validation and this.authenticate
        this.session = JSON.parse(localStorage.getItem('session'));
        var tsNow = this.setTimestamp();
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
    };
    SessionService.prototype.authenticate = function () {
        return this._http.get(this.config.api + '/v2/authentication').pipe(map(function (result) {
            console.log('AuthenticationService - authenticate - result: ', result);
            // return true || false
            return result.status === 200;
        }));
    };
    SessionService.prototype.destroySession = function () {
        localStorage.removeItem('session');
    };
    SessionService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root'
                },] },
    ];
    /** @nocollapse */
    SessionService.ctorParameters = function () { return [
        { type: HttpClient },
        { type: KuiCoreConfig, decorators: [{ type: Inject, args: ['config',] }] },
        { type: UsersService }
    ]; };
    SessionService.ngInjectableDef = i0.defineInjectable({ factory: function SessionService_Factory() { return new SessionService(i0.inject(i1.HttpClient), i0.inject("config"), i0.inject(i2.UsersService)); }, token: SessionService, providedIn: "root" });
    return SessionService;
}());
export { SessionService };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uLyIsInNvdXJjZXMiOlsibGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQW1CLGNBQWMsRUFBRSxhQUFhLEVBQWlCLFlBQVksRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUUxRyxPQUFPLEtBQUssY0FBYyxNQUFNLFFBQVEsQ0FBQztBQUV6QyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUFFckMsSUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBRzlCO0lBY0ksd0JBQ1ksS0FBaUIsRUFDQSxNQUFxQixFQUN0QyxNQUFvQjtRQUZwQixVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ0EsV0FBTSxHQUFOLE1BQU0sQ0FBZTtRQUN0QyxXQUFNLEdBQU4sTUFBTSxDQUFjO1FBVmhDOzs7O1dBSUc7UUFDTSxxQkFBZ0IsR0FBVyxRQUFRLENBQUMsQ0FBQywyQkFBMkI7SUFNekUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILG1DQUFVLEdBQVYsVUFBVyxHQUFXLEVBQUUsUUFBZ0I7UUFBeEMsaUJBK0JDO1FBN0JHLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQ25DLFVBQUMsTUFBWTtZQUNULElBQUksUUFBUSxHQUFZLEtBQUssQ0FBQztZQUU5QixJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3ZDLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUMvRCxRQUFRLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztxQkFDbkUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3pEO1lBRUQsdURBQXVEO1lBQ3ZELEtBQUksQ0FBQyxPQUFPLEdBQUc7Z0JBQ1gsRUFBRSxFQUFFLEtBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3ZCLElBQUksRUFBRTtvQkFDRixJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVE7b0JBQ3JCLEdBQUcsRUFBRSxHQUFHO29CQUNSLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsUUFBUSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0osQ0FBQztZQUNGLDRCQUE0QjtZQUM1QixZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWxFLENBQUMsRUFDRCxVQUFDLEtBQXNCO1lBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUNKLENBQUM7SUFDTixDQUFDO0lBRU8scUNBQVksR0FBcEI7UUFDSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCxtQ0FBVSxHQUFWO0lBRUEsQ0FBQztJQUVELHNDQUFhLEdBQWI7SUFFQSxDQUFDO0lBRUQsd0NBQWUsR0FBZjtRQUNJLDhEQUE4RDtRQUM5RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRTNELElBQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUUxQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDZCxxQkFBcUI7WUFDckIsdUNBQXVDO1lBQ3ZDLHFFQUFxRTtZQUNyRSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLEVBQUU7Z0JBQ2pELG1DQUFtQztnQkFDbkMsb0RBQW9EO2dCQUVwRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRTtvQkFDckIsbUNBQW1DO29CQUNuQyx3QkFBd0I7b0JBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztvQkFFeEIsc0NBQXNDO29CQUN0QyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUM5RCxPQUFPLElBQUksQ0FBQztpQkFFZjtxQkFBTTtvQkFDSCx3R0FBd0c7b0JBQ3hHLHVDQUF1QztvQkFDdkMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN0QixPQUFPLEtBQUssQ0FBQztpQkFDaEI7YUFFSjtpQkFBTTtnQkFDSCxPQUFPLElBQUksQ0FBQzthQUNmO1NBQ0o7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBR08scUNBQVksR0FBcEI7UUFDSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUM5RCxHQUFHLENBQUMsVUFBQyxNQUFXO1lBRVosT0FBTyxDQUFDLEdBQUcsQ0FBQyxpREFBaUQsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2RSx1QkFBdUI7WUFDdkIsT0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FDTCxDQUFDO0lBQ04sQ0FBQztJQUVELHVDQUFjLEdBQWQ7UUFDSSxZQUFZLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7O2dCQTNISixVQUFVLFNBQUM7b0JBQ1IsVUFBVSxFQUFFLE1BQU07aUJBQ3JCOzs7O2dCQWJRLFVBQVU7Z0JBRXVCLGFBQWEsdUJBeUI5QyxNQUFNLFNBQUMsUUFBUTtnQkF6QmdELFlBQVk7Ozt5QkFGcEY7Q0F5SUMsQUE5SEQsSUE4SEM7U0EzSFksY0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0dHBDbGllbnQgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgS25vcmFDb25zdGFudHMsIEt1aUNvcmVDb25maWcsIFNlc3Npb24sIFVzZXIsIFVzZXJzU2VydmljZSB9IGZyb20gJ0Brbm9yYS9jb3JlJztcblxuaW1wb3J0ICogYXMgbW9tZW50SW1wb3J0ZWQgZnJvbSAnbW9tZW50JztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuY29uc3QgbW9tZW50ID0gbW9tZW50SW1wb3J0ZWQ7XG5cblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBTZXNzaW9uU2VydmljZSB7XG5cbiAgICBwdWJsaWMgc2Vzc2lvbjogU2Vzc2lvbjtcblxuICAgIC8qKlxuICAgICAqIG1heCBzZXNzaW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzXG4gICAgICogZGVmYXVsdCB2YWx1ZSAoMjRoKTogODY0MDAwMDBcbiAgICAgKlxuICAgICAqL1xuICAgIHJlYWRvbmx5IE1BWF9TRVNTSU9OX1RJTUU6IG51bWJlciA9IDg2NDAwMDAwOyAvLyAxZCA9IDI0ICogNjAgKiA2MCAqIDEwMDBcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIF9odHRwOiBIdHRwQ2xpZW50LFxuICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnLFxuICAgICAgICBwcml2YXRlIF91c2VyczogVXNlcnNTZXJ2aWNlKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0IHRoZSBzZXNzaW9uIGJ5IHVzaW5nIHRoZSBqc29uIHdlYiB0b2tlbiAoand0KSBhbmQgdGhlIHVzZXIgb2JqZWN0O1xuICAgICAqIGl0IHdpbGwgYmUgdXNlZCBpbiB0aGUgbG9naW4gcHJvY2Vzc1xuICAgICAqXG4gICAgICogQHBhcmFtIGp3dFxuICAgICAqIEBwYXJhbSB1c2VybmFtZVxuICAgICAqL1xuICAgIHNldFNlc3Npb24oand0OiBzdHJpbmcsIHVzZXJuYW1lOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBnZXQgdXNlciBpbmZvcm1hdGlvblxuICAgICAgICB0aGlzLl91c2Vycy5nZXRVc2VyKHVzZXJuYW1lKS5zdWJzY3JpYmUoXG4gICAgICAgICAgICAocmVzdWx0OiBVc2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN5c0FkbWluOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IHJlc3VsdC5wZXJtaXNzaW9ucztcbiAgICAgICAgICAgICAgICBpZiAocGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXSkge1xuICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbiA9IHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKEtub3JhQ29uc3RhbnRzLlN5c3RlbUFkbWluR3JvdXBJUkkpID4gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGEgc2Vzc2lvbiBpZCwgd2hpY2ggaXMgdGhlIHRpbWVzdGFtcCBvZiBsb2dpblxuICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXMuc2V0VGltZXN0YW1wKCksXG4gICAgICAgICAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHJlc3VsdC51c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGp3dDogand0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFuZzogcmVzdWx0LmxhbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbjogc3lzQWRtaW5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgaW4gdGhlIGxvY2FsU3RvcmFnZVxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGltZXN0YW1wKCkge1xuICAgICAgICByZXR1cm4gKG1vbWVudCgpLmFkZCgwLCAnc2Vjb25kJykpLnZhbHVlT2YoKTtcbiAgICB9XG5cbiAgICBnZXRTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdXBkYXRlU2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHZhbGlkYXRlU2Vzc2lvbigpIHtcbiAgICAgICAgLy8gbWl4IG9mIGNoZWNrcyB3aXRoIHNlc3Npb24udmFsaWRhdGlvbiBhbmQgdGhpcy5hdXRoZW50aWNhdGVcbiAgICAgICAgdGhpcy5zZXNzaW9uID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKTtcblxuICAgICAgICBjb25zdCB0c05vdzogbnVtYmVyID0gdGhpcy5zZXRUaW1lc3RhbXAoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBleGlzdHNcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBzZXNzaW9uIGlzIHN0aWxsIHZhbGlkOlxuICAgICAgICAgICAgLy8gaWYgc2Vzc2lvbi5pZCArIE1BWF9TRVNTSU9OX1RJTUUgPiBub3c6IF9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpXG4gICAgICAgICAgICBpZiAodGhpcy5zZXNzaW9uLmlkICsgdGhpcy5NQVhfU0VTU0lPTl9USU1FIDwgdHNOb3cpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgaW50ZXJuYWwgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBhcGkgdjIvYXV0aGVudGljYXRpb24gaXMgc3RpbGwgdmFsaWRcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhcGkgYXV0aGVudGljYXRpb24gaXMgdmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Vzc2lvbi5pZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24uaWQgPSB0c05vdztcblxuICAgICAgICAgICAgICAgICAgICAvLyBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Nlc3Npb24uc2VydmljZSAtLSB2YWxpZGF0ZVNlc3Npb24gLS0gYXV0aGVudGljYXRlOiB0aGUgc2Vzc2lvbiBleHBpcmVkIG9uIEFQSSBzaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgdXNlciBpcyBub3QgYXV0aGVudGljYXRlZCBhbnltb3JlIVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhdXRoZW50aWNhdGUoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9odHRwLmdldCh0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJykucGlwZShcbiAgICAgICAgICAgIG1hcCgocmVzdWx0OiBhbnkpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdXRoZW50aWNhdGlvblNlcnZpY2UgLSBhdXRoZW50aWNhdGUgLSByZXN1bHQ6ICcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRydWUgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnN0YXR1cyA9PT0gMjAwO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBkZXN0cm95U2Vzc2lvbigpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxufVxuIl19