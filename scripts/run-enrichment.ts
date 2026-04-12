// Standalone enrichment script — scrapes websites for remaining un-scraped leads
// Usage: npx tsx scripts/run-enrichment.ts

import { PrismaClient, type OutreachChannel } from "@prisma/client";
import { scrapeWebsite } from "../src/lib/leads/scraper";

const BATCH_SIZE = 10;

async function main() {
  const prisma = new PrismaClient();

  const totalRemaining = await prisma.providerLead.count({
    where: { website: { not: null }, websiteScraped: false },
  });

  console.log(`\n=== Enrichment Script ===`);
  console.log(`Leads to scrape: ${totalRemaining}\n`);

  let processed = 0;
  let totalEnriched = 0;
  let totalContactsAdded = 0;
  let totalErrors = 0;

  while (true) {
    const leads = await prisma.providerLead.findMany({
      where: { website: { not: null }, websiteScraped: false },
      select: { id: true, businessName: true, website: true },
      take: BATCH_SIZE,
    });

    if (leads.length === 0) break;

    for (const lead of leads) {
      processed++;
      const pct = ((processed / totalRemaining) * 100).toFixed(1);

      try {
        const scraped = await scrapeWebsite(lead.website!);

        const contactsToCreate: Array<{
          channel: OutreachChannel;
          value: string;
          publicSource: string;
        }> = [];

        for (const email of scraped.emails)
          contactsToCreate.push({ channel: "EMAIL", value: email, publicSource: `Scraped from ${lead.website}` });
        for (const phone of scraped.phones)
          contactsToCreate.push({ channel: "PHONE", value: phone, publicSource: `Scraped from ${lead.website}` });
        for (const wa of scraped.whatsappLinks)
          contactsToCreate.push({ channel: "WHATSAPP", value: wa, publicSource: `Scraped from ${lead.website}` });
        for (const fb of scraped.facebookLinks)
          contactsToCreate.push({ channel: "FACEBOOK_DM", value: fb, publicSource: `Scraped from ${lead.website}` });
        for (const ig of scraped.instagramLinks)
          contactsToCreate.push({ channel: "INSTAGRAM_DM", value: ig, publicSource: `Scraped from ${lead.website}` });
        for (const li of scraped.linkedinLinks)
          contactsToCreate.push({ channel: "LINKEDIN_DM", value: li, publicSource: `Scraped from ${lead.website}` });

        if (contactsToCreate.length > 0) {
          // Dedup against existing contacts
          const existing = await prisma.leadContact.findMany({
            where: { leadId: lead.id },
            select: { channel: true, value: true },
          });
          const existingSet = new Set(existing.map((c) => `${c.channel}:${c.value.toLowerCase()}`));

          let added = 0;
          for (const contact of contactsToCreate) {
            const key = `${contact.channel}:${contact.value.toLowerCase()}`;
            if (existingSet.has(key)) continue;
            existingSet.add(key);

            await prisma.leadContact.create({
              data: {
                leadId: lead.id,
                channel: contact.channel,
                value: contact.value,
                publicSource: contact.publicSource,
                isPrimary: contact.channel === "EMAIL" && !existing.some((c) => c.channel === "EMAIL"),
              },
            });
            added++;
          }
          totalContactsAdded += added;
          totalEnriched++;

          const emailCount = scraped.emails.length;
          console.log(`[${pct}%] ${processed}/${totalRemaining} ✓ ${lead.businessName} — ${added} contacts (${emailCount} emails)`);
        } else {
          console.log(`[${pct}%] ${processed}/${totalRemaining} - ${lead.businessName} — no contacts found`);
        }

        // Mark as scraped
        await prisma.providerLead.update({
          where: { id: lead.id },
          data: { websiteScraped: true },
        });
      } catch (err) {
        totalErrors++;
        console.log(`[${pct}%] ${processed}/${totalRemaining} ✗ ${lead.businessName} — error: ${err instanceof Error ? err.message : "unknown"}`);

        // Mark as scraped anyway to not retry forever
        try {
          await prisma.providerLead.update({
            where: { id: lead.id },
            data: { websiteScraped: true },
          });
        } catch {
          // ignore
        }
      }
    }

    // Small delay between batches
    await new Promise((r) => setTimeout(r, 200));
  }

  // Final stats
  const emailCount = await prisma.leadContact.count({ where: { channel: "EMAIL" } });
  const phoneCount = await prisma.leadContact.count({ where: { channel: "PHONE" } });
  const whatsappCount = await prisma.leadContact.count({ where: { channel: "WHATSAPP" } });
  const fbCount = await prisma.leadContact.count({ where: { channel: "FACEBOOK_DM" } });
  const igCount = await prisma.leadContact.count({ where: { channel: "INSTAGRAM_DM" } });
  const liCount = await prisma.leadContact.count({ where: { channel: "LINKEDIN_DM" } });

  console.log(`\n=== Enrichment Complete ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Enriched (found contacts): ${totalEnriched}`);
  console.log(`New contacts added: ${totalContactsAdded}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`\n--- Total Contact Stats ---`);
  console.log(`Email: ${emailCount}`);
  console.log(`Phone: ${phoneCount}`);
  console.log(`WhatsApp: ${whatsappCount}`);
  console.log(`Facebook: ${fbCount}`);
  console.log(`Instagram: ${igCount}`);
  console.log(`LinkedIn: ${liCount}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
