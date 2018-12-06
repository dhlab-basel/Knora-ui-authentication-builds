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
export { LoginFormComponent };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFhLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRTVEO0lBNkhJLDRCQUFvQixLQUE0QixFQUM1QixRQUF3QixFQUN4QixHQUFnQixFQUNoQixNQUFzQixFQUN0QixPQUFlO1FBSmYsVUFBSyxHQUFMLEtBQUssQ0FBdUI7UUFDNUIsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7UUFDeEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQixXQUFNLEdBQU4sTUFBTSxDQUFnQjtRQUN0QixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBN0NuQyxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBS2hCLDBCQUEwQjtRQUMxQixtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUN2QixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUNyQixxQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFFekIsNEJBQTRCO1FBQzVCLFVBQUssR0FBRztZQUNKLEtBQUssRUFBRSxPQUFPO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsRUFBRSxFQUFFLFVBQVU7WUFDZCxNQUFNLEVBQUUsT0FBTztZQUNmLFFBQVEsRUFBRSxhQUFhO1lBQ3ZCLFNBQVMsRUFBRSxrQkFBa0I7WUFDN0IsS0FBSyxF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QkF2UEosU0FBUyxTQUFDO29CQUNQLFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLFFBQVEsRUFBRSxra0ZBMERiO29CQUNHLE1BQU0sRUFBRSxDQUFDLGlqQkFBaWpCLENBQUM7aUJBQzlqQjs7OztnQkFqRVEscUJBQXFCO2dCQUNyQixjQUFjO2dCQUpkLFdBQVc7Z0JBQ1gsY0FBYztnQkFBRSxNQUFNOzs7MkJBeUUxQixLQUFLO3dCQU1MLEtBQUs7O0lBK0tWLHlCQUFDO0NBQUEsQUF6UEQsSUF5UEM7U0ExTFksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQWN0aXZhdGVkUm91dGUsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBBcGlTZXJ2aWNlRXJyb3IsIEFwaVNlcnZpY2VSZXN1bHQgfSBmcm9tICdAa25vcmEvY29yZSc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9hdXRoZW50aWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2t1aS1sb2dpbi1mb3JtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJsb2dpbi1mb3JtXCIgKm5nSWY9XCIhbG9nZ2VkSW5Vc2VyXCI+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0taGVhZGVyXCI+XG4gICAgICAgIDxoMyBtYXQtc3ViaGVhZGVyPnt7bG9naW4udGl0bGV9fTwvaDM+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm0tY29udGVudFwiPlxuICAgICAgICA8IS0tIFRoaXMgaXMgdGhlIGxvZ2luIGZvcm0gLS0+XG4gICAgICAgIDxmb3JtIGNsYXNzPVwibG9naW4tZm9ybVwiIFtmb3JtR3JvdXBdPVwiZnJtXCIgKG5nU3VibWl0KT1cImRvTG9naW4oKVwiPlxuICAgICAgICAgICAgPCEtLSBFcnJvciBtZXNzYWdlIC0tPlxuICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZXJyb3JNZXNzYWdlICE9PSB1bmRlZmluZWRcIiBjbGFzcz1cImZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JVc2VyIHx8IGxvZ2luRXJyb3JQd1wiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCJsb2dpbkVycm9yU2VydmVyXCI+e3tsb2dpbi5lcnJvci5zZXJ2ZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbWF0LWhpbnQ+XG5cbiAgICAgICAgICAgIDwhLS0gVXNlcm5hbWUgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5wZXJzb248L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCBhdXRvZm9jdXMgW3BsYWNlaG9sZGVyXT1cImxvZ2luLm5hbWVcIiBhdXRvY29tcGxldGU9XCJ1c2VybmFtZVwiIGZvcm1Db250cm9sTmFtZT1cImlkZW50aWZpZXJcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLmlkZW50aWZpZXJcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIFBhc3N3b3JkIC0tPlxuICAgICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aCBsb2dpbi1maWVsZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaWNvbiBtYXRQcmVmaXg+bG9jazwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IHR5cGU9XCJwYXNzd29yZFwiIFtwbGFjZWhvbGRlcl09XCJsb2dpbi5wd1wiIGF1dG9jb21wbGV0ZT1cImN1cnJlbnQtcGFzc3dvcmRcIiBmb3JtQ29udHJvbE5hbWU9XCJwYXNzd29yZFwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMucGFzc3dvcmRcIiBjbGFzcz1cImxvZ2luLWVycm9yXCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvbWF0LWhpbnQ+XG4gICAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxuXG4gICAgICAgICAgICA8IS0tIEJ1dHRvbjogTG9naW4gLS0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvbiB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cIiFmcm0udmFsaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIHN1Ym1pdC1idXR0b24gbWF0LXByaW1hcnlcIj5cbiAgICAgICAgICAgICAgICAgICAge3tsb2dpbi5idXR0b259fVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiIFtjb2xvcl09XCJjb2xvclwiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG48L2Rpdj5cblxuPCEtLSBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW47IHNob3cgd2hvIGl0IGlzIGFuZCBhIGxvZ291dCBidXR0b24gLS0+XG5cbjxkaXYgY2xhc3M9XCJsb2dvdXQtZm9ybVwiICpuZ0lmPVwibG9nZ2VkSW5Vc2VyXCI+XG4gICAgPHA+QSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOjwvcD5cbiAgICA8cD57e2xvZ2dlZEluVXNlcn19PC9wPlxuICAgIDxicj5cbiAgICA8cD5JZiBpdCdzIG5vdCB5b3UsIHBsZWFzZSBsb2dvdXQhPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgPGJ1dHRvbiBtYXQtcmFpc2VkLWJ1dHRvblxuICAgICAgICAgICAgICAgIChjbGljayk9XCJsb2dvdXQoKVwiXG4gICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJmdWxsLXdpZHRoIG1hdC13YXJuXCI+XG4gICAgICAgICAgICBMT0dPVVRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxrdWktcHJvZ3Jlc3MtaW5kaWNhdG9yICpuZ0lmPVwibG9hZGluZ1wiPjwva3VpLXByb2dyZXNzLWluZGljYXRvcj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuYCxcbiAgICBzdHlsZXM6IFtgLmZ1bGwtd2lkdGh7d2lkdGg6MTAwJX0uYnV0dG9uLXJvdywubWF0LWZvcm0tZmllbGQsLm1hdC1oaW50e21hcmdpbi10b3A6MjRweH0ubWF0LWhpbnR7YmFja2dyb3VuZDpyZ2JhKDIzOSw4Myw4MCwuMzkpO2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6LTE2cHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtLC5sb2dvdXQtZm9ybXttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjI4MHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlciwubG9nb3V0LWZvcm0gLmxvZ2luLWZvcm0taGVhZGVye21hcmdpbi1ib3R0b206MjRweH0ubG9naW4tZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29uLC5sb2dvdXQtZm9ybSAubG9naW4tZmllbGQgLm1hdC1pY29ue2ZvbnQtc2l6ZToyMHB4O21hcmdpbi1yaWdodDoxMnB4fS5sb2dpbi1mb3JtIC5idXR0b24tcm93LC5sb2dvdXQtZm9ybSAuYnV0dG9uLXJvd3ttYXJnaW4tdG9wOjQ4cHh9LnNpZ24tdXB7bWFyZ2luLXRvcDoyNHB4fWBdXG59KVxuZXhwb3J0IGNsYXNzIExvZ2luRm9ybUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgICAvKipcbiAgICAgKiBuYXZpZ2F0ZSB0byB0aGUgZGVmaW5lZCB1cmwgYWZ0ZXIgbG9naW5cbiAgICAgKi9cbiAgICBASW5wdXQoKSBuYXZpZ2F0ZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIHNldCB5b3VyIHRoZW1lIGNvbG9yIGhlcmUsXG4gICAgICogaXQgd2lsbCBiZSB1c2VkIGluIHRoZSBwcm9ncmVzcy1pbmRpY2F0b3JcbiAgICAgKi9cbiAgICBASW5wdXQoKSBjb2xvcj86IHN0cmluZztcblxuICAgIHJldHVyblVybDogc3RyaW5nO1xuXG4gICAgLy8gaXMgdGhlcmUgYWxyZWFkeSBhIHZhbGlkIHNlc3Npb24/XG4gICAgbG9nZ2VkSW5Vc2VyOiBzdHJpbmc7XG5cbiAgICAvLyBmb3JtXG4gICAgZnJtOiBGb3JtR3JvdXA7XG5cbiAgICBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAvLyBnZW5lcmFsIGVycm9yIG1lc3NhZ2VcbiAgICBlcnJvck1lc3NhZ2U6IGFueTtcblxuICAgIC8vIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzXG4gICAgbG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICBsb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAvLyBsYWJlbHMgZm9yIHRoZSBsb2dpbiBmb3JtXG4gICAgbG9naW4gPSB7XG4gICAgICAgIHRpdGxlOiAnTG9naW4nLFxuICAgICAgICBuYW1lOiAnVXNlcm5hbWUnLFxuICAgICAgICBwdzogJ1Bhc3N3b3JkJyxcbiAgICAgICAgYnV0dG9uOiAnTG9naW4nLFxuICAgICAgICByZW1lbWJlcjogJ1JlbWVtYmVyIG1lJyxcbiAgICAgICAgZm9yZ290X3B3OiAnRm9yZ290IHBhc3N3b3JkPycsXG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBmYWlsZWQ6ICdQYXNzd29yZCBvciB1c2VybmFtZSBpcyB3cm9uZycsXG4gICAgICAgICAgICBzZXJ2ZXI6ICdUaGVyZVxcJ3MgYW4gZXJyb3Igd2l0aCB0aGUgc2VydmVyIGNvbm5lY3Rpb24uIFRyeSBpdCBhZ2FpbiBsYXRlciBvciBpbmZvcm0gdGhlIEtub3JhIFRlYW0nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gZXJyb3IgZGVmaW5pdGlvbnMgZm9yIHRoZSBmb2xsb3dpbmcgZm9ybSBmaWVsZHNcbiAgICBmb3JtRXJyb3JzID0ge1xuICAgICAgICAnaWRlbnRpZmllcic6ICcnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJ1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIGZvcm0gZmllbGRzIGRlZmluZWQgaW4gZm9ybUVycm9yc1xuICAgIHZhbGlkYXRpb25NZXNzYWdlcyA9IHtcbiAgICAgICAgJ2lkZW50aWZpZXInOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAndXNlciBuYW1lIGlzIHJlcXVpcmVkLidcbiAgICAgICAgfSxcbiAgICAgICAgJ3Bhc3N3b3JkJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3Bhc3N3b3JkIGlzIHJlcXVpcmVkJ1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aDogQXV0aGVudGljYXRpb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2ZiOiBGb3JtQnVpbGRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZTogQWN0aXZhdGVkUm91dGUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb24udmFsaWRhdGVTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbicpKS51c2VyLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkRm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGb3JtKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmZybSA9IHRoaXMuX2ZiLmdyb3VwKHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF0sXG4gICAgICAgICAgICBwYXNzd29yZDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZybS52YWx1ZUNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB0aGlzLm9uVmFsdWVDaGFuZ2VkKGRhdGEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBmb3IgZXJyb3JzIHdoaWxlIHVzaW5nIHRoZSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBvblZhbHVlQ2hhbmdlZChkYXRhPzogYW55KSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZybSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZnJtO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUVycm9ycykubWFwKGZpZWxkID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtLmdldChmaWVsZCk7XG4gICAgICAgICAgICBpZiAoY29udHJvbCAmJiBjb250cm9sLmRpcnR5ICYmICFjb250cm9sLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLnZhbGlkYXRpb25NZXNzYWdlc1tmaWVsZF07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29udHJvbC5lcnJvcnMpLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdICs9IG1lc3NhZ2VzW2tleV0gKyAnICc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRvTG9naW4oKSB7XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBmb3JtIHZhbHVlcyBhcmUgdmFsaWRcbiAgICAgICAgaWYgKHRoaXMuZnJtLmludmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgc3RhdHVzXG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gR3JhYiB2YWx1ZXMgZnJvbSBmb3JtXG4gICAgICAgIGNvbnN0IHVzZXJuYW1lID0gdGhpcy5mcm0uZ2V0KCdpZGVudGlmaWVyJykudmFsdWU7XG4gICAgICAgIGNvbnN0IHBhc3N3b3JkID0gdGhpcy5mcm0uZ2V0KCdwYXNzd29yZCcpLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuX2F1dGgubG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKVxuICAgICAgICAgICAgLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAocmVzcG9uc2U6IEFwaVNlcnZpY2VSZXN1bHQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBoYXZlIGEgdG9rZW47IHNldCB0aGUgc2Vzc2lvbiBub3dcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Vzc2lvbi5zZXRTZXNzaW9uKHJlc3BvbnNlLmJvZHkudG9rZW4sIHVzZXJuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCByZXR1cm4gdXJsIGZyb20gcm91dGUgcGFyYW1ldGVycyBvciBkZWZhdWx0IHRvICcvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm5VcmwgPSB0aGlzLl9yb3V0ZS5zbmFwc2hvdC5xdWVyeVBhcmFtc1sncmV0dXJuVXJsJ10gfHwgJy8nO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIGJhY2sgdG8gdGhlIHByZXZpb3VzIHJvdXRlIG9yIHRvIHRoZSByb3V0ZSBkZWZpbmVkIGluIHRoZSBASW5wdXQgaWYgbmF2aWdhdGUgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubmF2aWdhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMucmV0dXJuVXJsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5uYXZpZ2F0ZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyb3I6IEFwaVNlcnZpY2VFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSA8YW55PiBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGxvZ291dCgpIHtcbiAgICAgICAgdGhpcy5fYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgIH1cblxufVxuIl19