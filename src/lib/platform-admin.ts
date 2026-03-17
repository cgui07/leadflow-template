import { isPlatformAdminEmail } from "./tenant";

interface PlatformAdminCandidate {
  email: string;
  role: string;
}

export class PlatformAdminAccessError extends Error {
  constructor() {
    super("PLATFORM_ADMIN_ONLY");
  }
}

export function isPlatformAdminUser(
  user: PlatformAdminCandidate | null | undefined,
): boolean {
  return !!user && user.role === "admin" && isPlatformAdminEmail(user.email);
}

export function assertPlatformAdminAccess<T extends PlatformAdminCandidate>(
  user: T,
): T {
  if (!isPlatformAdminUser(user)) {
    throw new PlatformAdminAccessError();
  }

  return user;
}
