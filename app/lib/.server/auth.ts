import { env } from "~/env";

export function validateAdminCredentials(
  username: string,
  password: string,
): boolean {
  const adminUsername = env.ADMIN_USERNAME;
  const adminPassword = env.ADMIN_PASSWORD;

  return username === adminUsername && password === adminPassword;
}
