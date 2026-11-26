import { randomBytes, createHash } from "node:crypto";

export function gerarTokenSenha() {
  const token = randomBytes(32).toString("hex");

  const tokenHash = gerarHashToken(token);

  return {
    token,
    tokenHash
  };
}

export function gerarHashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}