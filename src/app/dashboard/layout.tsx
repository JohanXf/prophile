import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { UnsavedChangesProvider } from "@/components/dashboard/UnsavedChangesProvider";
import { profileFontVariables } from "@/lib/profile-fonts";
import PickUsernameModal from "@/components/dashboard/PickUsernameModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = getCurrentSessionDataSync();

  return (
    <div className={`${profileFontVariables} dashboard-no-caret contents`}>
      <UnsavedChangesProvider>
        <DashboardShell
          username={user?.username ?? undefined}
          userId={user?.id}
          avatarUrl={user?.avatarUrl ?? undefined}
          decorationUrl={user?.avatarDecorationUrl ?? undefined}
          decorationHue={user?.avatarDecorationHue ?? 0}
        >
          {children}
        </DashboardShell>
        {user?.needsUsername && <PickUsernameModal />}
      </UnsavedChangesProvider>
    </div>
  );
}
