// Outreach message templates for provider acquisition.
// Messaging angle: "We help you get more jobs" — NOT "join our platform".
// All templates are GDPR/PECR compliant: only sent to public business contacts.

// ---------------------------------------------------------------------------
// Template types
// ---------------------------------------------------------------------------

export type OutreachTemplate = {
  id: string;
  channel: "EMAIL" | "WHATSAPP" | "PHONE" | "LINKEDIN_DM" | "FACEBOOK_DM" | "INSTAGRAM_DM";
  name: string;
  /** When in the cadence this should be used (day 1, 3, 6, 10) */
  cadenceDay: number;
  subject?: string; // Email only
  body: string;
  /** Placeholders: {{businessName}}, {{ownerName}}, {{borough}}, {{service}}, {{website}} */
  notes?: string;
};

// ---------------------------------------------------------------------------
// Helper to fill placeholders
// ---------------------------------------------------------------------------

export function fillTemplate(
  template: string,
  vars: {
    businessName?: string;
    ownerName?: string;
    borough?: string;
    service?: string;
    website?: string;
  },
): string {
  let result = template;
  if (vars.businessName) result = result.replace(/\{\{businessName\}\}/g, vars.businessName);
  if (vars.ownerName) result = result.replace(/\{\{ownerName\}\}/g, vars.ownerName);
  if (vars.borough) result = result.replace(/\{\{borough\}\}/g, vars.borough);
  if (vars.service) result = result.replace(/\{\{service\}\}/g, vars.service);
  if (vars.website) result = result.replace(/\{\{website\}\}/g, vars.website);
  // Clean any remaining unfilled placeholders
  result = result.replace(/\{\{ownerName\}\}/g, "there");
  result = result.replace(/\{\{borough\}\}/g, "your area");
  result = result.replace(/\{\{service\}\}/g, "your services");
  return result;
}

// ---------------------------------------------------------------------------
// EMAIL TEMPLATES
// ---------------------------------------------------------------------------

const emailIntroV1: OutreachTemplate = {
  id: "email_intro_v1",
  channel: "EMAIL",
  name: "Intro email — help you get more jobs",
  cadenceDay: 1,
  subject: "More {{service}} jobs in {{borough}} — no advertising costs",
  body: `Hi {{ownerName}},

I came across {{businessName}} and was impressed by the quality of your work.

I'm reaching out from AreaSorted — we're a London-focused home services platform that matches homeowners with trusted local providers like you.

We're not another bidding site. Here's how it works:

- Homeowners in {{borough}} request {{service}} through our site
- We match them with providers who cover that area
- You set your own prices — no race to the bottom
- No advertising costs or monthly fees to get started

We already rank on Google for hundreds of London service + postcode searches, so we're generating real leads from homeowners actively looking for help.

Would you be open to a quick chat about how we could send some jobs your way?

Best,
AreaSorted Team
areasorted.com`,
};

const emailIntroV2: OutreachTemplate = {
  id: "email_intro_v2",
  channel: "EMAIL",
  name: "Intro email — local homeowners looking",
  cadenceDay: 1,
  subject: "Homeowners in {{borough}} looking for {{service}}",
  body: `Hi {{ownerName}},

I found {{businessName}} while researching top-rated {{service}} providers in {{borough}}.

We run AreaSorted (areasorted.com) — a managed marketplace that connects London homeowners with quality local service providers.

Why providers like working with us:

- Real job leads from homeowners in your area — no cold enquiries
- You set your own prices and availability
- No upfront fees, no bidding wars
- We handle the booking, payments, and customer support

We're specifically looking for reliable {{service}} providers covering {{borough}} right now. If you're interested in getting more work without the hassle of advertising, I'd love to tell you more.

Happy to jump on a quick call or answer any questions by email.

Best,
AreaSorted Team
areasorted.com`,
};

const emailFollowUpV1: OutreachTemplate = {
  id: "email_followup_v1",
  channel: "EMAIL",
  name: "Follow-up email — day 6",
  cadenceDay: 6,
  subject: "Re: More {{service}} jobs in {{borough}}",
  body: `Hi {{ownerName}},

Just a quick follow-up on my earlier email about getting more {{service}} jobs in {{borough}} through AreaSorted.

Totally understand if you're busy — just wanted to make sure this didn't get buried.

A few things that might help:

- There's no commitment to sign up for anything
- We can chat for 5 minutes so you can decide if it's worth exploring
- Several other {{service}} providers in London are already getting regular work through us

If now isn't the right time, no problem at all. But if you're interested in more local jobs, I'm here.

Best,
AreaSorted Team`,
};

const emailFinalNudgeV1: OutreachTemplate = {
  id: "email_final_v1",
  channel: "EMAIL",
  name: "Final nudge email — day 10",
  cadenceDay: 10,
  subject: "Last note — {{service}} work in {{borough}}",
  body: `Hi {{ownerName}},

This will be my last email — I don't want to be a nuisance!

If getting more {{service}} jobs in {{borough}} is something you'd find useful, AreaSorted can help with that. No fees to start, you set your prices, and we handle the customer side.

If it's not for you, totally fine. I'll leave the door open — you can always visit areasorted.com/providers if you change your mind down the line.

All the best with {{businessName}}.

Cheers,
AreaSorted Team`,
};

// ---------------------------------------------------------------------------
// WHATSAPP TEMPLATES
// ---------------------------------------------------------------------------

const whatsappIntroV1: OutreachTemplate = {
  id: "whatsapp_intro_v1",
  channel: "WHATSAPP",
  name: "WhatsApp intro — short and direct",
  cadenceDay: 3,
  body: `Hi! I came across {{businessName}} and wanted to reach out.

We run AreaSorted (areasorted.com) — we connect London homeowners with local service providers for {{service}} work.

We have homeowners in {{borough}} looking for help, and you'd be a great fit. You set your own prices, no fees to start.

Would you be interested in hearing more? Happy to send details or jump on a quick call.`,
};

