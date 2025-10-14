import type { CookieOptions } from 'express';

import type { ResponseWithCookies } from './cookies.ts';

declare global {
	namespace Express {
		interface Response {
			success(data?: unknown, message?: string, responseOptions?: ResponseWithCookies): this;
			error(error: Error | string, statusCode?: number, responseOptions?: ResponseWithCookies): this;
			setCookie(name: string, value: string, options?: CookieOptions): this;
			setSecureCookie(name: string, value: string, options?: CookieOptions): this;
			removeCookie(name: string, options?: CookieOptions): this;
		}
	}
}

export {};
