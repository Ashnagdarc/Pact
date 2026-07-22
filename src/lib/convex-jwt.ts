import { importJWK, SignJWT, type JWK } from "jose";

import { authJwtAudience, authJwtIssuer } from "@/lib/auth";

const KEY_ID = "pact-convex-es256";

type EcPrivateJwk = JWK & {
  kty: "EC";
  crv: string;
  x: string;
  y: string;
  d: string;
  kid?: string;
  alg?: string;
};

function readPrivateJwk(): EcPrivateJwk {
  const raw = process.env.PACT_CONVEX_JWT_PRIVATE_JWK;
  if (!raw) {
    throw new Error(
      "PACT_CONVEX_JWT_PRIVATE_JWK is required to mint Convex JWTs.",
    );
  }

  const parsed = JSON.parse(raw) as EcPrivateJwk;
  if (parsed.kty !== "EC" || !parsed.d || !parsed.x || !parsed.y) {
    throw new Error("PACT_CONVEX_JWT_PRIVATE_JWK must be an EC private JWK.");
  }

  return parsed;
}

export async function mintConvexJwt(input: {
  userId: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<string> {
  const jwk = readPrivateJwk();
  const privateKey = await importJWK(jwk, "ES256");

  return new SignJWT({
    name: input.name ?? undefined,
    email: input.email ?? undefined,
    picture: input.image ?? undefined,
  })
    .setProtectedHeader({
      alg: "ES256",
      typ: "JWT",
      kid: jwk.kid ?? KEY_ID,
    })
    .setSubject(input.userId)
    .setIssuer(authJwtIssuer)
    .setAudience(authJwtAudience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}
