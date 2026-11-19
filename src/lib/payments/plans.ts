export const PREMIUM_PLAN = {
  USD: { symbol: "$", display: "4.99", amount: 499, label: "USD $" },
  INR: { symbol: "₹", display: "449", amount: 44900, label: "INR ₹" },
} as const;

export const IMAGE_HOST_PLAN = {
  USD: { symbol: "$", display: "2.99", amount: 299, label: "USD $" },
  INR: { symbol: "₹", display: "249", amount: 24900, label: "INR ₹" },
} as const;

export const VERIFIED_PLAN = {
  USD: { symbol: "$", display: "8.99", amount: 899, label: "USD $" },
  INR: { symbol: "₹", display: "849", amount: 84900, label: "INR ₹" },
} as const;

export const DONATOR_PLAN = {
  USD: { symbol: "$", display: "3.99", amount: 399, label: "USD $" },
  INR: { symbol: "₹", display: "349", amount: 34900, label: "INR ₹" },
} as const;

export const BADGE_TOKEN_PLAN = {
  USD: { symbol: "$", display: "1.99", amount: 199, label: "USD $" },
  INR: { symbol: "₹", display: "149", amount: 14900, label: "INR ₹" },
} as const;

export const ALIAS_TOKEN_PLAN = {
  USD: { symbol: "$", display: "1.29", amount: 129, label: "USD $" },
  INR: { symbol: "₹", display: "120", amount: 12000, label: "INR ₹" },
} as const;

export const DOMAIN_TOKEN_PLAN = {
  USD: { symbol: "$", display: "0.99", amount: 99, label: "USD $" },
  INR: { symbol: "₹", display: "90", amount: 9000, label: "INR ₹" },
} as const;

export const PREMIUM_PLAN_TAG = "premium_lifetime";
export const IMAGE_HOST_PLAN_TAG = "image_host_lifetime";
export const VERIFIED_PLAN_TAG = "verified_lifetime";
export const DONATOR_PLAN_TAG = "donator_lifetime";
export const BADGE_TOKEN_PLAN_TAG = "badge_token";
export const ALIAS_TOKEN_PLAN_TAG = "alias_token";
export const DOMAIN_TOKEN_PLAN_TAG = "domain_token";

export const PLAN_TAGS = [
  PREMIUM_PLAN_TAG,
  IMAGE_HOST_PLAN_TAG,
  VERIFIED_PLAN_TAG,
  DONATOR_PLAN_TAG,
  BADGE_TOKEN_PLAN_TAG,
  ALIAS_TOKEN_PLAN_TAG,
  DOMAIN_TOKEN_PLAN_TAG,
] as const;

export type PlanTag = (typeof PLAN_TAGS)[number];

export const CURRENCIES = ["USD", "INR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type PlanKey =
  | "premium"
  | "image-host"
  | "verified"
  | "donator"
  | "badge-token"
  | "alias-token"
  | "domain-token";

export const PLANS_BY_KEY = {
  "premium": { plan: PREMIUM_PLAN, tag: PREMIUM_PLAN_TAG, title: "prophile Premium" },
  "image-host": { plan: IMAGE_HOST_PLAN, tag: IMAGE_HOST_PLAN_TAG, title: "Image Host" },
  "verified": { plan: VERIFIED_PLAN, tag: VERIFIED_PLAN_TAG, title: "Verified Badge" },
  "donator": { plan: DONATOR_PLAN, tag: DONATOR_PLAN_TAG, title: "Donator Badge" },
  "badge-token": { plan: BADGE_TOKEN_PLAN, tag: BADGE_TOKEN_PLAN_TAG, title: "Custom Badge Token" },
  "alias-token": { plan: ALIAS_TOKEN_PLAN, tag: ALIAS_TOKEN_PLAN_TAG, title: "Alias Token" },
  "domain-token": { plan: DOMAIN_TOKEN_PLAN, tag: DOMAIN_TOKEN_PLAN_TAG, title: "Custom Domain Token" },
} as const;

export type Plan = (typeof PLANS_BY_KEY)[PlanKey];

export function getPlan(tag: string): Plan | undefined {
  return Object.values(PLANS_BY_KEY).find((p) => p.tag === tag);
}

export function aliasSlots(tokens: number, isPremium: boolean): number {
  return Math.max(0, tokens) * (isPremium ? 4 : 1);
}
