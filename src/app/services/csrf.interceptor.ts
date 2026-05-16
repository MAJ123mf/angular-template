import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    req = req.clone({
      headers: req.headers.set('X-CSRFToken', csrfToken)
    });
  }
  return next(req);
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}