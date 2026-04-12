import type { MetadataRoute } from "next";
import { boroughPages } from "@/lib/seo/borough-pages";
import { boroughServiceContent } from "@/lib/seo/borough-service-content";
import { advicePosts } from "@/lib/seo/advice-posts";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

function getSafeBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

const BASE_URL = getSafeBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const enabledServiceValues = await getEnabledServiceValues();

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/london`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/become-a-cleaner`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/advice`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookie-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/gdpr-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cleaner-terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Customer auth pages (indexable for SEO)
  const authPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/customer/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/customer/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const boroughLandingPages: MetadataRoute.Sitemap = boroughPages.map((page) => ({
    url: `${BASE_URL}/london/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const servicePages: MetadataRoute.Sitemap = [
    { service: "cleaning", path: "/services/cleaning" },
    { service: "handyman", path: "/services/handyman" },
    { service: "pest-control", path: "/services/pest-control" },
    { service: "furniture-assembly", path: "/services/furniture-assembly" },
    { service: "waste-removal", path: "/services/waste-removal" },
    { service: "garden-maintenance", path: "/services/garden-maintenance" },
  ]
    .filter((entry) => enabledServiceValues.includes(entry.service as (typeof enabledServiceValues)[number]))
    .map((entry) => ({
      url: `${BASE_URL}${entry.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const serviceAreaPages: MetadataRoute.Sitemap = [];
  for (const borough of boroughPages) {
    for (const serviceContent of boroughServiceContent) {
      if (enabledServiceValues.includes(serviceContent.service)) {
        serviceAreaPages.push({
          url: `${BASE_URL}/london/${borough.slug}/${serviceContent.slug}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.75,
        });
      }
    }
  }

  const advicePages: MetadataRoute.Sitemap = advicePosts.map((post) => ({
    url: `${BASE_URL}/advice/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const comparePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/compare/hassle-alternative`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/compare/handy-alternative`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
  ];

  return [...staticPages, ...servicePages, ...boroughLandingPages, ...serviceAreaPages, ...advicePages, ...comparePages, ...authPages];
}
