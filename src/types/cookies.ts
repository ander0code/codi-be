import type { CookieOptions } from 'express';

export interface CookieConfig {
	name: string;
	value: string;
	options?: CookieOptions;
}

export interface ResponseWithCookies {
	cookies?: CookieConfig[];
	clearCookies?: string[];
}
