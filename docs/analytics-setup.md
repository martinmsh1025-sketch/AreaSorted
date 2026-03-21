# GA4 And Search Console Setup

## Google Analytics 4

1. Go to Google Analytics
2. Create a new property for `AreaSorted`
3. Choose `Web` data stream
4. Enter your production URL
5. Copy the Measurement ID

Add this to Vercel:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

After deploy, GA4 will start tracking page views.

### What To Check In GA4

- Realtime: check your own visit appears
- Acquisition: where traffic comes from
- Engagement: top pages and session quality
- Conversions: if you later add booking funnel events

## Google Search Console

1. Open Google Search Console
2. Add a property for your production domain
3. Prefer `Domain property` verification through DNS
4. Submit your sitemap:

```text
https://your-domain.com/sitemap.xml
```

### What To Check In Search Console

- Performance
  - impressions
  - clicks
  - CTR
  - average position
- Indexing
  - valid indexed pages
  - excluded pages
  - crawl issues
- URL Inspection
  - request indexing for new landing pages

## First Pages To Inspect

- `/`
- `/services`
- `/pricing`
- `/faq`
- `/london`
- `/london/camden`
- `/london/islington`
- `/london/westminster`
- `/london/hackney`
- `/london/lambeth`

## What To Expect Early

- Search Console usually becomes more useful before GA4 SEO conclusions do
- First wins often come from brand searches and long-tail borough/service queries
- Do not expect broad head terms to rank immediately
