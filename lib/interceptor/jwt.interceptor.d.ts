import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from '../session/session.service';
export declare class JwtInterceptor implements HttpInterceptor {
    private _session;
    constructor(_session: SessionService);
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
