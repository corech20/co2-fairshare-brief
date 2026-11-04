import { Helmet } from "react-helmet-async";

const SITE_URL = "https://co2kostenberechnung.de";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: object;
  noIndex?: boolean;
}

export default function SEO({ title, description, path, jsonLd, noIndex }: SEOProps) {
  // Accept only site-relative paths; avoid malformed absolute canonical URLs.
  const normalizedPath = `/${path.split("/").filter(Boolean).join("/")}`;
  const absoluteUrl = `${SITE_URL}${normalizedPath}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absoluteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noIndex && <meta name="robots" content="noindex, follow" />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}