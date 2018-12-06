(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common/http'), require('@angular/core'), require('@knora/core'), require('moment'), require('rxjs/operators'), require('@angular/router'), require('rxjs'), require('@angular/forms'), require('@angular/common'), require('@angular/material'), require('@knora/action')) :
    typeof define === 'function' && define.amd ? define('@knora/authentication', ['exports', '@angular/common/http', '@angular/core', '@knora/core', 'moment', 'rxjs/operators', '@angular/router', 'rxjs', '@angular/forms', '@angular/common', '@angular/material', '@knora/action'], factory) :
    (factory((global.knora = global.knora || {}, global.knora.authentication = {}),global.ng.common.http,global.ng.core,null,null,global.rxjs.operators,global.ng.router,global.rxjs,global.ng.forms,global.ng.common,global.ng.material,null));
}(this, (function (exports,i1,i0,i2,momentImported,operators,i2$1,rxjs,forms,common,material,action) { 'use strict';

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
    /** @type {?} */
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
            this.MAX_SESSION_TIME = 86400000;
        }
        /**
         * set the session by using the json web token (jwt) and the user object;
         * it will be used in the login process
         *
         * @param jwt
         * @param username
         */
        /**
         * set the session by using the json web token (jwt) and the user object;
         * it will be used in the login process
         *
         * @param {?} jwt
         * @param {?} username
         * @return {?}
         */
        SessionService.prototype.setSession = /**
         * set the session by using the json web token (jwt) and the user object;
         * it will be used in the login process
         *
         * @param {?} jwt
         * @param {?} username
         * @return {?}
         */
            function (jwt, username) {
                var _this = this;
                // get user information
                this._users.getUser(username).subscribe(function (result) {
                    /** @type {?} */
                    var sysAdmin = false;
                    /** @type {?} */
                    var permissions = result.permissions;
                    if (permissions.groupsPerProject[i2.KnoraConstants.SystemProjectIRI]) {
                        sysAdmin = permissions.groupsPerProject[i2.KnoraConstants.SystemProjectIRI]
                            .indexOf(i2.KnoraConstants.SystemAdminGroupIRI) > -1;
                    }
                    // define a session id, which is the timestamp of login
                    // define a session id, which is the timestamp of login
                    _this.session = {
                        id: _this.setTimestamp(),
                        user: {
                            name: result.email,
                            jwt: jwt,
                            lang: result.lang,
                            sysAdmin: sysAdmin
                        }
                    };
                    console.log('session service: ', _this.session);
                    // store in the localStorage
                    localStorage.setItem('session', JSON.stringify(_this.session));
                }, function (error) {
                    console.error(error);
                });
            };
        /**
         * @return {?}
         */
        SessionService.prototype.setTimestamp = /**
         * @return {?}
         */
            function () {
                return (moment().add(0, 'second')).valueOf();
            };
        /**
         * @return {?}
         */
        SessionService.prototype.getSession = /**
         * @return {?}
         */
            function () {
            };
        /**
         * @return {?}
         */
        SessionService.prototype.updateSession = /**
         * @return {?}
         */
            function () {
            };
        /**
         * @return {?}
         */
        SessionService.prototype.validateSession = /**
         * @return {?}
         */
            function () {
                // mix of checks with session.validation and this.authenticate
                this.session = JSON.parse(localStorage.getItem('session'));
                /** @type {?} */
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
        /**
         * @return {?}
         */
        SessionService.prototype.authenticate = /**
         * @return {?}
         */
            function () {
                return this._http.get(this.config.api + '/v2/authentication').pipe(operators.map(function (result) {
                    console.log('AuthenticationService - authenticate - result: ', result);
                    // return true || false
                    return result.status === 200;
                }));
            };
        /**
         * @return {?}
         */
        SessionService.prototype.destroySession = /**
         * @return {?}
         */
            function () {
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
        /** @nocollapse */ SessionService.ngInjectableDef = i0.defineInjectable({ factory: function SessionService_Factory() { return new SessionService(i0.inject(i1.HttpClient), i0.inject("config"), i0.inject(i2.UsersService)); }, token: SessionService, providedIn: "root" });
        return SessionService;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
    var AuthGuard = (function () {
        function AuthGuard(_session, _router) {
            this._session = _session;
            this._router = _router;
        }
        /**
         * @param {?} next
         * @param {?} state
         * @return {?}
         */
        AuthGuard.prototype.canActivate = /**
         * @param {?} next
         * @param {?} state
         * @return {?}
         */
            function (next, state) {
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
        /** @nocollapse */ AuthGuard.ngInjectableDef = i0.defineInjectable({ factory: function AuthGuard_Factory() { return new AuthGuard(i0.inject(SessionService), i0.inject(i2$1.Router)); }, token: AuthGuard, providedIn: "root" });
        return AuthGuard;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
    var JwtInterceptor = (function () {
        function JwtInterceptor(_session) {
            this._session = _session;
        }
        /**
         * @param {?} request
         * @param {?} next
         * @return {?}
         */
        JwtInterceptor.prototype.intercept = /**
         * @param {?} request
         * @param {?} next
         * @return {?}
         */
            function (request, next) {
                // add authorization header with jwt token if available
                if (this._session.validateSession()) {
                    /** @type {?} */
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

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
    var ErrorInterceptor = (function () {
        function ErrorInterceptor() {
        }
        /*
        constructor(private _authService: AuthenticationService) {
        }
    */
        /**
         * @param {?} request
         * @param {?} next
         * @return {?}
         */
        ErrorInterceptor.prototype.intercept = /**
         * @param {?} request
         * @param {?} next
         * @return {?}
         */
            function (request, next) {
                return next.handle(request).pipe(operators.catchError(function (err) {
                    console.log('authentication -- error.interceptor', err);
                    if (err.status === 401) ;
                    /** @type {?} */
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
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
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
                return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(operators.map(function (response) {
                    console.log('authentication service: ', response);
                    return response;
                }), operators.catchError(function (error) {
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
        /** @nocollapse */ AuthenticationService.ngInjectableDef = i0.defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(i0.inject(i1.HttpClient), i0.inject(SessionService), i0.inject("config")); }, token: AuthenticationService, providedIn: "root" });
        return AuthenticationService;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
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
        /**
         * @return {?}
         */
        LoginFormComponent.prototype.ngOnInit = /**
         * @return {?}
         */
            function () {
                // check if a user is already logged in
                if (this._session.validateSession()) {
                    this.loggedInUser = JSON.parse(localStorage.getItem('session')).user.name;
                }
                else {
                    this.buildForm();
                }
            };
        /**
         * @return {?}
         */
        LoginFormComponent.prototype.buildForm = /**
         * @return {?}
         */
            function () {
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
        /**
         * check for errors while using the form
         * @param {?=} data
         * @return {?}
         */
        LoginFormComponent.prototype.onValueChanged = /**
         * check for errors while using the form
         * @param {?=} data
         * @return {?}
         */
            function (data) {
                var _this = this;
                if (!this.frm) {
                    return;
                }
                /** @type {?} */
                var form = this.frm;
                Object.keys(this.formErrors).map(function (field) {
                    _this.formErrors[field] = '';
                    /** @type {?} */
                    var control = form.get(field);
                    if (control && control.dirty && !control.valid) {
                        /** @type {?} */
                        var messages_1 = _this.validationMessages[field];
                        Object.keys(control.errors).map(function (key) {
                            _this.formErrors[field] += messages_1[key] + ' ';
                        });
                    }
                });
            };
        /**
         * @return {?}
         */
        LoginFormComponent.prototype.doLogin = /**
         * @return {?}
         */
            function () {
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
                /** @type {?} */
                var username = this.frm.get('email').value;
                /** @type {?} */
                var password = this.frm.get('password').value;
                this._auth.login(username, password)
                    .subscribe(function (response) {
                    console.log('login-form: ', response);
                    // we have a token; set the session now
                    // we have a token; set the session now
                    _this._session.setSession(response.body.token, username);
                    setTimeout(function () {
                        // get return url from route parameters or default to '/'
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
                    _this.errorMessage = /** @type {?} */ (error);
                    _this.loading = false;
                });
            };
        /**
         * @return {?}
         */
        LoginFormComponent.prototype.logout = /**
         * @return {?}
         */
            function () {
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

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */
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

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
     */

    exports.AuthGuard = AuthGuard;
    exports.JwtInterceptor = JwtInterceptor;
    exports.ErrorInterceptor = ErrorInterceptor;
    exports.LoginFormComponent = LoginFormComponent;
    exports.AuthenticationService = AuthenticationService;
    exports.KuiAuthenticationModule = KuiAuthenticationModule;
    exports.ɵa = SessionService;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24udW1kLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2d1YXJkL2F1dGguZ3VhcmQudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3Ivand0LmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2ludGVyY2VwdG9yL2Vycm9yLmludGVyY2VwdG9yLnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9hdXRoZW50aWNhdGlvbi5tb2R1bGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQXBpU2VydmljZUVycm9yLCBLbm9yYUNvbnN0YW50cywgS3VpQ29yZUNvbmZpZywgU2Vzc2lvbiwgVXNlciwgVXNlcnNTZXJ2aWNlIH0gZnJvbSAnQGtub3JhL2NvcmUnO1xuXG5pbXBvcnQgKiBhcyBtb21lbnRJbXBvcnRlZCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5jb25zdCBtb21lbnQgPSBtb21lbnRJbXBvcnRlZDtcblxuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFNlc3Npb25TZXJ2aWNlIHtcblxuICAgIHB1YmxpYyBzZXNzaW9uOiBTZXNzaW9uO1xuXG4gICAgLyoqXG4gICAgICogbWF4IHNlc3Npb24gdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICAgKiBkZWZhdWx0IHZhbHVlICgyNGgpOiA4NjQwMDAwMFxuICAgICAqXG4gICAgICovXG4gICAgcmVhZG9ubHkgTUFYX1NFU1NJT05fVElNRTogbnVtYmVyID0gODY0MDAwMDA7IC8vIDFkID0gMjQgKiA2MCAqIDYwICogMTAwMFxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgX2h0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgIEBJbmplY3QoJ2NvbmZpZycpIHB1YmxpYyBjb25maWc6IEt1aUNvcmVDb25maWcsXG4gICAgICAgIHByaXZhdGUgX3VzZXJzOiBVc2Vyc1NlcnZpY2UpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHNlc3Npb24gYnkgdXNpbmcgdGhlIGpzb24gd2ViIHRva2VuIChqd3QpIGFuZCB0aGUgdXNlciBvYmplY3Q7XG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBsb2dpbiBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gand0XG4gICAgICogQHBhcmFtIHVzZXJuYW1lXG4gICAgICovXG4gICAgc2V0U2Vzc2lvbihqd3Q6IHN0cmluZywgdXNlcm5hbWU6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGdldCB1c2VyIGluZm9ybWF0aW9uXG4gICAgICAgIHRoaXMuX3VzZXJzLmdldFVzZXIodXNlcm5hbWUpLnN1YnNjcmliZShcbiAgICAgICAgICAgIChyZXN1bHQ6IFVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3lzQWRtaW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gcmVzdWx0LnBlcm1pc3Npb25zO1xuICAgICAgICAgICAgICAgIGlmIChwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5c0FkbWluID0gcGVybWlzc2lvbnMuZ3JvdXBzUGVyUHJvamVjdFtLbm9yYUNvbnN0YW50cy5TeXN0ZW1Qcm9qZWN0SVJJXVxuICAgICAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoS25vcmFDb25zdGFudHMuU3lzdGVtQWRtaW5Hcm91cElSSSkgPiAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgYSBzZXNzaW9uIGlkLCB3aGljaCBpcyB0aGUgdGltZXN0YW1wIG9mIGxvZ2luXG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogdGhpcy5zZXRUaW1lc3RhbXAoKSxcbiAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmVzdWx0LmVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgand0OiBqd3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiByZXN1bHQubGFuZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5c0FkbWluOiBzeXNBZG1pblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZXNzaW9uIHNlcnZpY2U6ICcsIHRoaXMuc2Vzc2lvbik7XG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgaW4gdGhlIGxvY2FsU3RvcmFnZVxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGltZXN0YW1wKCkge1xuICAgICAgICByZXR1cm4gKG1vbWVudCgpLmFkZCgwLCAnc2Vjb25kJykpLnZhbHVlT2YoKTtcbiAgICB9XG5cbiAgICBnZXRTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdXBkYXRlU2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHZhbGlkYXRlU2Vzc2lvbigpIHtcbiAgICAgICAgLy8gbWl4IG9mIGNoZWNrcyB3aXRoIHNlc3Npb24udmFsaWRhdGlvbiBhbmQgdGhpcy5hdXRoZW50aWNhdGVcbiAgICAgICAgdGhpcy5zZXNzaW9uID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKTtcblxuICAgICAgICBjb25zdCB0c05vdzogbnVtYmVyID0gdGhpcy5zZXRUaW1lc3RhbXAoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBleGlzdHNcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBzZXNzaW9uIGlzIHN0aWxsIHZhbGlkOlxuICAgICAgICAgICAgLy8gaWYgc2Vzc2lvbi5pZCArIE1BWF9TRVNTSU9OX1RJTUUgPiBub3c6IF9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpXG4gICAgICAgICAgICBpZiAodGhpcy5zZXNzaW9uLmlkICsgdGhpcy5NQVhfU0VTU0lPTl9USU1FIDwgdHNOb3cpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgaW50ZXJuYWwgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBhcGkgdjIvYXV0aGVudGljYXRpb24gaXMgc3RpbGwgdmFsaWRcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhcGkgYXV0aGVudGljYXRpb24gaXMgdmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Vzc2lvbi5pZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24uaWQgPSB0c05vdztcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbmV3IHNlc3Npb24gaWQnLCB0aGlzLnNlc3Npb24uaWQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Nlc3Npb24uc2VydmljZSAtLSB2YWxpZGF0ZVNlc3Npb24gLS0gYXV0aGVudGljYXRlOiB0aGUgc2Vzc2lvbiBleHBpcmVkIG9uIEFQSSBzaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgdXNlciBpcyBub3QgYXV0aGVudGljYXRlZCBhbnltb3JlIVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhdXRoZW50aWNhdGUoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9odHRwLmdldCh0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJykucGlwZShcbiAgICAgICAgICAgIG1hcCgocmVzdWx0OiBhbnkpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdXRoZW50aWNhdGlvblNlcnZpY2UgLSBhdXRoZW50aWNhdGUgLSByZXN1bHQ6ICcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRydWUgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnN0YXR1cyA9PT0gMjAwO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBkZXN0cm95U2Vzc2lvbigpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxufVxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgQ2FuQWN0aXZhdGUsIFJvdXRlciwgUm91dGVyU3RhdGVTbmFwc2hvdCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoR3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuXG4gICAgfVxuXG4gICAgY2FuQWN0aXZhdGUoXG4gICAgICAgIG5leHQ6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgICAgIHN0YXRlOiBSb3V0ZXJTdGF0ZVNuYXBzaG90KTogT2JzZXJ2YWJsZTxib29sZWFuPiB8IFByb21pc2U8Ym9vbGVhbj4gfCBib29sZWFuIHtcblxuICAgICAgICBpZiAoIXRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbJ2xvZ2luJ10sIHtxdWVyeVBhcmFtczoge3JldHVyblVybDogc3RhdGUudXJsfX0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBKd3RJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSkge1xuICAgIH1cblxuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgLy8gYWRkIGF1dGhvcml6YXRpb24gaGVhZGVyIHdpdGggand0IHRva2VuIGlmIGF2YWlsYWJsZVxuXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBpcyB2YWxpZCAoYW5kIHVwIHRvIGRhdGUpXG4gICAgICAgICAgICBjb25zdCBqd3QgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIuand0O1xuICAgICAgICAgICAgcmVxdWVzdCA9IHJlcXVlc3QuY2xvbmUoe1xuICAgICAgICAgICAgICAgIHNldEhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2p3dH1gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXNzaW9uLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8vIGltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBFcnJvckludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgICAvKlxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGhTZXJ2aWNlOiBBdXRoZW50aWNhdGlvblNlcnZpY2UpIHtcbiAgICB9XG4qL1xuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpLnBpcGUoY2F0Y2hFcnJvcihlcnIgPT4ge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gLS0gZXJyb3IuaW50ZXJjZXB0b3InLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgLy8gYXV0byBsb2dvdXQgaWYgNDAxIHJlc3BvbnNlIHJldHVybmVkIGZyb20gYXBpXG4vLyAgICAgICAgICAgICAgICB0aGlzLl9hdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBsb2NhdGlvbi5yZWxvYWQgaXMgdXNlZCBmb3IgdGhlIGF1dGguZ3VhcmQgaW4gYXBwIHJvdXRpbmdcbiAgICAgICAgICAgICAgICAvLyB0byBnbyB0byB0aGUgbG9naW4gcGFnZVxuLy8gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZXJyLmVycm9yLm1lc3NhZ2UgfHwgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEt1aUNvcmVDb25maWcgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uU2VydmljZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB2YWxpZGF0ZSBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdFxuICAgICAqIGFuZCB0aGUgc2Vzc2lvbiBpcyBhY3RpdmVcbiAgICAgKi9cbiAgICBzZXNzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2dpbiBwcm9jZXNzO1xuICAgICAqIGl0J3MgdXNlZCBieSB0aGUgbG9naW4gY29tcG9uZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRlbnRpZmllciAoZW1haWwgb3IgdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBsb2dpbihpZGVudGlmaWVyOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nLFxuICAgICAgICAgICAge2lkZW50aWZpZXI6IGlkZW50aWZpZXIsIHBhc3N3b3JkOiBwYXNzd29yZH0sXG4gICAgICAgICAgICB7b2JzZXJ2ZTogJ3Jlc3BvbnNlJ30pLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKChyZXNwb25zZTogSHR0cFJlc3BvbnNlPGFueT4pOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gc2VydmljZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIHJlcXVlc3QgZXJyb3IgaW4gY2FzZSBvZiBzZXJ2ZXIgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvclxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpOiBPYnNlcnZhYmxlPEFwaVNlcnZpY2VFcnJvcj4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlRXJyb3IgPSBuZXcgQXBpU2VydmljZUVycm9yKCk7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXMgPSBlcnJvci5zdGF0dXM7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXNUZXh0ID0gZXJyb3Iuc3RhdHVzVGV4dDtcbiAgICAgICAgc2VydmljZUVycm9yLmVycm9ySW5mbyA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIHNlcnZpY2VFcnJvci51cmwgPSBlcnJvci51cmw7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHNlcnZpY2VFcnJvcik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImVtYWlsXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5lbWFpbFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gUGFzc3dvcmQgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5sb2NrPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgW3BsYWNlaG9sZGVyXT1cImxvZ2luLnB3XCIgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIGZvcm1Db250cm9sTmFtZT1cInBhc3N3b3JkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5wYXNzd29yZFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gQnV0dG9uOiBMb2dpbiAtLT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIWZybS52YWxpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggc3VibWl0LWJ1dHRvbiBtYXQtcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICB7e2xvZ2luLmJ1dHRvbn19XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCIgW2NvbG9yXT1cImNvbG9yXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48IS0tIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjsgc2hvdyB3aG8gaXQgaXMgYW5kIGEgbG9nb3V0IGJ1dHRvbiAtLT5cblxuPGRpdiBjbGFzcz1cImxvZ291dC1mb3JtXCIgKm5nSWY9XCJsb2dnZWRJblVzZXJcIj5cbiAgICA8cD5BIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW46PC9wPlxuICAgIDxwPnt7bG9nZ2VkSW5Vc2VyfX08L3A+XG4gICAgPGJyPlxuICAgIDxwPklmIGl0J3Mgbm90IHlvdSwgcGxlYXNlIGxvZ291dCE8L3A+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uXG4gICAgICAgICAgICAgICAgKGNsaWNrKT1cImxvZ291dCgpXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggbWF0LXdhcm5cIj5cbiAgICAgICAgICAgIExPR09VVFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5gLFxuICAgIHN0eWxlczogW2AuZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5idXR0b24tcm93LC5tYXQtZm9ybS1maWVsZCwubWF0LWhpbnR7bWFyZ2luLXRvcDoyNHB4fS5tYXQtaGludHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDgzLDgwLC4zOSk7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDotMTZweDtwYWRkaW5nOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0sLmxvZ291dC1mb3Jte21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZvcm0taGVhZGVyLC5sb2dvdXQtZm9ybSAubG9naW4tZm9ybS1oZWFkZXJ7bWFyZ2luLWJvdHRvbToyNHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb24sLmxvZ291dC1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb257Zm9udC1zaXplOjIwcHg7bWFyZ2luLXJpZ2h0OjEycHh9LmxvZ2luLWZvcm0gLmJ1dHRvbi1yb3csLmxvZ291dC1mb3JtIC5idXR0b24tcm93e21hcmdpbi10b3A6NDhweH0uc2lnbi11cHttYXJnaW4tdG9wOjI0cHh9YF1cbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Gb3JtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICAgIC8qKlxuICAgICAqIG5hdmlnYXRlIHRvIHRoZSBkZWZpbmVkIHVybCBhZnRlciBsb2dpblxuICAgICAqL1xuICAgIEBJbnB1dCgpIG5hdmlnYXRlPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogc2V0IHlvdXIgdGhlbWUgY29sb3IgaGVyZSxcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2dyZXNzLWluZGljYXRvclxuICAgICAqL1xuICAgIEBJbnB1dCgpIGNvbG9yPzogc3RyaW5nO1xuXG4gICAgcmV0dXJuVXJsOiBzdHJpbmc7XG5cbiAgICAvLyBpcyB0aGVyZSBhbHJlYWR5IGEgdmFsaWQgc2Vzc2lvbj9cbiAgICBsb2dnZWRJblVzZXI6IHN0cmluZztcblxuICAgIC8vIGZvcm1cbiAgICBmcm06IEZvcm1Hcm91cDtcblxuICAgIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGdlbmVyYWwgZXJyb3IgbWVzc2FnZVxuICAgIGVycm9yTWVzc2FnZTogYW55O1xuXG4gICAgLy8gc3BlY2lmaWMgZXJyb3IgbWVzc2FnZXNcbiAgICBsb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgIC8vIGxhYmVscyBmb3IgdGhlIGxvZ2luIGZvcm1cbiAgICBsb2dpbiA9IHtcbiAgICAgICAgdGl0bGU6ICdMb2dpbicsXG4gICAgICAgIG5hbWU6ICdVc2VybmFtZScsXG4gICAgICAgIHB3OiAnUGFzc3dvcmQnLFxuICAgICAgICBidXR0b246ICdMb2dpbicsXG4gICAgICAgIHJlbWVtYmVyOiAnUmVtZW1iZXIgbWUnLFxuICAgICAgICBmb3Jnb3RfcHc6ICdGb3Jnb3QgcGFzc3dvcmQ/JyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIGZhaWxlZDogJ1Bhc3N3b3JkIG9yIHVzZXJuYW1lIGlzIHdyb25nJyxcbiAgICAgICAgICAgIHNlcnZlcjogJ1RoZXJlXFwncyBhbiBlcnJvciB3aXRoIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbi4gVHJ5IGl0IGFnYWluIGxhdGVyIG9yIGluZm9ybSB0aGUgS25vcmEgVGVhbSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBlcnJvciBkZWZpbml0aW9ucyBmb3IgdGhlIGZvbGxvd2luZyBmb3JtIGZpZWxkc1xuICAgIGZvcm1FcnJvcnMgPSB7XG4gICAgICAgICdlbWFpbCc6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2VtYWlsJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3VzZXIgbmFtZSBpcyByZXF1aXJlZC4nXG4gICAgICAgIH0sXG4gICAgICAgICdwYXNzd29yZCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICdwYXNzd29yZCBpcyByZXF1aXJlZCdcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGg6IEF1dGhlbnRpY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9mYjogRm9ybUJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5idWlsZEZvcm0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRm9ybSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5mcm0gPSB0aGlzLl9mYi5ncm91cCh7XG4gICAgICAgICAgICBlbWFpbDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZnJtLnZhbHVlQ2hhbmdlc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IHRoaXMub25WYWx1ZUNoYW5nZWQoZGF0YSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGZvciBlcnJvcnMgd2hpbGUgdXNpbmcgdGhlIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIG9uVmFsdWVDaGFuZ2VkKGRhdGE/OiBhbnkpIHtcblxuICAgICAgICBpZiAoIXRoaXMuZnJtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5mcm07XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5mb3JtRXJyb3JzKS5tYXAoZmllbGQgPT4ge1xuICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSA9ICcnO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm0uZ2V0KGZpZWxkKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sICYmIGNvbnRyb2wuZGlydHkgJiYgIWNvbnRyb2wudmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMudmFsaWRhdGlvbk1lc3NhZ2VzW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb250cm9sLmVycm9ycykubWFwKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gKz0gbWVzc2FnZXNba2V5XSArICcgJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZG9Mb2dpbigpIHtcblxuICAgICAgICAvLyByZXNldCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIGZvcm0gdmFsdWVzIGFyZSB2YWxpZFxuICAgICAgICBpZiAodGhpcy5mcm0uaW52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBzdGF0dXNcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyBHcmFiIHZhbHVlcyBmcm9tIGZvcm1cbiAgICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLmZybS5nZXQoJ2VtYWlsJykudmFsdWU7XG4gICAgICAgIGNvbnN0IHBhc3N3b3JkID0gdGhpcy5mcm0uZ2V0KCdwYXNzd29yZCcpLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuX2F1dGgubG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKVxuICAgICAgICAgICAgLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAocmVzcG9uc2U6IEFwaVNlcnZpY2VSZXN1bHQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbG9naW4tZm9ybTogJywgcmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB0b2tlbjsgc2V0IHRoZSBzZXNzaW9uIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXNzaW9uLnNldFNlc3Npb24ocmVzcG9uc2UuYm9keS50b2tlbiwgdXNlcm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHJldHVybiB1cmwgZnJvbSByb3V0ZSBwYXJhbWV0ZXJzIG9yIGRlZmF1bHQgdG8gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblVybCA9IHRoaXMuX3JvdXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zWydyZXR1cm5VcmwnXSB8fCAnLyc7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gYmFjayB0byB0aGUgcHJldmlvdXMgcm91dGUgb3IgdG8gdGhlIHJvdXRlIGRlZmluZWQgaW4gdGhlIEBJbnB1dCBpZiBuYXZpZ2F0ZSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5uYXZpZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5yZXR1cm5VcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLm5hdmlnYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IDxhbnk+IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICB0aGlzLl9hdXRoLmxvZ291dCgpO1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgSHR0cENsaWVudE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBSZWFjdGl2ZUZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgTWF0QnV0dG9uTW9kdWxlLCBNYXRDYXJkTW9kdWxlLCBNYXREaWFsb2dNb2R1bGUsIE1hdEZvcm1GaWVsZE1vZHVsZSwgTWF0SWNvbk1vZHVsZSwgTWF0SW5wdXRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbCc7XG5pbXBvcnQgeyBLdWlBY3Rpb25Nb2R1bGUgfSBmcm9tICdAa25vcmEvYWN0aW9uJztcblxuaW1wb3J0IHsgTG9naW5Gb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50JztcblxuQE5nTW9kdWxlKHtcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIENvbW1vbk1vZHVsZSxcbiAgICAgICAgS3VpQWN0aW9uTW9kdWxlLFxuICAgICAgICBNYXRDYXJkTW9kdWxlLFxuICAgICAgICBNYXRJY29uTW9kdWxlLFxuICAgICAgICBNYXRJbnB1dE1vZHVsZSxcbiAgICAgICAgTWF0QnV0dG9uTW9kdWxlLFxuICAgICAgICBNYXREaWFsb2dNb2R1bGUsXG4gICAgICAgIE1hdEZvcm1GaWVsZE1vZHVsZSxcbiAgICAgICAgUmVhY3RpdmVGb3Jtc01vZHVsZSxcbiAgICAgICAgSHR0cENsaWVudE1vZHVsZVxuICAgIF0sXG4gICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgIExvZ2luRm9ybUNvbXBvbmVudFxuICAgIF0sXG4gICAgZXhwb3J0czogW1xuICAgICAgICBMb2dpbkZvcm1Db21wb25lbnRcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIEt1aUF1dGhlbnRpY2F0aW9uTW9kdWxlIHtcbn1cbiJdLCJuYW1lcyI6WyJLbm9yYUNvbnN0YW50cyIsIm1hcCIsIkluamVjdGFibGUiLCJIdHRwQ2xpZW50IiwiS3VpQ29yZUNvbmZpZyIsIkluamVjdCIsIlVzZXJzU2VydmljZSIsIlJvdXRlciIsImNhdGNoRXJyb3IiLCJ0aHJvd0Vycm9yIiwiQXBpU2VydmljZUVycm9yIiwiVmFsaWRhdG9ycyIsIkNvbXBvbmVudCIsIkZvcm1CdWlsZGVyIiwiQWN0aXZhdGVkUm91dGUiLCJJbnB1dCIsIk5nTW9kdWxlIiwiQ29tbW9uTW9kdWxlIiwiS3VpQWN0aW9uTW9kdWxlIiwiTWF0Q2FyZE1vZHVsZSIsIk1hdEljb25Nb2R1bGUiLCJNYXRJbnB1dE1vZHVsZSIsIk1hdEJ1dHRvbk1vZHVsZSIsIk1hdERpYWxvZ01vZHVsZSIsIk1hdEZvcm1GaWVsZE1vZHVsZSIsIlJlYWN0aXZlRm9ybXNNb2R1bGUiLCJIdHRwQ2xpZW50TW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7SUFRQSxJQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7O1FBaUIx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