const whatsappFollowUpV1: OutreachTemplate = {
  id: "whatsapp_followup_v1",
  channel: "WHATSAPP",
  name: "WhatsApp follow-up",
  cadenceDay: 6,
  body: `Hi! Just following up on my earlier message about {{service}} work in {{borough}} through AreaSorted.

No pressure — just wanted to check if you'd be interested in getting some extra local jobs. Happy to explain how it works in a quick call.`,
};

// ---------------------------------------------------------------------------
// PHONE CALL SCRIPTS
// ---------------------------------------------------------------------------

const phoneIntroV1: OutreachTemplate = {
  id: "phone_intro_v1",
  channel: "PHONE",
  name: "Phone call script — intro",
  cadenceDay: 3,
  body: `[CALL SCRIPT]

Opening:
"Hi, is this {{ownerName}} from {{businessName}}? My name is [YOUR NAME] from AreaSorted."

If they say yes:
"Great! I'll be really brief — I found your business online and I'm reaching out because we have homeowners in {{borough}} looking for {{service}} help, and I thought you might be a good fit."

The pitch (keep it under 60 seconds):
"We run a managed marketplace for home services in London. Homeowners come to our website, request a service, and we match them with trusted local providers. You'd set your own prices, there's no bidding, and there are no upfront fees."

"We already rank on Google for loads of London service searches, so we're getting real enquiries from people who need help now."

Handle objections:
- "Is this like Bark/MyBuilder?" → "No — we don't do bidding. We match you directly. You set your price, the customer accepts or doesn't."
- "What's the catch?" → "We take a service fee on completed jobs. But there's no fee to join, no monthly subscription."
- "I'm too busy" → "That's great! Even better — you can set your own availability. We only send you work when you're free."

Close:
"Would you be happy for me to send you a link to register? It takes about 5 minutes, and we can get you set up for jobs in {{borough}} straight away."

If not interested:
"No problem at all. If things change, you can always find us at areasorted.com. Best of luck with the business!"`,
};

const phoneFollowUpV1: OutreachTemplate = {
  id: "phone_followup_v1",
  channel: "PHONE",
  name: "Phone call script — follow-up",
  cadenceDay: 6,
  body: `[FOLLOW-UP CALL SCRIPT]

Opening:
"Hi {{ownerName}}, it's [YOUR NAME] from AreaSorted. I reached out a few days ago about {{service}} work in {{borough}}. Is now a good time for 2 minutes?"

If yes:
"I just wanted to check if you had a chance to think about it. We've had a few homeowners in {{borough}} request {{service}} recently, and I wanted to make sure you didn't miss out."

"Registration takes about 5 minutes, and you can start getting matched with jobs straight away. No fees to join."

If they're on the fence:
"Tell you what — why don't I send you the link, and you can have a look in your own time? No commitment."

If not interested:
"Totally understand. I appreciate your time. If anything changes, we're at areasorted.com. All the best!"`,
};

// ---------------------------------------------------------------------------
// LINKEDIN DM TEMPLATES
// ---------------------------------------------------------------------------

const linkedinIntroV1: OutreachTemplate = {
  id: "linkedin_intro_v1",
  channel: "LINKEDIN_DM",
  name: "LinkedIn DM — professional intro",
  cadenceDay: 3,
  body: `Hi {{ownerName}},

I came across {{businessName}} and thought I'd reach out. I'm with AreaSorted — we're a London-based home services marketplace connecting homeowners with trusted local providers.

We're currently looking for quality {{service}} providers in {{borough}}. If you're ever looking for extra work, we make it easy — you set your own prices, no bidding, no advertising costs.

Happy to share more if you're interested!`,
};

// ---------------------------------------------------------------------------
// FACEBOOK / INSTAGRAM DM TEMPLATES
// ---------------------------------------------------------------------------

const facebookIntroV1: OutreachTemplate = {
  id: "facebook_intro_v1",
  channel: "FACEBOOK_DM",
  name: "Facebook DM — friendly intro",
  cadenceDay: 3,
  body: `Hi! I found your page and your work looks great.

I'm from AreaSorted — we help London homeowners find trusted local providers for services like {{service}}.

We have people in {{borough}} looking for help right now. If you're interested in getting more local jobs (you set your own prices, no fees to start), I'd love to tell you more!

Check us out: areasorted.com`,
};

const instagramIntroV1: OutreachTemplate = {
  id: "instagram_intro_v1",
  channel: "INSTAGRAM_DM",
  name: "Instagram DM — friendly intro",
  cadenceDay: 3,
  body: `Hey! Love the work you're posting.

I'm from AreaSorted — we connect London homeowners with quality local service providers. We have people in {{borough}} looking for {{service}} right now.

You set your own prices, no bidding, no fees to join. Interested in hearing more?

areasorted.com`,
};

// ---------------------------------------------------------------------------
// All templates grouped by channel
// ---------------------------------------------------------------------------

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  // Email
  emailIntroV1,
  emailIntroV2,
  emailFollowUpV1,
  emailFinalNudgeV1,
  // WhatsApp
  whatsappIntroV1,
  whatsappFollowUpV1,
  // Phone
  phoneIntroV1,
  phoneFollowUpV1,
  // LinkedIn
  linkedinIntroV1,
  // Facebook
  facebookIntroV1,
  // Instagram
  instagramIntroV1,
];

export function getTemplatesForChannel(channel: string): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter((t) => t.channel === channel);
}
