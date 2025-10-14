import type { ResponseWithCookies } from './cookies.js';

export interface ServiceResponse<T = any> {
	message?: string;
	data?: T;
	cookiesOptions?: ResponseWithCookies;
}
