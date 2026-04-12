// Website scraper for lead enrichment.
// Visits a lead's website and extracts public contact information:
// email, phone, WhatsApp, Facebook, Instagram, LinkedIn, Twitter/X.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScrapedContacts = {
  emails: string[];
  phones: string[];
  whatsappLinks: string[];
  facebookLinks: string[];
  instagramLinks: string[];
  linkedinLinks: string[];
  twitterLinks: string[];
};

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

// Email: standard pattern, exclude image/file extensions
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// mailto: links — extract email from href="mailto:foo@bar.com"
const MAILTO_RE = /href\s*=\s*["']mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;

// Obfuscated email patterns: foo [at] bar [dot] com
const OBFUSCATED_AT_RE = /[a-zA-Z0-9._%+\-]+\s*[\[\(]\s*at\s*[\]\)]\s*[a-zA-Z0-9.\-]+\s*[\[\(]\s*dot\s*[\]\)]\s*[a-zA-Z]{2,}/gi;

// HTML entity encoded @ sign: &#64; or &#x40;
const HTML_ENTITY_EMAIL_RE = /[a-zA-Z0-9._%+\-]+(?:&#64;|&#x40;)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;

const JUNK_EMAIL_DOMAINS = new Set([
  "example.com",
  "sentry.io",
  "wixpress.com",
  "googleapis.com",
  "w3.org",
  "schema.org",
  "gravatar.com",
  "wordpress.org",
  "wordpress.com",
  "squarespace.com",
  "squarespace-mail.com",
  "godaddy.com",
  "wix.com",
  "weebly.com",
  "shopify.com",
  "mailchimp.com",
  "googlemail.com",
  "sharethis.com",
  "addthis.com",
  "cloudflare.com",
  "cloudflareinsights.com",
  "intercom.io",
  "crisp.chat",
  "tawk.to",
  "zendesk.com",
  "hubspot.com",
  "mailgun.org",
  "sendgrid.net",
  "trustpilot.com",
  "recaptcha.net",
  "gstatic.com",
  "google.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "linkedin.com",
]);

const JUNK_EMAIL_PREFIXES = [
  "noreply",
  "no-reply",
  "no_reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "postmaster",
  "webmaster",
  "hostmaster",
  "abuse@",
  "security@",
  "privacy@",
  "support@wix",
  "support@squarespace",
  "support@godaddy",
  "wordpress@",
  "admin@wordpress",
];

// UK phone patterns — more permissive
const UK_PHONE_RE = /(?:(?:\+\s*44|0)\s*(?:\d[\s\-\.]?){9,10})/g;

// WhatsApp
const WHATSAPP_RE = /https?:\/\/(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/[^\s"'<>)]+/gi;

// Social media
const FACEBOOK_RE = /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.\-_]+\/?/gi;
const INSTAGRAM_RE = /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9.\-_]+\/?/gi;
const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9.\-_]+\/?/gi;
const TWITTER_RE = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9.\-_]+\/?/gi;

// ---------------------------------------------------------------------------
// Sub-pages to attempt (ordered by likelihood of having contact info)
// ---------------------------------------------------------------------------

const CONTACT_SUBPAGES = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/get-in-touch",
  "/enquiries",
  "/enquiry",
  "/about",
  "/about-us",
  "/aboutus",
  "/book",
  "/book-now",
  "/hire-us",
  "/get-a-quote",
  "/quote",
  "/request-quote",
  "/footer",         // some SPAs expose footer as page
  "/privacy-policy", // often has real email for data controller
  "/terms",
];

// ---------------------------------------------------------------------------
// Fetch a page with timeout
// ---------------------------------------------------------------------------

