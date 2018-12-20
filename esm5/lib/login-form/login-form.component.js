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
export { LoginFormComponent };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFhLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRTVEO0lBK0hJLDRCQUFvQixLQUE0QixFQUM1QixRQUF3QixFQUN4QixHQUFnQixFQUNoQixNQUFzQixFQUN0QixPQUFlO1FBSmYsVUFBSyxHQUFMLEtBQUssQ0FBdUI7UUFDNUIsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7UUFDeEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQixXQUFNLEdBQU4sTUFBTSxDQUFnQjtRQUN0QixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBN0NuQyxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBS2hCLDBCQUEwQjtRQUMxQixtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUN2QixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUNyQixxQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFFekIsNEJBQTRCO1FBQzVCLFVBQUssR0FBRztZQUNKLEtBQUssRUFBRSxPQUFPO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsRUFBRSxFQUFFLFVBQVU7WUFDZCxNQUFNLEVBQUUsT0FBTztZQUNmLFFBQVEsRUFBRSxhQUFhO1lBQ3ZCLFNBQVMsRUFBRSxrQkFBa0I7WUFDN0IsS0FBSyxF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bnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImVtYWlsXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5lbWFpbFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gUGFzc3dvcmQgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5sb2NrPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgW3BsYWNlaG9sZGVyXT1cImxvZ2luLnB3XCIgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIGZvcm1Db250cm9sTmFtZT1cInBhc3N3b3JkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5wYXNzd29yZFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gQnV0dG9uOiBMb2dpbiAtLT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIWZybS52YWxpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggc3VibWl0LWJ1dHRvbiBtYXQtcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICB7e2xvZ2luLmJ1dHRvbn19XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCIgW2NvbG9yXT1cImNvbG9yXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48IS0tIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjsgc2hvdyB3aG8gaXQgaXMgYW5kIGEgbG9nb3V0IGJ1dHRvbiAtLT5cblxuPGRpdiBjbGFzcz1cImxvZ291dC1mb3JtXCIgKm5nSWY9XCJsb2dnZWRJblVzZXJcIj5cbiAgICA8cD5BIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW46PC9wPlxuICAgIDxwPnt7bG9nZ2VkSW5Vc2VyfX08L3A+XG4gICAgPGJyPlxuICAgIDxwPklmIGl0J3Mgbm90IHlvdSwgcGxlYXNlIGxvZ291dCE8L3A+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uXG4gICAgICAgICAgICAgICAgKGNsaWNrKT1cImxvZ291dCgpXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggbWF0LXdhcm5cIj5cbiAgICAgICAgICAgIExPR09VVFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5gLFxuICAgIHN0eWxlczogW2AuZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5idXR0b24tcm93LC5tYXQtZm9ybS1maWVsZCwubWF0LWhpbnR7bWFyZ2luLXRvcDoyNHB4fS5tYXQtaGludHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDgzLDgwLC4zOSk7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDotMTZweDtwYWRkaW5nOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0sLmxvZ291dC1mb3Jte21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZvcm0taGVhZGVyLC5sb2dvdXQtZm9ybSAubG9naW4tZm9ybS1oZWFkZXJ7bWFyZ2luLWJvdHRvbToyNHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb24sLmxvZ291dC1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb257Zm9udC1zaXplOjIwcHg7bWFyZ2luLXJpZ2h0OjEycHh9LmxvZ2luLWZvcm0gLmJ1dHRvbi1yb3csLmxvZ291dC1mb3JtIC5idXR0b24tcm93e21hcmdpbi10b3A6NDhweH0uc2lnbi11cHttYXJnaW4tdG9wOjI0cHh9YF1cbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Gb3JtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmF2aWdhdGVdXG4gICAgICogbmF2aWdhdGUgdG8gdGhlIGRlZmluZWQgdXJsIGFmdGVyIHN1Y2Nlc3NmdWwgbG9naW5cbiAgICAgKi9cbiAgICBASW5wdXQoKSBuYXZpZ2F0ZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29sb3JdXG4gICAgICogc2V0IHlvdXIgdGhlbWUgY29sb3IgaGVyZSxcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2dyZXNzLWluZGljYXRvclxuICAgICAqL1xuICAgIEBJbnB1dCgpIGNvbG9yPzogc3RyaW5nO1xuXG4gICAgcmV0dXJuVXJsOiBzdHJpbmc7XG5cbiAgICAvLyBpcyB0aGVyZSBhbHJlYWR5IGEgdmFsaWQgc2Vzc2lvbj9cbiAgICBsb2dnZWRJblVzZXI6IHN0cmluZztcblxuICAgIC8vIGZvcm1cbiAgICBmcm06IEZvcm1Hcm91cDtcblxuICAgIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGdlbmVyYWwgZXJyb3IgbWVzc2FnZVxuICAgIGVycm9yTWVzc2FnZTogYW55O1xuXG4gICAgLy8gc3BlY2lmaWMgZXJyb3IgbWVzc2FnZXNcbiAgICBsb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgIC8vIGxhYmVscyBmb3IgdGhlIGxvZ2luIGZvcm1cbiAgICBsb2dpbiA9IHtcbiAgICAgICAgdGl0bGU6ICdMb2dpbicsXG4gICAgICAgIG5hbWU6ICdVc2VybmFtZScsXG4gICAgICAgIHB3OiAnUGFzc3dvcmQnLFxuICAgICAgICBidXR0b246ICdMb2dpbicsXG4gICAgICAgIHJlbWVtYmVyOiAnUmVtZW1iZXIgbWUnLFxuICAgICAgICBmb3Jnb3RfcHc6ICdGb3Jnb3QgcGFzc3dvcmQ/JyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIGZhaWxlZDogJ1Bhc3N3b3JkIG9yIHVzZXJuYW1lIGlzIHdyb25nJyxcbiAgICAgICAgICAgIHNlcnZlcjogJ1RoZXJlXFwncyBhbiBlcnJvciB3aXRoIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbi4gVHJ5IGl0IGFnYWluIGxhdGVyIG9yIGluZm9ybSB0aGUgS25vcmEgVGVhbSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBlcnJvciBkZWZpbml0aW9ucyBmb3IgdGhlIGZvbGxvd2luZyBmb3JtIGZpZWxkc1xuICAgIGZvcm1FcnJvcnMgPSB7XG4gICAgICAgICdlbWFpbCc6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2VtYWlsJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3VzZXIgbmFtZSBpcyByZXF1aXJlZC4nXG4gICAgICAgIH0sXG4gICAgICAgICdwYXNzd29yZCc6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICdwYXNzd29yZCBpcyByZXF1aXJlZCdcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2F1dGg6IEF1dGhlbnRpY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9zZXNzaW9uOiBTZXNzaW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9mYjogRm9ybUJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG4gICAgfVxuXG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGb3JtKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmZybSA9IHRoaXMuX2ZiLmdyb3VwKHtcbiAgICAgICAgICAgIGVtYWlsOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcm0udmFsdWVDaGFuZ2VzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gdGhpcy5vblZhbHVlQ2hhbmdlZChkYXRhKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGlnbm9yZVxuICAgICAqXG4gICAgICogY2hlY2sgZm9yIGVycm9ycyB3aGlsZSB1c2luZyB0aGUgZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgb25WYWx1ZUNoYW5nZWQoZGF0YT86IGFueSkge1xuXG4gICAgICAgIGlmICghdGhpcy5mcm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLmZybTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1FcnJvcnMpLm1hcChmaWVsZCA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdID0gJyc7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybS5nZXQoZmllbGQpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2wgJiYgY29udHJvbC5kaXJ0eSAmJiAhY29udHJvbC52YWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy52YWxpZGF0aW9uTWVzc2FnZXNbZmllbGRdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2wuZXJyb3JzKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSArPSBtZXNzYWdlc1trZXldICsgJyAnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkb0xvZ2luKCkge1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBlcnJvciBtZXNzYWdlc1xuICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSB2YWx1ZXMgYXJlIHZhbGlkXG4gICAgICAgIGlmICh0aGlzLmZybS5pbnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlc2V0IHN0YXR1c1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIEdyYWIgdmFsdWVzIGZyb20gZm9ybVxuICAgICAgICBjb25zdCB1c2VybmFtZSA9IHRoaXMuZnJtLmdldCgnZW1haWwnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSB0aGlzLmZybS5nZXQoJ3Bhc3N3b3JkJykudmFsdWU7XG5cbiAgICAgICAgdGhpcy5fYXV0aC5sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgIChyZXNwb25zZTogQXBpU2VydmljZVJlc3VsdCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB0b2tlbjsgc2V0IHRoZSBzZXNzaW9uIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXNzaW9uLnNldFNlc3Npb24ocmVzcG9uc2UuYm9keS50b2tlbiwgdXNlcm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHJldHVybiB1cmwgZnJvbSByb3V0ZSBwYXJhbWV0ZXJzIG9yIGRlZmF1bHQgdG8gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblVybCA9IHRoaXMuX3JvdXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zWydyZXR1cm5VcmwnXSB8fCAnLyc7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gYmFjayB0byB0aGUgcHJldmlvdXMgcm91dGUgb3IgdG8gdGhlIHJvdXRlIGRlZmluZWQgaW4gdGhlIEBJbnB1dCBpZiBuYXZpZ2F0ZSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5uYXZpZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5yZXR1cm5VcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLm5hdmlnYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IDxhbnk+IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICB0aGlzLl9hdXRoLmxvZ291dCgpO1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgfVxuXG59XG4iXX0=