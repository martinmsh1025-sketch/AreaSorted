import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getLeadsWithEmailAction } from "./email-actions";
import { EmailOutreach } from "./email-outreach";

export default async function EmailOutreachPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const leads = await getLeadsWithEmailAction();

  return <EmailOutreach leads={leads} />;
}
