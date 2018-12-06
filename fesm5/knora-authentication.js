import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Inject, Injectable, Component, Input, defineInjectable, inject, NgModule } from '@angular/core';
import { KnoraConstants, KuiCoreConfig, UsersService, ApiServiceError } from '@knora/core';
import * as momentImported from 'moment';
import { map, catchError } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCardModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { KuiActionModule } from '@knora/action';

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
                    name: username,
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
    SessionService.ngInjectableDef = defineInjectable({ factory: function SessionService_Factory() { return new SessionService(inject(HttpClient), inject("config"), inject(UsersService)); }, token: SessionService, providedIn: "root" });
    return SessionService;
}());

var AuthGuard = /** @class */ (function () {
    function AuthGuard(_session, _router) {
        this._session = _session;
        this._router = _router;
    }
    AuthGuard.prototype.canActivate = function (next, state) {
        if (!this._session.validateSession()) {
            this._router.navigate(['login'], { queryParams: { returnUrl: state.url } });
            return false;
        }
        return true;
    };
    AuthGuard.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root'
                },] },
    ];
    /** @nocollapse */
    AuthGuard.ctorParameters = function () { return [
        { type: SessionService },
        { type: Router }
    ]; };
    AuthGuard.ngInjectableDef = defineInjectable({ factory: function AuthGuard_Factory() { return new AuthGuard(inject(SessionService), inject(Router)); }, token: AuthGuard, providedIn: "root" });
    return AuthGuard;
}());

