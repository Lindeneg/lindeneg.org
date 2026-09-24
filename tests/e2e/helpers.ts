import {randomUUID} from "node:crypto";
import {loadAppEnv} from "../../src/lib/env.js";
import type {MaybeNull} from "../../src/lib/types.js";
import DataService from "../../src/services/data-service.js";
import LoggerService from "../../src/services/logger-service.js";

export const env = loadAppEnv();

export const BASE_URL = `http://localhost:${env.PORT}`;

export const db = new DataService(env.DATABASE_URL, env.NODE_ENV, new LoggerService(env.NODE_ENV));

export type TestResponse = {
    status: number;
    location: MaybeNull<string>;
    setCookies: string[];
    html: string;
};

async function request(path: string, init: RequestInit, cookie?: string): Promise<TestResponse> {
    const headers = new Headers(init.headers);
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(BASE_URL + path, {...init, headers, redirect: "manual"});
    return {
        status: res.status,
        location: res.headers.get("location"),
        setCookies: res.headers.getSetCookie(),
        html: await res.text(),
    };
}

export function get(path: string, cookie?: string): Promise<TestResponse> {
    return request(path, {method: "GET"}, cookie);
}

export function postForm(path: string, fields: Record<string, string>, cookie?: string): Promise<TestResponse> {
    return request(path, {method: "POST", body: new URLSearchParams(fields)}, cookie);
}

export function postMultipart(path: string, form: FormData, cookie?: string): Promise<TestResponse> {
    return request(path, {method: "POST", body: form}, cookie);
}

export function imageBlob(): Blob {
    return new Blob([Buffer.from("not-really-a-png")], {type: "image/png"});
}

export function uid(): string {
    return randomUUID().slice(0, 8);
}

export function idFromLocation(location: MaybeNull<string>, pattern: RegExp): string {
    const match = location?.match(pattern);
    if (!match) throw new Error(`unexpected redirect: ${location}`);
    return match[1];
}

export async function cacheStats(cookie: string): Promise<{entries: number; hits: number; misses: number}> {
    const {html} = await get("/admin/settings", cookie);
    const read = (label: string) => {
        const match = html.match(new RegExp(`${label}: (\\d+)`));
        if (!match) throw new Error(`no "${label}" in cache stats`);
        return Number(match[1]);
    };
    return {entries: read("Entries"), hits: read("Hits"), misses: read("Misses")};
}

export async function login(): Promise<string> {
    if (!env.SUPER_USER) throw new Error("SUPER_USER must be set in .env.test");
    const res = await postForm("/admin/login", {email: env.SUPER_USER.email, password: env.SUPER_USER.password});
    const cookie = res.setCookies.find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`));
    if (res.status !== 302 || !cookie) throw new Error(`login failed with status ${res.status}`);
    return cookie.split(";")[0];
}
