import AuthPanel from "@/app/auth-panel";
import { getSuperAdminEmail } from "@/lib/super-admin";

export default function SuperAdminLoginPage() {
  return <AuthPanel superAdminEmail={getSuperAdminEmail()} />;
}
