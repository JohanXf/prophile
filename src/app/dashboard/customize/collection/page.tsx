import Link from "next/link";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SectionCategoryNotice from "@/components/dashboard/SectionCategoryNotice";
import { normalizeProfileSections } from "@/lib/profile-sections";
import CollectionProfileClient from "./CollectionProfileClient";

export default function Page() {
  const { user, backgrounds } = getCurrentSessionDataSync();
  const hasCollectionSection = normalizeProfileSections(user?.profileSections).some((section) =>
    section.categories.includes("collection")
  );

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-white/4 pb-5 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] gap-2">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="text-white/40 hover:text-white tracking-tight">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbEllipsis className="text-white/40" />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#f05e23] font-normal tracking-tight">
                Collection
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div
        className="flex flex-col gap-6 pb-2 w-full pt-2"
        style={{ paddingRight: "calc(var(--preview-width, 380px) + 2rem)" }}
      >
        <div>
          <div className="flex items-center gap-3">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f05e23"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="8" height="11" rx="2" />
              <rect x="14" y="3" width="7" height="6" rx="2" />
              <rect x="14" y="12" width="7" height="9" rx="2" />
              <rect x="3" y="17" width="8" height="4" rx="1.5" />
            </svg>
            <h1 className="text-[20px] font-normal text-white tracking-tight">Collection</h1>
          </div>
          <p className="text-white/40 text-[13px] mt-0.5">
            Drag and drop PFP, portrait, and landscape photos into a full-width magazine collection
          </p>
        </div>

        {!hasCollectionSection && <SectionCategoryNotice category="collection" />}
      </div>

      <CollectionProfileClient user={user} backgrounds={backgrounds} />
    </div>
  );
}
