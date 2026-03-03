import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { signAccessToken, verifyToken } from "./jwt";

describe("PBKDF2 password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("mysecretpassword");
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    const valid = await verifyPassword("mysecretpassword", hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct");
    const valid = await verifyPassword("wrong", hash);
    expect(valid).toBe(false);
  });

  it("generates unique hashes for same password", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
    // But both should verify
    expect(await verifyPassword("same", h1)).toBe(true);
    expect(await verifyPassword("same", h2)).toBe(true);
  });
});

describe("JWT sign/verify", () => {
  const SECRET = "test-secret-key-at-least-32-chars-long";

  it("signs and verifies a token", async () => {
    const token = await signAccessToken(
      { sub: "user123", email: "test@example.com", admin: 0, jti: "jti123" },
      SECRET
    );
    expect(typeof token).toBe("string");
    const payload = await verifyToken(token, SECRET);
    expect(payload.sub).toBe("user123");
    expect(payload.email).toBe("test@example.com");
    expect(payload.admin).toBe(0);
    expect(payload.type).toBe("access");
  });

  it("rejects token signed with different secret", async () => {
    const token = await signAccessToken(
      { sub: "user123", email: "test@example.com", admin: 0, jti: "jti123" },
      SECRET
    );
    await expect(verifyToken(token, "different-secret")).rejects.toThrow();
  });

  it("rejects tampered token", async () => {
    const token = await signAccessToken(
      { sub: "user123", email: "test@example.com", admin: 0, jti: "jti123" },
      SECRET
    );
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}xxx.${parts[2]}`;
    await expect(verifyToken(tampered, SECRET)).rejects.toThrow();
  });
});
