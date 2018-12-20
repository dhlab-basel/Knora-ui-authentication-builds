(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common/http'), require('@angular/core'), require('@knora/core'), require('moment'), require('rxjs/operators'), require('@angular/router'), require('rxjs'), require('@angular/forms'), require('@angular/common'), require('@angular/material'), require('@knora/action')) :
    typeof define === 'function' && define.amd ? define('@knora/authentication', ['exports', '@angular/common/http', '@angular/core', '@knora/core', 'moment', 'rxjs/operators', '@angular/router', 'rxjs', '@angular/forms', '@angular/common', '@angular/material', '@knora/action'], factory) :
    (factory((global.knora = global.knora || {}, global.knora.authentication = {}),global.ng.common.http,global.ng.core,null,null,global.rxjs.operators,global.ng.router,global.rxjs,global.ng.forms,global.ng.common,global.ng.material,null));
}(this, (function (exports,i1,i0,i2,momentImported,operators,i2$1,rxjs,forms,common,material,action) { 'use strict';

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
                if (permissions.groupsPerProject[i2.KnoraConstants.SystemProjectIRI]) {
                    sysAdmin = permissions.groupsPerProject[i2.KnoraConstants.SystemProjectIRI]
                        .indexOf(i2.KnoraConstants.SystemAdminGroupIRI) > -1;
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
            return this._http.get(this.config.api + '/v2/authentication').pipe(operators.map(function (result) {
                console.log('AuthenticationService - authenticate - result: ', result);
                // return true || false
                return result.status === 200;
            }));
        };
        SessionService.prototype.destroySession = function () {
            localStorage.removeItem('session');
        };
        SessionService.decorators = [
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] },
        ];
        /** @nocollapse */
        SessionService.ctorParameters = function () {
            return [
                { type: i1.HttpClient },
                { type: i2.KuiCoreConfig, decorators: [{ type: i0.Inject, args: ['config',] }] },
                { type: i2.UsersService }
            ];
        };
        SessionService.ngInjectableDef = i0.defineInjectable({ factory: function SessionService_Factory() { return new SessionService(i0.inject(i1.HttpClient), i0.inject("config"), i0.inject(i2.UsersService)); }, token: SessionService, providedIn: "root" });
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
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] },
        ];
        /** @nocollapse */
        AuthGuard.ctorParameters = function () {
            return [
                { type: SessionService },
                { type: i2$1.Router }
            ];
        };
        AuthGuard.ngInjectableDef = i0.defineInjectable({ factory: function AuthGuard_Factory() { return new AuthGuard(i0.inject(SessionService), i0.inject(i2$1.Router)); }, token: AuthGuard, providedIn: "root" });
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
            { type: i0.Injectable },
        ];
        /** @nocollapse */
        JwtInterceptor.ctorParameters = function () {
            return [
                { type: SessionService }
            ];
        };
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
            return next.handle(request).pipe(operators.catchError(function (err) {
                // console.log('authentication -- error.interceptor', err);
                if (err.status === 401) ;
                var error = err.error.message || err.statusText;
                return rxjs.throwError(error);
            }));
        };
        ErrorInterceptor.decorators = [
            { type: i0.Injectable },
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
            return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(operators.map(function (response) {
                return response;
            }), operators.catchError(function (error) {
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
            var serviceError = new i2.ApiServiceError();
            serviceError.status = error.status;
            serviceError.statusText = error.statusText;
            serviceError.errorInfo = error.message;
            serviceError.url = error.url;
            return rxjs.throwError(serviceError);
        };
        AuthenticationService.decorators = [
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] },
        ];
        /** @nocollapse */
        AuthenticationService.ctorParameters = function () {
            return [
                { type: i1.HttpClient },
                { type: SessionService },
                { type: i2.KuiCoreConfig, decorators: [{ type: i0.Inject, args: ['config',] }] }
            ];
        };
        AuthenticationService.ngInjectableDef = i0.defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(i0.inject(i1.HttpClient), i0.inject(SessionService), i0.inject("config")); }, token: AuthenticationService, providedIn: "root" });
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
                email: ['', forms.Validators.required],
                password: ['', forms.Validators.required]
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
            { type: i0.Component, args: [{
                        selector: 'kui-login-form',
                        template: "<div class=\"login-form\" *ngIf=\"!loggedInUser\">\n    <div class=\"login-form-header\">\n        <h3 mat-subheader>{{login.title}}</h3>\n    </div>\n    <div class=\"login-form-content\">\n        <!-- This is the login form -->\n        <form class=\"login-form\" [formGroup]=\"frm\" (ngSubmit)=\"doLogin()\">\n            <!-- Error message -->\n            <mat-hint *ngIf=\"errorMessage !== undefined\" class=\"full-width\">\n                <span *ngIf=\"loginErrorUser || loginErrorPw\">{{login.error.failed}}</span>\n                <span *ngIf=\"loginErrorServer\">{{login.error.server}}</span>\n            </mat-hint>\n\n            <!-- Username -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>person</mat-icon>\n                <input matInput autofocus [placeholder]=\"login.name\" autocomplete=\"username\" formControlName=\"email\">\n                <mat-hint *ngIf=\"formErrors.email\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Password -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>lock</mat-icon>\n                <input matInput type=\"password\" [placeholder]=\"login.pw\" autocomplete=\"current-password\" formControlName=\"password\">\n                <mat-hint *ngIf=\"formErrors.password\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Button: Login -->\n            <div class=\"button-row full-width\">\n                <button mat-raised-button type=\"submit\"\n                        *ngIf=\"!loading\"\n                        [disabled]=\"!frm.valid\"\n                        class=\"full-width submit-button mat-primary\">\n                    {{login.button}}\n                </button>\n                <kui-progress-indicator *ngIf=\"loading\" [color]=\"color\"></kui-progress-indicator>\n            </div>\n        </form>\n    </div>\n</div>\n\n<!-- a user is already logged in; show who it is and a logout button -->\n\n<div class=\"logout-form\" *ngIf=\"loggedInUser\">\n    <p>A user is already logged in:</p>\n    <p>{{loggedInUser}}</p>\n    <br>\n    <p>If it's not you, please logout!</p>\n    <div class=\"button-row full-width\">\n        <button mat-raised-button\n                (click)=\"logout()\"\n                *ngIf=\"!loading\"\n                class=\"full-width mat-warn\">\n            LOGOUT\n        </button>\n        <kui-progress-indicator *ngIf=\"loading\"></kui-progress-indicator>\n    </div>\n</div>\n",
                        styles: [".full-width{width:100%}.button-row,.mat-form-field,.mat-hint{margin-top:24px}.mat-hint{background:rgba(239,83,80,.39);display:block;margin-left:-16px;padding:16px;text-align:center;width:280px}.login-form,.logout-form{margin-left:auto;margin-right:auto;position:relative;width:280px}.login-form .login-form-header,.logout-form .login-form-header{margin-bottom:24px}.login-form .login-field .mat-icon,.logout-form .login-field .mat-icon{font-size:20px;margin-right:12px}.login-form .button-row,.logout-form .button-row{margin-top:48px}.sign-up{margin-top:24px}"]
                    },] },
        ];
        /** @nocollapse */
        LoginFormComponent.ctorParameters = function () {
            return [
                { type: AuthenticationService },
                { type: SessionService },
                { type: forms.FormBuilder },
                { type: i2$1.ActivatedRoute },
                { type: i2$1.Router }
            ];
        };
        LoginFormComponent.propDecorators = {
            navigate: [{ type: i0.Input }],
            color: [{ type: i0.Input }]
        };
        return LoginFormComponent;
    }());

    var KuiAuthenticationModule = /** @class */ (function () {
        function KuiAuthenticationModule() {
        }
        KuiAuthenticationModule.decorators = [
            { type: i0.NgModule, args: [{
                        imports: [
                            common.CommonModule,
                            action.KuiActionModule,
                            material.MatCardModule,
                            material.MatIconModule,
                            material.MatInputModule,
                            material.MatButtonModule,
                            material.MatDialogModule,
                            material.MatFormFieldModule,
                            forms.ReactiveFormsModule,
                            i1.HttpClientModule
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

    exports.ɵa = SessionService;
    exports.AuthGuard = AuthGuard;
    exports.JwtInterceptor = JwtInterceptor;
    exports.ErrorInterceptor = ErrorInterceptor;
    exports.LoginFormComponent = LoginFormComponent;
    exports.AuthenticationService = AuthenticationService;
    exports.KuiAuthenticationModule = KuiAuthenticationModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24udW1kLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2d1YXJkL2F1dGguZ3VhcmQudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9hdXRoZW50aWNhdGlvbi5tb2R1bGUudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9wdWJsaWNfYXBpLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24va25vcmEtYXV0aGVudGljYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLbm9yYUNvbnN0YW50cywgS3VpQ29yZUNvbmZpZywgU2Vzc2lvbiwgVXNlciwgVXNlcnNTZXJ2aWNlIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuXG5pbXBvcnQgKiBhcyBtb21lbnRJbXBvcnRlZCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5jb25zdCBtb21lbnQgPSBtb21lbnRJbXBvcnRlZDtcblxuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFNlc3Npb25TZXJ2aWNlIHtcblxuICAgIHB1YmxpYyBzZXNzaW9uOiBTZXNzaW9uO1xuXG4gICAgLyoqXG4gICAgICogbWF4IHNlc3Npb24gdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICAgKiBkZWZhdWx0IHZhbHVlICgyNGgpOiA4NjQwMDAwMFxuICAgICAqXG4gICAgICovXG4gICAgcmVhZG9ubHkgTUFYX1NFU1NJT05fVElNRTogbnVtYmVyID0gODY0MDAwMDA7IC8vIDFkID0gMjQgKiA2MCAqIDYwICogMTAwMFxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgX2h0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcsXG4gICAgICAgIHByaXZhdGUgX3VzZXJzOiBVc2Vyc1NlcnZpY2UpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHNlc3Npb24gYnkgdXNpbmcgdGhlIGpzb24gd2ViIHRva2VuIChqd3QpIGFuZCB0aGUgdXNlciBvYmplY3Q7XG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBsb2dpbiBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gand0XG4gICAgICogQHBhcmFtIHVzZXJuYW1lXG4gICAgICovXG4gICAgc2V0U2Vzc2lvbihqd3Q6IHN0cmluZywgdXNlcm5hbWU6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGdldCB1c2VyIGluZm9ybWF0aW9uXG4gICAgICAgIHRoaXMuX3VzZXJzLmdldFVzZXIodXNlcm5hbWUpLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZXN1bHQ6IFVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3lzQWRtaW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gcmVzdWx0LnBlcm1pc3Npb25zO1xuICAgICAgICAgICAgICAgIGlmIChwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5c0FkbWluID0gcGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXVxuICAgICAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoS25vcmFDb25zdGFudHMuU3lzdGVtQWRtaW5Hcm91cElSSSkgPiAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgYSBzZXNzaW9uIGlkLCB3aGljaCBpcyB0aGUgdGltZXN0YW1wIG9mIGxvZ2luXG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogdGhpcy5zZXRUaW1lc3RhbXAoKSxcbiAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmVzdWx0LnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgand0OiBqd3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiByZXN1bHQubGFuZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5c0FkbWluOiBzeXNBZG1pblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzdG9yZSBpbiB0aGUgbG9jYWxTdG9yYWdlXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb24nLCBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24pKTtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUaW1lc3RhbXAoKSB7XG4gICAgICAgIHJldHVybiAobW9tZW50KCkuYWRkKDAsICdzZWNvbmQnKSkudmFsdWVPZigpO1xuICAgIH1cblxuICAgIGdldFNlc3Npb24oKSB7XG5cbiAgICB9XG5cbiAgICB1cGRhdGVTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdmFsaWRhdGVTZXNzaW9uKCkge1xuICAgICAgICAvLyBtaXggb2YgY2hlY2tzIHdpdGggc2Vzc2lvbi52YWxpZGF0aW9uIGFuZCB0aGlzLmF1dGhlbnRpY2F0ZVxuICAgICAgICB0aGlzLnNlc3Npb24gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpO1xuXG4gICAgICAgIGNvbnN0IHRzTm93OiBudW1iZXIgPSB0aGlzLnNldFRpbWVzdGFtcCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnNlc3Npb24pIHtcbiAgICAgICAgICAgIC8vIHRoZSBzZXNzaW9uIGV4aXN0c1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHNlc3Npb24gaXMgc3RpbGwgdmFsaWQ6XG4gICAgICAgICAgICAvLyBpZiBzZXNzaW9uLmlkICsgTUFYX1NFU1NJT05fVElNRSA+IG5vdzogX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKClcbiAgICAgICAgICAgIGlmICh0aGlzLnNlc3Npb24uaWQgKyB0aGlzLk1BWF9TRVNTSU9OX1RJTUUgPCB0c05vdykge1xuICAgICAgICAgICAgICAgIC8vIHRoZSBpbnRlcm5hbCBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGFwaSB2Mi9hdXRoZW50aWNhdGlvbiBpcyBzdGlsbCB2YWxpZFxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXV0aGVudGljYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFwaSBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzZXNzaW9uLmlkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbi5pZCA9IHRzTm93O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcignc2Vzc2lvbi5zZXJ2aWNlIC0tIHZhbGlkYXRlU2Vzc2lvbiAtLSBhdXRoZW50aWNhdGU6IHRoZSBzZXNzaW9uIGV4cGlyZWQgb24gQVBJIHNpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYSB1c2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkIGFueW1vcmUhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveVNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGF1dGhlbnRpY2F0ZSgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2h0dHAuZ2V0KHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nKS5waXBlKFxuICAgICAgICAgICAgbWFwKChyZXN1bHQ6IGFueSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1dGhlbnRpY2F0aW9uU2VydmljZSAtIGF1dGhlbnRpY2F0ZSAtIHJlc3VsdDogJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdHJ1ZSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuc3RhdHVzID09PSAyMDA7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGRlc3Ryb3lTZXNzaW9uKCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG59XG4iLCJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBDYW5BY3RpdmF0ZSwgUm91dGVyLCBSb3V0ZXJTdGF0ZVNuYXBzaG90IH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG5cbiAgICB9XG5cbiAgICBjYW5BY3RpdmF0ZShcbiAgICAgICAgbmV4dDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgICAgICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHwgUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW4ge1xuXG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFsnbG9naW4nXSwge3F1ZXJ5UGFyYW1zOiB7cmV0dXJuVXJsOiBzdGF0ZS51cmx9fSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEp3dEludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlKSB7XG4gICAgfVxuXG4gICAgaW50ZXJjZXB0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgICAgICAvLyBhZGQgYXV0aG9yaXphdGlvbiBoZWFkZXIgd2l0aCBqd3QgdG9rZW4gaWYgYXZhaWxhYmxlXG5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIC8vIHRoZSBzZXNzaW9uIGlzIHZhbGlkIChhbmQgdXAgdG8gZGF0ZSlcbiAgICAgICAgICAgIGNvbnN0IGp3dCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5qd3Q7XG4gICAgICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdC5jbG9uZSh7XG4gICAgICAgICAgICAgICAgc2V0SGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7and0fWBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Nlc3Npb24uZGVzdHJveVNlc3Npb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXh0LmhhbmRsZShyZXF1ZXN0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLy8gaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEVycm9ySW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuICAgIC8qXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aFNlcnZpY2U6IEF1dGhlbnRpY2F0aW9uU2VydmljZSkge1xuICAgIH1cbiovXG4gICAgaW50ZXJjZXB0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCkucGlwZShjYXRjaEVycm9yKGVyciA9PiB7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdhdXRoZW50aWNhdGlvbiAtLSBlcnJvci5pbnRlcmNlcHRvcicsIGVycik7XG5cbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAvLyBhdXRvIGxvZ291dCBpZiA0MDEgcmVzcG9uc2UgcmV0dXJuZWQgZnJvbSBhcGlcbi8vICAgICAgICAgICAgICAgIHRoaXMuX2F1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGxvY2F0aW9uLnJlbG9hZCBpcyB1c2VkIGZvciB0aGUgYXV0aC5ndWFyZCBpbiBhcHAgcm91dGluZ1xuICAgICAgICAgICAgICAgIC8vIHRvIGdvIHRvIHRoZSBsb2dpbiBwYWdlXG4vLyAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBlcnIuZXJyb3IubWVzc2FnZSB8fCBlcnIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKGVycm9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBFcnJvclJlc3BvbnNlLCBIdHRwUmVzcG9uc2UgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgS3VpQ29yZUNvbmZpZyB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbi8qKlxuICogQXV0aGVudGljYXRpb24gc2VydmljZSBpbmNsdWRlcyB0aGUgbG9naW4sIGxvZ291dCBtZXRob2QgYW5kIGEgc2Vzc2lvbiBtZXRob2QgdG8gY2hlY2sgaWYgYSB1c2VyIGlzIGxvZ2dlZCBpbiBvciBub3QuXG4gKi9cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25TZXJ2aWNlIHtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBodHRwOiBIdHRwQ2xpZW50LFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB2YWxpZGF0ZSBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdFxuICAgICAqIHJldHVybnMgdHJ1ZSBpZiB0aGUgc2Vzc2lvbiBpcyBhY3RpdmVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIGJvb2xlYW5cbiAgICAgKi9cbiAgICBzZXNzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2dpbiBwcm9jZXNzO1xuICAgICAqIGl0J3MgdXNlZCBieSB0aGUgbG9naW4gY29tcG9uZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWRlbnRpZmllciBlbWFpbCBvciB1c2VybmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZFxuICAgICAqIEByZXR1cm5zIE9ic2VydmFibGU8YW55PlxuICAgICAqL1xuICAgIGxvZ2luKGlkZW50aWZpZXI6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IE9ic2VydmFibGU8YW55PiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5wb3N0KFxuICAgICAgICAgICAgdGhpcy5jb25maWcuYXBpICsgJy92Mi9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgICAgICB7aWRlbnRpZmllcjogaWRlbnRpZmllciwgcGFzc3dvcmQ6IHBhc3N3b3JkfSxcbiAgICAgICAgICAgIHtvYnNlcnZlOiAncmVzcG9uc2UnfSkucGlwZShcbiAgICAgICAgICAgICAgICBtYXAoKHJlc3BvbnNlOiBIdHRwUmVzcG9uc2U8YW55Pik6IGFueSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBjYXRjaEVycm9yKChlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogbG9nb3V0IHRoZSB1c2VyIGJ5IGRlc3Ryb3lpbmcgdGhlIHNlc3Npb25cbiAgICAgKlxuICAgICAqIEBwYXJhbVxuICAgICAqL1xuICAgIGxvZ291dCgpIHtcbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQGlnbm9yZVxuICAgICAqIGhhbmRsZSByZXF1ZXN0IGVycm9yIGluIGNhc2Ugb2Ygc2VydmVyIGVycm9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKTogT2JzZXJ2YWJsZTxBcGlTZXJ2aWNlRXJyb3I+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZUVycm9yID0gbmV3IEFwaVNlcnZpY2VFcnJvcigpO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzVGV4dCA9IGVycm9yLnN0YXR1c1RleHQ7XG4gICAgICAgIHNlcnZpY2VFcnJvci5lcnJvckluZm8gPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBzZXJ2aWNlRXJyb3IudXJsID0gZXJyb3IudXJsO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzZXJ2aWNlRXJyb3IpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRm9ybUJ1aWxkZXIsIEZvcm1Hcm91cCwgVmFsaWRhdG9ycyB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlLCBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBBcGlTZXJ2aWNlUmVzdWx0IH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdrdWktbG9naW4tZm9ybScsXG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybVwiICpuZ0lmPVwiIWxvZ2dlZEluVXNlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWhlYWRlclwiPlxuICAgICAgICA8aDMgbWF0LXN1YmhlYWRlcj57e2xvZ2luLnRpdGxlfX08L2gzPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWNvbnRlbnRcIj5cbiAgICAgICAgPCEtLSBUaGlzIGlzIHRoZSBsb2dpbiBmb3JtIC0tPlxuICAgICAgICA8Zm9ybSBjbGFzcz1cImxvZ2luLWZvcm1cIiBbZm9ybUdyb3VwXT1cImZybVwiIChuZ1N1Ym1pdCk9XCJkb0xvZ2luKClcIj5cbiAgICAgICAgICAgIDwhLS0gRXJyb3IgbWVzc2FnZSAtLT5cbiAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImVycm9yTWVzc2FnZSAhPT0gdW5kZWZpbmVkXCIgY2xhc3M9XCJmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yVXNlciB8fCBsb2dpbkVycm9yUHdcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclNlcnZlclwiPnt7bG9naW4uZXJyb3Iuc2VydmVyfX08L3NwYW4+XG4gICAgICAgICAgICA8L21hdC1oaW50PlxuXG4gICAgICAgICAgICA8IS0tIFVzZXJuYW1lIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+cGVyc29uPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgYXV0b2ZvY3VzIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5uYW1lXCIgYXV0b2NvbXBsZXRlPVwidXNlcm5hbWVcIiBmb3JtQ29udHJvbE5hbWU9XCJlbWFpbFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMuZW1haWxcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIFBhc3N3b3JkIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+bG9jazwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IHR5cGU9XCJwYXNzd29yZFwiIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5wd1wiIGF1dG9jb21wbGV0ZT1cImN1cnJlbnQtcGFzc3dvcmRcIiBmb3JtQ29udHJvbE5hbWU9XCJwYXNzd29yZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMucGFzc3dvcmRcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIEJ1dHRvbjogTG9naW4gLS0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvbiB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cIiFmcm0udmFsaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIHN1Ym1pdC1idXR0b24gbWF0LXByaW1hcnlcIj5cbiAgICAgICAgICAgICAgICAgICAge3tsb2dpbi5idXR0b259fVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiIFtjb2xvcl09XCJjb2xvclwiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG48L2Rpdj5cblxuPCEtLSBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW47IHNob3cgd2hvIGl0IGlzIGFuZCBhIGxvZ291dCBidXR0b24gLS0+XG5cbjxkaXYgY2xhc3M9XCJsb2dvdXQtZm9ybVwiICpuZ0lmPVwibG9nZ2VkSW5Vc2VyXCI+XG4gICAgPHA+QSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOjwvcD5cbiAgICA8cD57e2xvZ2dlZEluVXNlcn19PC9wPlxuICAgIDxicj5cbiAgICA8cD5JZiBpdCdzIG5vdCB5b3UsIHBsZWFzZSBsb2dvdXQhPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvblxuICAgICAgICAgICAgICAgIChjbGljayk9XCJsb2dvdXQoKVwiXG4gICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIG1hdC13YXJuXCI+XG4gICAgICAgICAgICBMT0dPVVRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuYCxcbiAgICBzdHlsZXM6IFtgLmZ1bGwtd2lkdGh7d2lkdGg6MTAwJX0uYnV0dG9uLXJvdywubWF0LWZvcm0tZmllbGQsLm1hdC1oaW50e21hcmdpbi10b3A6MjRweH0ubWF0LWhpbnR7YmFja2dyb3VuZDpyZ2JhKDIzOSw4Myw4MCwuMzkpO2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6LTE2cHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtLC5sb2dvdXQtZm9ybXttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlciwubG9nb3V0LWZvcm0gLmxvZ2luLWZvcm0taGVhZGVye21hcmdpbi1ib3R0b206MjRweH0ubG9naW4tZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29uLC5sb2dvdXQtZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29ue2ZvbnQtc2l6ZToyMHB4O21hcmdpbi1yaWdodDoxMnB4fS5sb2dpbi1mb3JtIC5idXR0b24tcm93LC5sb2dvdXQtZm9ybSAuYnV0dG9uLXJvd3ttYXJnaW4tdG9wOjQ4cHh9LnNpZ24tdXB7bWFyZ2luLXRvcDoyNHB4fWBdXG59KVxuZXhwb3J0IGNsYXNzIExvZ2luRm9ybUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25hdmlnYXRlXVxuICAgICAqIG5hdmlnYXRlIHRvIHRoZSBkZWZpbmVkIHVybCBhZnRlciBzdWNjZXNzZnVsIGxvZ2luXG4gICAgICovXG4gICAgQElucHV0KCkgbmF2aWdhdGU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbG9yXVxuICAgICAqIHNldCB5b3VyIHRoZW1lIGNvbG9yIGhlcmUsXG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBwcm9ncmVzcy1pbmRpY2F0b3JcbiAgICAgKi9cbiAgICBASW5wdXQoKSBjb2xvcj86IHN0cmluZztcblxuICAgIHJldHVyblVybDogc3RyaW5nO1xuXG4gICAgLy8gaXMgdGhlcmUgYWxyZWFkeSBhIHZhbGlkIHNlc3Npb24/XG4gICAgbG9nZ2VkSW5Vc2VyOiBzdHJpbmc7XG5cbiAgICAvLyBmb3JtXG4gICAgZnJtOiBGb3JtR3JvdXA7XG5cbiAgICBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAvLyBnZW5lcmFsIGVycm9yIG1lc3NhZ2VcbiAgICBlcnJvck1lc3NhZ2U6IGFueTtcblxuICAgIC8vIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzXG4gICAgbG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAvLyBsYWJlbHMgZm9yIHRoZSBsb2dpbiBmb3JtXG4gICAgbG9naW4gPSB7XG4gICAgICAgIHRpdGxlOiAnTG9naW4nLFxuICAgICAgICBuYW1lOiAnVXNlcm5hbWUnLFxuICAgICAgICBwdzogJ1Bhc3N3b3JkJyxcbiAgICAgICAgYnV0dG9uOiAnTG9naW4nLFxuICAgICAgICByZW1lbWJlcjogJ1JlbWVtYmVyIG1lJyxcbiAgICAgICAgZm9yZ290X3B3OiAnRm9yZ290IHBhc3N3b3JkPycsXG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBmYWlsZWQ6ICdQYXNzd29yZCBvciB1c2VybmFtZSBpcyB3cm9uZycsXG4gICAgICAgICAgICBzZXJ2ZXI6ICdUaGVyZVxcJ3MgYW4gZXJyb3Igd2l0aCB0aGUgc2VydmVyIGNvbm5lY3Rpb24uIFRyeSBpdCBhZ2FpbiBsYXRlciBvciBpbmZvcm0gdGhlIEtub3JhIFRlYW0nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgZGVmaW5pdGlvbnMgZm9yIHRoZSBmb2xsb3dpbmcgZm9ybSBmaWVsZHNcbiAgICBmb3JtRXJyb3JzID0ge1xuICAgICAgICAnZW1haWwnOiAnJyxcbiAgICAgICAgJ3Bhc3N3b3JkJzogJydcbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgbWVzc2FnZXMgZm9yIHRoZSBmb3JtIGZpZWxkcyBkZWZpbmVkIGluIGZvcm1FcnJvcnNcbiAgICB2YWxpZGF0aW9uTWVzc2FnZXMgPSB7XG4gICAgICAgICdlbWFpbCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICd1c2VyIG5hbWUgaXMgcmVxdWlyZWQuJ1xuICAgICAgICB9LFxuICAgICAgICAncGFzc3dvcmQnOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAncGFzc3dvcmQgaXMgcmVxdWlyZWQnXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hdXRoOiBBdXRoZW50aWNhdGlvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfZmI6IEZvcm1CdWlsZGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlOiBBY3RpdmF0ZWRSb3V0ZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuICAgIH1cblxuXG4gICAgbmdPbkluaXQoKSB7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5idWlsZEZvcm0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRm9ybSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5mcm0gPSB0aGlzLl9mYi5ncm91cCh7XG4gICAgICAgICAgICBlbWFpbDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZnJtLnZhbHVlQ2hhbmdlc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IHRoaXMub25WYWx1ZUNoYW5nZWQoZGF0YSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpZ25vcmVcbiAgICAgKlxuICAgICAqIGNoZWNrIGZvciBlcnJvcnMgd2hpbGUgdXNpbmcgdGhlIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIG9uVmFsdWVDaGFuZ2VkKGRhdGE/OiBhbnkpIHtcblxuICAgICAgICBpZiAoIXRoaXMuZnJtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5mcm07XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5mb3JtRXJyb3JzKS5tYXAoZmllbGQgPT4ge1xuICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSA9ICcnO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm0uZ2V0KGZpZWxkKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sICYmIGNvbnRyb2wuZGlydHkgJiYgIWNvbnRyb2wudmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMudmFsaWRhdGlvbk1lc3NhZ2VzW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb250cm9sLmVycm9ycykubWFwKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gKz0gbWVzc2FnZXNba2V5XSArICcgJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZG9Mb2dpbigpIHtcblxuICAgICAgICAvLyByZXNldCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIGZvcm0gdmFsdWVzIGFyZSB2YWxpZFxuICAgICAgICBpZiAodGhpcy5mcm0uaW52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBzdGF0dXNcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyBHcmFiIHZhbHVlcyBmcm9tIGZvcm1cbiAgICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLmZybS5nZXQoJ2VtYWlsJykudmFsdWU7XG4gICAgICAgIGNvbnN0IHBhc3N3b3JkID0gdGhpcy5mcm0uZ2V0KCdwYXNzd29yZCcpLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuX2F1dGgubG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKVxuICAgICAgICAgICAgLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAocmVzcG9uc2U6IEFwaVNlcnZpY2VSZXN1bHQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIGEgdG9rZW47IHNldCB0aGUgc2Vzc2lvbiBub3dcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5zZXRTZXNzaW9uKHJlc3BvbnNlLmJvZHkudG9rZW4sIHVzZXJuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCByZXR1cm4gdXJsIGZyb20gcm91dGUgcGFyYW1ldGVycyBvciBkZWZhdWx0IHRvICcvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm5VcmwgPSB0aGlzLl9yb3V0ZS5zbmFwc2hvdC5xdWVyeVBhcmFtc1sncmV0dXJuVXJsJ10gfHwgJy8nO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIGJhY2sgdG8gdGhlIHByZXZpb3VzIHJvdXRlIG9yIHRvIHRoZSByb3V0ZSBkZWZpbmVkIGluIHRoZSBASW5wdXQgaWYgbmF2aWdhdGUgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubmF2aWdhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMucmV0dXJuVXJsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5uYXZpZ2F0ZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSA8YW55PiBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgdGhpcy5fYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IEh0dHBDbGllbnRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUmVhY3RpdmVGb3Jtc01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IE1hdEJ1dHRvbk1vZHVsZSwgTWF0Q2FyZE1vZHVsZSwgTWF0RGlhbG9nTW9kdWxlLCBNYXRGb3JtRmllbGRNb2R1bGUsIE1hdEljb25Nb2R1bGUsIE1hdElucHV0TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwnO1xuaW1wb3J0IHsgS3VpQWN0aW9uTW9kdWxlIH0gZnJvbSAnQGtub3JhL2FjdGlvbic7XG5cbmltcG9ydCB7IExvZ2luRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW1xuICAgICAgICBDb21tb25Nb2R1bGUsXG4gICAgICAgIEt1aUFjdGlvbk1vZHVsZSxcbiAgICAgICAgTWF0Q2FyZE1vZHVsZSxcbiAgICAgICAgTWF0SWNvbk1vZHVsZSxcbiAgICAgICAgTWF0SW5wdXRNb2R1bGUsXG4gICAgICAgIE1hdEJ1dHRvbk1vZHVsZSxcbiAgICAgICAgTWF0RGlhbG9nTW9kdWxlLFxuICAgICAgICBNYXRGb3JtRmllbGRNb2R1bGUsXG4gICAgICAgIFJlYWN0aXZlRm9ybXNNb2R1bGUsXG4gICAgICAgIEh0dHBDbGllbnRNb2R1bGVcbiAgICBdLFxuICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICBMb2dpbkZvcm1Db21wb25lbnRcbiAgICBdLFxuICAgIGV4cG9ydHM6IFtcbiAgICAgICAgTG9naW5Gb3JtQ29tcG9uZW50XG4gICAgXVxufSlcbmV4cG9ydCBjbGFzcyBLdWlBdXRoZW50aWNhdGlvbk1vZHVsZSB7XG59XG4iLCIvKlxuICogUHVibGljIEFQSSBTdXJmYWNlIG9mIGF1dGhlbnRpY2F0aW9uXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9saWIvZ3VhcmQvYXV0aC5ndWFyZCc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvYXV0aGVudGljYXRpb24ubW9kdWxlJztcbiIsIi8qKlxuICogR2VuZXJhdGVkIGJ1bmRsZSBpbmRleC4gRG8gbm90IGVkaXQuXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9wdWJsaWNfYXBpJztcblxuZXhwb3J0IHtTZXNzaW9uU2VydmljZSBhcyDDicK1YX0gZnJvbSAnLi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnOyJdLCJuYW1lcyI6WyJLbm9yYUNvbnN0YW50cyIsIm1hcCIsIkluamVjdGFibGUiLCJIdHRwQ2xpZW50IiwiS3VpQ29yZUNvbmZpZyIsIkluamVjdCIsIlVzZXJzU2VydmljZSIsIlJvdXRlciIsImNhdGNoRXJyb3IiLCJ0aHJvd0Vycm9yIiwiQXBpU2VydmljZUVycm9yIiwiVmFsaWRhdG9ycyIsIkNvbXBvbmVudCIsIkZvcm1CdWlsZGVyIiwiQWN0aXZhdGVkUm91dGUiLCJJbnB1dCIsIk5nTW9kdWxlIiwiQ29tbW9uTW9kdWxlIiwiS3VpQWN0aW9uTW9kdWxlIiwiTWF0Q2FyZE1vZHVsZSIsIk1hdEljb25Nb2R1bGUiLCJNYXRJbnB1dE1vZHVsZSIsIk1hdEJ1dHRvbk1vZHVsZSIsIk1hdERpYWxvZ01vZHVsZSIsIk1hdEZvcm1GaWVsZE1vZHVsZSIsIlJlYWN0aXZlRm9ybXNNb2R1bGUiLCJIdHRwQ2xpZW50TW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7SUFRQSxJQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFHOUI7UUFjSSx3QkFDWSxLQUFpQixFQUNBLE1BQXFCLEVBQ3RDLE1BQW9CO1lBRnBCLFVBQUssR0FBTCxLQUFLLENBQVk7WUFDQSxXQUFNLEdBQU4sTUFBTSxDQUFlO1lBQ3RDLFdBQU0sR0FBTixNQUFNLENBQWM7Ozs7OztZQUx2QixxQkFBZ0IsR0FBVyxRQUFRLENB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