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
     * @ignore
     *
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aa25vcmEvYXV0aGVudGljYXRpb24vIiwic291cmNlcyI6WyJsaWIvbG9naW4tZm9ybS9sb2dpbi1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUUsV0FBVyxFQUFhLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBaUU1RCxNQUFNO0lBZ0VGLFlBQW9CLEtBQTRCLEVBQzVCLFFBQXdCLEVBQ3hCLEdBQWdCLEVBQ2hCLE1BQXNCLEVBQ3RCLE9BQWU7UUFKZixVQUFLLEdBQUwsS0FBSyxDQUF1QjtRQUM1QixhQUFRLEdBQVIsUUFBUSxDQUFnQjtRQUN4QixRQUFHLEdBQUgsR0FBRyxDQUFhO1FBQ2hCLFdBQU0sR0FBTixNQUFNLENBQWdCO1FBQ3RCLFlBQU8sR0FBUCxPQUFPLENBQVE7UUE3Q25DLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFLaEIsMEJBQTBCO1FBQzFCLG1CQUFjLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztRQUV6Qiw0QkFBNEI7UUFDNUIsVUFBSyxHQUFHO1lBQ0osS0FBSyxFQUFFLE9BQU87WUFDZCxJQUFJLEVBQUUsVUFBVTtZQUNoQixFQUFFLEVBQUUsVUFBVTtZQUNkLE1BQU0sRUFBRSxPQUFPO1lBQ2YsUUFBUSxFQUFFLGFBQWE7WUFDdkIsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixL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IElucHV0LCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvcm1CdWlsZGVyLCBGb3JtR3JvdXAsIFZhbGlkYXRvcnMgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSwgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IEFwaVNlcnZpY2VFcnJvciwgQXBpU2VydmljZVJlc3VsdCB9IGZyb20gJ0Brbm9yYS9jb3JlJztcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhlbnRpY2F0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgU2Vzc2lvblNlcnZpY2UgfSBmcm9tICcuLi9zZXNzaW9uL3Nlc3Npb24uc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAna3VpLWxvZ2luLWZvcm0nLFxuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImxvZ2luLWZvcm1cIiAqbmdJZj1cIiFsb2dnZWRJblVzZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1oZWFkZXJcIj5cbiAgICAgICAgPGgzIG1hdC1zdWJoZWFkZXI+e3tsb2dpbi50aXRsZX19PC9oMz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwibG9naW4tZm9ybS1jb250ZW50XCI+XG4gICAgICAgIDwhLS0gVGhpcyBpcyB0aGUgbG9naW4gZm9ybSAtLT5cbiAgICAgICAgPGZvcm0gY2xhc3M9XCJsb2dpbi1mb3JtXCIgW2Zvcm1Hcm91cF09XCJmcm1cIiAobmdTdWJtaXQpPVwiZG9Mb2dpbigpXCI+XG4gICAgICAgICAgICA8IS0tIEVycm9yIG1lc3NhZ2UgLS0+XG4gICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJlcnJvck1lc3NhZ2UgIT09IHVuZGVmaW5lZFwiIGNsYXNzPVwiZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwibG9naW5FcnJvclVzZXIgfHwgbG9naW5FcnJvclB3XCI+e3tsb2dpbi5lcnJvci5mYWlsZWR9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImxvZ2luRXJyb3JTZXJ2ZXJcIj57e2xvZ2luLmVycm9yLnNlcnZlcn19PC9zcGFuPlxuICAgICAgICAgICAgPC9tYXQtaGludD5cblxuICAgICAgICAgICAgPCEtLSBVc2VybmFtZSAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PnBlcnNvbjwvbWF0LWljb24+XG4gICAgICAgICAgICAgICAgPGlucHV0IG1hdElucHV0IGF1dG9mb2N1cyBbcGxhY2Vob2xkZXJdPVwibG9naW4ubmFtZVwiIGF1dG9jb21wbGV0ZT1cInVzZXJuYW1lXCIgZm9ybUNvbnRyb2xOYW1lPVwiZW1haWxcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLmVtYWlsXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBQYXNzd29yZCAtLT5cbiAgICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBjbGFzcz1cImZ1bGwtd2lkdGggbG9naW4tZmllbGRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWljb24gbWF0UHJlZml4PmxvY2s8L21hdC1pY29uPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBtYXRJbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBbcGxhY2Vob2xkZXJdPVwibG9naW4ucHdcIiBhdXRvY29tcGxldGU9XCJjdXJyZW50LXBhc3N3b3JkXCIgZm9ybUNvbnRyb2xOYW1lPVwicGFzc3dvcmRcIj5cbiAgICAgICAgICAgICAgICA8bWF0LWhpbnQgKm5nSWY9XCJmb3JtRXJyb3JzLnBhc3N3b3JkXCIgY2xhc3M9XCJsb2dpbi1lcnJvclwiPnt7bG9naW4uZXJyb3IuZmFpbGVkfX08L21hdC1oaW50PlxuICAgICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cblxuICAgICAgICAgICAgPCEtLSBCdXR0b246IExvZ2luIC0tPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1yb3cgZnVsbC13aWR0aFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b24gdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAqbmdJZj1cIiFsb2FkaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCIhZnJtLnZhbGlkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBzdWJtaXQtYnV0dG9uIG1hdC1wcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIHt7bG9naW4uYnV0dG9ufX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIiBbY29sb3JdPVwiY29sb3JcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvZGl2PlxuPC9kaXY+XG5cbjwhLS0gYSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluOyBzaG93IHdobyBpdCBpcyBhbmQgYSBsb2dvdXQgYnV0dG9uIC0tPlxuXG48ZGl2IGNsYXNzPVwibG9nb3V0LWZvcm1cIiAqbmdJZj1cImxvZ2dlZEluVXNlclwiPlxuICAgIDxwPkEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbjo8L3A+XG4gICAgPHA+e3tsb2dnZWRJblVzZXJ9fTwvcD5cbiAgICA8YnI+XG4gICAgPHA+SWYgaXQncyBub3QgeW91LCBwbGVhc2UgbG9nb3V0ITwvcD5cbiAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJvdyBmdWxsLXdpZHRoXCI+XG4gICAgICAgIDxidXR0b24gbWF0LXJhaXNlZC1idXR0b25cbiAgICAgICAgICAgICAgICAoY2xpY2spPVwibG9nb3V0KClcIlxuICAgICAgICAgICAgICAgICpuZ0lmPVwiIWxvYWRpbmdcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiZnVsbC13aWR0aCBtYXQtd2FyblwiPlxuICAgICAgICAgICAgTE9HT1VUXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8a3VpLXByb2dyZXNzLWluZGljYXRvciAqbmdJZj1cImxvYWRpbmdcIj48L2t1aS1wcm9ncmVzcy1pbmRpY2F0b3I+XG4gICAgPC9kaXY+XG48L2Rpdj5cbmAsXG4gICAgc3R5bGVzOiBbYC5mdWxsLXdpZHRoe3dpZHRoOjEwMCV9LmJ1dHRvbi1yb3csLm1hdC1mb3JtLWZpZWxkLC5tYXQtaGludHttYXJnaW4tdG9wOjI0cHh9Lm1hdC1oaW50e2JhY2tncm91bmQ6cmdiYSgyMzksODMsODAsLjM5KTtkaXNwbGF5OmJsb2NrO21hcmdpbi1sZWZ0Oi0xNnB4O3BhZGRpbmc6MTZweDt0ZXh0LWFsaWduOmNlbnRlcjt3aWR0aDoyODBweH0ubG9naW4tZm9ybSwubG9nb3V0LWZvcm17bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0bztwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoyODBweH0ubG9naW4tZm9ybSAubG9naW4tZm9ybS1oZWFkZXIsLmxvZ291dC1mb3JtIC5sb2dpbi1mb3JtLWhlYWRlcnttYXJnaW4tYm90dG9tOjI0cHh9LmxvZ2luLWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbiwubG9nb3V0LWZvcm0gLmxvZ2luLWZpZWxkIC5tYXQtaWNvbntmb250LXNpemU6MjBweDttYXJnaW4tcmlnaHQ6MTJweH0ubG9naW4tZm9ybSAuYnV0dG9uLXJvdywubG9nb3V0LWZvcm0gLmJ1dHRvbi1yb3d7bWFyZ2luLXRvcDo0OHB4fS5zaWduLXVwe21hcmdpbi10b3A6MjRweH1gXVxufSlcbmV4cG9ydCBjbGFzcyBMb2dpbkZvcm1Db21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYXZpZ2F0ZV1cbiAgICAgKiBuYXZpZ2F0ZSB0byB0aGUgZGVmaW5lZCB1cmwgYWZ0ZXIgc3VjY2Vzc2Z1bCBsb2dpblxuICAgICAqL1xuICAgIEBJbnB1dCgpIG5hdmlnYXRlPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb2xvcl1cbiAgICAgKiBzZXQgeW91ciB0aGVtZSBjb2xvciBoZXJlLFxuICAgICAqIGl0IHdpbGwgYmUgdXNlZCBpbiB0aGUgcHJvZ3Jlc3MtaW5kaWNhdG9yXG4gICAgICovXG4gICAgQElucHV0KCkgY29sb3I/OiBzdHJpbmc7XG5cbiAgICByZXR1cm5Vcmw6IHN0cmluZztcblxuICAgIC8vIGlzIHRoZXJlIGFscmVhZHkgYSB2YWxpZCBzZXNzaW9uP1xuICAgIGxvZ2dlZEluVXNlcjogc3RyaW5nO1xuXG4gICAgLy8gZm9ybVxuICAgIGZybTogRm9ybUdyb3VwO1xuXG4gICAgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgLy8gZ2VuZXJhbCBlcnJvciBtZXNzYWdlXG4gICAgZXJyb3JNZXNzYWdlOiBhbnk7XG5cbiAgICAvLyBzcGVjaWZpYyBlcnJvciBtZXNzYWdlc1xuICAgIGxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgbG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgLy8gbGFiZWxzIGZvciB0aGUgbG9naW4gZm9ybVxuICAgIGxvZ2luID0ge1xuICAgICAgICB0aXRsZTogJ0xvZ2luJyxcbiAgICAgICAgbmFtZTogJ1VzZXJuYW1lJyxcbiAgICAgICAgcHc6ICdQYXNzd29yZCcsXG4gICAgICAgIGJ1dHRvbjogJ0xvZ2luJyxcbiAgICAgICAgcmVtZW1iZXI6ICdSZW1lbWJlciBtZScsXG4gICAgICAgIGZvcmdvdF9wdzogJ0ZvcmdvdCBwYXNzd29yZD8nLFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgZmFpbGVkOiAnUGFzc3dvcmQgb3IgdXNlcm5hbWUgaXMgd3JvbmcnLFxuICAgICAgICAgICAgc2VydmVyOiAnVGhlcmVcXCdzIGFuIGVycm9yIHdpdGggdGhlIHNlcnZlciBjb25uZWN0aW9uLiBUcnkgaXQgYWdhaW4gbGF0ZXIgb3IgaW5mb3JtIHRoZSBLbm9yYSBUZWFtJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGVycm9yIGRlZmluaXRpb25zIGZvciB0aGUgZm9sbG93aW5nIGZvcm0gZmllbGRzXG4gICAgZm9ybUVycm9ycyA9IHtcbiAgICAgICAgJ2VtYWlsJzogJycsXG4gICAgICAgICdwYXNzd29yZCc6ICcnXG4gICAgfTtcblxuICAgIC8vIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgZm9ybSBmaWVsZHMgZGVmaW5lZCBpbiBmb3JtRXJyb3JzXG4gICAgdmFsaWRhdGlvbk1lc3NhZ2VzID0ge1xuICAgICAgICAnZW1haWwnOiB7XG4gICAgICAgICAgICAncmVxdWlyZWQnOiAndXNlciBuYW1lIGlzIHJlcXVpcmVkLidcbiAgICAgICAgfSxcbiAgICAgICAgJ3Bhc3N3b3JkJzoge1xuICAgICAgICAgICAgJ3JlcXVpcmVkJzogJ3Bhc3N3b3JkIGlzIHJlcXVpcmVkJ1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXV0aDogQXV0aGVudGljYXRpb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2ZiOiBGb3JtQnVpbGRlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIF9yb3V0ZTogQWN0aXZhdGVkUm91dGUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBfcm91dGVyOiBSb3V0ZXIpIHtcbiAgICB9XG5cblxuICAgIG5nT25Jbml0KCkge1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIGEgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpblxuICAgICAgICBpZiAodGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uJykpLnVzZXIubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRGb3JtKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZvcm0oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZnJtID0gdGhpcy5fZmIuZ3JvdXAoe1xuICAgICAgICAgICAgZW1haWw6IFsnJywgVmFsaWRhdG9ycy5yZXF1aXJlZF0sXG4gICAgICAgICAgICBwYXNzd29yZDogWycnLCBWYWxpZGF0b3JzLnJlcXVpcmVkXVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZybS52YWx1ZUNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB0aGlzLm9uVmFsdWVDaGFuZ2VkKGRhdGEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaWdub3JlXG4gICAgICpcbiAgICAgKiBjaGVjayBmb3IgZXJyb3JzIHdoaWxlIHVzaW5nIHRoZSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBvblZhbHVlQ2hhbmdlZChkYXRhPzogYW55KSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZybSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZnJtO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUVycm9ycykubWFwKGZpZWxkID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUVycm9yc1tmaWVsZF0gPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtLmdldChmaWVsZCk7XG4gICAgICAgICAgICBpZiAoY29udHJvbCAmJiBjb250cm9sLmRpcnR5ICYmICFjb250cm9sLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLnZhbGlkYXRpb25NZXNzYWdlc1tmaWVsZF07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29udHJvbC5lcnJvcnMpLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1FcnJvcnNbZmllbGRdICs9IG1lc3NhZ2VzW2tleV0gKyAnICc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRvTG9naW4oKSB7XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBmb3JtIHZhbHVlcyBhcmUgdmFsaWRcbiAgICAgICAgaWYgKHRoaXMuZnJtLmludmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclB3ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgc3RhdHVzXG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gR3JhYiB2YWx1ZXMgZnJvbSBmb3JtXG4gICAgICAgIGNvbnN0IHVzZXJuYW1lID0gdGhpcy5mcm0uZ2V0KCdlbWFpbCcpLnZhbHVlO1xuICAgICAgICBjb25zdCBwYXNzd29yZCA9IHRoaXMuZnJtLmdldCgncGFzc3dvcmQnKS52YWx1ZTtcblxuICAgICAgICB0aGlzLl9hdXRoLmxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgKHJlc3BvbnNlOiBBcGlTZXJ2aWNlUmVzdWx0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHRva2VuOyBzZXQgdGhlIHNlc3Npb24gbm93XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Nlc3Npb24uc2V0U2Vzc2lvbihyZXNwb25zZS5ib2R5LnRva2VuLCB1c2VybmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgcmV0dXJuIHVybCBmcm9tIHJvdXRlIHBhcmFtZXRlcnMgb3IgZGVmYXVsdCB0byAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVXJsID0gdGhpcy5fcm91dGUuc25hcHNob3QucXVlcnlQYXJhbXNbJ3JldHVyblVybCddIHx8ICcvJztcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnbyBiYWNrIHRvIHRoZSBwcmV2aW91cyByb3V0ZSBvciB0byB0aGUgcm91dGUgZGVmaW5lZCBpbiB0aGUgQElucHV0IGlmIG5hdmlnYXRlIGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5hdmlnYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFt0aGlzLnJldHVyblVybF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIubmF2aWdhdGUoW3RoaXMubmF2aWdhdGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGVycm9yOiBBcGlTZXJ2aWNlRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yVXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JQdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2luRXJyb3JTZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpbkVycm9yUHcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5FcnJvclNlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gPGFueT4gZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBsb2dvdXQoKSB7XG4gICAgICAgIHRoaXMuX2F1dGgubG9nb3V0KCk7XG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICB9XG5cbn1cbiJdfQ==