var JwtInterceptor = /** @class */ (function () {
    function JwtInterceptor(_session) {
        this._session = _session;
    }
    JwtInterceptor.prototype.intercept = function (request, next) {
        // add authorization header with jwt token if available
        if (this._session.validateSession()) {
            // the session is valid (and up to date)
            var jwt = JSON.parse(localStorage.getItem('session')).user.jwt;
            request = request.clone({
                setHeaders: {
                    Authorization: "Bearer " + jwt
                }
            });
        }
        else {
            this._session.destroySession();
        }
        return next.handle(request);
    };
    JwtInterceptor.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    JwtInterceptor.ctorParameters = function () { return [
        { type: SessionService }
    ]; };
    return JwtInterceptor;
}());

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
            console.log('authentication -- error.interceptor', err);
            if (err.status === 401) ;
            var error = err.error.message || err.statusText;
            return throwError(error);
        }));
    };
    ErrorInterceptor.decorators = [
        { type: Injectable },
    ];
    return ErrorInterceptor;
}());

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
    AuthenticationService.prototype.session = function () {
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
    AuthenticationService.prototype.login = function (identifier, password) {
        var _this = this;
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map(function (response) {
            return response;
        }), catchError(function (error) {
            return _this.handleRequestError(error);
        }));
    };
    AuthenticationService.prototype.logout = function () {
        // destroy the session
        localStorage.removeItem('session');
    };
    /**
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    AuthenticationService.prototype.handleRequestError = function (error) {
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
    AuthenticationService.ngInjectableDef = defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(inject(HttpClient), inject(SessionService), inject("config")); }, token: AuthenticationService, providedIn: "root" });
    return AuthenticationService;
}());

var LoginFormComponent = /** @class */ (function () {
    function LoginFormComponent(_auth, _session, _fb, _route, _router) {
        this._auth = _auth;
        this._session = _session;
        this._fb = _fb;
        this._route = _route;
        this._router = _router;
        this.loading = false;
        // specific error messages
        this.loginErrorUser = false;
        this.loginErrorPw = false;
        this.loginErrorServer = false;
        // labels for the login form
        this.login = {
            title: 'Login',
            name: 'Username',
            pw: 'Password',
            button: 'Login',
            remember: 'Remember me',
            forgot_pw: 'Forgot password?',
            error: {
                failed: 'Password or username is wrong',
                server: 'There\'s an error with the server connection. Try it again later or inform the Knora Team'
            }
        };
        // error definitions for the following form fields
        this.formErrors = {
            'identifier': '',
            'password': ''
        };
        // error messages for the form fields defined in formErrors
        this.validationMessages = {
            'identifier': {
                'required': 'user name is required.'
            },
            'password': {
                'required': 'password is required'
            }
        };
    }
    LoginFormComponent.prototype.ngOnInit = function () {
        // check if a user is already logged in
        if (this._session.validateSession()) {
            this.loggedInUser = JSON.parse(localStorage.getItem('session')).user.name;
        }
        else {
            this.buildForm();
        }
    };
    LoginFormComponent.prototype.buildForm = function () {
        var _this = this;
        this.frm = this._fb.group({
            identifier: ['', Validators.required],
            password: ['', Validators.required]
        });
        this.frm.valueChanges
            .subscribe(function (data) { return _this.onValueChanged(data); });
    };
    /**
     * check for errors while using the form
     * @param data
     */
    LoginFormComponent.prototype.onValueChanged = function (data) {
        var _this = this;
        if (!this.frm) {
            return;
        }
        var form = this.frm;
        Object.keys(this.formErrors).map(function (field) {
            _this.formErrors[field] = '';
            var control = form.get(field);
            if (control && control.dirty && !control.valid) {
                var messages_1 = _this.validationMessages[field];
                Object.keys(control.errors).map(function (key) {
                    _this.formErrors[field] += messages_1[key] + ' ';
                });
            }
        });
    };
    LoginFormComponent.prototype.doLogin = function () {
        var _this = this;
        // reset the error messages
        this.errorMessage = undefined;
        this.loginErrorUser = false;
        this.loginErrorPw = false;
        this.loginErrorServer = false;
        // make sure form values are valid
        if (this.frm.invalid) {
            this.loginErrorPw = true;
            this.loginErrorUser = true;
            return;
        }
        // Reset status
        this.loading = true;
        // Grab values from form
        var username = this.frm.get('identifier').value;
        var password = this.frm.get('password').value;
        this._auth.login(username, password)
            .subscribe(function (response) {
            // we have a token; set the session now
            _this._session.setSession(response.body.token, username);
            setTimeout(function () {
                // get return url from route parameters or default to '/'
                _this.returnUrl = _this._route.snapshot.queryParams['returnUrl'] || '/';
                // go back to the previous route or to the route defined in the @Input if navigate exists
                if (!_this.navigate) {
                    _this._router.navigate([_this.returnUrl]);
                }
                else {
                    _this._router.navigate([_this.navigate]);
                }
                _this.loading = false;
            }, 2000);
        }, function (error) {
            // error handling
            if (error.status === 0) {
                _this.loginErrorUser = false;
                _this.loginErrorPw = false;
                _this.loginErrorServer = true;
            }
            if (error.status === 401) {
                _this.loginErrorUser = false;
                _this.loginErrorPw = true;
                _this.loginErrorServer = false;
            }
            if (error.status === 404) {
                _this.loginErrorUser = true;
                _this.loginErrorPw = false;
                _this.loginErrorServer = false;
            }
            _this.errorMessage = error;
            _this.loading = false;
        });
    };
    LoginFormComponent.prototype.logout = function () {
        this._auth.logout();
        location.reload(true);
    };
    LoginFormComponent.decorators = [
        { type: Component, args: [{
                    selector: 'kui-login-form',
                    template: "<div class=\"login-form\" *ngIf=\"!loggedInUser\">\n    <div class=\"login-form-header\">\n        <h3 mat-subheader>{{login.title}}</h3>\n    </div>\n    <div class=\"login-form-content\">\n        <!-- This is the login form -->\n        <form class=\"login-form\" [formGroup]=\"frm\" (ngSubmit)=\"doLogin()\">\n            <!-- Error message -->\n            <mat-hint *ngIf=\"errorMessage !== undefined\" class=\"full-width\">\n                <span *ngIf=\"loginErrorUser || loginErrorPw\">{{login.error.failed}}</span>\n                <span *ngIf=\"loginErrorServer\">{{login.error.server}}</span>\n            </mat-hint>\n\n            <!-- Username -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>person</mat-icon>\n                <input matInput autofocus [placeholder]=\"login.name\" autocomplete=\"username\" formControlName=\"identifier\">\n                <mat-hint *ngIf=\"formErrors.identifier\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Password -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>lock</mat-icon>\n                <input matInput type=\"password\" [placeholder]=\"login.pw\" autocomplete=\"current-password\" formControlName=\"password\">\n                <mat-hint *ngIf=\"formErrors.password\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Button: Login -->\n            <div class=\"button-row full-width\">\n                <button mat-raised-button type=\"submit\"\n                        *ngIf=\"!loading\"\n                        [disabled]=\"!frm.valid\"\n                        class=\"full-width submit-button mat-primary\">\n                    {{login.button}}\n                </button>\n                <kui-progress-indicator *ngIf=\"loading\" [color]=\"color\"></kui-progress-indicator>\n            </div>\n        </form>\n    </div>\n</div>\n\n<!-- a user is already logged in; show who it is and a logout button -->\n\n<div class=\"logout-form\" *ngIf=\"loggedInUser\">\n    <p>A user is already logged in:</p>\n    <p>{{loggedInUser}}</p>\n    <br>\n    <p>If it's not you, please logout!</p>\n    <div class=\"button-row full-width\">\n        <button mat-raised-button\n                (click)=\"logout()\"\n                *ngIf=\"!loading\"\n                class=\"full-width mat-warn\">\n            LOGOUT\n        </button>\n        <kui-progress-indicator *ngIf=\"loading\"></kui-progress-indicator>\n    </div>\n</div>\n",
                    styles: [".full-width{width:100%}.button-row,.mat-form-field,.mat-hint{margin-top:24px}.mat-hint{background:rgba(239,83,80,.39);display:block;margin-left:-16px;padding:16px;text-align:center;width:280px}.login-form,.logout-form{margin-left:auto;margin-right:auto;position:relative;width:280px}.login-form .login-form-header,.logout-form .login-form-header{margin-bottom:24px}.login-form .login-field .mat-icon,.logout-form .login-field .mat-icon{font-size:20px;margin-right:12px}.login-form .button-row,.logout-form .button-row{margin-top:48px}.sign-up{margin-top:24px}"]
                },] },
    ];
    /** @nocollapse */
    LoginFormComponent.ctorParameters = function () { return [
        { type: AuthenticationService },
        { type: SessionService },
        { type: FormBuilder },
        { type: ActivatedRoute },
        { type: Router }
    ]; };
    LoginFormComponent.propDecorators = {
        navigate: [{ type: Input }],
        color: [{ type: Input }]
    };
    return LoginFormComponent;
}());

