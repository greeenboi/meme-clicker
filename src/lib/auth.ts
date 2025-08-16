import { id } from "@instantdb/react";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import db from "./db";
import { validateLogin, validateSignUp } from "./zod.auth";

const COOKIE_NAME = "frog_auth";
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || "dev-insecure-secret";
const COOKIE_DAYS = 7;

export type AuthToken = {
	ownerId: string;
	email: string;
	username: string;
	iat?: number;
	exp?: number;
};

const getKey = () => new TextEncoder().encode(JWT_SECRET);

async function signToken(payload: AuthToken) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime(`${COOKIE_DAYS}d`)
		.sign(getKey());
}

async function verifyToken(token: string): Promise<AuthToken | null> {
	try {
		const { payload } = await jwtVerify(token, getKey(), {
			algorithms: ["HS256"],
		});
		return payload as AuthToken;
	} catch {
		return null;
	}
}

function setCookie(name: string, value: string, days: number) {
	const d = new Date();
	d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
	const expires = "expires=" + d.toUTCString();
	document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
	const cname = name + "=";
	const decodedCookie = decodeURIComponent(document.cookie);
	const ca = decodedCookie.split(";");
	for (let c of ca) {
		while (c.charAt(0) === " ") c = c.substring(1);
		if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
	}
	return null;
}

function deleteCookie(name: string) {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export async function signUp(
	email: string,
	username: string,
	password: string,
) {
	const parsed = validateSignUp({ email, username, password });
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		throw new Error(first.message);
	}
	// use normalized values (e.g., lowercased email, trimmed fields)
	({ email, username, password } = parsed.data);
	// Ensure username and email availability
	const { data: profilesData } = await db.queryOnce({
		profiles: { $: { where: { username } } },
	});
	if ((profilesData.profiles || []).length > 0) {
		throw new Error("Username already taken");
	}

	const { data: authData } = await db.queryOnce({
		auths: { $: { where: { email } } },
	});
	if ((authData.auths || []).length > 0) {
		throw new Error("Email already registered");
	}

	const salt = bcrypt.genSaltSync(10);
	const passwordHash = bcrypt.hashSync(password, salt);

	const ownerId = id();
	const authId = id();
	const profileId = id();
	const statsId = id();
	const now = new Date().toISOString();

	await db.transact([
		db.tx.auths[authId].create({
			email,
			passwordHash,
			passwordSalt: salt,
			ownerId,
			createdAt: now,
			lastLoginAt: now,
		}),
		db.tx.profiles[profileId].create({
			username,
			ownerId,
			createdAt: now,
			avatarEmoji: "🐸",
			theme: "swamp",
		}),
		db.tx.stats[statsId].create({
			ownerId,
			totalFrogs: 0,
			totalClicks: 0,
			frogsPerSecond: 0,
			prestige: 0,
			createdAt: now,
			lastActiveAt: now,
		}),
		// link stats <-> profile for convenience
		db.tx.stats[statsId].link({ profile: profileId }),
	]);

	const token = await signToken({ ownerId, email, username });
	setCookie(COOKIE_NAME, token, COOKIE_DAYS);

	return { ownerId, email, username } as AuthToken;
}

export async function login(email: string, password: string) {
	const parsed = validateLogin({ email, password });
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		throw new Error(first.message);
	}
	({ email, password } = parsed.data);
	const { data } = await db.queryOnce({
		auths: { $: { where: { email } } },
	});
	const record = (data.auths || [])[0];
	if (!record) throw new Error("Invalid credentials");

	const ok = bcrypt.compareSync(password, record.passwordHash);
	if (!ok) throw new Error("Invalid credentials");

	// Fetch username by ownerId
	const { data: prof } = await db.queryOnce({
		profiles: { $: { where: { ownerId: record.ownerId } } },
	});
	const profile = (prof.profiles || [])[0];
	const username = profile?.username || "frogling";

	// Update last login
	await db.transact(
		db.tx.auths[record.id].update({ lastLoginAt: new Date().toISOString() }),
	);

	const token = await signToken({ ownerId: record.ownerId, email, username });
	setCookie(COOKIE_NAME, token, COOKIE_DAYS);

	return { ownerId: record.ownerId, email, username } as AuthToken;
}

export function logout() {
	deleteCookie(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthToken | null> {
	const token = getCookie(COOKIE_NAME);
	if (!token) return null;
	const payload = await verifyToken(token);
	if (!payload) {
		deleteCookie(COOKIE_NAME);
		return null;
	}
	return payload;
}
