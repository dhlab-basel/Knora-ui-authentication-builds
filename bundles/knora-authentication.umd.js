(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common/http'), require('@angular/core'), require('@knora/core'), require('moment'), require('rxjs/operators'), require('@angular/router'), require('rxjs'), require('@angular/forms'), require('@angular/common'), require('@angular/material'), require('@knora/action')) :
    typeof define === 'function' && define.amd ? define('@knora/authentication', ['exports', '@angular/common/http', '@angular/core', '@knora/core', 'moment', 'rxjs/operators', '@angular/router', 'rxjs', '@angular/forms', '@angular/common', '@angular/material', '@knora/action'], factory) :
    (factory((global.knora = global.knora || {}, global.knora.authentication = {}),global.ng.common.http,global.ng.core,null,null,global.rxjs.operators,global.ng.router,global.rxjs,global.ng.forms,global.ng.common,global.ng.material,null));
}(this, (function (exports,i1,i0,i2,momentImported,operators,i2$1,rxjs,forms,common,material,action) { 'use strict';

    var moment = momentImported;
    var SessionService = (function () {
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
            this._users.getUserByEmail(username).subscribe(function (result) {
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

    var AuthGuard = (function () {
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

    var JwtInterceptor = (function () {
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
    var ErrorInterceptor = (function () {
        function ErrorInterceptor() {
        }
        /*
        constructor(private _authService: AuthenticationService) {
        }
    */
        ErrorInterceptor.prototype.intercept = function (request, next) {
            return next.handle(request).pipe(operators.catchError(function (err) {
                console.log('authentication -- error.interceptor', err);
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

    var AuthenticationService = (function () {
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
         * @param username
         * @param password
         * @returns
         */
        AuthenticationService.prototype.login = function (username, password) {
            var _this = this;
            return this.http.post(this.config.api + '/v2/authentication', { email: username, password: password }, { observe: 'response' }).pipe(operators.map(function (response) {
                return response;
            }), operators.catchError(function (error) {
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

    var LoginFormComponent = (function () {
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

    var KuiAuthenticationModule = (function () {
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24udW1kLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2d1YXJkL2F1dGguZ3VhcmQudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9hdXRoZW50aWNhdGlvbi5tb2R1bGUudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9wdWJsaWNfYXBpLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24va25vcmEtYXV0aGVudGljYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLbm9yYUNvbnN0YW50cywgS3VpQ29yZUNvbmZpZywgU2Vzc2lvbiwgVXNlciwgVXNlcnNTZXJ2aWNlIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuXG5pbXBvcnQgKiBhcyBtb21lbnRJbXBvcnRlZCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5jb25zdCBtb21lbnQgPSBtb21lbnRJbXBvcnRlZDtcblxuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFNlc3Npb25TZXJ2aWNlIHtcblxuICAgIHB1YmxpYyBzZXNzaW9uOiBTZXNzaW9uO1xuXG4gICAgLyoqXG4gICAgICogbWF4IHNlc3Npb24gdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICAgKiBkZWZhdWx0IHZhbHVlICgyNGgpOiA4NjQwMDAwMFxuICAgICAqXG4gICAgICovXG4gICAgcmVhZG9ubHkgTUFYX1NFU1NJT05fVElNRTogbnVtYmVyID0gODY0MDAwMDA7IC8vIDFkID0gMjQgKiA2MCAqIDYwICogMTAwMFxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgX2h0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcsXG4gICAgICAgIHByaXZhdGUgX3VzZXJzOiBVc2Vyc1NlcnZpY2UpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHNlc3Npb24gYnkgdXNpbmcgdGhlIGpzb24gd2ViIHRva2VuIChqd3QpIGFuZCB0aGUgdXNlciBvYmplY3Q7XG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBsb2dpbiBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gand0XG4gICAgICogQHBhcmFtIHVzZXJuYW1lXG4gICAgICovXG4gICAgc2V0U2Vzc2lvbihqd3Q6IHN0cmluZywgdXNlcm5hbWU6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGdldCB1c2VyIGluZm9ybWF0aW9uXG4gICAgICAgIHRoaXMuX3VzZXJzLmdldFVzZXJCeUVtYWlsKHVzZXJuYW1lKS5zdWJzY3JpYmUoXG4gICAgICAgICAgICAocmVzdWx0OiBVc2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN5c0FkbWluOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IHJlc3VsdC5wZXJtaXNzaW9ucztcbiAgICAgICAgICAgICAgICBpZiAocGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXSkge1xuICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbiA9IHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKEtub3JhQ29uc3RhbnRzLlN5c3RlbUFkbWluR3JvdXBJUkkpID4gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGEgc2Vzc2lvbiBpZCwgd2hpY2ggaXMgdGhlIHRpbWVzdGFtcCBvZiBsb2dpblxuICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXMuc2V0VGltZXN0YW1wKCksXG4gICAgICAgICAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgand0OiBqd3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiByZXN1bHQubGFuZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5c0FkbWluOiBzeXNBZG1pblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzdG9yZSBpbiB0aGUgbG9jYWxTdG9yYWdlXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb24nLCBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24pKTtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUaW1lc3RhbXAoKSB7XG4gICAgICAgIHJldHVybiAobW9tZW50KCkuYWRkKDAsICdzZWNvbmQnKSkudmFsdWVPZigpO1xuICAgIH1cblxuICAgIGdldFNlc3Npb24oKSB7XG5cbiAgICB9XG5cbiAgICB1cGRhdGVTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdmFsaWRhdGVTZXNzaW9uKCkge1xuICAgICAgICAvLyBtaXggb2YgY2hlY2tzIHdpdGggc2Vzc2lvbi52YWxpZGF0aW9uIGFuZCB0aGlzLmF1dGhlbnRpY2F0ZVxuICAgICAgICB0aGlzLnNlc3Npb24gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpO1xuXG4gICAgICAgIGNvbnN0IHRzTm93OiBudW1iZXIgPSB0aGlzLnNldFRpbWVzdGFtcCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnNlc3Npb24pIHtcbiAgICAgICAgICAgIC8vIHRoZSBzZXNzaW9uIGV4aXN0c1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHNlc3Npb24gaXMgc3RpbGwgdmFsaWQ6XG4gICAgICAgICAgICAvLyBpZiBzZXNzaW9uLmlkICsgTUFYX1NFU1NJT05fVElNRSA+IG5vdzogX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKClcbiAgICAgICAgICAgIGlmICh0aGlzLnNlc3Npb24uaWQgKyB0aGlzLk1BWF9TRVNTSU9OX1RJTUUgPCB0c05vdykge1xuICAgICAgICAgICAgICAgIC8vIHRoZSBpbnRlcm5hbCBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGFwaSB2Mi9hdXRoZW50aWNhdGlvbiBpcyBzdGlsbCB2YWxpZFxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXV0aGVudGljYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFwaSBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzZXNzaW9uLmlkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbi5pZCA9IHRzTm93O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCduZXcgc2Vzc2lvbiBpZCcsIHRoaXMuc2Vzc2lvbi5pZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcignc2Vzc2lvbi5zZXJ2aWNlIC0tIHZhbGlkYXRlU2Vzc2lvbiAtLSBhdXRoZW50aWNhdGU6IHRoZSBzZXNzaW9uIGV4cGlyZWQgb24gQVBJIHNpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYSB1c2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkIGFueW1vcmUhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveVNlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGF1dGhlbnRpY2F0ZSgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2h0dHAuZ2V0KHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nKS5waXBlKFxuICAgICAgICAgICAgbWFwKChyZXN1bHQ6IGFueSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1dGhlbnRpY2F0aW9uU2VydmljZSAtIGF1dGhlbnRpY2F0ZSAtIHJlc3VsdDogJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdHJ1ZSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuc3RhdHVzID09PSAyMDA7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGRlc3Ryb3lTZXNzaW9uKCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG59XG4iLCJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBDYW5BY3RpdmF0ZSwgUm91dGVyLCBSb3V0ZXJTdGF0ZVNuYXBzaG90IH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG5cbiAgICB9XG5cbiAgICBjYW5BY3RpdmF0ZShcbiAgICAgICAgbmV4dDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgICAgICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHwgUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW4ge1xuXG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFsnbG9naW4nXSwge3F1ZXJ5UGFyYW1zOiB7cmV0dXJuVXJsOiBzdGF0ZS51cmx9fSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEp3dEludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlKSB7XG4gICAgfVxuXG4gICAgaW50ZXJjZXB0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgICAgICAvLyBhZGQgYXV0aG9yaXphdGlvbiBoZWFkZXIgd2l0aCBqd3QgdG9rZW4gaWYgYXZhaWxhYmxlXG5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIC8vIHRoZSBzZXNzaW9uIGlzIHZhbGlkIChhbmQgdXAgdG8gZGF0ZSlcbiAgICAgICAgICAgIGNvbnN0IGp3dCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5qd3Q7XG4gICAgICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdC5jbG9uZSh7XG4gICAgICAgICAgICAgICAgc2V0SGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7and0fWBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Nlc3Npb24uZGVzdHJveVNlc3Npb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXh0LmhhbmRsZShyZXF1ZXN0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLy8gaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEVycm9ySW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuICAgIC8qXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aFNlcnZpY2U6IEF1dGhlbnRpY2F0aW9uU2VydmljZSkge1xuICAgIH1cbiovXG4gICAgaW50ZXJjZXB0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCkucGlwZShjYXRjaEVycm9yKGVyciA9PiB7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhdXRoZW50aWNhdGlvbiAtLSBlcnJvci5pbnRlcmNlcHRvcicsIGVycik7XG5cbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAvLyBhdXRvIGxvZ291dCBpZiA0MDEgcmVzcG9uc2UgcmV0dXJuZWQgZnJvbSBhcGlcbi8vICAgICAgICAgICAgICAgIHRoaXMuX2F1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGxvY2F0aW9uLnJlbG9hZCBpcyB1c2VkIGZvciB0aGUgYXV0aC5ndWFyZCBpbiBhcHAgcm91dGluZ1xuICAgICAgICAgICAgICAgIC8vIHRvIGdvIHRvIHRoZSBsb2dpbiBwYWdlXG4vLyAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBlcnIuZXJyb3IubWVzc2FnZSB8fCBlcnIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKGVycm9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBFcnJvclJlc3BvbnNlLCBIdHRwUmVzcG9uc2UgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgS3VpQ29yZUNvbmZpZyB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25TZXJ2aWNlIHtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBodHRwOiBIdHRwQ2xpZW50LFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHZhbGlkYXRlIGlmIGEgdXNlciBpcyBsb2dnZWQgaW4gb3Igbm90XG4gICAgICogYW5kIHRoZSBzZXNzaW9uIGlzIGFjdGl2ZVxuICAgICAqL1xuICAgIHNlc3Npb24oKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvZ2luIHByb2Nlc3M7XG4gICAgICogaXQncyB1c2VkIGJ5IHRoZSBsb2dpbiBjb21wb25lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZVxuICAgICAqIEBwYXJhbSBwYXNzd29yZFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgbG9naW4odXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IE9ic2VydmFibGU8YW55PiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5wb3N0KFxuICAgICAgICAgICAgdGhpcy5jb25maWcuYXBpICsgJy92Mi9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgICAgICB7ZW1haWw6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmR9LFxuICAgICAgICAgICAge29ic2VydmU6ICdyZXNwb25zZSd9KS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcCgocmVzcG9uc2U6IEh0dHBSZXNwb25zZTxhbnk+KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNlc3Npb25cbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIGhhbmRsZSByZXF1ZXN0IGVycm9yIGluIGNhc2Ugb2Ygc2VydmVyIGVycm9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKTogT2JzZXJ2YWJsZTxBcGlTZXJ2aWNlRXJyb3I+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZUVycm9yID0gbmV3IEFwaVNlcnZpY2VFcnJvcigpO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzVGV4dCA9IGVycm9yLnN0YXR1c1RleHQ7XG4gICAgICAgIHNlcnZpY2VFcnJvci5lcnJvckluZm8gPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBzZXJ2aWNlRXJyb3IudXJsID0gZXJyb3IudXJsO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzZXJ2aWNlRXJyb3IpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRm9ybUJ1aWxkZXIsIEZvcm1Hcm91cCwgVmFsaWRhdG9ycyB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlLCBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBBcGlTZXJ2aWNlUmVzdWx0IH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdrdWktbG9naW4tZm9ybScsXG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybVwiICpuZ0lmPVwiIWxvZ2dlZEluVXNlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWhlYWRlclwiPlxuICAgICAgICA8aDMgbWF0LXN1YmhlYWRlcj57e2xvZ2luLnRpdGxlfX08L2gzPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWNvbnRlbnRcIj5cbiAgICAgICAgPCEtLSBUaGlzIGlzIHRoZSBsb2dpbiBmb3JtIC0tPlxuICAgICAgICA8Zm9ybSBjbGFzcz1cImxvZ2luLWZvcm1cIiBbZm9ybUdyb3VwXT1cImZybVwiIChuZ1N1Ym1pdCk9XCJkb0xvZ2luKClcIj5cbiAgICAgICAgICAgIDwhLS0gRXJyb3IgbWVzc2FnZSAtLT5cbiAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImVycm9yTWVzc2FnZSAhPT0gdW5kZWZpbmVkXCIgY2xhc3M9XCJmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yVXNlciB8fCBsb2dpbkVycm9yUHdcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclNlcnZlclwiPnt7bG9naW4uZXJyb3Iuc2VydmVyfX08L3NwYW4+XG4gICAgICAgICAgICA8L21hdC1oaW50PlxuXG4gICAgICAgICAgICA8IS0tIFVzZXJuYW1lIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+cGVyc29uPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgYXV0b2ZvY3VzIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5uYW1lXCIgYXV0b2NvbXBsZXRlPVwidXNlcm5hbWVcIiBmb3JtQ29udHJvbE5hbWU9XCJlbWFpbFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMuZW1haWxcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIFBhc3N3b3JkIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+bG9jazwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IHR5cGU9XCJwYXNzd29yZFwiIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5wd1wiIGF1dG9jb21wbGV0ZT1cImN1cnJlbnQtcGFzc3dvcmRcIiBmb3JtQ29udHJvbE5hbWU9XCJwYXNzd29yZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMucGFzc3dvcmRcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIEJ1dHRvbjogTG9naW4gLS0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvbiB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cIiFmcm0udmFsaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIHN1Ym1pdC1idXR0b24gbWF0LXByaW1hcnlcIj5cbiAgICAgICAgICAgICAgICAgICAge3tsb2dpbi5idXR0b259fVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiIFtjb2xvcl09XCJjb2xvclwiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG48L2Rpdj5cblxuPCEtLSBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW47IHNob3cgd2hvIGl0IGlzIGFuZCBhIGxvZ291dCBidXR0b24gLS0+XG5cbjxkaXYgY2xhc3M9XCJsb2dvdXQtZm9ybVwiICpuZ0lmPVwibG9nZ2VkSW5Vc2VyXCI+XG4gICAgPHA+QSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOjwvcD5cbiAgICA8cD57e2xvZ2dlZEluVXNlcn19PC9wPlxuICAgIDxicj5cbiAgICA8cD5JZiBpdCdzIG5vdCB5b3UsIHBsZWFzZSBsb2dvdXQhPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvblxuICAgICAgICAgICAgICAgIChjbGljayk9XCJsb2dvdXQoKVwiXG4gICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIG1hdC13YXJuXCI+XG4gICAgICAgICAgICBMT0dPVVRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuYCxcbiAgICBzdHlsZXM6IFtgLmZ1bGwtd2lkdGh7d2lkdGg6MTAwJX0uYnV0dG9uLXJvdywubWF0LWZvcm0tZmllbGQsLm1hdC1oaW50e21hcmdpbi10b3A6MjRweH0ubWF0LWhpbnR7YmFja2dyb3VuZDpyZ2JhKDIzOSw4Myw4MCwuMzkpO2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6LTE2cHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtLC5sb2dvdXQtZm9ybXttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlciwubG9nb3V0LWZvcm0gLmxvZ2luLWZvcm0taGVhZGVye21hcmdpbi1ib3R0b206MjRweH0ubG9naW4tZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29uLC5sb2dvdXQtZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29ue2ZvbnQtc2l6ZToyMHB4O21hcmdpbi1yaWdodDoxMnB4fS5sb2dpbi1mb3JtIC5idXR0b24tcm93LC5sb2dvdXQtZm9ybSAuYnV0dG9uLXJvd3ttYXJnaW4tdG9wOjQ4cHh9LnNpZ24tdXB7bWFyZ2luLXRvcDoyNHB4fWBdXG59KVxuZXhwb3J0IGNsYXNzIExvZ2luRm9ybUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgICAvKipcbiAgICAgKiBuYXZpZ2F0ZSB0byB0aGUgZGVmaW5lZCB1cmwgYWZ0ZXIgbG9naW5cbiAgICAgKi9cbiAgICBASW5wdXQoKSBuYXZpZ2F0ZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIHNldCB5b3VyIHRoZW1lIGNvbG9yIGhlcmUsXG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBwcm9ncmVzcy1pbmRpY2F0b3JcbiAgICAgKi9cbiAgICBASW5wdXQoKSBjb2xvcj86IHN0cmluZztcblxuICAgIHJldHVyblVybDogc3RyaW5nO1xuXG4gICAgLy8gaXMgdGhlcmUgYWxyZWFkeSBhIHZhbGlkIHNlc3Npb24/XG4gICAgbG9nZ2VkSW5Vc2VyOiBzdHJpbmc7XG5cbiAgICAvLyBmb3JtXG4gICAgZnJtOiBGb3JtR3JvdXA7XG5cbiAgICBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAvLyBnZW5lcmFsIGVycm9yIG1lc3NhZ2VcbiAgICBlcnJvck1lc3NhZ2U6IGFueTtcblxuICAgIC8vIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzXG4gICAgbG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAvLyBsYWJlbHMgZm9yIHRoZSBsb2dpbiBmb3JtXG4gICAgbG9naW4gPSB7XG4gICAgICAgIHRpdGxlOiAnTG9naW4nLFxuICAgICAgICBuYW1lOiAnVXNlcm5hbWUnLFxuICAgICAgICBwdzogJ1Bhc3N3b3JkJyxcbiAgICAgICAgYnV0dG9uOiAnTG9naW4nLFxuICAgICAgICByZW1lbWJlcjogJ1JlbWVtYmVyIG1lJyxcbiAgICAgICAgZm9yZ290X3B3OiAnRm9yZ290IHBhc3N3b3JkPycsXG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBmYWlsZWQ6ICdQYXNzd29yZCBvciB1c2VybmFtZSBpcyB3cm9uZycsXG4gICAgICAgICAgICBzZXJ2ZXI6ICdUaGVyZVxcJ3MgYW4gZXJyb3Igd2l0aCB0aGUgc2VydmVyIGNvbm5lY3Rpb24uIFRyeSBpdCBhZ2FpbiBsYXRlciBvciBpbmZvcm0gdGhlIEtub3JhIFRlYW0nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgZGVmaW5pdGlvbnMgZm9yIHRoZSBmb2xsb3dpbmcgZm9ybSBmaWVsZHNcbiAgICBmb3JtRXJyb3JzID0ge1xuICAgICAgICAnZW1haWwnOiAnJyxcbiAgICAgICAgJ3Bhc3N3b3JkJzogJydcbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgbWVzc2FnZXMgZm9yIHRoZSBmb3JtIGZpZWxkcyBkZWZpbmVkIGluIGZvcm1FcnJvcnNcbiAgICB2YWxpZGF0aW9uTWVzc2FnZXMgPSB7XG4gICAgICAgICdlbWFpbCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICd1c2VyIG5hbWUgaXMgcmVxdWlyZWQuJ1xuICAgICAgICB9LFxuICAgICAgICAncGFzc3dvcmQnOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAncGFzc3dvcmQgaXMgcmVxdWlyZWQnXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hdXRoOiBBdXRoZW50aWNhdGlvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfZmI6IEZvcm1CdWlsZGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlOiBBY3RpdmF0ZWRSb3V0ZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuICAgIH1cblxuICAgIG5nT25Jbml0KCkge1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpblxuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRGb3JtKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZvcm0oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZnJtID0gdGhpcy5fZmIuZ3JvdXAoe1xuICAgICAgICAgICAgZW1haWw6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF0sXG4gICAgICAgICAgICBwYXNzd29yZDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZybS52YWx1ZUNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB0aGlzLm9uVmFsdWVDaGFuZ2VkKGRhdGEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBmb3IgZXJyb3JzIHdoaWxlIHVzaW5nIHRoZSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBvblZhbHVlQ2hhbmdlZChkYXRhPzogYW55KSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZybSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZnJtO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUVycm9ycykubWFwKGZpZWxkID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtLmdldChmaWVsZCk7XG4gICAgICAgICAgICBpZiAoY29udHJvbCAmJiBjb250cm9sLmRpcnR5ICYmICFjb250cm9sLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLnZhbGlkYXRpb25NZXNzYWdlc1tmaWVsZF07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29udHJvbC5lcnJvcnMpLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdICs9IG1lc3NhZ2VzW2tleV0gKyAnICc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRvTG9naW4oKSB7XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBmb3JtIHZhbHVlcyBhcmUgdmFsaWRcbiAgICAgICAgaWYgKHRoaXMuZnJtLmludmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgc3RhdHVzXG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gR3JhYiB2YWx1ZXMgZnJvbSBmb3JtXG4gICAgICAgIGNvbnN0IHVzZXJuYW1lID0gdGhpcy5mcm0uZ2V0KCdlbWFpbCcpLnZhbHVlO1xuICAgICAgICBjb25zdCBwYXNzd29yZCA9IHRoaXMuZnJtLmdldCgncGFzc3dvcmQnKS52YWx1ZTtcblxuICAgICAgICB0aGlzLl9hdXRoLmxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgKHJlc3BvbnNlOiBBcGlTZXJ2aWNlUmVzdWx0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHRva2VuOyBzZXQgdGhlIHNlc3Npb24gbm93XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Nlc3Npb24uc2V0U2Vzc2lvbihyZXNwb25zZS5ib2R5LnRva2VuLCB1c2VybmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgcmV0dXJuIHVybCBmcm9tIHJvdXRlIHBhcmFtZXRlcnMgb3IgZGVmYXVsdCB0byAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVXJsID0gdGhpcy5fcm91dGUuc25hcHNob3QucXVlcnlQYXJhbXNbJ3JldHVyblVybCddIHx8ICcvJztcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnbyBiYWNrIHRvIHRoZSBwcmV2aW91cyByb3V0ZSBvciB0byB0aGUgcm91dGUgZGVmaW5lZCBpbiB0aGUgQElucHV0IGlmIG5hdmlnYXRlIGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5hdmlnYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLnJldHVyblVybF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMubmF2aWdhdGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGVycm9yOiBBcGlTZXJ2aWNlRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gPGFueT4gZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIHRoaXMuX2F1dGgubG9nb3V0KCk7XG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBIdHRwQ2xpZW50TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFJlYWN0aXZlRm9ybXNNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQgeyBNYXRCdXR0b25Nb2R1bGUsIE1hdENhcmRNb2R1bGUsIE1hdERpYWxvZ01vZHVsZSwgTWF0Rm9ybUZpZWxkTW9kdWxlLCBNYXRJY29uTW9kdWxlLCBNYXRJbnB1dE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsJztcbmltcG9ydCB7IEt1aUFjdGlvbk1vZHVsZSB9IGZyb20gJ0Brbm9yYS9hY3Rpb24nO1xuXG5pbXBvcnQgeyBMb2dpbkZvcm1Db21wb25lbnQgfSBmcm9tICcuL2xvZ2luLWZvcm0vbG9naW4tZm9ybS5jb21wb25lbnQnO1xuXG5ATmdNb2R1bGUoe1xuICAgIGltcG9ydHM6IFtcbiAgICAgICAgQ29tbW9uTW9kdWxlLFxuICAgICAgICBLdWlBY3Rpb25Nb2R1bGUsXG4gICAgICAgIE1hdENhcmRNb2R1bGUsXG4gICAgICAgIE1hdEljb25Nb2R1bGUsXG4gICAgICAgIE1hdElucHV0TW9kdWxlLFxuICAgICAgICBNYXRCdXR0b25Nb2R1bGUsXG4gICAgICAgIE1hdERpYWxvZ01vZHVsZSxcbiAgICAgICAgTWF0Rm9ybUZpZWxkTW9kdWxlLFxuICAgICAgICBSZWFjdGl2ZUZvcm1zTW9kdWxlLFxuICAgICAgICBIdHRwQ2xpZW50TW9kdWxlXG4gICAgXSxcbiAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgTG9naW5Gb3JtQ29tcG9uZW50XG4gICAgXSxcbiAgICBleHBvcnRzOiBbXG4gICAgICAgIExvZ2luRm9ybUNvbXBvbmVudFxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgS3VpQXV0aGVudGljYXRpb25Nb2R1bGUge1xufVxuIiwiLypcbiAqIFB1YmxpYyBBUEkgU3VyZmFjZSBvZiBhdXRoZW50aWNhdGlvblxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vbGliL2d1YXJkL2F1dGguZ3VhcmQnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2xvZ2luLWZvcm0vbG9naW4tZm9ybS5jb21wb25lbnQnO1xuXG5leHBvcnQgKiBmcm9tICcuL2xpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2F1dGhlbnRpY2F0aW9uLm1vZHVsZSc7XG4iLCIvKipcbiAqIEdlbmVyYXRlZCBidW5kbGUgaW5kZXguIERvIG5vdCBlZGl0LlxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vcHVibGljX2FwaSc7XG5cbmV4cG9ydCB7U2Vzc2lvblNlcnZpY2UgYXMgw4nCtWF9IGZyb20gJy4vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJzsiXSwibmFtZXMiOlsiS25vcmFDb25zdGFudHMiLCJtYXAiLCJJbmplY3RhYmxlIiwiSHR0cENsaWVudCIsIkt1aUNvcmVDb25maWciLCJJbmplY3QiLCJVc2Vyc1NlcnZpY2UiLCJSb3V0ZXIiLCJjYXRjaEVycm9yIiwidGhyb3dFcnJvciIsIkFwaVNlcnZpY2VFcnJvciIsIlZhbGlkYXRvcnMiLCJDb21wb25lbnQiLCJGb3JtQnVpbGRlciIsIkFjdGl2YXRlZFJvdXRlIiwiSW5wdXQiLCJOZ01vZHVsZSIsIkNvbW1vbk1vZHVsZSIsIkt1aUFjdGlvbk1vZHVsZSIsIk1hdENhcmRNb2R1bGUiLCJNYXRJY29uTW9kdWxlIiwiTWF0SW5wdXRNb2R1bGUiLCJNYXRCdXR0b25Nb2R1bGUiLCJNYXREaWFsb2dNb2R1bGUiLCJNYXRGb3JtRmllbGRNb2R1bGUiLCJSZWFjdGl2ZUZvcm1zTW9kdWxlIiwiSHR0cENsaWVudE1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBUUEsSUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBRzlCO1FBY0ksd0JBQ1ksS0FBaUIsRUFDQSxNQUFxQixFQUN0QyxNQUFvQjtZQUZwQixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ0EsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQUN0QyxXQUFNLEdBQU4sTUFBTSxDQUFjOzs7Ozs7WUFMdkIscUJBQWdCLEdBQVcsUUFBUSxDQUFDO1NBTTVDOzs7Ozs7OztRQVNELG1DQUFVLEdBQVYsVUFBVyxHQUFXLEVBQUUsUUFBZ0I7WUFBeEMsaUJBK0JDOztZQTVCRyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQzFDLFVBQUMsTUFBWTtnQkFDVCxJQUFJLFFBQVEsR0FBWSxLQUFLLENBQUM7Z0JBRTlCLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZDLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDQSxpQkFBYyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7b0JBQy9ELFFBQVEsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUNBLGlCQUFjLENBQUMsZ0JBQWdCLENBQUM7eUJBQ25FLE9BQU8sQ0FBQ0EsaUJBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFH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