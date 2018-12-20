import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../session/session.service';
import * as i0 from "@angular/core";
import * as i1 from "../session/session.service";
import * as i2 from "@angular/router";
export class AuthGuard {
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
AuthGuard.ngInjectableDef = i0.defineInjectable({ factory: function AuthGuard_Factory() { return new AuthGuard(i0.inject(i1.SessionService), i0.inject(i2.Router)); }, token: AuthGuard, providedIn: "root" });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5ndWFyZC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0Brbm9yYS9hdXRoZW50aWNhdGlvbi8iLCJzb3VyY2VzIjpbImxpYi9ndWFyZC9hdXRoLmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0MsT0FBTyxFQUF1QyxNQUFNLEVBQXVCLE1BQU0saUJBQWlCLENBQUM7QUFFbkcsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDOzs7O0FBSzVELE1BQU07SUFFRixZQUFvQixRQUF3QixFQUN4QixPQUFlO1FBRGYsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7UUFDeEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtJQUVuQyxDQUFDO0lBRUQsV0FBVyxDQUNQLElBQTRCLEVBQzVCLEtBQTBCO1FBRTFCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxXQUFXLEVBQUUsRUFBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBQyxFQUFDLENBQUMsQ0FBQztZQUN4RSxPQUFPLEtBQUssQ0FBQztTQUNoQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7OztZQXBCSixVQUFVLFNBQUM7Z0JBQ1IsVUFBVSxFQUFFLE1BQU07YUFDckI7Ozs7WUFKUSxjQUFjO1lBRnVCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBDYW5BY3RpdmF0ZSwgUm91dGVyLCBSb3V0ZXJTdGF0ZVNuYXBzaG90IH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFNlc3Npb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2Vzc2lvbi9zZXNzaW9uLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Nlc3Npb246IFNlc3Npb25TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX3JvdXRlcjogUm91dGVyKSB7XG5cbiAgICB9XG5cbiAgICBjYW5BY3RpdmF0ZShcbiAgICAgICAgbmV4dDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgICAgICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHwgUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW4ge1xuXG4gICAgICAgIGlmICghdGhpcy5fc2Vzc2lvbi52YWxpZGF0ZVNlc3Npb24oKSkge1xuICAgICAgICAgICAgdGhpcy5fcm91dGVyLm5hdmlnYXRlKFsnbG9naW4nXSwge3F1ZXJ5UGFyYW1zOiB7cmV0dXJuVXJsOiBzdGF0ZS51cmx9fSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbn1cbiJdfQ==