var KuiAuthenticationModule = /** @class */ (function () {
    function KuiAuthenticationModule() {
    }
    KuiAuthenticationModule.decorators = [
        { type: NgModule, args: [{
                    imports: [
                        CommonModule,
                        KuiActionModule,
                        MatCardModule,
                        MatIconModule,
                        MatInputModule,
                        MatButtonModule,
                        MatDialogModule,
                        MatFormFieldModule,
                        ReactiveFormsModule,
                        HttpClientModule
                    ],
                    declarations: [
                        LoginFormComponent
                    ],
                    exports: [
                        LoginFormComponent
                    ]
                },] },
    ];
    return KuiAuthenticationModule;
}());

/*
 * Public API Surface of authentication
 */

/**
 * Generated bundle index. Do not edit.
 */

export { SessionService as ɵa, AuthGuard, JwtInterceptor, ErrorInterceptor, LoginFormComponent, AuthenticationService, KuiAuthenticationModule };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24uanMubWFwIiwic291cmNlcyI6WyJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvZ3VhcmQvYXV0aC5ndWFyZC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvYXV0aGVudGljYXRpb24uc2VydmljZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50LnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLm1vZHVsZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL3B1YmxpY19hcGkudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9rbm9yYS1hdXRoZW50aWNhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEtub3JhQ29uc3RhbnRzLCBLdWlDb3JlQ29uZmlnLCBTZXNzaW9uLCBVc2VyLCBVc2Vyc1NlcnZpY2UgfSBmcm9tICdAa25vcmEvY29yZSc7XG5cbmltcG9ydCAqIGFzIG1vbWVudEltcG9ydGVkIGZyb20gJ21vbWVudCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmNvbnN0IG1vbWVudCA9IG1vbWVudEltcG9ydGVkO1xuXG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgU2Vzc2lvblNlcnZpY2Uge1xuXG4gICAgcHVibGljIHNlc3Npb246IFNlc3Npb247XG5cbiAgICAvKipcbiAgICAgKiBtYXggc2Vzc2lvbiB0aW1lIGluIG1pbGxpc2Vjb25kc1xuICAgICAqIGRlZmF1bHQgdmFsdWUgKDI0aCk6IDg2NDAwMDAwXG4gICAgICpcbiAgICAgKi9cbiAgICByZWFkb25seSBNQVhfU0VTU0lPTl9USU1FOiBudW1iZXIgPSA4NjQwMDAwMDsgLy8gMWQgPSAyNCAqIDYwICogNjAgKiAxMDAwXG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBfaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZyxcbiAgICAgICAgcHJpdmF0ZSBfdXNlcnM6IFVzZXJzU2VydmljZSkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldCB0aGUgc2Vzc2lvbiBieSB1c2luZyB0aGUganNvbiB3ZWIgdG9rZW4gKGp3dCkgYW5kIHRoZSB1c2VyIG9iamVjdDtcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIGxvZ2luIHByb2Nlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSBqd3RcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICAgKi9cbiAgICBzZXRTZXNzaW9uKGp3dDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gZ2V0IHVzZXIgaW5mb3JtYXRpb25cbiAgICAgICAgdGhpcy5fdXNlcnMuZ2V0VXNlcih1c2VybmFtZSkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlc3VsdDogVXNlcikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzeXNBZG1pbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGVybWlzc2lvbnMgPSByZXN1bHQucGVybWlzc2lvbnM7XG4gICAgICAgICAgICAgICAgaWYgKHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3lzQWRtaW4gPSBwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldXG4gICAgICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihLbm9yYUNvbnN0YW50cy5TeXN0ZW1BZG1pbkdyb3VwSVJJKSA+IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBhIHNlc3Npb24gaWQsIHdoaWNoIGlzIHRoZSB0aW1lc3RhbXAgb2YgbG9naW5cbiAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnNldFRpbWVzdGFtcCgpLFxuICAgICAgICAgICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGp3dDogand0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFuZzogcmVzdWx0LmxhbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbjogc3lzQWRtaW5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgaW4gdGhlIGxvY2FsU3RvcmFnZVxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGltZXN0YW1wKCkge1xuICAgICAgICByZXR1cm4gKG1vbWVudCgpLmFkZCgwLCAnc2Vjb25kJykpLnZhbHVlT2YoKTtcbiAgICB9XG5cbiAgICBnZXRTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdXBkYXRlU2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHZhbGlkYXRlU2Vzc2lvbigpIHtcbiAgICAgICAgLy8gbWl4IG9mIGNoZWNrcyB3aXRoIHNlc3Npb24udmFsaWRhdGlvbiBhbmQgdGhpcy5hdXRoZW50aWNhdGVcbiAgICAgICAgdGhpcy5zZXNzaW9uID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKTtcblxuICAgICAgICBjb25zdCB0c05vdzogbnVtYmVyID0gdGhpcy5zZXRUaW1lc3RhbXAoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBleGlzdHNcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBzZXNzaW9uIGlzIHN0aWxsIHZhbGlkOlxuICAgICAgICAgICAgLy8gaWYgc2Vzc2lvbi5pZCArIE1BWF9TRVNTSU9OX1RJTUUgPiBub3c6IF9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpXG4gICAgICAgICAgICBpZiAodGhpcy5zZXNzaW9uLmlkICsgdGhpcy5NQVhfU0VTU0lPTl9USU1FIDwgdHNOb3cpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgaW50ZXJuYWwgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBhcGkgdjIvYXV0aGVudGljYXRpb24gaXMgc3RpbGwgdmFsaWRcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhcGkgYXV0aGVudGljYXRpb24gaXMgdmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Vzc2lvbi5pZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24uaWQgPSB0c05vdztcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbmV3IHNlc3Npb24gaWQnLCB0aGlzLnNlc3Npb24uaWQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Nlc3Npb24uc2VydmljZSAtLSB2YWxpZGF0ZVNlc3Npb24gLS0gYXV0aGVudGljYXRlOiB0aGUgc2Vzc2lvbiBleHBpcmVkIG9uIEFQSSBzaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgdXNlciBpcyBub3QgYXV0aGVudGljYXRlZCBhbnltb3JlIVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhdXRoZW50aWNhdGUoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9odHRwLmdldCh0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJykucGlwZShcbiAgICAgICAgICAgIG1hcCgocmVzdWx0OiBhbnkpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdXRoZW50aWNhdGlvblNlcnZpY2UgLSBhdXRoZW50aWNhdGUgLSByZXN1bHQ6ICcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRydWUgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnN0YXR1cyA9PT0gMjAwO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBkZXN0cm95U2Vzc2lvbigpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxufVxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgQ2FuQWN0aXZhdGUsIFJvdXRlciwgUm91dGVyU3RhdGVTbmFwc2hvdCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoR3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuXG4gICAgfVxuXG4gICAgY2FuQWN0aXZhdGUoXG4gICAgICAgIG5leHQ6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgICAgIHN0YXRlOiBSb3V0ZXJTdGF0ZVNuYXBzaG90KTogT2JzZXJ2YWJsZTxib29sZWFuPiB8IFByb21pc2U8Ym9vbGVhbj4gfCBib29sZWFuIHtcblxuICAgICAgICBpZiAoIXRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbJ2xvZ2luJ10sIHtxdWVyeVBhcmFtczoge3JldHVyblVybDogc3RhdGUudXJsfX0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBKd3RJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSkge1xuICAgIH1cblxuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgLy8gYWRkIGF1dGhvcml6YXRpb24gaGVhZGVyIHdpdGggand0IHRva2VuIGlmIGF2YWlsYWJsZVxuXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBpcyB2YWxpZCAoYW5kIHVwIHRvIGRhdGUpXG4gICAgICAgICAgICBjb25zdCBqd3QgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIuand0O1xuICAgICAgICAgICAgcmVxdWVzdCA9IHJlcXVlc3QuY2xvbmUoe1xuICAgICAgICAgICAgICAgIHNldEhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2p3dH1gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXNzaW9uLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8vIGltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBFcnJvckludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgICAvKlxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGhTZXJ2aWNlOiBBdXRoZW50aWNhdGlvblNlcnZpY2UpIHtcbiAgICB9XG4qL1xuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpLnBpcGUoY2F0Y2hFcnJvcihlcnIgPT4ge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gLS0gZXJyb3IuaW50ZXJjZXB0b3InLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgLy8gYXV0byBsb2dvdXQgaWYgNDAxIHJlc3BvbnNlIHJldHVybmVkIGZyb20gYXBpXG4vLyAgICAgICAgICAgICAgICB0aGlzLl9hdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBsb2NhdGlvbi5yZWxvYWQgaXMgdXNlZCBmb3IgdGhlIGF1dGguZ3VhcmQgaW4gYXBwIHJvdXRpbmdcbiAgICAgICAgICAgICAgICAvLyB0byBnbyB0byB0aGUgbG9naW4gcGFnZVxuLy8gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZXJyLmVycm9yLm1lc3NhZ2UgfHwgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEt1aUNvcmVDb25maWcgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uU2VydmljZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB2YWxpZGF0ZSBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdFxuICAgICAqIGFuZCB0aGUgc2Vzc2lvbiBpcyBhY3RpdmVcbiAgICAgKi9cbiAgICBzZXNzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2dpbiBwcm9jZXNzO1xuICAgICAqIGl0J3MgdXNlZCBieSB0aGUgbG9naW4gY29tcG9uZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRlbnRpZmllciAoZW1haWwgb3IgdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBsb2dpbihpZGVudGlmaWVyOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nLFxuICAgICAgICAgICAge2lkZW50aWZpZXI6IGlkZW50aWZpZXIsIHBhc3N3b3JkOiBwYXNzd29yZH0sXG4gICAgICAgICAgICB7b2JzZXJ2ZTogJ3Jlc3BvbnNlJ30pLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKChyZXNwb25zZTogSHR0cFJlc3BvbnNlPGFueT4pOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIHJlcXVlc3QgZXJyb3IgaW4gY2FzZSBvZiBzZXJ2ZXIgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvclxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpOiBPYnNlcnZhYmxlPEFwaVNlcnZpY2VFcnJvcj4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlRXJyb3IgPSBuZXcgQXBpU2VydmljZUVycm9yKCk7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXMgPSBlcnJvci5zdGF0dXM7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXNUZXh0ID0gZXJyb3Iuc3RhdHVzVGV4dDtcbiAgICAgICAgc2VydmljZUVycm9yLmVycm9ySW5mbyA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIHNlcnZpY2VFcnJvci51cmwgPSBlcnJvci51cmw7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHNlcnZpY2VFcnJvcik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImlkZW50aWZpZXJcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLmlkZW50aWZpZXJcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIFBhc3N3b3JkIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+bG9jazwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IHR5cGU9XCJwYXNzd29yZFwiIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5wd1wiIGF1dG9jb21wbGV0ZT1cImN1cnJlbnQtcGFzc3dvcmRcIiBmb3JtQ29udHJvbE5hbWU9XCJwYXNzd29yZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMucGFzc3dvcmRcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIEJ1dHRvbjogTG9naW4gLS0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvbiB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cIiFmcm0udmFsaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIHN1Ym1pdC1idXR0b24gbWF0LXByaW1hcnlcIj5cbiAgICAgICAgICAgICAgICAgICAge3tsb2dpbi5idXR0b259fVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiIFtjb2xvcl09XCJjb2xvclwiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG48L2Rpdj5cblxuPCEtLSBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW47IHNob3cgd2hvIGl0IGlzIGFuZCBhIGxvZ291dCBidXR0b24gLS0+XG5cbjxkaXYgY2xhc3M9XCJsb2dvdXQtZm9ybVwiICpuZ0lmPVwibG9nZ2VkSW5Vc2VyXCI+XG4gICAgPHA+QSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOjwvcD5cbiAgICA8cD57e2xvZ2dlZEluVXNlcn19PC9wPlxuICAgIDxicj5cbiAgICA8cD5JZiBpdCdzIG5vdCB5b3UsIHBsZWFzZSBsb2dvdXQhPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvblxuICAgICAgICAgICAgICAgIChjbGljayk9XCJsb2dvdXQoKVwiXG4gICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIG1hdC13YXJuXCI+XG4gICAgICAgICAgICBMT0dPVVRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuYCxcbiAgICBzdHlsZXM6IFtgLmZ1bGwtd2lkdGh7d2lkdGg6MTAwJX0uYnV0dG9uLXJvdywubWF0LWZvcm0tZmllbGQsLm1hdC1oaW50e21hcmdpbi10b3A6MjRweH0ubWF0LWhpbnR7YmFja2dyb3VuZDpyZ2JhKDIzOSw4Myw4MCwuMzkpO2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6LTE2cHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtLC5sb2dvdXQtZm9ybXttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlciwubG9nb3V0LWZvcm0gLmxvZ2luLWZvcm0taGVhZGVye21hcmdpbi1ib3R0b206MjRweH0ubG9naW4tZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29uLC5sb2dvdXQtZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29ue2ZvbnQtc2l6ZToyMHB4O21hcmdpbi1yaWdodDoxMnB4fS5sb2dpbi1mb3JtIC5idXR0b24tcm93LC5sb2dvdXQtZm9ybSAuYnV0dG9uLXJvd3ttYXJnaW4tdG9wOjQ4cHh9LnNpZ24tdXB7bWFyZ2luLXRvcDoyNHB4fWBdXG59KVxuZXhwb3J0IGNsYXNzIExvZ2luRm9ybUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgICAvKipcbiAgICAgKiBuYXZpZ2F0ZSB0byB0aGUgZGVmaW5lZCB1cmwgYWZ0ZXIgbG9naW5cbiAgICAgKi9cbiAgICBASW5wdXQoKSBuYXZpZ2F0ZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIHNldCB5b3VyIHRoZW1lIGNvbG9yIGhlcmUsXG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBwcm9ncmVzcy1pbmRpY2F0b3JcbiAgICAgKi9cbiAgICBASW5wdXQoKSBjb2xvcj86IHN0cmluZztcblxuICAgIHJldHVyblVybDogc3RyaW5nO1xuXG4gICAgLy8gaXMgdGhlcmUgYWxyZWFkeSBhIHZhbGlkIHNlc3Npb24/XG4gICAgbG9nZ2VkSW5Vc2VyOiBzdHJpbmc7XG5cbiAgICAvLyBmb3JtXG4gICAgZnJtOiBGb3JtR3JvdXA7XG5cbiAgICBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAvLyBnZW5lcmFsIGVycm9yIG1lc3NhZ2VcbiAgICBlcnJvck1lc3NhZ2U6IGFueTtcblxuICAgIC8vIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzXG4gICAgbG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAvLyBsYWJlbHMgZm9yIHRoZSBsb2dpbiBmb3JtXG4gICAgbG9naW4gPSB7XG4gICAgICAgIHRpdGxlOiAnTG9naW4nLFxuICAgICAgICBuYW1lOiAnVXNlcm5hbWUnLFxuICAgICAgICBwdzogJ1Bhc3N3b3JkJyxcbiAgICAgICAgYnV0dG9uOiAnTG9naW4nLFxuICAgICAgICByZW1lbWJlcjogJ1JlbWVtYmVyIG1lJyxcbiAgICAgICAgZm9yZ290X3B3OiAnRm9yZ290IHBhc3N3b3JkPycsXG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBmYWlsZWQ6ICdQYXNzd29yZCBvciB1c2VybmFtZSBpcyB3cm9uZycsXG4gICAgICAgICAgICBzZXJ2ZXI6ICdUaGVyZVxcJ3MgYW4gZXJyb3Igd2l0aCB0aGUgc2VydmVyIGNvbm5lY3Rpb24uIFRyeSBpdCBhZ2FpbiBsYXRlciBvciBpbmZvcm0gdGhlIEtub3JhIFRlYW0nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgZGVmaW5pdGlvbnMgZm9yIHRoZSBmb2xsb3dpbmcgZm9ybSBmaWVsZHNcbiAgICBmb3JtRXJyb3JzID0ge1xuICAgICAgICAnaWRlbnRpZmllcic6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2lkZW50aWZpZXInOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAndXNlciBuYW1lIGlzIHJlcXVpcmVkLidcbiAgICAgICAgfSxcbiAgICAgICAgJ3Bhc3N3b3JkJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3Bhc3N3b3JkIGlzIHJlcXVpcmVkJ1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aDogQXV0aGVudGljYXRpb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2ZiOiBGb3JtQnVpbGRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZTogQWN0aXZhdGVkUm91dGUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGb3JtKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmZybSA9IHRoaXMuX2ZiLmdyb3VwKHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF0sXG4gICAgICAgICAgICBwYXNzd29yZDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZybS52YWx1ZUNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB0aGlzLm9uVmFsdWVDaGFuZ2VkKGRhdGEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBmb3IgZXJyb3JzIHdoaWxlIHVzaW5nIHRoZSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBvblZhbHVlQ2hhbmdlZChkYXRhPzogYW55KSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZybSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZnJtO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUVycm9ycykubWFwKGZpZWxkID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtLmdldChmaWVsZCk7XG4gICAgICAgICAgICBpZiAoY29udHJvbCAmJiBjb250cm9sLmRpcnR5ICYmICFjb250cm9sLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLnZhbGlkYXRpb25NZXNzYWdlc1tmaWVsZF07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29udHJvbC5lcnJvcnMpLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdICs9IG1lc3NhZ2VzW2tleV0gKyAnICc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRvTG9naW4oKSB7XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBmb3JtIHZhbHVlcyBhcmUgdmFsaWRcbiAgICAgICAgaWYgKHRoaXMuZnJtLmludmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgc3RhdHVzXG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gR3JhYiB2YWx1ZXMgZnJvbSBmb3JtXG4gICAgICAgIGNvbnN0IHVzZXJuYW1lID0gdGhpcy5mcm0uZ2V0KCdpZGVudGlmaWVyJykudmFsdWU7XG4gICAgICAgIGNvbnN0IHBhc3N3b3JkID0gdGhpcy5mcm0uZ2V0KCdwYXNzd29yZCcpLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuX2F1dGgubG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKVxuICAgICAgICAgICAgLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAocmVzcG9uc2U6IEFwaVNlcnZpY2VSZXN1bHQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIGEgdG9rZW47IHNldCB0aGUgc2Vzc2lvbiBub3dcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5zZXRTZXNzaW9uKHJlc3BvbnNlLmJvZHkudG9rZW4sIHVzZXJuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCByZXR1cm4gdXJsIGZyb20gcm91dGUgcGFyYW1ldGVycyBvciBkZWZhdWx0IHRvICcvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm5VcmwgPSB0aGlzLl9yb3V0ZS5zbmFwc2hvdC5xdWVyeVBhcmFtc1sncmV0dXJuVXJsJ10gfHwgJy8nO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIGJhY2sgdG8gdGhlIHByZXZpb3VzIHJvdXRlIG9yIHRvIHRoZSByb3V0ZSBkZWZpbmVkIGluIHRoZSBASW5wdXQgaWYgbmF2aWdhdGUgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubmF2aWdhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMucmV0dXJuVXJsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5uYXZpZ2F0ZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSA8YW55PiBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgdGhpcy5fYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IEh0dHBDbGllbnRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUmVhY3RpdmVGb3Jtc01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IE1hdEJ1dHRvbk1vZHVsZSwgTWF0Q2FyZE1vZHVsZSwgTWF0RGlhbG9nTW9kdWxlLCBNYXRGb3JtRmllbGRNb2R1bGUsIE1hdEljb25Nb2R1bGUsIE1hdElucHV0TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwnO1xuaW1wb3J0IHsgS3VpQWN0aW9uTW9kdWxlIH0gZnJvbSAnQGtub3JhL2FjdGlvbic7XG5cbmltcG9ydCB7IExvZ2luRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW1xuICAgICAgICBDb21tb25Nb2R1bGUsXG4gICAgICAgIEt1aUFjdGlvbk1vZHVsZSxcbiAgICAgICAgTWF0Q2FyZE1vZHVsZSxcbiAgICAgICAgTWF0SWNvbk1vZHVsZSxcbiAgICAgICAgTWF0SW5wdXRNb2R1bGUsXG4gICAgICAgIE1hdEJ1dHRvbk1vZHVsZSxcbiAgICAgICAgTWF0RGlhbG9nTW9kdWxlLFxuICAgICAgICBNYXRGb3JtRmllbGRNb2R1bGUsXG4gICAgICAgIFJlYWN0aXZlRm9ybXNNb2R1bGUsXG4gICAgICAgIEh0dHBDbGllbnRNb2R1bGVcbiAgICBdLFxuICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICBMb2dpbkZvcm1Db21wb25lbnRcbiAgICBdLFxuICAgIGV4cG9ydHM6IFtcbiAgICAgICAgTG9naW5Gb3JtQ29tcG9uZW50XG4gICAgXVxufSlcbmV4cG9ydCBjbGFzcyBLdWlBdXRoZW50aWNhdGlvbk1vZHVsZSB7XG59XG4iLCIvKlxuICogUHVibGljIEFQSSBTdXJmYWNlIG9mIGF1dGhlbnRpY2F0aW9uXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9saWIvZ3VhcmQvYXV0aC5ndWFyZCc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvYXV0aGVudGljYXRpb24ubW9kdWxlJztcbiIsIi8qKlxuICogR2VuZXJhdGVkIGJ1bmRsZSBpbmRleC4gRG8gbm90IGVkaXQuXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9wdWJsaWNfYXBpJztcblxuZXhwb3J0IHtTZXNzaW9uU2VydmljZSBhcyDDicK1YX0gZnJvbSAnLi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnOyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxJ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