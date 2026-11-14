export function getSuperAdminEmail() {
  return (
    process.env.SUPERADMIN_EMAIL?.trim() ||
    process.env.SUPER_ADMIN_EMAIL?.trim() ||
    "Admin@gmail.com"
  ).toLowerCase();
}

export function getSuperAdminPassword() {
  return process.env.SUPERADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD;
}

export function isSuperAdminEmail(email: string) {
  return email.trim().toLowerCase() === getSuperAdminEmail();
}
