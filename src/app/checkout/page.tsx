import { useSearchParams } from "next/navigation";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import CheckoutClient from "./CheckoutClient";
import type { PlanTag } from "@/lib/payments/plans";

export default function CheckoutPage({ product }: { product?: PlanTag }) {
  const searchParams = useSearchParams();
  const polar = searchParams.get("polar");
  const { isAuthenticated, user } = getCurrentSessionDataSync();

  return (
    <CheckoutClient
      isAuthenticated={isAuthenticated}
      email={user?.email ?? null}
      initialSucceeded={polar === "success"}
      product={product}
    />
  );
}
