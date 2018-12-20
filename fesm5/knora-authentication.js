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
            // console.log('authentication -- error.interceptor', err);
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

/**
 * Authentication service includes the login, logout method and a session method to check if a user is logged in or not.
 */
var AuthenticationService = /** @class */ (function () {
    function AuthenticationService(http, _session, config) {
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
    AuthenticationService.prototype.session = function () {
        return this._session.validateSession();
    };
    /**
     * login process;
     * it's used by the login component
     *
     * @param {string} identifier email or username
     * @param {string} password
     * @returns Observable<any>
     */
    AuthenticationService.prototype.login = function (identifier, password) {
        var _this = this;
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map(function (response) {
            return response;
        }), catchError(function (error) {
            return _this.handleRequestError(error);
        }));
    };
    /**
     * logout the user by destroying the session
     *
     * @param
     */
    AuthenticationService.prototype.logout = function () {
        // destroy the session
        localStorage.removeItem('session');
    };
    /**
     * @ignore
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
            'email': '',
            'password': ''
        };
        // error messages for the form fields defined in formErrors
        this.validationMessages = {
            'email': {
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
            email: ['', Validators.required],
            password: ['', Validators.required]
        });
        this.frm.valueChanges
            .subscribe(function (data) { return _this.onValueChanged(data); });
    };
    /**
     * @ignore
     *
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
        var username = this.frm.get('email').value;
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
                    template: "<div class=\"login-form\" *ngIf=\"!loggedInUser\">\n    <div class=\"login-form-header\">\n        <h3 mat-subheader>{{login.title}}</h3>\n    </div>\n    <div class=\"login-form-content\">\n        <!-- This is the login form -->\n        <form class=\"login-form\" [formGroup]=\"frm\" (ngSubmit)=\"doLogin()\">\n            <!-- Error message -->\n            <mat-hint *ngIf=\"errorMessage !== undefined\" class=\"full-width\">\n                <span *ngIf=\"loginErrorUser || loginErrorPw\">{{login.error.failed}}</span>\n                <span *ngIf=\"loginErrorServer\">{{login.error.server}}</span>\n            </mat-hint>\n\n            <!-- Username -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>person</mat-icon>\n                <input matInput autofocus [placeholder]=\"login.name\" autocomplete=\"username\" formControlName=\"email\">\n                <mat-hint *ngIf=\"formErrors.email\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Password -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>lock</mat-icon>\n                <input matInput type=\"password\" [placeholder]=\"login.pw\" autocomplete=\"current-password\" formControlName=\"password\">\n                <mat-hint *ngIf=\"formErrors.password\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Button: Login -->\n            <div class=\"button-row full-width\">\n                <button mat-raised-button type=\"submit\"\n                        *ngIf=\"!loading\"\n                        [disabled]=\"!frm.valid\"\n                        class=\"full-width submit-button mat-primary\">\n                    {{login.button}}\n                </button>\n                <kui-progress-indicator *ngIf=\"loading\" [color]=\"color\"></kui-progress-indicator>\n            </div>\n        </form>\n    </div>\n</div>\n\n<!-- a user is already logged in; show who it is and a logout button -->\n\n<div class=\"logout-form\" *ngIf=\"loggedInUser\">\n    <p>A user is already logged in:</p>\n    <p>{{loggedInUser}}</p>\n    <br>\n    <p>If it's not you, please logout!</p>\n    <div class=\"button-row full-width\">\n        <button mat-raised-button\n                (click)=\"logout()\"\n                *ngIf=\"!loading\"\n                class=\"full-width mat-warn\">\n            LOGOUT\n        </button>\n        <kui-progress-indicator *ngIf=\"loading\"></kui-progress-indicator>\n    </div>\n</div>\n",
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24uanMubWFwIiwic291cmNlcyI6WyJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvZ3VhcmQvYXV0aC5ndWFyZC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvYXV0aGVudGljYXRpb24uc2VydmljZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50LnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLm1vZHVsZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL3B1YmxpY19hcGkudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9rbm9yYS1hdXRoZW50aWNhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEtub3JhQ29uc3RhbnRzLCBLdWlDb3JlQ29uZmlnLCBTZXNzaW9uLCBVc2VyLCBVc2Vyc1NlcnZpY2UgfSBmcm9tICdAa25vcmEvY29yZSc7XG5cbmltcG9ydCAqIGFzIG1vbWVudEltcG9ydGVkIGZyb20gJ21vbWVudCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmNvbnN0IG1vbWVudCA9IG1vbWVudEltcG9ydGVkO1xuXG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgU2Vzc2lvblNlcnZpY2Uge1xuXG4gICAgcHVibGljIHNlc3Npb246IFNlc3Npb247XG5cbiAgICAvKipcbiAgICAgKiBtYXggc2Vzc2lvbiB0aW1lIGluIG1pbGxpc2Vjb25kc1xuICAgICAqIGRlZmF1bHQgdmFsdWUgKDI0aCk6IDg2NDAwMDAwXG4gICAgICpcbiAgICAgKi9cbiAgICByZWFkb25seSBNQVhfU0VTU0lPTl9USU1FOiBudW1iZXIgPSA4NjQwMDAwMDsgLy8gMWQgPSAyNCAqIDYwICogNjAgKiAxMDAwXG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBfaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZyxcbiAgICAgICAgcHJpdmF0ZSBfdXNlcnM6IFVzZXJzU2VydmljZSkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldCB0aGUgc2Vzc2lvbiBieSB1c2luZyB0aGUganNvbiB3ZWIgdG9rZW4gKGp3dCkgYW5kIHRoZSB1c2VyIG9iamVjdDtcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIGxvZ2luIHByb2Nlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSBqd3RcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICAgKi9cbiAgICBzZXRTZXNzaW9uKGp3dDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gZ2V0IHVzZXIgaW5mb3JtYXRpb25cbiAgICAgICAgdGhpcy5fdXNlcnMuZ2V0VXNlcih1c2VybmFtZSkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlc3VsdDogVXNlcikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzeXNBZG1pbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGVybWlzc2lvbnMgPSByZXN1bHQucGVybWlzc2lvbnM7XG4gICAgICAgICAgICAgICAgaWYgKHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3lzQWRtaW4gPSBwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldXG4gICAgICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihLbm9yYUNvbnN0YW50cy5TeXN0ZW1BZG1pbkdyb3VwSVJJKSA+IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBhIHNlc3Npb24gaWQsIHdoaWNoIGlzIHRoZSB0aW1lc3RhbXAgb2YgbG9naW5cbiAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnNldFRpbWVzdGFtcCgpLFxuICAgICAgICAgICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiByZXN1bHQudXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBqd3Q6IGp3dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmc6IHJlc3VsdC5sYW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3lzQWRtaW46IHN5c0FkbWluXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHN0b3JlIGluIHRoZSBsb2NhbFN0b3JhZ2VcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yOiBBcGlTZXJ2aWNlRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFRpbWVzdGFtcCgpIHtcbiAgICAgICAgcmV0dXJuIChtb21lbnQoKS5hZGQoMCwgJ3NlY29uZCcpKS52YWx1ZU9mKCk7XG4gICAgfVxuXG4gICAgZ2V0U2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHVwZGF0ZVNlc3Npb24oKSB7XG5cbiAgICB9XG5cbiAgICB2YWxpZGF0ZVNlc3Npb24oKSB7XG4gICAgICAgIC8vIG1peCBvZiBjaGVja3Mgd2l0aCBzZXNzaW9uLnZhbGlkYXRpb24gYW5kIHRoaXMuYXV0aGVudGljYXRlXG4gICAgICAgIHRoaXMuc2Vzc2lvbiA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSk7XG5cbiAgICAgICAgY29uc3QgdHNOb3c6IG51bWJlciA9IHRoaXMuc2V0VGltZXN0YW1wKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2Vzc2lvbikge1xuICAgICAgICAgICAgLy8gdGhlIHNlc3Npb24gZXhpc3RzXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgc2Vzc2lvbiBpcyBzdGlsbCB2YWxpZDpcbiAgICAgICAgICAgIC8vIGlmIHNlc3Npb24uaWQgKyBNQVhfU0VTU0lPTl9USU1FID4gbm93OiBfc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKVxuICAgICAgICAgICAgaWYgKHRoaXMuc2Vzc2lvbi5pZCArIHRoaXMuTUFYX1NFU1NJT05fVElNRSA8IHRzTm93KSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGludGVybmFsIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgYXBpIHYyL2F1dGhlbnRpY2F0aW9uIGlzIHN0aWxsIHZhbGlkXG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRoZW50aWNhdGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgYXBpIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkO1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHNlc3Npb24uaWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uLmlkID0gdHNOb3c7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb24nLCBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24pKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKCdzZXNzaW9uLnNlcnZpY2UgLS0gdmFsaWRhdGVTZXNzaW9uIC0tIGF1dGhlbnRpY2F0ZTogdGhlIHNlc3Npb24gZXhwaXJlZCBvbiBBUEkgc2lkZScpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhIHVzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQgYW55bW9yZSFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95U2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYXV0aGVudGljYXRlKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faHR0cC5nZXQodGhpcy5jb25maWcuYXBpICsgJy92Mi9hdXRoZW50aWNhdGlvbicpLnBpcGUoXG4gICAgICAgICAgICBtYXAoKHJlc3VsdDogYW55KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRpb25TZXJ2aWNlIC0gYXV0aGVudGljYXRlIC0gcmVzdWx0OiAnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0cnVlIHx8IGZhbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMgPT09IDIwMDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZGVzdHJveVNlc3Npb24oKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgfVxuXG5cbn1cbiIsImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIENhbkFjdGl2YXRlLCBSb3V0ZXIsIFJvdXRlclN0YXRlU25hcHNob3QgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgQXV0aEd1YXJkIGltcGxlbWVudHMgQ2FuQWN0aXZhdGUge1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcblxuICAgIH1cblxuICAgIGNhbkFjdGl2YXRlKFxuICAgICAgICBuZXh0OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LFxuICAgICAgICBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdCk6IE9ic2VydmFibGU8Ym9vbGVhbj4gfCBQcm9taXNlPGJvb2xlYW4+IHwgYm9vbGVhbiB7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoWydsb2dpbiddLCB7cXVlcnlQYXJhbXM6IHtyZXR1cm5Vcmw6IHN0YXRlLnVybH19KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgSnd0SW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UpIHtcbiAgICB9XG5cbiAgICBpbnRlcmNlcHQocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PiwgbmV4dDogSHR0cEhhbmRsZXIpOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgICAgIC8vIGFkZCBhdXRob3JpemF0aW9uIGhlYWRlciB3aXRoIGp3dCB0b2tlbiBpZiBhdmFpbGFibGVcblxuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgLy8gdGhlIHNlc3Npb24gaXMgdmFsaWQgKGFuZCB1cCB0byBkYXRlKVxuICAgICAgICAgICAgY29uc3Qgand0ID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLmp3dDtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0LmNsb25lKHtcbiAgICAgICAgICAgICAgICBzZXRIZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtqd3R9YFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5kZXN0cm95U2Vzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vLyBpbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRXJyb3JJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG4gICAgLypcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hdXRoU2VydmljZTogQXV0aGVudGljYXRpb25TZXJ2aWNlKSB7XG4gICAgfVxuKi9cbiAgICBpbnRlcmNlcHQocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PiwgbmV4dDogSHR0cEhhbmRsZXIpOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgICAgIHJldHVybiBuZXh0LmhhbmRsZShyZXF1ZXN0KS5waXBlKGNhdGNoRXJyb3IoZXJyID0+IHtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2F1dGhlbnRpY2F0aW9uIC0tIGVycm9yLmludGVyY2VwdG9yJywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgIC8vIGF1dG8gbG9nb3V0IGlmIDQwMSByZXNwb25zZSByZXR1cm5lZCBmcm9tIGFwaVxuLy8gICAgICAgICAgICAgICAgdGhpcy5fYXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgbG9jYXRpb24ucmVsb2FkIGlzIHVzZWQgZm9yIHRoZSBhdXRoLmd1YXJkIGluIGFwcCByb3V0aW5nXG4gICAgICAgICAgICAgICAgLy8gdG8gZ28gdG8gdGhlIGxvZ2luIHBhZ2Vcbi8vICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IGVyci5lcnJvci5tZXNzYWdlIHx8IGVyci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZXJyb3IpO1xuICAgICAgICB9KSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSHR0cENsaWVudCwgSHR0cEVycm9yUmVzcG9uc2UsIEh0dHBSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLdWlDb3JlQ29uZmlnIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciwgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuLyoqXG4gKiBBdXRoZW50aWNhdGlvbiBzZXJ2aWNlIGluY2x1ZGVzIHRoZSBsb2dpbiwgbG9nb3V0IG1ldGhvZCBhbmQgYSBzZXNzaW9uIG1ldGhvZCB0byBjaGVjayBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdC5cbiAqL1xuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvblNlcnZpY2Uge1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZykge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHZhbGlkYXRlIGlmIGEgdXNlciBpcyBsb2dnZWQgaW4gb3Igbm90XG4gICAgICogcmV0dXJucyB0cnVlIGlmIHRoZSBzZXNzaW9uIGlzIGFjdGl2ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIHNlc3Npb24oKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvZ2luIHByb2Nlc3M7XG4gICAgICogaXQncyB1c2VkIGJ5IHRoZSBsb2dpbiBjb21wb25lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZGVudGlmaWVyIGVtYWlsIG9yIHVzZXJuYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkXG4gICAgICogQHJldHVybnMgT2JzZXJ2YWJsZTxhbnk+XG4gICAgICovXG4gICAgbG9naW4oaWRlbnRpZmllcjogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogT2JzZXJ2YWJsZTxhbnk+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5odHRwLnBvc3QoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgICAgIHtpZGVudGlmaWVyOiBpZGVudGlmaWVyLCBwYXNzd29yZDogcGFzc3dvcmR9LFxuICAgICAgICAgICAge29ic2VydmU6ICdyZXNwb25zZSd9KS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcCgocmVzcG9uc2U6IEh0dHBSZXNwb25zZTxhbnk+KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBsb2dvdXQgdGhlIHVzZXIgYnkgZGVzdHJveWluZyB0aGUgc2Vzc2lvblxuICAgICAqXG4gICAgICogQHBhcmFtXG4gICAgICovXG4gICAgbG9nb3V0KCkge1xuICAgICAgICAvLyBkZXN0cm95IHRoZSBzZXNzaW9uXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBAaWdub3JlXG4gICAgICogaGFuZGxlIHJlcXVlc3QgZXJyb3IgaW4gY2FzZSBvZiBzZXJ2ZXIgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvclxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpOiBPYnNlcnZhYmxlPEFwaVNlcnZpY2VFcnJvcj4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlRXJyb3IgPSBuZXcgQXBpU2VydmljZUVycm9yKCk7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXMgPSBlcnJvci5zdGF0dXM7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXNUZXh0ID0gZXJyb3Iuc3RhdHVzVGV4dDtcbiAgICAgICAgc2VydmljZUVycm9yLmVycm9ySW5mbyA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIHNlcnZpY2VFcnJvci51cmwgPSBlcnJvci51cmw7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHNlcnZpY2VFcnJvcik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImVtYWlsXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5lbWFpbFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gUGFzc3dvcmQgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5sb2NrPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgW3BsYWNlaG9sZGVyXT1cImxvZ2luLnB3XCIgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIGZvcm1Db250cm9sTmFtZT1cInBhc3N3b3JkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5wYXNzd29yZFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gQnV0dG9uOiBMb2dpbiAtLT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIWZybS52YWxpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggc3VibWl0LWJ1dHRvbiBtYXQtcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICB7e2xvZ2luLmJ1dHRvbn19XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCIgW2NvbG9yXT1cImNvbG9yXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48IS0tIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjsgc2hvdyB3aG8gaXQgaXMgYW5kIGEgbG9nb3V0IGJ1dHRvbiAtLT5cblxuPGRpdiBjbGFzcz1cImxvZ291dC1mb3JtXCIgKm5nSWY9XCJsb2dnZWRJblVzZXJcIj5cbiAgICA8cD5BIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW46PC9wPlxuICAgIDxwPnt7bG9nZ2VkSW5Vc2VyfX08L3A+XG4gICAgPGJyPlxuICAgIDxwPklmIGl0J3Mgbm90IHlvdSwgcGxlYXNlIGxvZ291dCE8L3A+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uXG4gICAgICAgICAgICAgICAgKGNsaWNrKT1cImxvZ291dCgpXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggbWF0LXdhcm5cIj5cbiAgICAgICAgICAgIExPR09VVFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5gLFxuICAgIHN0eWxlczogW2AuZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5idXR0b24tcm93LC5tYXQtZm9ybS1maWVsZCwubWF0LWhpbnR7bWFyZ2luLXRvcDoyNHB4fS5tYXQtaGludHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDgzLDgwLC4zOSk7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDotMTZweDtwYWRkaW5nOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0sLmxvZ291dC1mb3Jte21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZvcm0taGVhZGVyLC5sb2dvdXQtZm9ybSAubG9naW4tZm9ybS1oZWFkZXJ7bWFyZ2luLWJvdHRvbToyNHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb24sLmxvZ291dC1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb257Zm9udC1zaXplOjIwcHg7bWFyZ2luLXJpZ2h0OjEycHh9LmxvZ2luLWZvcm0gLmJ1dHRvbi1yb3csLmxvZ291dC1mb3JtIC5idXR0b24tcm93e21hcmdpbi10b3A6NDhweH0uc2lnbi11cHttYXJnaW4tdG9wOjI0cHh9YF1cbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Gb3JtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmF2aWdhdGVdXG4gICAgICogbmF2aWdhdGUgdG8gdGhlIGRlZmluZWQgdXJsIGFmdGVyIHN1Y2Nlc3NmdWwgbG9naW5cbiAgICAgKi9cbiAgICBASW5wdXQoKSBuYXZpZ2F0ZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29sb3JdXG4gICAgICogc2V0IHlvdXIgdGhlbWUgY29sb3IgaGVyZSxcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2dyZXNzLWluZGljYXRvclxuICAgICAqL1xuICAgIEBJbnB1dCgpIGNvbG9yPzogc3RyaW5nO1xuXG4gICAgcmV0dXJuVXJsOiBzdHJpbmc7XG5cbiAgICAvLyBpcyB0aGVyZSBhbHJlYWR5IGEgdmFsaWQgc2Vzc2lvbj9cbiAgICBsb2dnZWRJblVzZXI6IHN0cmluZztcblxuICAgIC8vIGZvcm1cbiAgICBmcm06IEZvcm1Hcm91cDtcblxuICAgIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGdlbmVyYWwgZXJyb3IgbWVzc2FnZVxuICAgIGVycm9yTWVzc2FnZTogYW55O1xuXG4gICAgLy8gc3BlY2lmaWMgZXJyb3IgbWVzc2FnZXNcbiAgICBsb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgIC8vIGxhYmVscyBmb3IgdGhlIGxvZ2luIGZvcm1cbiAgICBsb2dpbiA9IHtcbiAgICAgICAgdGl0bGU6ICdMb2dpbicsXG4gICAgICAgIG5hbWU6ICdVc2VybmFtZScsXG4gICAgICAgIHB3OiAnUGFzc3dvcmQnLFxuICAgICAgICBidXR0b246ICdMb2dpbicsXG4gICAgICAgIHJlbWVtYmVyOiAnUmVtZW1iZXIgbWUnLFxuICAgICAgICBmb3Jnb3RfcHc6ICdGb3Jnb3QgcGFzc3dvcmQ/JyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIGZhaWxlZDogJ1Bhc3N3b3JkIG9yIHVzZXJuYW1lIGlzIHdyb25nJyxcbiAgICAgICAgICAgIHNlcnZlcjogJ1RoZXJlXFwncyBhbiBlcnJvciB3aXRoIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbi4gVHJ5IGl0IGFnYWluIGxhdGVyIG9yIGluZm9ybSB0aGUgS25vcmEgVGVhbSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBlcnJvciBkZWZpbml0aW9ucyBmb3IgdGhlIGZvbGxvd2luZyBmb3JtIGZpZWxkc1xuICAgIGZvcm1FcnJvcnMgPSB7XG4gICAgICAgICdlbWFpbCc6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2VtYWlsJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3VzZXIgbmFtZSBpcyByZXF1aXJlZC4nXG4gICAgICAgIH0sXG4gICAgICAgICdwYXNzd29yZCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICdwYXNzd29yZCBpcyByZXF1aXJlZCdcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGg6IEF1dGhlbnRpY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9mYjogRm9ybUJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG4gICAgfVxuXG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGb3JtKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmZybSA9IHRoaXMuX2ZiLmdyb3VwKHtcbiAgICAgICAgICAgIGVtYWlsOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcm0udmFsdWVDaGFuZ2VzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gdGhpcy5vblZhbHVlQ2hhbmdlZChkYXRhKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGlnbm9yZVxuICAgICAqXG4gICAgICogY2hlY2sgZm9yIGVycm9ycyB3aGlsZSB1c2luZyB0aGUgZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgb25WYWx1ZUNoYW5nZWQoZGF0YT86IGFueSkge1xuXG4gICAgICAgIGlmICghdGhpcy5mcm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLmZybTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1FcnJvcnMpLm1hcChmaWVsZCA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdID0gJyc7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybS5nZXQoZmllbGQpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2wgJiYgY29udHJvbC5kaXJ0eSAmJiAhY29udHJvbC52YWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy52YWxpZGF0aW9uTWVzc2FnZXNbZmllbGRdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2wuZXJyb3JzKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSArPSBtZXNzYWdlc1trZXldICsgJyAnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkb0xvZ2luKCkge1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBlcnJvciBtZXNzYWdlc1xuICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSB2YWx1ZXMgYXJlIHZhbGlkXG4gICAgICAgIGlmICh0aGlzLmZybS5pbnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlc2V0IHN0YXR1c1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIEdyYWIgdmFsdWVzIGZyb20gZm9ybVxuICAgICAgICBjb25zdCB1c2VybmFtZSA9IHRoaXMuZnJtLmdldCgnZW1haWwnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSB0aGlzLmZybS5nZXQoJ3Bhc3N3b3JkJykudmFsdWU7XG5cbiAgICAgICAgdGhpcy5fYXV0aC5sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgIChyZXNwb25zZTogQXBpU2VydmljZVJlc3VsdCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB0b2tlbjsgc2V0IHRoZSBzZXNzaW9uIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXNzaW9uLnNldFNlc3Npb24ocmVzcG9uc2UuYm9keS50b2tlbiwgdXNlcm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHJldHVybiB1cmwgZnJvbSByb3V0ZSBwYXJhbWV0ZXJzIG9yIGRlZmF1bHQgdG8gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblVybCA9IHRoaXMuX3JvdXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zWydyZXR1cm5VcmwnXSB8fCAnLyc7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gYmFjayB0byB0aGUgcHJldmlvdXMgcm91dGUgb3IgdG8gdGhlIHJvdXRlIGRlZmluZWQgaW4gdGhlIEBJbnB1dCBpZiBuYXZpZ2F0ZSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5uYXZpZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5yZXR1cm5VcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLm5hdmlnYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IDxhbnk+IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICB0aGlzLl9hdXRoLmxvZ291dCgpO1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgSHR0cENsaWVudE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBSZWFjdGl2ZUZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgTWF0QnV0dG9uTW9kdWxlLCBNYXRDYXJkTW9kdWxlLCBNYXREaWFsb2dNb2R1bGUsIE1hdEZvcm1GaWVsZE1vZHVsZSwgTWF0SWNvbk1vZHVsZSwgTWF0SW5wdXRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbCc7XG5pbXBvcnQgeyBLdWlBY3Rpb25Nb2R1bGUgfSBmcm9tICdAa25vcmEvYWN0aW9uJztcblxuaW1wb3J0IHsgTG9naW5Gb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50JztcblxuQE5nTW9kdWxlKHtcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIENvbW1vbk1vZHVsZSxcbiAgICAgICAgS3VpQWN0aW9uTW9kdWxlLFxuICAgICAgICBNYXRDYXJkTW9kdWxlLFxuICAgICAgICBNYXRJY29uTW9kdWxlLFxuICAgICAgICBNYXRJbnB1dE1vZHVsZSxcbiAgICAgICAgTWF0QnV0dG9uTW9kdWxlLFxuICAgICAgICBNYXREaWFsb2dNb2R1bGUsXG4gICAgICAgIE1hdEZvcm1GaWVsZE1vZHVsZSxcbiAgICAgICAgUmVhY3RpdmVGb3Jtc01vZHVsZSxcbiAgICAgICAgSHR0cENsaWVudE1vZHVsZVxuICAgIF0sXG4gICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgIExvZ2luRm9ybUNvbXBvbmVudFxuICAgIF0sXG4gICAgZXhwb3J0czogW1xuICAgICAgICBMb2dpbkZvcm1Db21wb25lbnRcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIEt1aUF1dGhlbnRpY2F0aW9uTW9kdWxlIHtcbn1cbiIsIi8qXG4gKiBQdWJsaWMgQVBJIFN1cmZhY2Ugb2YgYXV0aGVudGljYXRpb25cbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2xpYi9ndWFyZC9hdXRoLmd1YXJkJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2ludGVyY2VwdG9yL2p3dC5pbnRlcmNlcHRvcic7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9pbnRlcmNlcHRvci9lcnJvci5pbnRlcmNlcHRvcic7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50JztcblxuZXhwb3J0ICogZnJvbSAnLi9saWIvYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9hdXRoZW50aWNhdGlvbi5tb2R1bGUnO1xuIiwiLyoqXG4gKiBHZW5lcmF0ZWQgYnVuZGxlIGluZGV4LiBEbyBub3QgZWRpdC5cbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL3B1YmxpY19hcGknO1xuXG5leHBvcnQge1Nlc3Npb25TZXJ2aWNlIGFzIMOJwrVhfSBmcm9tICcuL2xpYi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLElBQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUc5QjtJQWNJLHdCQUNZLEtBQWlCLEVBQ0EsTUFBcUIsRUFDdEMsTUFBb0I7UUFGcEIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNBLFdBQU0sR0FBTixNQUFNLENBQWU7UUFDdEMsV0FBTSxHQUFOLE1BQU0sQ0FBYzs7Ozs7O1FBTHZCLHFCQUFnQixHQUFXLFFBQVEsQ0FBQztLQU01Qzs7Ozs7Ozs7SUFTRCxtQ0FBVSxHQUFWLFVBQVcsR0FBVyxFQUFFLFFBQWdCO1FBQXhDLGlCQStCQzs7UUE1QkcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUNuQyxVQUFDLE1BQVk7WUFDVCxJQUFJLFFBQVEsR0FBWSxLQUFLLENBQUM7WUFFOUIsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUN2QyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDL0QsUUFBUSxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUM7cUJBQ25FLE9BQU8sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN6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