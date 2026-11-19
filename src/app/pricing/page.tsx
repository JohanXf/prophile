import PricingClient from "./PricingClient";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import { PREMIUM_PLAN } from "@/lib/payments/plans";
import { SITE_CONFIG } from "@/lib/config";
import JsonLd from "@/components/seo/JsonLd";

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "prophile Premium",
  description:
    "Lifetime access to prophile Premium - unlimited backgrounds, tracks, widgets, every effect, aliases, tab customization and the Premium badge. One time payment, no subscription.",
  brand: {
    "@type": "Brand",
    name: SITE_CONFIG.name,
  },
  url: `${SITE_CONFIG.url}/pricing`,
  offers: (Object.keys(PREMIUM_PLAN) as (keyof typeof PREMIUM_PLAN)[]).map(
    (currency) => ({
      "@type": "Offer",
      name: `prophile Premium lifetime (${currency})`,
      price: PREMIUM_PLAN[currency].display,
      priceCurrency: currency,
      url: `${SITE_CONFIG.url}/pricing`,
      availability: "https://schema.org/InStock",
    })
  ),
};

export default function PricingPage() {
  const { isAuthenticated, user } = getCurrentSessionDataSync();
  return (
    <>
      <JsonLd data={pricingJsonLd} />
      <PricingClient
        isAuthenticated={isAuthenticated}
        isPremium={!!user?.isPremium}
        hasImageHost={!!user?.hasImageHost}
        hasVerified={!!user?.hasVerified}
        hasDonator={!!user?.hasDonator}
      />
    </>
  );
}