async function fetchPage(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    // Only read text/html responses
    const ct = response.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain") && !ct.includes("application/xhtml")) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Clean email: is this a real business email?
// ---------------------------------------------------------------------------

function isValidBusinessEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const domain = lower.split("@")[1];

  if (!domain) return false;

  // Check exact domain AND parent domain (catches subdomains like sentry-next.wixpress.com)
  if (JUNK_EMAIL_DOMAINS.has(domain)) return false;
  const parts = domain.split(".");
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join(".");
    if (JUNK_EMAIL_DOMAINS.has(parentDomain)) return false;
  }

  // File extensions that get caught by email regex (e.g. flags@2x.webp)
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
      lower.endsWith(".svg") || lower.endsWith(".gif") || lower.endsWith(".webp") ||
      lower.endsWith(".css") || lower.endsWith(".js") || lower.endsWith(".ico") ||
      lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") ||
      lower.endsWith(".map") || lower.endsWith(".json")) return false;

  // Domain must have a proper TLD (at least 2 chars after last dot)
  if (!/\.[a-z]{2,}$/.test(domain)) return false;

  for (const prefix of JUNK_EMAIL_PREFIXES) {
    if (lower.startsWith(prefix)) return false;
  }

  // Test / placeholder emails
  if (/^test@/i.test(lower) || /^demo@/i.test(lower) || /^sample@/i.test(lower) ||
      /^placeholder@/i.test(lower) || /^fake@/i.test(lower) ||
      lower === "email@example.com" || lower === "your@email.com" ||
      lower === "name@domain.com" || lower === "user@domain.com") return false;

  // Filter out very long emails (likely false positives)
  if (lower.length > 60) return false;

  // Filter out emails with version numbers or hashes (code artifacts)
  if (/\d{4,}/.test(lower.split("@")[0])) return false;

  // Filter out emails where local part looks like a hex hash (sentry IDs, etc.)
  if (/^[0-9a-f]{16,}@/.test(lower)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Extract emails from HTML text using multiple methods
// ---------------------------------------------------------------------------

function extractEmails(html: string): string[] {
  const found = new Set<string>();

  // Method 1: Direct email regex
  const direct = html.match(EMAIL_RE) || [];
  for (const e of direct) found.add(e.toLowerCase());

  // Method 2: mailto: links
  let match;
  const mailtoRe = new RegExp(MAILTO_RE.source, "gi");
  while ((match = mailtoRe.exec(html)) !== null) {
    found.add(match[1].toLowerCase());
  }

  // Method 3: HTML entity encoded emails
  const entityEmails = html.match(HTML_ENTITY_EMAIL_RE) || [];
  for (const e of entityEmails) {
    found.add(e.replace(/&#64;|&#x40;/gi, "@").toLowerCase());
  }

  // Method 4: Obfuscated [at] [dot] format
  const obfuscated = html.match(OBFUSCATED_AT_RE) || [];
  for (const e of obfuscated) {
    const clean = e
      .replace(/\s*[\[\(]\s*at\s*[\]\)]\s*/gi, "@")
      .replace(/\s*[\[\(]\s*dot\s*[\]\)]\s*/gi, ".")
      .toLowerCase();
    found.add(clean);
  }

  // Method 5: JSON-LD structured data (often has email)
  const jsonLdRe = /"email"\s*:\s*"([^"]+@[^"]+)"/gi;
  while ((match = jsonLdRe.exec(html)) !== null) {
    found.add(match[1].toLowerCase());
  }

  // Method 6: Schema.org itemprop="email"
  const itempropRe = /itemprop\s*=\s*["']email["'][^>]*content\s*=\s*["']([^"']+)["']/gi;
  while ((match = itempropRe.exec(html)) !== null) {
    if (match[1].includes("@")) found.add(match[1].toLowerCase());
  }

  // Filter to real business emails
  return [...found].filter(isValidBusinessEmail);
}

// ---------------------------------------------------------------------------
// Scrape a single website
// ---------------------------------------------------------------------------

export async function scrapeWebsite(url: string): Promise<ScrapedContacts> {
  const result: ScrapedContacts = {
    emails: [],
    phones: [],
    whatsappLinks: [],
    facebookLinks: [],
    instagramLinks: [],
    linkedinLinks: [],
    twitterLinks: [],
  };

  try {
    // Normalise URL
    let baseUrl = url.trim();
    if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
    // Remove trailing paths to get root
    const urlObj = new URL(baseUrl);
    const rootUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Fetch main page
    const mainHtml = await fetchPage(baseUrl, 10000);
    if (!mainHtml) return result;

    let fullText = mainHtml;

    // Fetch sub-pages — stop after we find at least one email or after trying all
    let foundEmailFromSubpage = false;
    for (const path of CONTACT_SUBPAGES) {
      const subUrl = `${rootUrl}${path}`;
      // Skip if same as main URL
      if (subUrl === baseUrl || subUrl === baseUrl + "/") continue;

      const subHtml = await fetchPage(subUrl, 6000);
      if (subHtml) {
        fullText += "\n" + subHtml;

        // Quick check: did this page have an email?
        const quickEmails = extractEmails(subHtml);
        if (quickEmails.length > 0) {
          foundEmailFromSubpage = true;
        }
      }

      // If we already found email on a sub-page, still try a few more but be quicker
      // Stop after /about-us if we already have emails
      if (foundEmailFromSubpage && CONTACT_SUBPAGES.indexOf(path) >= 6) break;
    }

    // Extract all contacts from combined text
    result.emails = extractEmails(fullText).slice(0, 5);

    // Extract phones
    const rawPhones = fullText.match(UK_PHONE_RE) || [];
    const cleanPhones = rawPhones.map((p) => p.replace(/[\s\-\.]/g, "")).filter(Boolean);
    result.phones = [...new Set(cleanPhones)].slice(0, 3);

    // Extract WhatsApp links
    const rawWhatsapp = fullText.match(WHATSAPP_RE) || [];
    result.whatsappLinks = [...new Set(rawWhatsapp.map((u) => u.replace(/["'<>)]/g, "")))].slice(0, 3);

    // Extract social links
    const rawFb = fullText.match(FACEBOOK_RE) || [];
    result.facebookLinks = [...new Set(rawFb)].filter(u => !u.includes("facebook.com/tr") && !u.includes("facebook.com/sharer")).slice(0, 2);

    const rawIg = fullText.match(INSTAGRAM_RE) || [];
    result.instagramLinks = [...new Set(rawIg)].slice(0, 2);

    const rawLi = fullText.match(LINKEDIN_RE) || [];
    result.linkedinLinks = [...new Set(rawLi)].slice(0, 2);

    const rawTw = fullText.match(TWITTER_RE) || [];
    result.twitterLinks = [...new Set(rawTw)].filter(u => !u.includes("/share") && !u.includes("/intent")).slice(0, 2);
  } catch {
    // Network error, timeout, etc — return empty result
  }

  return result;
}
