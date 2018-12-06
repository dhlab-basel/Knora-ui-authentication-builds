import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { SessionService } from '../session/session.service';
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
export { LoginFormComponent };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFhLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRTVEO0lBNkhJLDRCQUFvQixLQUE0QixFQUM1QixRQUF3QixFQUN4QixHQUFnQixFQUNoQixNQUFzQixFQUN0QixPQUFlO1FBSmYsVUFBSyxHQUFMLEtBQUssQ0FBdUI7UUFDNUIsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7UUFDeEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQixXQUFNLEdBQU4sTUFBTSxDQUFnQjtRQUN0QixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBN0NuQyxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBS2hCLDBCQUEwQjtRQUMxQixtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUN2QixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUNyQixxQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFFekIsNEJBQTRCO1FBQzVCLFVBQUssR0FBRztZQUNKLEtBQUssRUFBRSxPQUFPO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsRUFBRSxFQUFFLFVBQVU7WUFDZCxNQUFNLEVBQUUsT0FBTztZQUNmLFFBQVEsRUFBRSxhQUFhO1lBQ3ZCLFNBQVMsRUFBRSxrQkFBa0I7WUFDN0IsS0FBSyxF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QXZQSixTQUFTLFNBQUM7b0JBQ1AsUUFBUSxFQUFFLGdCQUFnQjtvQkFDMUIsUUFBUSxFQUFFLHdqRkEwRGI7b0JBQ0csTUFBTSxFQUFFLENBQUMsaWpCQUFpakIsQ0FBQztpQkFDOWpCOzs7O2dCQWpFUSxxQkFBcUI7Z0JBQ3JCLGNBQWM7Z0JBSmQsV0FBVztnQkFDWCxjQUFjO2dCQUFFLE1BQU07OzsyQkF5RTFCLEtBQUs7d0JBTUwsS0FBSzs7SUErS1YseUJBQUM7Q0FBQSxBQXpQRCxJQXlQQztTQTFMWSxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvcm1CdWlsZGVyLCBGb3JtR3JvdXAsIFZhbGlkYXRvcnMgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSwgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgQXBpU2VydmljZVJlc3VsdCB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAna3VpLWxvZ2luLWZvcm0nLFxuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm1cIiAqbmdJZj1cIiFsb2dnZWRJblVzZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1oZWFkZXJcIj5cbiAgICAgICAgPGgzIG1hdC1zdWJoZWFkZXI+e3tsb2dpbi50aXRsZX19PC9oMz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1jb250ZW50XCI+XG4gICAgICAgIDwhLS0gVGhpcyBpcyB0aGUgbG9naW4gZm9ybSAtLT5cbiAgICAgICAgPGZvcm0gY2xhc3M9XCJsb2dpbi1mb3JtXCIgW2Zvcm1Hcm91cF09XCJmcm1cIiAobmdTdWJtaXQpPVwiZG9Mb2dpbigpXCI+XG4gICAgICAgICAgICA8IS0tIEVycm9yIG1lc3NhZ2UgLS0+XG4gICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJlcnJvck1lc3NhZ2UgIT09IHVuZGVmaW5lZFwiIGNsYXNzPVwiZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclVzZXIgfHwgbG9naW5FcnJvclB3XCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JTZXJ2ZXJcIj57e2xvZ2luLmVycm9yLnNlcnZlcn19PC9zcGFuPlxuICAgICAgICAgICAgPC9tYXQtaGludD5cblxuICAgICAgICAgICAgPCEtLSBVc2VybmFtZSAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PnBlcnNvbjwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IGF1dG9mb2N1cyBbcGxhY2Vob2xkZXJdPVwibG9naW4ubmFtZVwiIGF1dG9jb21wbGV0ZT1cInVzZXJuYW1lXCIgZm9ybUNvbnRyb2xOYW1lPVwiZW1haWxcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLmVtYWlsXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBQYXNzd29yZCAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PmxvY2s8L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBbcGxhY2Vob2xkZXJdPVwibG9naW4ucHdcIiBhdXRvY29tcGxldGU9XCJjdXJyZW50LXBhc3N3b3JkXCIgZm9ybUNvbnRyb2xOYW1lPVwicGFzc3dvcmRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLnBhc3N3b3JkXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBCdXR0b246IExvZ2luIC0tPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b24gdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCIhZnJtLnZhbGlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBzdWJtaXQtYnV0dG9uIG1hdC1wcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIHt7bG9naW4uYnV0dG9ufX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIiBbY29sb3JdPVwiY29sb3JcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5cbjwhLS0gYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOyBzaG93IHdobyBpdCBpcyBhbmQgYSBsb2dvdXQgYnV0dG9uIC0tPlxuXG48ZGl2IGNsYXNzPVwibG9nb3V0LWZvcm1cIiAqbmdJZj1cImxvZ2dlZEluVXNlclwiPlxuICAgIDxwPkEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjo8L3A+XG4gICAgPHA+e3tsb2dnZWRJblVzZXJ9fTwvcD5cbiAgICA8YnI+XG4gICAgPHA+SWYgaXQncyBub3QgeW91LCBwbGVhc2UgbG9nb3V0ITwvcD5cbiAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b25cbiAgICAgICAgICAgICAgICAoY2xpY2spPVwibG9nb3V0KClcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBtYXQtd2FyblwiPlxuICAgICAgICAgICAgTE9HT1VUXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgPC9kaXY+XG48L2Rpdj5cbmAsXG4gICAgc3R5bGVzOiBbYC5mdWxsLXdpZHRoe3dpZHRoOjEwMCV9LmJ1dHRvbi1yb3csLm1hdC1mb3JtLWZpZWxkLC5tYXQtaGludHttYXJnaW4tdG9wOjI0cHh9Lm1hdC1oaW50e2JhY2tncm91bmQ6cmdiYSgyMzksODMsODAsLjM5KTtkaXNwbGF5OmJsb2NrO21hcmdpbi1sZWZ0Oi0xNnB4O3BhZGRpbmc6MTZweDt0ZXh0LWFsaWduOmNlbnRlcjt3aWR0aDoyODBweH0ubG9naW4tZm9ybSwubG9nb3V0LWZvcm17bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0bztwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoyODBweH0ubG9naW4tZm9ybSAubG9naW4tZm9ybS1oZWFkZXIsLmxvZ291dC1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlcnttYXJnaW4tYm90dG9tOjI0cHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbiwubG9nb3V0LWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbntmb250LXNpemU6MjBweDttYXJnaW4tcmlnaHQ6MTJweH0ubG9naW4tZm9ybSAuYnV0dG9uLXJvdywubG9nb3V0LWZvcm0gLmJ1dHRvbi1yb3d7bWFyZ2luLXRvcDo0OHB4fS5zaWduLXVwe21hcmdpbi10b3A6MjRweH1gXVxufSlcbmV4cG9ydCBjbGFzcyBMb2dpbkZvcm1Db21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gICAgLyoqXG4gICAgICogbmF2aWdhdGUgdG8gdGhlIGRlZmluZWQgdXJsIGFmdGVyIGxvZ2luXG4gICAgICovXG4gICAgQElucHV0KCkgbmF2aWdhdGU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBzZXQgeW91ciB0aGVtZSBjb2xvciBoZXJlLFxuICAgICAqIGl0IHdpbGwgYmUgdXNlZCBpbiB0aGUgcHJvZ3Jlc3MtaW5kaWNhdG9yXG4gICAgICovXG4gICAgQElucHV0KCkgY29sb3I/OiBzdHJpbmc7XG5cbiAgICByZXR1cm5Vcmw6IHN0cmluZztcblxuICAgIC8vIGlzIHRoZXJlIGFscmVhZHkgYSB2YWxpZCBzZXNzaW9uP1xuICAgIGxvZ2dlZEluVXNlcjogc3RyaW5nO1xuXG4gICAgLy8gZm9ybVxuICAgIGZybTogRm9ybUdyb3VwO1xuXG4gICAgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgLy8gZ2VuZXJhbCBlcnJvciBtZXNzYWdlXG4gICAgZXJyb3JNZXNzYWdlOiBhbnk7XG5cbiAgICAvLyBzcGVjaWZpYyBlcnJvciBtZXNzYWdlc1xuICAgIGxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgLy8gbGFiZWxzIGZvciB0aGUgbG9naW4gZm9ybVxuICAgIGxvZ2luID0ge1xuICAgICAgICB0aXRsZTogJ0xvZ2luJyxcbiAgICAgICAgbmFtZTogJ1VzZXJuYW1lJyxcbiAgICAgICAgcHc6ICdQYXNzd29yZCcsXG4gICAgICAgIGJ1dHRvbjogJ0xvZ2luJyxcbiAgICAgICAgcmVtZW1iZXI6ICdSZW1lbWJlciBtZScsXG4gICAgICAgIGZvcmdvdF9wdzogJ0ZvcmdvdCBwYXNzd29yZD8nLFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgZmFpbGVkOiAnUGFzc3dvcmQgb3IgdXNlcm5hbWUgaXMgd3JvbmcnLFxuICAgICAgICAgICAgc2VydmVyOiAnVGhlcmVcXCdzIGFuIGVycm9yIHdpdGggdGhlIHNlcnZlciBjb25uZWN0aW9uLiBUcnkgaXQgYWdhaW4gbGF0ZXIgb3IgaW5mb3JtIHRoZSBLbm9yYSBUZWFtJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGVycm9yIGRlZmluaXRpb25zIGZvciB0aGUgZm9sbG93aW5nIGZvcm0gZmllbGRzXG4gICAgZm9ybUVycm9ycyA9IHtcbiAgICAgICAgJ2VtYWlsJzogJycsXG4gICAgICAgICdwYXNzd29yZCc6ICcnXG4gICAgfTtcblxuICAgIC8vIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgZm9ybSBmaWVsZHMgZGVmaW5lZCBpbiBmb3JtRXJyb3JzXG4gICAgdmFsaWRhdGlvbk1lc3NhZ2VzID0ge1xuICAgICAgICAnZW1haWwnOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAndXNlciBuYW1lIGlzIHJlcXVpcmVkLidcbiAgICAgICAgfSxcbiAgICAgICAgJ3Bhc3N3b3JkJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3Bhc3N3b3JkIGlzIHJlcXVpcmVkJ1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aDogQXV0aGVudGljYXRpb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2ZiOiBGb3JtQnVpbGRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZTogQWN0aXZhdGVkUm91dGUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGb3JtKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmZybSA9IHRoaXMuX2ZiLmdyb3VwKHtcbiAgICAgICAgICAgIGVtYWlsOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcm0udmFsdWVDaGFuZ2VzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gdGhpcy5vblZhbHVlQ2hhbmdlZChkYXRhKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2hlY2sgZm9yIGVycm9ycyB3aGlsZSB1c2luZyB0aGUgZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgb25WYWx1ZUNoYW5nZWQoZGF0YT86IGFueSkge1xuXG4gICAgICAgIGlmICghdGhpcy5mcm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLmZybTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1FcnJvcnMpLm1hcChmaWVsZCA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdID0gJyc7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybS5nZXQoZmllbGQpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2wgJiYgY29udHJvbC5kaXJ0eSAmJiAhY29udHJvbC52YWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy52YWxpZGF0aW9uTWVzc2FnZXNbZmllbGRdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2wuZXJyb3JzKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSArPSBtZXNzYWdlc1trZXldICsgJyAnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkb0xvZ2luKCkge1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBlcnJvciBtZXNzYWdlc1xuICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSB2YWx1ZXMgYXJlIHZhbGlkXG4gICAgICAgIGlmICh0aGlzLmZybS5pbnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlc2V0IHN0YXR1c1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIEdyYWIgdmFsdWVzIGZyb20gZm9ybVxuICAgICAgICBjb25zdCB1c2VybmFtZSA9IHRoaXMuZnJtLmdldCgnZW1haWwnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSB0aGlzLmZybS5nZXQoJ3Bhc3N3b3JkJykudmFsdWU7XG5cbiAgICAgICAgdGhpcy5fYXV0aC5sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgIChyZXNwb25zZTogQXBpU2VydmljZVJlc3VsdCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB0b2tlbjsgc2V0IHRoZSBzZXNzaW9uIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXNzaW9uLnNldFNlc3Npb24ocmVzcG9uc2UuYm9keS50b2tlbiwgdXNlcm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHJldHVybiB1cmwgZnJvbSByb3V0ZSBwYXJhbWV0ZXJzIG9yIGRlZmF1bHQgdG8gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblVybCA9IHRoaXMuX3JvdXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zWydyZXR1cm5VcmwnXSB8fCAnLyc7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gYmFjayB0byB0aGUgcHJldmlvdXMgcm91dGUgb3IgdG8gdGhlIHJvdXRlIGRlZmluZWQgaW4gdGhlIEBJbnB1dCBpZiBuYXZpZ2F0ZSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5uYXZpZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5yZXR1cm5VcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLm5hdmlnYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IDxhbnk+IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICB0aGlzLl9hdXRoLmxvZ291dCgpO1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgfVxuXG59XG4iXX0=