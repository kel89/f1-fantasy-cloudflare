import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  admin: number;
  type: "access" | "refresh";
}

const encoder = new TextEncoder();

function getAccessKey(secret: string) {
  return encoder.encode(secret);
}

function getRefreshKey(secret: string) {
  return encoder.encode(secret);
}

export async function signAccessToken(
  payload: Omit<TokenPayload, "type" | "iat" | "exp">,
  secret: string
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessKey(secret));
}

export async function signRefreshToken(
  payload: Pick<TokenPayload, "sub" | "jti">,
  secret: string
): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getRefreshKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getAccessKey(secret));
  return payload as TokenPayload;
}
