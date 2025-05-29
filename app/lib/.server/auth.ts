export function validateAdminCredentials(
  username: string,
  password: string,
): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn("Admin credentials not configured in environment variables");
    return false;
  }

  return username === adminUsername && password === adminPassword;
}

export function getAdminConfig() {
  return {
    hasCredentials: !!(
      process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
    ),
  };
}
