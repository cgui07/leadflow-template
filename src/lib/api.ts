import { getCurrentUser } from "./auth";
import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return error("Não autorizado", 401);
  }
  console.error(err);
  return error("Erro interno do servidor", 500);
}
