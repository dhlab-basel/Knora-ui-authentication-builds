import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { SessionService } from '../session/session.service';
export class LoginFormComponent {
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
            identifier: ['', Validators.required],
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
        const username = this.frm.get('identifier').value;
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
                <input matInput autofocus [placeholder]="login.name" autocomplete="username" formControlName="identifier">
                <mat-hint *ngIf="formErrors.identifier" class="login-error">{{login.error.failed}}</mat-hint>
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFhLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBaUU1RCxNQUFNO0lBOERGLFlBQW9CLEtBQTRCLEVBQzVCLFFBQXdCLEVBQ3hCLEdBQWdCLEVBQ2hCLE1BQXNCLEVBQ3RCLE9BQWU7UUFKZixVQUFLLEdBQUwsS0FBSyxDQUF1QjtRQUM1QixhQUFRLEdBQVIsUUFBUSxDQUFnQjtRQUN4QixRQUFHLEdBQUgsR0FBRyxDQUFhO1FBQ2hCLFdBQU0sR0FBTixNQUFNLENBQWdCO1FBQ3RCLFlBQU8sR0FBUCxPQUFPLENBQVE7UUE3Q25DLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFLaEIsMEJBQTBCO1FBQzFCLG1CQUFjLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztRQUV6Qiw0QkFBNEI7UUFDNUIsVUFBSyxHQUFHO1lBQ0osS0FBSyxFQUFFLE9BQU87WUFDZCxJQUFJLEVBQUUsVUFBVTtZQUNoQixFQUFFLEVBQUUsVUFBVTtZQUNkLE1BQU0sRUFBRSxPQUFPO1lBQ2YsUUFBUSxFQUFFLGFBQWE7WUFDdkIsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixL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QUFnQjtnQkFDMUIsUUFBUSxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMERiO2dCQUNHLE1BQU0sRUFBRSxDQUFDLGlqQkFBaWpCLENBQUM7YUFDOWpCOzs7O1lBakVRLHFCQUFxQjtZQUNyQixjQUFjO1lBSmQsV0FBVztZQUNYLGNBQWM7WUFBRSxNQUFNOzs7dUJBeUUxQixLQUFLO29CQU1MLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvcm1CdWlsZGVyLCBGb3JtR3JvdXAsIFZhbGlkYXRvcnMgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSwgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgQXBpU2VydmljZVJlc3VsdCB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAna3VpLWxvZ2luLWZvcm0nLFxuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm1cIiAqbmdJZj1cIiFsb2dnZWRJblVzZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1oZWFkZXJcIj5cbiAgICAgICAgPGgzIG1hdC1zdWJoZWFkZXI+e3tsb2dpbi50aXRsZX19PC9oMz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1jb250ZW50XCI+XG4gICAgICAgIDwhLS0gVGhpcyBpcyB0aGUgbG9naW4gZm9ybSAtLT5cbiAgICAgICAgPGZvcm0gY2xhc3M9XCJsb2dpbi1mb3JtXCIgW2Zvcm1Hcm91cF09XCJmcm1cIiAobmdTdWJtaXQpPVwiZG9Mb2dpbigpXCI+XG4gICAgICAgICAgICA8IS0tIEVycm9yIG1lc3NhZ2UgLS0+XG4gICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJlcnJvck1lc3NhZ2UgIT09IHVuZGVmaW5lZFwiIGNsYXNzPVwiZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclVzZXIgfHwgbG9naW5FcnJvclB3XCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JTZXJ2ZXJcIj57e2xvZ2luLmVycm9yLnNlcnZlcn19PC9zcGFuPlxuICAgICAgICAgICAgPC9tYXQtaGludD5cblxuICAgICAgICAgICAgPCEtLSBVc2VybmFtZSAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PnBlcnNvbjwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IGF1dG9mb2N1cyBbcGxhY2Vob2xkZXJdPVwibG9naW4ubmFtZVwiIGF1dG9jb21wbGV0ZT1cInVzZXJuYW1lXCIgZm9ybUNvbnRyb2xOYW1lPVwiaWRlbnRpZmllclwiPlxuICAgICAgICAgICAgICAgIDxtYXQtaGludCAqbmdJZj1cImZvcm1FcnJvcnMuaWRlbnRpZmllclwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gUGFzc3dvcmQgLS0+XG4gICAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgY2xhc3M9XCJmdWxsLXdpZHRoIGxvZ2luLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1pY29uIG1hdFByZWZpeD5sb2NrPC9tYXQtaWNvbj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgbWF0SW5wdXQgdHlwZT1cInBhc3N3b3JkXCIgW3BsYWNlaG9sZGVyXT1cImxvZ2luLnB3XCIgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiIGZvcm1Db250cm9sTmFtZT1cInBhc3N3b3JkXCI+XG4gICAgICAgICAgICAgICAgPG1hdC1oaW50ICpuZ0lmPVwiZm9ybUVycm9ycy5wYXNzd29yZFwiIGNsYXNzPVwibG9naW4tZXJyb3JcIj57e2xvZ2luLmVycm9yLmZhaWxlZH19PC9tYXQtaGludD5cbiAgICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XG5cbiAgICAgICAgICAgIDwhLS0gQnV0dG9uOiBMb2dpbiAtLT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcm93IGZ1bGwtd2lkdGhcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIhbG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIWZybS52YWxpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggc3VibWl0LWJ1dHRvbiBtYXQtcHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICB7e2xvZ2luLmJ1dHRvbn19XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCIgW2NvbG9yXT1cImNvbG9yXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48IS0tIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjsgc2hvdyB3aG8gaXQgaXMgYW5kIGEgbG9nb3V0IGJ1dHRvbiAtLT5cblxuPGRpdiBjbGFzcz1cImxvZ291dC1mb3JtXCIgKm5nSWY9XCJsb2dnZWRJblVzZXJcIj5cbiAgICA8cD5BIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW46PC9wPlxuICAgIDxwPnt7bG9nZ2VkSW5Vc2VyfX08L3A+XG4gICAgPGJyPlxuICAgIDxwPklmIGl0J3Mgbm90IHlvdSwgcGxlYXNlIGxvZ291dCE8L3A+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICA8YnV0dG9uIG1hdC1yYWlzZWQtYnV0dG9uXG4gICAgICAgICAgICAgICAgKGNsaWNrKT1cImxvZ291dCgpXCJcbiAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZ1bGwtd2lkdGggbWF0LXdhcm5cIj5cbiAgICAgICAgICAgIExPR09VVFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGt1aS1wcm9ncmVzcy1pbmRpY2F0b3IgKm5nSWY9XCJsb2FkaW5nXCI+PC9rdWktcHJvZ3Jlc3MtaW5kaWNhdG9yPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5gLFxuICAgIHN0eWxlczogW2AuZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5idXR0b24tcm93LC5tYXQtZm9ybS1maWVsZCwubWF0LWhpbnR7bWFyZ2luLXRvcDoyNHB4fS5tYXQtaGludHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDgzLDgwLC4zOSk7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDotMTZweDtwYWRkaW5nOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0sLmxvZ291dC1mb3Jte21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MjgwcHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZvcm0taGVhZGVyLC5sb2dvdXQtZm9ybSAubG9naW4tZm9ybS1oZWFkZXJ7bWFyZ2luLWJvdHRvbToyNHB4fS5sb2dpbi1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb24sLmxvZ291dC1mb3JtIC5sb2dpbi1maWVsZCAubWF0LWljb257Zm9udC1zaXplOjIwcHg7bWFyZ2luLXJpZ2h0OjEycHh9LmxvZ2luLWZvcm0gLmJ1dHRvbi1yb3csLmxvZ291dC1mb3JtIC5idXR0b24tcm93e21hcmdpbi10b3A6NDhweH0uc2lnbi11cHttYXJnaW4tdG9wOjI0cHh9YF1cbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Gb3JtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcblxuICAgIC8qKlxuICAgICAqIG5hdmlnYXRlIHRvIHRoZSBkZWZpbmVkIHVybCBhZnRlciBsb2dpblxuICAgICAqL1xuICAgIEBJbnB1dCgpIG5hdmlnYXRlPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogc2V0IHlvdXIgdGhlbWUgY29sb3IgaGVyZSxcbiAgICAgKiBpdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2dyZXNzLWluZGljYXRvclxuICAgICAqL1xuICAgIEBJbnB1dCgpIGNvbG9yPzogc3RyaW5nO1xuXG4gICAgcmV0dXJuVXJsOiBzdHJpbmc7XG5cbiAgICAvLyBpcyB0aGVyZSBhbHJlYWR5IGEgdmFsaWQgc2Vzc2lvbj9cbiAgICBsb2dnZWRJblVzZXI6IHN0cmluZztcblxuICAgIC8vIGZvcm1cbiAgICBmcm06IEZvcm1Hcm91cDtcblxuICAgIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGdlbmVyYWwgZXJyb3IgbWVzc2FnZVxuICAgIGVycm9yTWVzc2FnZTogYW55O1xuXG4gICAgLy8gc3BlY2lmaWMgZXJyb3IgbWVzc2FnZXNcbiAgICBsb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JQdyA9IGZhbHNlO1xuICAgIGxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcblxuICAgIC8vIGxhYmVscyBmb3IgdGhlIGxvZ2luIGZvcm1cbiAgICBsb2dpbiA9IHtcbiAgICAgICAgdGl0bGU6ICdMb2dpbicsXG4gICAgICAgIG5hbWU6ICdVc2VybmFtZScsXG4gICAgICAgIHB3OiAnUGFzc3dvcmQnLFxuICAgICAgICBidXR0b246ICdMb2dpbicsXG4gICAgICAgIHJlbWVtYmVyOiAnUmVtZW1iZXIgbWUnLFxuICAgICAgICBmb3Jnb3RfcHc6ICdGb3Jnb3QgcGFzc3dvcmQ/JyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgIGZhaWxlZDogJ1Bhc3N3b3JkIG9yIHVzZXJuYW1lIGlzIHdyb25nJyxcbiAgICAgICAgICAgIHNlcnZlcjogJ1RoZXJlXFwncyBhbiBlcnJvciB3aXRoIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbi4gVHJ5IGl0IGFnYWluIGxhdGVyIG9yIGluZm9ybSB0aGUgS25vcmEgVGVhbSdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBlcnJvciBkZWZpbml0aW9ucyBmb3IgdGhlIGZvbGxvd2luZyBmb3JtIGZpZWxkc1xuICAgIGZvcm1FcnJvcnMgPSB7XG4gICAgICAgICdpZGVudGlmaWVyJzogJycsXG4gICAgICAgICdwYXNzd29yZCc6ICcnXG4gICAgfTtcblxuICAgIC8vIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgZm9ybSBmaWVsZHMgZGVmaW5lZCBpbiBmb3JtRXJyb3JzXG4gICAgdmFsaWRhdGlvbk1lc3NhZ2VzID0ge1xuICAgICAgICAnaWRlbnRpZmllcic6IHtcbiAgICAgICAgICAgICdyZXF1aXJlZCc6ICd1c2VyIG5hbWUgaXMgcmVxdWlyZWQuJ1xuICAgICAgICB9LFxuICAgICAgICAncGFzc3dvcmQnOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAncGFzc3dvcmQgaXMgcmVxdWlyZWQnXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hdXRoOiBBdXRoZW50aWNhdGlvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Vzc2lvbjogU2Vzc2lvblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfZmI6IEZvcm1CdWlsZGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlOiBBY3RpdmF0ZWRSb3V0ZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZXI6IFJvdXRlcikge1xuICAgIH1cblxuICAgIG5nT25Jbml0KCkge1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpblxuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRGb3JtKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZvcm0oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZnJtID0gdGhpcy5fZmIuZ3JvdXAoe1xuICAgICAgICAgICAgaWRlbnRpZmllcjogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBbJycsIFZhbGlkYXRvcnMucmVxdWlyZWRdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZnJtLnZhbHVlQ2hhbmdlc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IHRoaXMub25WYWx1ZUNoYW5nZWQoZGF0YSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGZvciBlcnJvcnMgd2hpbGUgdXNpbmcgdGhlIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIG9uVmFsdWVDaGFuZ2VkKGRhdGE/OiBhbnkpIHtcblxuICAgICAgICBpZiAoIXRoaXMuZnJtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5mcm07XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5mb3JtRXJyb3JzKS5tYXAoZmllbGQgPT4ge1xuICAgICAgICAgICAgdGhpcy5mb3JtRXJyb3JzW2ZpZWxkXSA9ICcnO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm0uZ2V0KGZpZWxkKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sICYmIGNvbnRyb2wuZGlydHkgJiYgIWNvbnRyb2wudmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMudmFsaWRhdGlvbk1lc3NhZ2VzW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb250cm9sLmVycm9ycykubWFwKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gKz0gbWVzc2FnZXNba2V5XSArICcgJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZG9Mb2dpbigpIHtcblxuICAgICAgICAvLyByZXNldCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIGZvcm0gdmFsdWVzIGFyZSB2YWxpZFxuICAgICAgICBpZiAodGhpcy5mcm0uaW52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBzdGF0dXNcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyBHcmFiIHZhbHVlcyBmcm9tIGZvcm1cbiAgICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLmZybS5nZXQoJ2lkZW50aWZpZXInKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSB0aGlzLmZybS5nZXQoJ3Bhc3N3b3JkJykudmFsdWU7XG5cbiAgICAgICAgdGhpcy5fYXV0aC5sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgIChyZXNwb25zZTogQXBpU2VydmljZVJlc3VsdCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB0b2tlbjsgc2V0IHRoZSBzZXNzaW9uIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXNzaW9uLnNldFNlc3Npb24ocmVzcG9uc2UuYm9keS50b2tlbiwgdXNlcm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHJldHVybiB1cmwgZnJvbSByb3V0ZSBwYXJhbWV0ZXJzIG9yIGRlZmF1bHQgdG8gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblVybCA9IHRoaXMuX3JvdXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zWydyZXR1cm5VcmwnXSB8fCAnLyc7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gYmFjayB0byB0aGUgcHJldmlvdXMgcm91dGUgb3IgdG8gdGhlIHJvdXRlIGRlZmluZWQgaW4gdGhlIEBJbnB1dCBpZiBuYXZpZ2F0ZSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5uYXZpZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5uYXZpZ2F0ZShbdGhpcy5yZXR1cm5VcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLm5hdmlnYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcjogQXBpU2VydmljZUVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IDxhbnk+IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgbG9nb3V0KCkge1xuICAgICAgICB0aGlzLl9hdXRoLmxvZ291dCgpO1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgfVxuXG59XG4iXX0=