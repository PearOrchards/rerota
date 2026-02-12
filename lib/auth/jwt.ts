import { EncryptJWT, jwtDecrypt, base64url } from "jose";
const ACCESS_TOKEN_TTL_MINUTES = Number(
	process.env.AUTH_ACCESS_TTL_MINUTES ?? 15,
);
const REFRESH_TOKEN_TTL_DAYS = Number(
	process.env.AUTH_REFRESH_TTL_DAYS ?? 30,
);

export type SessionTokenType = "access" | "refresh";

export type SessionClaims = {
	sub: string;
	email: string;
	roleId: string;
	roleName: string;
	businessId: string;
	typ: SessionTokenType;
	jti?: string;
};

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error("JWT_ENC_KEY hex string must have even length.");
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i += 1) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function getJwtKey(): Uint8Array {
	const raw = process.env.JWT_ENC_KEY;
	if (!raw) {
		throw new Error("JWT_ENC_KEY is required.");
	}

	const isHex = /^[0-9a-f]+$/i.test(raw);
	const keyBytes = isHex ? hexToBytes(raw) : base64url.decode(raw);

	if (keyBytes.length !== 32) {
		throw new Error("JWT_ENC_KEY must be 32 bytes (base64url or hex).");
	}
	return keyBytes;
}

const jwtKey = getJwtKey();

export async function encryptAccessToken(claims: Omit<SessionClaims, "typ">) {
	return await new EncryptJWT({ ...claims, typ: "access" })
		.setProtectedHeader({ alg: "dir", enc: "A256GCM" })
		.setIssuedAt()
		.setExpirationTime(`${ACCESS_TOKEN_TTL_MINUTES}m`)
		.encrypt(jwtKey);
}

export async function encryptRefreshToken(claims: Omit<SessionClaims, "typ">) {
	return await new EncryptJWT({ ...claims, typ: "refresh" })
		.setProtectedHeader({ alg: "dir", enc: "A256GCM" })
		.setIssuedAt()
		.setExpirationTime(`${REFRESH_TOKEN_TTL_DAYS}d`)
		.encrypt(jwtKey);
}

export async function decryptToken(token: string): Promise<SessionClaims> {
	const { payload } = await jwtDecrypt(token, jwtKey);
	return payload as SessionClaims;
}

export async function decryptAccessToken(token: string): Promise<SessionClaims> {
	const payload = await decryptToken(token);
	if (payload.typ !== "access") {
		throw new Error("Invalid access token type.");
	}
	return payload;
}

export async function decryptRefreshToken(token: string): Promise<SessionClaims> {
	const payload = await decryptToken(token);
	if (payload.typ !== "refresh") {
		throw new Error("Invalid refresh token type.");
	}
	if (!payload.jti) {
		throw new Error("Refresh token missing jti.");
	}
	return payload;
}
