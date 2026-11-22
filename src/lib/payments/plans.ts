export const PREMIUM_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const IMAGE_HOST_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const VERIFIED_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const DONATOR_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const BADGE_TOKEN_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const ALIAS_TOKEN_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const DOMAIN_TOKEN_PLAN = {
  USD: { symbol: "$", display: "1", amount: 100, label: "USD $" },
  INR: { symbol: "₹", display: "85", amount: 8500, label: "INR ₹" },
} as const;

export const PREMIUM_PLAN_TAG = "premium_monthly";
export const IMAGE_HOST_PLAN_TAG = "image_host_monthly";
export const VERIFIED_PLAN_TAG = "verified_monthly";
export const DONATOR_PLAN_TAG = "donator_monthly";
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
  "premium": { plan: PREMIUM_PLAN, tag: PREMIUM_PLAN_TAG, title: "prophile Premium ($1/month)" },
  "image-host": { plan: IMAGE_HOST_PLAN, tag: IMAGE_HOST_PLAN_TAG, title: "Image Host ($1/month)" },
  "verified": { plan: VERIFIED_PLAN, tag: VERIFIED_PLAN_TAG, title: "Verified Badge ($1/month)" },
  "donator": { plan: DONATOR_PLAN, tag: DONATOR_PLAN_TAG, title: "Donator Badge ($1/month)" },
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
