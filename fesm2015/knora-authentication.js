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

const moment = momentImported;
class SessionService {
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
SessionService.ngInjectableDef = defineInjectable({ factory: function SessionService_Factory() { return new SessionService(inject(HttpClient), inject("config"), inject(UsersService)); }, token: SessionService, providedIn: "root" });

class AuthGuard {
    constructor(_session, _router) {
        this._session = _session;
        this._router = _router;
    }
    canActivate(next, state) {
        if (!this._session.validateSession()) {
            this._router.navigate(['login'], { queryParams: { returnUrl: state.url } });
            return false;
        }
        return true;
    }
}
AuthGuard.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] },
];
/** @nocollapse */
AuthGuard.ctorParameters = () => [
    { type: SessionService },
    { type: Router }
];
AuthGuard.ngInjectableDef = defineInjectable({ factory: function AuthGuard_Factory() { return new AuthGuard(inject(SessionService), inject(Router)); }, token: AuthGuard, providedIn: "root" });

class JwtInterceptor {
    constructor(_session) {
        this._session = _session;
    }
    intercept(request, next) {
        // add authorization header with jwt token if available
        if (this._session.validateSession()) {
            // the session is valid (and up to date)
            const jwt = JSON.parse(localStorage.getItem('session')).user.jwt;
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${jwt}`
                }
            });
        }
        else {
            this._session.destroySession();
        }
        return next.handle(request);
    }
}
JwtInterceptor.decorators = [
    { type: Injectable },
];
/** @nocollapse */
JwtInterceptor.ctorParameters = () => [
    { type: SessionService }
];

// import { AuthenticationService } from './authentication.service';
class ErrorInterceptor {
    /*
    constructor(private _authService: AuthenticationService) {
    }
*/
    intercept(request, next) {
        return next.handle(request).pipe(catchError(err => {
            console.log('authentication -- error.interceptor', err);
            if (err.status === 401) ;
            const error = err.error.message || err.statusText;
            return throwError(error);
        }));
    }
}
ErrorInterceptor.decorators = [
    { type: Injectable },
];

class AuthenticationService {
    constructor(http, _session, config) {
        this.http = http;
        this._session = _session;
        this.config = config;
    }
    /**
     * validate if a user is logged in or not
     * and the session is active
     */
    session() {
        return this._session.validateSession();
    }
    /**
     * login process;
     * it's used by the login component
     *
     * @param identifier (email or username)
     * @param password
     * @returns
     */
    login(identifier, password) {
        return this.http.post(this.config.api + '/v2/authentication', { identifier: identifier, password: password }, { observe: 'response' }).pipe(map((response) => {
            return response;
        }), catchError((error) => {
            return this.handleRequestError(error);
        }));
    }
    logout() {
        // destroy the session
        localStorage.removeItem('session');
    }
    /**
     * handle request error in case of server error
     *
     * @param error
     * @returns
     */
    handleRequestError(error) {
        const serviceError = new ApiServiceError();
        serviceError.status = error.status;
        serviceError.statusText = error.statusText;
        serviceError.errorInfo = error.message;
        serviceError.url = error.url;
        return throwError(serviceError);
    }
}
AuthenticationService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] },
];
/** @nocollapse */
AuthenticationService.ctorParameters = () => [
    { type: HttpClient },
    { type: SessionService },
    { type: KuiCoreConfig, decorators: [{ type: Inject, args: ['config',] }] }
];
AuthenticationService.ngInjectableDef = defineInjectable({ factory: function AuthenticationService_Factory() { return new AuthenticationService(inject(HttpClient), inject(SessionService), inject("config")); }, token: AuthenticationService, providedIn: "root" });

class LoginFormComponent {
    constructor(_auth, _session, _fb, _route, _router) {
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
    ngOnInit() {
        // check if a user is already logged in
        if (this._session.validateSession()) {
            this.loggedInUser = JSON.parse(localStorage.getItem('session')).user.name;
        }
        else {
            this.buildForm();
        }
    }
    buildForm() {
        this.frm = this._fb.group({
            email: ['', Validators.required],
            password: ['', Validators.required]
        });
        this.frm.valueChanges
            .subscribe(data => this.onValueChanged(data));
    }
    /**
     * check for errors while using the form
     * @param data
     */
    onValueChanged(data) {
        if (!this.frm) {
            return;
        }
        const form = this.frm;
        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });
            }
        });
    }
    doLogin() {
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
        const username = this.frm.get('email').value;
        const password = this.frm.get('password').value;
        this._auth.login(username, password)
            .subscribe((response) => {
            // we have a token; set the session now
            this._session.setSession(response.body.token, username);
            setTimeout(() => {
                // get return url from route parameters or default to '/'
                this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
                // go back to the previous route or to the route defined in the @Input if navigate exists
                if (!this.navigate) {
                    this._router.navigate([this.returnUrl]);
                }
                else {
                    this._router.navigate([this.navigate]);
                }
                this.loading = false;
            }, 2000);
        }, (error) => {
            // error handling
            if (error.status === 0) {
                this.loginErrorUser = false;
                this.loginErrorPw = false;
                this.loginErrorServer = true;
            }
            if (error.status === 401) {
                this.loginErrorUser = false;
                this.loginErrorPw = true;
                this.loginErrorServer = false;
            }
            if (error.status === 404) {
                this.loginErrorUser = true;
                this.loginErrorPw = false;
                this.loginErrorServer = false;
            }
            this.errorMessage = error;
            this.loading = false;
        });
    }
    logout() {
        this._auth.logout();
        location.reload(true);
    }
}
LoginFormComponent.decorators = [
    { type: Component, args: [{
                selector: 'kui-login-form',
                template: `<div class="login-form" *ngIf="!loggedInUser">
    <div class="login-form-header">
        <h3 mat-subheader>{{login.title}}</h3>
    </div>
    <div class="login-form-content">
        <!-- This is the login form -->
        <form class="login-form" [formGroup]="frm" (ngSubmit)="doLogin()">
            <!-- Error message -->
            <mat-hint *ngIf="errorMessage !== undefined" class="full-width">
                <span *ngIf="loginErrorUser || loginErrorPw">{{login.error.failed}}</span>
                <span *ngIf="loginErrorServer">{{login.error.server}}</span>
            </mat-hint>

            <!-- Username -->
            <mat-form-field class="full-width login-field">
                <mat-icon matPrefix>person</mat-icon>
                <input matInput autofocus [placeholder]="login.name" autocomplete="username" formControlName="email">
                <mat-hint *ngIf="formErrors.email" class="login-error">{{login.error.failed}}</mat-hint>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field class="full-width login-field">
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput type="password" [placeholder]="login.pw" autocomplete="current-password" formControlName="password">
                <mat-hint *ngIf="formErrors.password" class="login-error">{{login.error.failed}}</mat-hint>
            </mat-form-field>

            <!-- Button: Login -->
            <div class="button-row full-width">
                <button mat-raised-button type="submit"
                        *ngIf="!loading"
                        [disabled]="!frm.valid"
                        class="full-width submit-button mat-primary">
                    {{login.button}}
                </button>
                <kui-progress-indicator *ngIf="loading" [color]="color"></kui-progress-indicator>
            </div>
        </form>
    </div>
</div>

<!-- a user is already logged in; show who it is and a logout button -->

<div class="logout-form" *ngIf="loggedInUser">
    <p>A user is already logged in:</p>
    <p>{{loggedInUser}}</p>
    <br>
    <p>If it's not you, please logout!</p>
    <div class="button-row full-width">
        <button mat-raised-button
                (click)="logout()"
                *ngIf="!loading"
                class="full-width mat-warn">
            LOGOUT
        </button>
        <kui-progress-indicator *ngIf="loading"></kui-progress-indicator>
    </div>
</div>
`,
                styles: [`.full-width{width:100%}.button-row,.mat-form-field,.mat-hint{margin-top:24px}.mat-hint{background:rgba(239,83,80,.39);display:block;margin-left:-16px;padding:16px;text-align:center;width:280px}.login-form,.logout-form{margin-left:auto;margin-right:auto;position:relative;width:280px}.login-form .login-form-header,.logout-form .login-form-header{margin-bottom:24px}.login-form .login-field .mat-icon,.logout-form .login-field .mat-icon{font-size:20px;margin-right:12px}.login-form .button-row,.logout-form .button-row{margin-top:48px}.sign-up{margin-top:24px}`]
            },] },
];
/** @nocollapse */
LoginFormComponent.ctorParameters = () => [
    { type: AuthenticationService },
    { type: SessionService },
    { type: FormBuilder },
    { type: ActivatedRoute },
    { type: Router }
];
LoginFormComponent.propDecorators = {
    navigate: [{ type: Input }],
    color: [{ type: Input }]
};

class KuiAuthenticationModule {
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

/*
 * Public API Surface of authentication
 */

/**
 * Generated bundle index. Do not edit.
 */

export { SessionService as ɵa, AuthGuard, JwtInterceptor, ErrorInterceptor, LoginFormComponent, AuthenticationService, KuiAuthenticationModule };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vcmEtYXV0aGVudGljYXRpb24uanMubWFwIiwic291cmNlcyI6WyJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvZ3VhcmQvYXV0aC5ndWFyZC50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3IudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9saWIvYXV0aGVudGljYXRpb24uc2VydmljZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL2xpYi9sb2dpbi1mb3JtL2xvZ2luLWZvcm0uY29tcG9uZW50LnRzIiwibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vbGliL2F1dGhlbnRpY2F0aW9uLm1vZHVsZS50cyIsIm5nOi8vQGtub3JhL2F1dGhlbnRpY2F0aW9uL3B1YmxpY19hcGkudHMiLCJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi9rbm9yYS1hdXRoZW50aWNhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEtub3JhQ29uc3RhbnRzLCBLdWlDb3JlQ29uZmlnLCBTZXNzaW9uLCBVc2VyLCBVc2Vyc1NlcnZpY2UgfSBmcm9tICdAa25vcmEvY29yZSc7XG5cbmltcG9ydCAqIGFzIG1vbWVudEltcG9ydGVkIGZyb20gJ21vbWVudCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmNvbnN0IG1vbWVudCA9IG1vbWVudEltcG9ydGVkO1xuXG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgU2Vzc2lvblNlcnZpY2Uge1xuXG4gICAgcHVibGljIHNlc3Npb246IFNlc3Npb247XG5cbiAgICAvKipcbiAgICAgKiBtYXggc2Vzc2lvbiB0aW1lIGluIG1pbGxpc2Vjb25kc1xuICAgICAqIGRlZmF1bHQgdmFsdWUgKDI0aCk6IDg2NDAwMDAwXG4gICAgICpcbiAgICAgKi9cbiAgICByZWFkb25seSBNQVhfU0VTU0lPTl9USU1FOiBudW1iZXIgPSA4NjQwMDAwMDsgLy8gMWQgPSAyNCAqIDYwICogNjAgKiAxMDAwXG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBfaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgQEluamVjdCgnY29uZmlnJykgcHVibGljIGNvbmZpZzogS3VpQ29yZUNvbmZpZyxcbiAgICAgICAgcHJpdmF0ZSBfdXNlcnM6IFVzZXJzU2VydmljZSkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldCB0aGUgc2Vzc2lvbiBieSB1c2luZyB0aGUganNvbiB3ZWIgdG9rZW4gKGp3dCkgYW5kIHRoZSB1c2VyIG9iamVjdDtcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIGxvZ2luIHByb2Nlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSBqd3RcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICAgKi9cbiAgICBzZXRTZXNzaW9uKGp3dDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gZ2V0IHVzZXIgaW5mb3JtYXRpb25cbiAgICAgICAgdGhpcy5fdXNlcnMuZ2V0VXNlcih1c2VybmFtZSkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgKHJlc3VsdDogVXNlcikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzeXNBZG1pbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGVybWlzc2lvbnMgPSByZXN1bHQucGVybWlzc2lvbnM7XG4gICAgICAgICAgICAgICAgaWYgKHBlcm1pc3Npb25zLmdyb3Vwc1BlclByb2plY3RbS25vcmFDb25zdGFudHMuU3lzdGVtUHJvamVjdElSSV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3lzQWRtaW4gPSBwZXJtaXNzaW9ucy5ncm91cHNQZXJQcm9qZWN0W0tub3JhQ29uc3RhbnRzLlN5c3RlbVByb2plY3RJUkldXG4gICAgICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihLbm9yYUNvbnN0YW50cy5TeXN0ZW1BZG1pbkdyb3VwSVJJKSA+IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBhIHNlc3Npb24gaWQsIHdoaWNoIGlzIHRoZSB0aW1lc3RhbXAgb2YgbG9naW5cbiAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnNldFRpbWVzdGFtcCgpLFxuICAgICAgICAgICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGp3dDogand0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFuZzogcmVzdWx0LmxhbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzeXNBZG1pbjogc3lzQWRtaW5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgaW4gdGhlIGxvY2FsU3RvcmFnZVxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGltZXN0YW1wKCkge1xuICAgICAgICByZXR1cm4gKG1vbWVudCgpLmFkZCgwLCAnc2Vjb25kJykpLnZhbHVlT2YoKTtcbiAgICB9XG5cbiAgICBnZXRTZXNzaW9uKCkge1xuXG4gICAgfVxuXG4gICAgdXBkYXRlU2Vzc2lvbigpIHtcblxuICAgIH1cblxuICAgIHZhbGlkYXRlU2Vzc2lvbigpIHtcbiAgICAgICAgLy8gbWl4IG9mIGNoZWNrcyB3aXRoIHNlc3Npb24udmFsaWRhdGlvbiBhbmQgdGhpcy5hdXRoZW50aWNhdGVcbiAgICAgICAgdGhpcy5zZXNzaW9uID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKTtcblxuICAgICAgICBjb25zdCB0c05vdzogbnVtYmVyID0gdGhpcy5zZXRUaW1lc3RhbXAoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBleGlzdHNcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBzZXNzaW9uIGlzIHN0aWxsIHZhbGlkOlxuICAgICAgICAgICAgLy8gaWYgc2Vzc2lvbi5pZCArIE1BWF9TRVNTSU9OX1RJTUUgPiBub3c6IF9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpXG4gICAgICAgICAgICBpZiAodGhpcy5zZXNzaW9uLmlkICsgdGhpcy5NQVhfU0VTU0lPTl9USU1FIDwgdHNOb3cpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgaW50ZXJuYWwgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBhcGkgdjIvYXV0aGVudGljYXRpb24gaXMgc3RpbGwgdmFsaWRcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhcGkgYXV0aGVudGljYXRpb24gaXMgdmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Vzc2lvbi5pZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb24uaWQgPSB0c05vdztcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbmV3IHNlc3Npb24gaWQnLCB0aGlzLnNlc3Npb24uaWQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2Vzc2lvbicsIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Nlc3Npb24uc2VydmljZSAtLSB2YWxpZGF0ZVNlc3Npb24gLS0gYXV0aGVudGljYXRlOiB0aGUgc2Vzc2lvbiBleHBpcmVkIG9uIEFQSSBzaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgdXNlciBpcyBub3QgYXV0aGVudGljYXRlZCBhbnltb3JlIVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhdXRoZW50aWNhdGUoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9odHRwLmdldCh0aGlzLmNvbmZpZy5hcGkgKyAnL3YyL2F1dGhlbnRpY2F0aW9uJykucGlwZShcbiAgICAgICAgICAgIG1hcCgocmVzdWx0OiBhbnkpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdXRoZW50aWNhdGlvblNlcnZpY2UgLSBhdXRoZW50aWNhdGUgLSByZXN1bHQ6ICcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRydWUgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnN0YXR1cyA9PT0gMjAwO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBkZXN0cm95U2Vzc2lvbigpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Nlc3Npb24nKTtcbiAgICB9XG5cblxufVxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgQ2FuQWN0aXZhdGUsIFJvdXRlciwgUm91dGVyU3RhdGVTbmFwc2hvdCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4uL3Nlc3Npb24vc2Vzc2lvbi5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBBdXRoR3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuXG4gICAgfVxuXG4gICAgY2FuQWN0aXZhdGUoXG4gICAgICAgIG5leHQ6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgICAgIHN0YXRlOiBSb3V0ZXJTdGF0ZVNuYXBzaG90KTogT2JzZXJ2YWJsZTxib29sZWFuPiB8IFByb21pc2U8Ym9vbGVhbj4gfCBib29sZWFuIHtcblxuICAgICAgICBpZiAoIXRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbJ2xvZ2luJ10sIHtxdWVyeVBhcmFtczoge3JldHVyblVybDogc3RhdGUudXJsfX0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBKd3RJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSkge1xuICAgIH1cblxuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgLy8gYWRkIGF1dGhvcml6YXRpb24gaGVhZGVyIHdpdGggand0IHRva2VuIGlmIGF2YWlsYWJsZVxuXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICAvLyB0aGUgc2Vzc2lvbiBpcyB2YWxpZCAoYW5kIHVwIHRvIGRhdGUpXG4gICAgICAgICAgICBjb25zdCBqd3QgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIuand0O1xuICAgICAgICAgICAgcmVxdWVzdCA9IHJlcXVlc3QuY2xvbmUoe1xuICAgICAgICAgICAgICAgIHNldEhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2p3dH1gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXNzaW9uLmRlc3Ryb3lTZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxdWVzdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhdGNoRXJyb3IgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8vIGltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vYXV0aGVudGljYXRpb24uc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBFcnJvckludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgICAvKlxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGhTZXJ2aWNlOiBBdXRoZW50aWNhdGlvblNlcnZpY2UpIHtcbiAgICB9XG4qL1xuICAgIGludGVyY2VwdChyZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcXVlc3QpLnBpcGUoY2F0Y2hFcnJvcihlcnIgPT4ge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXV0aGVudGljYXRpb24gLS0gZXJyb3IuaW50ZXJjZXB0b3InLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgLy8gYXV0byBsb2dvdXQgaWYgNDAxIHJlc3BvbnNlIHJldHVybmVkIGZyb20gYXBpXG4vLyAgICAgICAgICAgICAgICB0aGlzLl9hdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBsb2NhdGlvbi5yZWxvYWQgaXMgdXNlZCBmb3IgdGhlIGF1dGguZ3VhcmQgaW4gYXBwIHJvdXRpbmdcbiAgICAgICAgICAgICAgICAvLyB0byBnbyB0byB0aGUgbG9naW4gcGFnZVxuLy8gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZXJyLmVycm9yLm1lc3NhZ2UgfHwgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXJyb3JSZXNwb25zZSwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEt1aUNvcmVDb25maWcgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uU2VydmljZSB9IGZyb20gJy4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uU2VydmljZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaHR0cDogSHR0cENsaWVudCxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KCdjb25maWcnKSBwdWJsaWMgY29uZmlnOiBLdWlDb3JlQ29uZmlnKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB2YWxpZGF0ZSBpZiBhIHVzZXIgaXMgbG9nZ2VkIGluIG9yIG5vdFxuICAgICAqIGFuZCB0aGUgc2Vzc2lvbiBpcyBhY3RpdmVcbiAgICAgKi9cbiAgICBzZXNzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2dpbiBwcm9jZXNzO1xuICAgICAqIGl0J3MgdXNlZCBieSB0aGUgbG9naW4gY29tcG9uZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRlbnRpZmllciAoZW1haWwgb3IgdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBsb2dpbihpZGVudGlmaWVyOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFwaSArICcvdjIvYXV0aGVudGljYXRpb24nLFxuICAgICAgICAgICAge2lkZW50aWZpZXI6IGlkZW50aWZpZXIsIHBhc3N3b3JkOiBwYXNzd29yZH0sXG4gICAgICAgICAgICB7b2JzZXJ2ZTogJ3Jlc3BvbnNlJ30pLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKChyZXNwb25zZTogSHR0cFJlc3BvbnNlPGFueT4pOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3I6IEh0dHBFcnJvclJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVxdWVzdEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2Vzc2lvbicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIHJlcXVlc3QgZXJyb3IgaW4gY2FzZSBvZiBzZXJ2ZXIgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvclxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhbmRsZVJlcXVlc3RFcnJvcihlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpOiBPYnNlcnZhYmxlPEFwaVNlcnZpY2VFcnJvcj4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlRXJyb3IgPSBuZXcgQXBpU2VydmljZUVycm9yKCk7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXMgPSBlcnJvci5zdGF0dXM7XG4gICAgICAgIHNlcnZpY2VFcnJvci5zdGF0dXNUZXh0ID0gZXJyb3Iuc3RhdHVzVGV4dDtcbiAgICAgICAgc2VydmljZUVycm9yLmVycm9ySW5mbyA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIHNlcnZpY2VFcnJvci51cmwgPSBlcnJvci51cmw7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHNlcnZpY2VFcnJvcik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImVtYWlsXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5lbWFpbFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gUGFzc3dvcmQgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5sb2NrPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgW3BsYWNlaG9sZGVyXT1cImxvZ2luLnB3XCIgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIGZvcm1Db250cm9sTmFtZT1cInBhc3N3b3JkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5wYXNzd29yZFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gQnV0dG9uOiBMb2dpbiAtLT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIWZybS52YWxpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggc3VibWl0LWJ1dHRvbiBtYXQtcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICB7e2xvZ2luLmJ1dHRvbn19XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCIgW2NvbG9yXT1cImNvbG9yXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48IS0tIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjsgc2hvdyB3aG8gaXQgaXMgYW5kIGEgbG9nb3V0IGJ1dHRvbiAtLT5cblxuPGRpdiBjbGFzcz1cImxvZ291dC1mb3JtXCIgKm5nSWY9XCJsb2dnZWRJblVzZXJcIj5cbiAgICA8cD5BIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW46PC9wPlxuICAgIDxwPnt7bG9nZ2VkSW5Vc2VyfX08L3A+XG4gICAgPGJyPlxuICAgIDxwPklmIGl0J3Mgbm90IHlvdSwgcGxlYXNlIGxvZ291dCE8L3A+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uXG4gICAgICAgICAgICAgICAgKGNsaWNrKT1cImxvZ291dCgpXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggbWF0LXdhcm5cIj5cbiAgICAgICAgICAgIExPR09VVFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5gLFxuICAgIHN0eWxlczogW2AuZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5idXR0b24tcm93LC5tYXQtZm9ybS1maWVsZCwubWF0LWhpbnR7bWFyZ2luLXRvcDoyNHB4fS5tYXQtaGludHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDgzLDgwLC4zOSk7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDotMTZweDtwYWRkaW5nOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0sLmxvZ291dC1mb3Jte21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZvcm0taGVhZGVyLC5sb2dvdXQtZm9ybSAubG9naW4tZm9ybS1oZWFkZXJ7bWFyZ2luLWJvdHRvbToyNHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb24sLmxvZ291dC1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb257Zm9udC1zaXplOjIwcHg7bWFyZ2luLXJpZ2h0OjEycHh9LmxvZ2luLWZvcm0gLmJ1dHRvbi1yb3csLmxvZ291dC1mb3JtIC5idXR0b24tcm93e21hcmdpbi10b3A6NDhweH0uc2lnbi11cHttYXJnaW4tdG9wOjI0cHh9YF1cbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Gb3JtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICAgIC8qKlxuICAgICAqIG5hdmlnYXRlIHRvIHRoZSBkZWZpbmVkIHVybCBhZnRlciBsb2dpblxuICAgICAqL1xuICAgIEBJbnB1dCgpIG5hdmlnYXRlPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogc2V0IHlvdXIgdGhlbWUgY29sb3IgaGVyZSxcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2dyZXNzLWluZGljYXRvclxuICAgICAqL1xuICAgIEBJbnB1dCgpIGNvbG9yPzogc3RyaW5nO1xuXG4gICAgcmV0dXJuVXJsOiBzdHJpbmc7XG5cbiAgICAvLyBpcyB0aGVyZSBhbHJlYWR5IGEgdmFsaWQgc2Vzc2lvbj9cbiAgICBsb2dnZWRJblVzZXI6IHN0cmluZztcblxuICAgIC8vIGZvcm1cbiAgICBmcm06IEZvcm1Hcm91cDtcblxuICAgIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGdlbmVyYWwgZXJyb3IgbWVzc2FnZVxuICAgIGVycm9yTWVzc2FnZTogYW55O1xuXG4gICAgLy8gc3BlY2lmaWMgZXJyb3IgbWVzc2FnZXNcbiAgICBsb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgIC8vIGxhYmVscyBmb3IgdGhlIGxvZ2luIGZvcm1cbiAgICBsb2dpbiA9IHtcbiAgICAgICAgdGl0bGU6ICdMb2dpbicsXG4gICAgICAgIG5hbWU6ICdVc2VybmFtZScsXG4gICAgICAgIHB3OiAnUGFzc3dvcmQnLFxuICAgICAgICBidXR0b246ICdMb2dpbicsXG4gICAgICAgIHJlbWVtYmVyOiAnUmVtZW1iZXIgbWUnLFxuICAgICAgICBmb3Jnb3RfcHc6ICdGb3Jnb3QgcGFzc3dvcmQ/JyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIGZhaWxlZDogJ1Bhc3N3b3JkIG9yIHVzZXJuYW1lIGlzIHdyb25nJyxcbiAgICAgICAgICAgIHNlcnZlcjogJ1RoZXJlXFwncyBhbiBlcnJvciB3aXRoIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbi4gVHJ5IGl0IGFnYWluIGxhdGVyIG9yIGluZm9ybSB0aGUgS25vcmEgVGVhbSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBlcnJvciBkZWZpbml0aW9ucyBmb3IgdGhlIGZvbGxvd2luZyBmb3JtIGZpZWxkc1xuICAgIGZvcm1FcnJvcnMgPSB7XG4gICAgICAgICdlbWFpbCc6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2VtYWlsJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3VzZXIgbmFtZSBpcyByZXF1aXJlZC4nXG4gICAgICAgIH0sXG4gICAgICAgICdwYXNzd29yZCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICdwYXNzd29yZCBpcyByZXF1aXJlZCdcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGg6IEF1dGhlbnRpY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9mYjogRm9ybUJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluXG4gICAgICAgIGlmICh0aGlzLl9zZXNzaW9uLnZhbGlkYXRlU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Nlc3Npb24nKSkudXNlci5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5idWlsZEZvcm0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRm9ybSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5mcm0gPSB0aGlzLl9mYi5ncm91cCh7XG4gICAgICAgICAgICBlbWFpbDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZnJtLnZhbHVlQ2hhbmdlc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IHRoaXMub25WYWx1ZUNoYW5nZWQoZGF0YSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGZvciBlcnJvcnMgd2hpbGUgdXNpbmcgdGhlIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIG9uVmFsdWVDaGFuZ2VkKGRhdGE/OiBhbnkpIHtcblxuICAgICAgICBpZiAoIXRoaXMuZnJtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5mcm07XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5mb3JtRXJyb3JzKS5tYXAoZmllbGQgPT4ge1xuICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSA9ICcnO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm0uZ2V0KGZpZWxkKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sICYmIGNvbnRyb2wuZGlydHkgJiYgIWNvbnRyb2wudmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMudmFsaWRhdGlvbk1lc3NhZ2VzW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb250cm9sLmVycm9ycykubWFwKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gKz0gbWVzc2FnZXNba2V5XSArICcgJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZG9Mb2dpbigpIHtcblxuICAgICAgICAvLyByZXNldCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIGZvcm0gdmFsdWVzIGFyZSB2YWxpZFxuICAgICAgICBpZiAodGhpcy5mcm0uaW52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBzdGF0dXNcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyBHcmFiIHZhbHVlcyBmcm9tIGZvcm1cbiAgICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLmZybS5nZXQoJ2VtYWlsJykudmFsdWU7XG4gICAgICAgIGNvbnN0IHBhc3N3b3JkID0gdGhpcy5mcm0uZ2V0KCdwYXNzd29yZCcpLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuX2F1dGgubG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKVxuICAgICAgICAgICAgLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAocmVzcG9uc2U6IEFwaVNlcnZpY2VSZXN1bHQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIGEgdG9rZW47IHNldCB0aGUgc2Vzc2lvbiBub3dcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5zZXRTZXNzaW9uKHJlc3BvbnNlLmJvZHkudG9rZW4sIHVzZXJuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCByZXR1cm4gdXJsIGZyb20gcm91dGUgcGFyYW1ldGVycyBvciBkZWZhdWx0IHRvICcvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm5VcmwgPSB0aGlzLl9yb3V0ZS5zbmFwc2hvdC5xdWVyeVBhcmFtc1sncmV0dXJuVXJsJ10gfHwgJy8nO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIGJhY2sgdG8gdGhlIHByZXZpb3VzIHJvdXRlIG9yIHRvIHRoZSByb3V0ZSBkZWZpbmVkIGluIHRoZSBASW5wdXQgaWYgbmF2aWdhdGUgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubmF2aWdhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMucmV0dXJuVXJsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5uYXZpZ2F0ZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSA8YW55PiBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgdGhpcy5fYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IEh0dHBDbGllbnRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUmVhY3RpdmVGb3Jtc01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IE1hdEJ1dHRvbk1vZHVsZSwgTWF0Q2FyZE1vZHVsZSwgTWF0RGlhbG9nTW9kdWxlLCBNYXRGb3JtRmllbGRNb2R1bGUsIE1hdEljb25Nb2R1bGUsIE1hdElucHV0TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwnO1xuaW1wb3J0IHsgS3VpQWN0aW9uTW9kdWxlIH0gZnJvbSAnQGtub3JhL2FjdGlvbic7XG5cbmltcG9ydCB7IExvZ2luRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW1xuICAgICAgICBDb21tb25Nb2R1bGUsXG4gICAgICAgIEt1aUFjdGlvbk1vZHVsZSxcbiAgICAgICAgTWF0Q2FyZE1vZHVsZSxcbiAgICAgICAgTWF0SWNvbk1vZHVsZSxcbiAgICAgICAgTWF0SW5wdXRNb2R1bGUsXG4gICAgICAgIE1hdEJ1dHRvbk1vZHVsZSxcbiAgICAgICAgTWF0RGlhbG9nTW9kdWxlLFxuICAgICAgICBNYXRGb3JtRmllbGRNb2R1bGUsXG4gICAgICAgIFJlYWN0aXZlRm9ybXNNb2R1bGUsXG4gICAgICAgIEh0dHBDbGllbnRNb2R1bGVcbiAgICBdLFxuICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICBMb2dpbkZvcm1Db21wb25lbnRcbiAgICBdLFxuICAgIGV4cG9ydHM6IFtcbiAgICAgICAgTG9naW5Gb3JtQ29tcG9uZW50XG4gICAgXVxufSlcbmV4cG9ydCBjbGFzcyBLdWlBdXRoZW50aWNhdGlvbk1vZHVsZSB7XG59XG4iLCIvKlxuICogUHVibGljIEFQSSBTdXJmYWNlIG9mIGF1dGhlbnRpY2F0aW9uXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9saWIvZ3VhcmQvYXV0aC5ndWFyZCc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9pbnRlcmNlcHRvci9qd3QuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvaW50ZXJjZXB0b3IvZXJyb3IuaW50ZXJjZXB0b3InO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbGliL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvYXV0aGVudGljYXRpb24ubW9kdWxlJztcbiIsIi8qKlxuICogR2VuZXJhdGVkIGJ1bmRsZSBpbmRleC4gRG8gbm90IGVkaXQuXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9wdWJsaWNfYXBpJztcblxuZXhwb3J0IHtTZXNzaW9uU2VydmljZSBhcyDDicK1YX0gZnJvbSAnLi9saWIvc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnOyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFNOUI7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