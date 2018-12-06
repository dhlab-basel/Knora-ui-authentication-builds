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
         * @param identifier (email or username)
         * @param password
         * @returns
         */
        AuthenticationService.prototype.login = function (identifier, password) {
            var _this = this;
            return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(operators.map(function (response) {
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
                identifier: ['', forms.Validators.required],
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
            { type: i0.Component, args: [{
                        selector: 'kui-login-form',
                        template: "<div class=\"login-form\" *ngIf=\"!loggedInUser\">\n    <div class=\"login-form-header\">\n        <h3 mat-subheader>{{login.title}}</h3>\n    </div>\n    <div class=\"login-form-content\">\n        <!-- This is the login form -->\n        <form class=\"login-form\" [formGroup]=\"frm\" (ngSubmit)=\"doLogin()\">\n            <!-- Error message -->\n            <mat-hint *ngIf=\"errorMessage !== undefined\" class=\"full-width\">\n                <span *ngIf=\"loginErrorUser || loginErrorPw\">{{login.error.failed}}</span>\n                <span *ngIf=\"loginErrorServer\">{{login.error.server}}</span>\n            </mat-hint>\n\n            <!-- Username -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>person</mat-icon>\n                <input matInput autofocus [placeholder]=\"login.name\" autocomplete=\"username\" formControlName=\"identifier\">\n                <mat-hint *ngIf=\"formErrors.identifier\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Password -->\n            <mat-form-field class=\"full-width login-field\">\n                <mat-icon matPrefix>lock</mat-icon>\n                <input matInput type=\"password\" [placeholder]=\"login.pw\" autocomplete=\"current-password\" formControlName=\"password\">\n                <mat-hint *ngIf=\"formErrors.password\" class=\"login-error\">{{login.error.failed}}</mat-hint>\n            </mat-form-field>\n\n            <!-- Button: Login -->\n            <div class=\"button-row full-width\">\n                <button mat-raised-button type=\"submit\"\n                        *ngIf=\"!loading\"\n                        [disabled]=\"!frm.valid\"\n                        class=\"full-width submit-button mat-primary\">\n                    {{login.button}}\n                </button>\n                <kui-progress-indicator *ngIf=\"loading\" [color]=\"color\"></kui-progress-indicator>\n            </div>\n        </form>\n    </div>\n</div>\n\n<!-- a user is already logged in; show who it is and a logout button -->\n\n<div class=\"logout-form\" *ngIf=\"loggedInUser\">\n    <p>A user is already logged in:</p>\n    <p>{{loggedInUser}}</p>\n    <br>\n    <p>If it's not you, please logout!</p>\n    <div class=\"button-row full-width\">\n        <button mat-raised-button\n                (click)=\"logout()\"\n                *ngIf=\"!loading\"\n                class=\"full-width mat-warn\">\n            LOGOUT\n        </button>\n        <kui-progress-indicator *ngIf=\"loading\"></kui-progress-indicator>\n    </div>\n</div>\n",
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24udW1kLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2d1YXJkL2F1dGguZ3VhcmQudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9hdXRoZW50aWNhdGlvbi5tb2R1bGUudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9wdWJsaWNfYXBpLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24va25vcmEtYXV0aGVudGljYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLbm9yYUNvbnN0YW50cywgS3VpQ29yZUNvbmZpZywgU2Vzc2lvbiwgVXNlciwgVXNlcnNTZXJ2aWNlIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuXG5pbXBvcnQgKiBhcyBtb21lbnRJbXBvcnRlZCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5jb25zdCBtb21lbnQgPSBtb21lbnRJbXBvcnRlZDtcblxuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFNlc3Npb25TZXJ2aWNlIHtcblxuICAgIHB1YmxpYyBzZXNzaW9uOiBTZXNzaW9uO1xuXG4gICAgLyoqXG4gICAgICogbWF4IHNlc3Npb24gdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICAgKiBkZWZhdWx0IHZhbHVlICgyNGgpOiA4NjQwMDAwMFxuICAgICAqXG4gICAgICovXG4gICAgcmVhZG9ubHkgTUFYX1NFU1NJT05fVElNRTogbnVtYmVyID0gODY0MDAwMDA7IC8vIDFkID0gMjQgKiA2MCAqIDYwICogMTAwMFxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgX2h0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcsXG4gICAgICAgIHByaXZhdGUgX3VzZXJzOiBVc2Vyc1NlcnZpY2UpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHNlc3Npb24gYnkgdXNpbmcgdGhlIGpzb24gd2ViIHRva2VuIChqd3QpIGFuZCB0aGUgdXNlciBvYmplY3Q7XG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBsb2dpbiBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gand0XG4gICAgICogQHBhcmFtIHVzZXJuYW1lXG4gICAgICovXG4gICAgc2V0U2Vzc2lvbihqd3Q6IHN0cmluZywgdXNlcm5hbWU6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGdldCB1c2VyIGluZm9ybWF0aW9uXG4gICAgICAgIHRoaXMuX3VzZXJzLmdldFVzZXIodXNlcm5hbWUpLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZXN1bHQ6IFVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3lzQWRtaW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gcmVzdWx0LnBlcm1pc3Npb25zO1xuICAgICAgICAgICAgICAgIGlmIChwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5c0FkbWluID0gcGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXVxuICAgICAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoS25vcmFDb25zdGFudHMuU3lzdGVtQWRtaW5Hcm91cElSSSkgPiAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgYSBzZXNzaW9uIGlkLCB3aGljaCBpcyB0aGUgdGltZXN0YW1wIG9mIGxvZ2luXG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogdGhpcy5zZXRUaW1lc3RhbXAoKSxcbiAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBqd3Q6IGp3dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmc6IHJlc3VsdC5sYW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3lzQWRtaW46IHN5c0FkbWluXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHN0b3JlIGluIHRoZSBsb2NhbFN0b3JhZ2VcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yOiBBcGlTZXJ2aWNlRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFRpbWVzdGFtcCgpIHtcbiAgICAgICAgcmV0dXJuIChtb21lbnQoKS5hZGQoMCwgJ3NlY29uZCcpKS52YWx1ZU9mKCk7XG4gICAgfVxuXG4gICAgZ2V0U2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHVwZGF0ZVNlc3Npb24oKSB7XG5cbiAgICB9XG5cbiAgICB2YWxpZGF0ZVNlc3Npb24oKSB7XG4gICAgICAgIC8vIG1peCBvZiBjaGVja3Mgd2l0aCBzZXNzaW9uLnZhbGlkYXRpb24gYW5kIHRoaXMuYXV0aGVudGljYXRlXG4gICAgICAgIHRoaXMuc2Vzc2lvbiA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSk7XG5cbiAgICAgICAgY29uc3QgdHNOb3c6IG51bWJlciA9IHRoaXMuc2V0VGltZXN0YW1wKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2Vzc2lvbikge1xuICAgICAgICAgICAgLy8gdGhlIHNlc3Npb24gZXhpc3RzXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgc2Vzc2lvbiBpcyBzdGlsbCB2YWxpZDpcbiAgICAgICAgICAgIC8vIGlmIHNlc3Npb24uaWQgKyBNQVhfU0VTU0lPTl9USU1FID4gbm93OiBfc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKVxuICAgICAgICAgICAgaWYgKHRoaXMuc2Vzc2lvbi5pZCArIHRoaXMuTUFYX1NFU1NJT05fVElNRSA8IHRzTm93KSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGludGVybmFsIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgYXBpIHYyL2F1dGhlbnRpY2F0aW9uIGlzIHN0aWxsIHZhbGlkXG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRoZW50aWNhdGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgYXBpIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkO1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHNlc3Npb24uaWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uLmlkID0gdHNOb3c7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25ldyBzZXNzaW9uIGlkJywgdGhpcy5zZXNzaW9uLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb24nLCBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24pKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKCdzZXNzaW9uLnNlcnZpY2UgLS0gdmFsaWRhdGVTZXNzaW9uIC0tIGF1dGhlbnRpY2F0ZTogdGhlIHNlc3Npb24gZXhwaXJlZCBvbiBBUEkgc2lkZScpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhIHVzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQgYW55bW9yZSFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95U2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYXV0aGVudGljYXRlKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faHR0cC5nZXQodGhpcy5jb25maWcuYXBpICsgJy92Mi9hdXRoZW50aWNhdGlvbicpLnBpcGUoXG4gICAgICAgICAgICBtYXAoKHJlc3VsdDogYW55KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRpb25TZXJ2aWNlIC0gYXV0aGVudGljYXRlIC0gcmVzdWx0OiAnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0cnVlIHx8IGZhbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMgPT09IDIwMDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZGVzdHJveVNlc3Npb24oKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXNzaW9uJyk7XG4gICAgfVxuXG5cbn1cbiIsImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIENhbkFjdGl2YXRlLCBSb3V0ZXIsIFJvdXRlclN0YXRlU25hcHNob3QgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgQXV0aEd1YXJkIGltcGxlbWVudHMgQ2FuQWN0aXZhdGUge1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcblxuICAgIH1cblxuICAgIGNhbkFjdGl2YXRlKFxuICAgICAgICBuZXh0OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LFxuICAgICAgICBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdCk6IE9ic2VydmFibGU8Ym9vbGVhbj4gfCBQcm9taXNlPGJvb2xlYW4+IHwgYm9vbGVhbiB7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoWydsb2dpbiddLCB7cXVlcnlQYXJhbXM6IHtyZXR1cm5Vcmw6IHN0YXRlLnVybH19KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgSnd0SW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UpIHtcbiAgICB9XG5cbiAgICBpbnRlcmNlcHQocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PiwgbmV4dDogSHR0cEhhbmRsZXIpOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgICAgIC8vIGFkZCBhdXRob3JpemF0aW9uIGhlYWRlciB3aXRoIGp3dCB0b2tlbiBpZiBhdmFpbGFibGVcblxuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgLy8gdGhlIHNlc3Npb24gaXMgdmFsaWQgKGFuZCB1cCB0byBkYXRlKVxuICAgICAgICAgICAgY29uc3Qgand0ID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLmp3dDtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0LmNsb25lKHtcbiAgICAgICAgICAgICAgICBzZXRIZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtqd3R9YFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5kZXN0cm95U2Vzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vLyBpbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRXJyb3JJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG4gICAgLypcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hdXRoU2VydmljZTogQXV0aGVudGljYXRpb25TZXJ2aWNlKSB7XG4gICAgfVxuKi9cbiAgICBpbnRlcmNlcHQocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PiwgbmV4dDogSHR0cEhhbmRsZXIpOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgICAgIHJldHVybiBuZXh0LmhhbmRsZShyZXF1ZXN0KS5waXBlKGNhdGNoRXJyb3IoZXJyID0+IHtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2F1dGhlbnRpY2F0aW9uIC0tIGVycm9yLmludGVyY2VwdG9yJywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgIC8vIGF1dG8gbG9nb3V0IGlmIDQwMSByZXNwb25zZSByZXR1cm5lZCBmcm9tIGFwaVxuLy8gICAgICAgICAgICAgICAgdGhpcy5fYXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgbG9jYXRpb24ucmVsb2FkIGlzIHVzZWQgZm9yIHRoZSBhdXRoLmd1YXJkIGluIGFwcCByb3V0aW5nXG4gICAgICAgICAgICAgICAgLy8gdG8gZ28gdG8gdGhlIGxvZ2luIHBhZ2Vcbi8vICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IGVyci5lcnJvci5tZXNzYWdlIHx8IGVyci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZXJyb3IpO1xuICAgICAgICB9KSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSHR0cENsaWVudCwgSHR0cEVycm9yUmVzcG9uc2UsIEh0dHBSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLdWlDb3JlQ29uZmlnIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciwgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvblNlcnZpY2Uge1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZykge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdmFsaWRhdGUgaWYgYSB1c2VyIGlzIGxvZ2dlZCBpbiBvciBub3RcbiAgICAgKiBhbmQgdGhlIHNlc3Npb24gaXMgYWN0aXZlXG4gICAgICovXG4gICAgc2Vzc2lvbigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9naW4gcHJvY2VzcztcbiAgICAgKiBpdCdzIHVzZWQgYnkgdGhlIGxvZ2luIGNvbXBvbmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGlkZW50aWZpZXIgKGVtYWlsIG9yIHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBwYXNzd29yZFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgbG9naW4oaWRlbnRpZmllcjogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogT2JzZXJ2YWJsZTxhbnk+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5odHRwLnBvc3QoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgICAgIHtpZGVudGlmaWVyOiBpZGVudGlmaWVyLCBwYXNzd29yZDogcGFzc3dvcmR9LFxuICAgICAgICAgICAge29ic2VydmU6ICdyZXNwb25zZSd9KS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcCgocmVzcG9uc2U6IEh0dHBSZXNwb25zZTxhbnk+KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoKGVycm9yOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNlc3Npb25cbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIGhhbmRsZSByZXF1ZXN0IGVycm9yIGluIGNhc2Ugb2Ygc2VydmVyIGVycm9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKTogT2JzZXJ2YWJsZTxBcGlTZXJ2aWNlRXJyb3I+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZUVycm9yID0gbmV3IEFwaVNlcnZpY2VFcnJvcigpO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuICAgICAgICBzZXJ2aWNlRXJyb3Iuc3RhdHVzVGV4dCA9IGVycm9yLnN0YXR1c1RleHQ7XG4gICAgICAgIHNlcnZpY2VFcnJvci5lcnJvckluZm8gPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBzZXJ2aWNlRXJyb3IudXJsID0gZXJyb3IudXJsO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzZXJ2aWNlRXJyb3IpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRm9ybUJ1aWxkZXIsIEZvcm1Hcm91cCwgVmFsaWRhdG9ycyB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlLCBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBBcGlTZXJ2aWNlUmVzdWx0IH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdrdWktbG9naW4tZm9ybScsXG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybVwiICpuZ0lmPVwiIWxvZ2dlZEluVXNlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWhlYWRlclwiPlxuICAgICAgICA8aDMgbWF0LXN1YmhlYWRlcj57e2xvZ2luLnRpdGxlfX08L2gzPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtLWNvbnRlbnRcIj5cbiAgICAgICAgPCEtLSBUaGlzIGlzIHRoZSBsb2dpbiBmb3JtIC0tPlxuICAgICAgICA8Zm9ybSBjbGFzcz1cImxvZ2luLWZvcm1cIiBbZm9ybUdyb3VwXT1cImZybVwiIChuZ1N1Ym1pdCk9XCJkb0xvZ2luKClcIj5cbiAgICAgICAgICAgIDwhLS0gRXJyb3IgbWVzc2FnZSAtLT5cbiAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImVycm9yTWVzc2FnZSAhPT0gdW5kZWZpbmVkXCIgY2xhc3M9XCJmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yVXNlciB8fCBsb2dpbkVycm9yUHdcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclNlcnZlclwiPnt7bG9naW4uZXJyb3Iuc2VydmVyfX08L3NwYW4+XG4gICAgICAgICAgICA8L21hdC1oaW50PlxuXG4gICAgICAgICAgICA8IS0tIFVzZXJuYW1lIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+cGVyc29uPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgYXV0b2ZvY3VzIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5uYW1lXCIgYXV0b2NvbXBsZXRlPVwidXNlcm5hbWVcIiBmb3JtQ29udHJvbE5hbWU9XCJpZGVudGlmaWVyXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5pZGVudGlmaWVyXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBQYXNzd29yZCAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PmxvY2s8L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBbcGxhY2Vob2xkZXJdPVwibG9naW4ucHdcIiBhdXRvY29tcGxldGU9XCJjdXJyZW50LXBhc3N3b3JkXCIgZm9ybUNvbnRyb2xOYW1lPVwicGFzc3dvcmRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLnBhc3N3b3JkXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBCdXR0b246IExvZ2luIC0tPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b24gdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCIhZnJtLnZhbGlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBzdWJtaXQtYnV0dG9uIG1hdC1wcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIHt7bG9naW4uYnV0dG9ufX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIiBbY29sb3JdPVwiY29sb3JcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5cbjwhLS0gYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOyBzaG93IHdobyBpdCBpcyBhbmQgYSBsb2dvdXQgYnV0dG9uIC0tPlxuXG48ZGl2IGNsYXNzPVwibG9nb3V0LWZvcm1cIiAqbmdJZj1cImxvZ2dlZEluVXNlclwiPlxuICAgIDxwPkEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjo8L3A+XG4gICAgPHA+e3tsb2dnZWRJblVzZXJ9fTwvcD5cbiAgICA8YnI+XG4gICAgPHA+SWYgaXQncyBub3QgeW91LCBwbGVhc2UgbG9nb3V0ITwvcD5cbiAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b25cbiAgICAgICAgICAgICAgICAoY2xpY2spPVwibG9nb3V0KClcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBtYXQtd2FyblwiPlxuICAgICAgICAgICAgTE9HT1VUXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgPC9kaXY+XG48L2Rpdj5cbmAsXG4gICAgc3R5bGVzOiBbYC5mdWxsLXdpZHRoe3dpZHRoOjEwMCV9LmJ1dHRvbi1yb3csLm1hdC1mb3JtLWZpZWxkLC5tYXQtaGludHttYXJnaW4tdG9wOjI0cHh9Lm1hdC1oaW50e2JhY2tncm91bmQ6cmdiYSgyMzksODMsODAsLjM5KTtkaXNwbGF5OmJsb2NrO21hcmdpbi1sZWZ0Oi0xNnB4O3BhZGRpbmc6MTZweDt0ZXh0LWFsaWduOmNlbnRlcjt3aWR0aDoyODBweH0ubG9naW4tZm9ybSwubG9nb3V0LWZvcm17bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0bztwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoyODBweH0ubG9naW4tZm9ybSAubG9naW4tZm9ybS1oZWFkZXIsLmxvZ291dC1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlcnttYXJnaW4tYm90dG9tOjI0cHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbiwubG9nb3V0LWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbntmb250LXNpemU6MjBweDttYXJnaW4tcmlnaHQ6MTJweH0ubG9naW4tZm9ybSAuYnV0dG9uLXJvdywubG9nb3V0LWZvcm0gLmJ1dHRvbi1yb3d7bWFyZ2luLXRvcDo0OHB4fS5zaWduLXVwe21hcmdpbi10b3A6MjRweH1gXVxufSlcbmV4cG9ydCBjbGFzcyBMb2dpbkZvcm1Db21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gICAgLyoqXG4gICAgICogbmF2aWdhdGUgdG8gdGhlIGRlZmluZWQgdXJsIGFmdGVyIGxvZ2luXG4gICAgICovXG4gICAgQElucHV0KCkgbmF2aWdhdGU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBzZXQgeW91ciB0aGVtZSBjb2xvciBoZXJlLFxuICAgICAqIGl0IHdpbGwgYmUgdXNlZCBpbiB0aGUgcHJvZ3Jlc3MtaW5kaWNhdG9yXG4gICAgICovXG4gICAgQElucHV0KCkgY29sb3I/OiBzdHJpbmc7XG5cbiAgICByZXR1cm5Vcmw6IHN0cmluZztcblxuICAgIC8vIGlzIHRoZXJlIGFscmVhZHkgYSB2YWxpZCBzZXNzaW9uP1xuICAgIGxvZ2dlZEluVXNlcjogc3RyaW5nO1xuXG4gICAgLy8gZm9ybVxuICAgIGZybTogRm9ybUdyb3VwO1xuXG4gICAgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgLy8gZ2VuZXJhbCBlcnJvciBtZXNzYWdlXG4gICAgZXJyb3JNZXNzYWdlOiBhbnk7XG5cbiAgICAvLyBzcGVjaWZpYyBlcnJvciBtZXNzYWdlc1xuICAgIGxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgLy8gbGFiZWxzIGZvciB0aGUgbG9naW4gZm9ybVxuICAgIGxvZ2luID0ge1xuICAgICAgICB0aXRsZTogJ0xvZ2luJyxcbiAgICAgICAgbmFtZTogJ1VzZXJuYW1lJyxcbiAgICAgICAgcHc6ICdQYXNzd29yZCcsXG4gICAgICAgIGJ1dHRvbjogJ0xvZ2luJyxcbiAgICAgICAgcmVtZW1iZXI6ICdSZW1lbWJlciBtZScsXG4gICAgICAgIGZvcmdvdF9wdzogJ0ZvcmdvdCBwYXNzd29yZD8nLFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgZmFpbGVkOiAnUGFzc3dvcmQgb3IgdXNlcm5hbWUgaXMgd3JvbmcnLFxuICAgICAgICAgICAgc2VydmVyOiAnVGhlcmVcXCdzIGFuIGVycm9yIHdpdGggdGhlIHNlcnZlciBjb25uZWN0aW9uLiBUcnkgaXQgYWdhaW4gbGF0ZXIgb3IgaW5mb3JtIHRoZSBLbm9yYSBUZWFtJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGVycm9yIGRlZmluaXRpb25zIGZvciB0aGUgZm9sbG93aW5nIGZvcm0gZmllbGRzXG4gICAgZm9ybUVycm9ycyA9IHtcbiAgICAgICAgJ2lkZW50aWZpZXInOiAnJyxcbiAgICAgICAgJ3Bhc3N3b3JkJzogJydcbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgbWVzc2FnZXMgZm9yIHRoZSBmb3JtIGZpZWxkcyBkZWZpbmVkIGluIGZvcm1FcnJvcnNcbiAgICB2YWxpZGF0aW9uTWVzc2FnZXMgPSB7XG4gICAgICAgICdpZGVudGlmaWVyJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3VzZXIgbmFtZSBpcyByZXF1aXJlZC4nXG4gICAgICAgIH0sXG4gICAgICAgICdwYXNzd29yZCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICdwYXNzd29yZCBpcyByZXF1aXJlZCdcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGg6IEF1dGhlbnRpY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9mYjogRm9ybUJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5idWlsZEZvcm0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRm9ybSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5mcm0gPSB0aGlzLl9mYi5ncm91cCh7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcm0udmFsdWVDaGFuZ2VzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gdGhpcy5vblZhbHVlQ2hhbmdlZChkYXRhKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2hlY2sgZm9yIGVycm9ycyB3aGlsZSB1c2luZyB0aGUgZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgb25WYWx1ZUNoYW5nZWQoZGF0YT86IGFueSkge1xuXG4gICAgICAgIGlmICghdGhpcy5mcm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLmZybTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1FcnJvcnMpLm1hcChmaWVsZCA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdID0gJyc7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybS5nZXQoZmllbGQpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2wgJiYgY29udHJvbC5kaXJ0eSAmJiAhY29udHJvbC52YWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy52YWxpZGF0aW9uTWVzc2FnZXNbZmllbGRdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2wuZXJyb3JzKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSArPSBtZXNzYWdlc1trZXldICsgJyAnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkb0xvZ2luKCkge1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBlcnJvciBtZXNzYWdlc1xuICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSB2YWx1ZXMgYXJlIHZhbGlkXG4gICAgICAgIGlmICh0aGlzLmZybS5pbnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlc2V0IHN0YXR1c1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIEdyYWIgdmFsdWVzIGZyb20gZm9ybVxuICAgICAgICBjb25zdCB1c2VybmFtZSA9IHRoaXMuZnJtLmdldCgnaWRlbnRpZmllcicpLnZhbHVlO1xuICAgICAgICBjb25zdCBwYXNzd29yZCA9IHRoaXMuZnJtLmdldCgncGFzc3dvcmQnKS52YWx1ZTtcblxuICAgICAgICB0aGlzLl9hdXRoLmxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgKHJlc3BvbnNlOiBBcGlTZXJ2aWNlUmVzdWx0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHRva2VuOyBzZXQgdGhlIHNlc3Npb24gbm93XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Nlc3Npb24uc2V0U2Vzc2lvbihyZXNwb25zZS5ib2R5LnRva2VuLCB1c2VybmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgcmV0dXJuIHVybCBmcm9tIHJvdXRlIHBhcmFtZXRlcnMgb3IgZGVmYXVsdCB0byAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVXJsID0gdGhpcy5fcm91dGUuc25hcHNob3QucXVlcnlQYXJhbXNbJ3JldHVyblVybCddIHx8ICcvJztcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnbyBiYWNrIHRvIHRoZSBwcmV2aW91cyByb3V0ZSBvciB0byB0aGUgcm91dGUgZGVmaW5lZCBpbiB0aGUgQElucHV0IGlmIG5hdmlnYXRlIGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5hdmlnYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLnJldHVyblVybF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMubmF2aWdhdGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGVycm9yOiBBcGlTZXJ2aWNlRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gPGFueT4gZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIHRoaXMuX2F1dGgubG9nb3V0KCk7XG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBIdHRwQ2xpZW50TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFJlYWN0aXZlRm9ybXNNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQgeyBNYXRCdXR0b25Nb2R1bGUsIE1hdENhcmRNb2R1bGUsIE1hdERpYWxvZ01vZHVsZSwgTWF0Rm9ybUZpZWxkTW9kdWxlLCBNYXRJY29uTW9kdWxlLCBNYXRJbnB1dE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsJztcbmltcG9ydCB7IEt1aUFjdGlvbk1vZHVsZSB9IGZyb20gJ0Brbm9yYS9hY3Rpb24nO1xuXG5pbXBvcnQgeyBMb2dpbkZvcm1Db21wb25lbnQgfSBmcm9tICcuL2xvZ2luLWZvcm0vbG9naW4tZm9ybS5jb21wb25lbnQnO1xuXG5ATmdNb2R1bGUoe1xuICAgIGltcG9ydHM6IFtcbiAgICAgICAgQ29tbW9uTW9kdWxlLFxuICAgICAgICBLdWlBY3Rpb25Nb2R1bGUsXG4gICAgICAgIE1hdENhcmRNb2R1bGUsXG4gICAgICAgIE1hdEljb25Nb2R1bGUsXG4gICAgICAgIE1hdElucHV0TW9kdWxlLFxuICAgICAgICBNYXRCdXR0b25Nb2R1bGUsXG4gICAgICAgIE1hdERpYWxvZ01vZHVsZSxcbiAgICAgICAgTWF0Rm9ybUZpZWxkTW9kdWxlLFxuICAgICAgICBSZWFjdGl2ZUZvcm1zTW9kdWxlLFxuICAgICAgICBIdHRwQ2xpZW50TW9kdWxlXG4gICAgXSxcbiAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgTG9naW5Gb3JtQ29tcG9uZW50XG4gICAgXSxcbiAgICBleHBvcnRzOiBbXG4gICAgICAgIExvZ2luRm9ybUNvbXBvbmVudFxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgS3VpQXV0aGVudGljYXRpb25Nb2R1bGUge1xufVxuIiwiLypcbiAqIFB1YmxpYyBBUEkgU3VyZmFjZSBvZiBhdXRoZW50aWNhdGlvblxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vbGliL2d1YXJkL2F1dGguZ3VhcmQnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2xvZ2luLWZvcm0vbG9naW4tZm9ybS5jb21wb25lbnQnO1xuXG5leHBvcnQgKiBmcm9tICcuL2xpYi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2F1dGhlbnRpY2F0aW9uLm1vZHVsZSc7XG4iLCIvKipcbiAqIEdlbmVyYXRlZCBidW5kbGUgaW5kZXguIERvIG5vdCBlZGl0LlxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vcHVibGljX2FwaSc7XG5cbmV4cG9ydCB7U2Vzc2lvblNlcnZpY2UgYXMgw4nCtWF9IGZyb20gJy4vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJzsiXSwibmFtZXMiOlsiS25vcmFDb25zdGFudHMiLCJtYXAiLCJJbmplY3RhYmxlIiwiSHR0cENsaWVudCIsIkt1aUNvcmVDb25maWciLCJJbmplY3QiLCJVc2Vyc1NlcnZpY2UiLCJSb3V0ZXIiLCJjYXRjaEVycm9yIiwidGhyb3dFcnJvciIsIkFwaVNlcnZpY2VFcnJvciIsIlZhbGlkYXRvcnMiLCJDb21wb25lbnQiLCJGb3JtQnVpbGRlciIsIkFjdGl2YXRlZFJvdXRlIiwiSW5wdXQiLCJOZ01vZHVsZSIsIkNvbW1vbk1vZHVsZSIsIkt1aUFjdGlvbk1vZHVsZSIsIk1hdENhcmRNb2R1bGUiLCJNYXRJY29uTW9kdWxlIiwiTWF0SW5wdXRNb2R1bGUiLCJNYXRCdXR0b25Nb2R1bGUiLCJNYXREaWFsb2dNb2R1bGUiLCJNYXRGb3JtRmllbGRNb2R1bGUiLCJSZWFjdGl2ZUZvcm1zTW9kdWxlIiwiSHR0cENsaWVudE1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBUUEsSUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBRzlCO1FBY0ksd0JBQ1ksS0FBaUIsRUFDQSxNQUFxQixFQUN0QyxNQUFvQjtZQUZwQixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ0EsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQUN0QyxXQUFNLEdBQU4sTUFBTSxDQUFjOzs7Ozs7WUFMdkIscUJBQWdCLEdBQVcsUUFBUSxDQUFDO1NBTTVDOzs7Ozs7OztRQVNELG1DQUFVLEdBQVYsVUFBVyxHQUFXLEVBQUUsUUFBZ0I7WUFBeEMsaUJBK0JDOztZQTVCRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQ25DLFVBQUMsTUFBWTtnQkFDVCxJQUFJLFFBQVEsR0FBWSxLQUFLLENBQUM7Z0JBRTlCLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZDLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDQSxpQkFBYyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7b0JBQy9ELFFBQVEsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUNBLGlCQUFjLENBQUMsZ0JB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