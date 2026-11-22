import ProfileCustomizeNav from "@/components/dashboard/ProfileCustomizeNav";
import SectionBuilderClient from "./SectionBuilderClient";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import { normalizeProfileSections } from "@/lib/profile-sections";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function Page() {
  const { user, backgrounds } = getCurrentSessionDataSync();
  const bigLinksCount = (user?.links ?? []).filter((l) => l && l.variant !== "small").length;

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-white/4 pb-5 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] gap-2">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="text-white/40 hover:text-white tracking-tight">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbEllipsis className="text-white/40" />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/customize/profile/general" className="text-white/40 hover:text-white tracking-tight">Profile</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#f05e23] font-normal tracking-tight">Section builder</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-6 pb-2 w-full pt-2" style={{ paddingRight: 'calc(var(--preview-width, 380px) + 2rem)' }}>
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
              <rect x="3" y="3" width="18" height="5" rx="1.5" />
              <rect x="3" y="11" width="18" height="5" rx="1.5" />
              <rect x="3" y="19" width="18" height="2" rx="1" />
            </svg>
            <h1 className="text-[20px] font-normal text-white tracking-tight">Section builder</h1>
          </div>
          <p className="text-white/40 text-[13px] mt-0.5">Build and arrange the sections of your profile</p>
        </div>

        <ProfileCustomizeNav />
      </div>

      <div
        className="flex flex-col gap-6 w-full pb-10"
        style={{ paddingRight: 'calc(var(--preview-width, 380px) + 2rem)' }}
      >
        <SectionBuilderClient
          user={user}
          backgrounds={backgrounds}
          initialSectioned={user?.profileStructure === "sectioned"}
          initialAbout={{
            hidden: user?.aboutSectionEnabled === false,
            title: user?.aboutSectionTitle ?? "About",
            description: user?.aboutSectionDescription ?? "",
          }}
          initialLinks={{
            hidden: user?.linksSectionEnabled === false,
            title: user?.linksSectionTitle ?? "Links",
            description: user?.linksSectionDescription ?? "",
            bigCount: bigLinksCount,
            aboveAbout: user?.linksSectionPosition === "above",
          }}
          initialSections={normalizeProfileSections(user?.profileSections)}
        />
      </div>
    </div>
  );
}
