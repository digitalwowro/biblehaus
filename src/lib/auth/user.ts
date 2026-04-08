import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "./jwt";

const TOKEN_EXPIRY = "24h";

export interface UserTokenPayload {
  sub: string;
  email: string;
}

export async function createUserToken(
  payload: UserTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyUserToken(
  token: string
): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as UserTokenPayload;
  } catch {
    return null;
  }
}
