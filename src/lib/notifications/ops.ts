import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";

export async function getOpsNotificationRecipients() {
  const prisma = getPrisma();
  const setting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.ops_notification_emails" },
    select: { valueJson: true },
  });

  const raw = getSettingValue<string>(setting, process.env.SUPPORT_EMAIL || "support@areasorted.com");
  const recipients = String(raw)
    .replace(/\n/g, ",")
    .replace(/;/g, ",")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return recipients.length > 0 ? recipients : [process.env.SUPPORT_EMAIL || "support@areasorted.com"];
}
