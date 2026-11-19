import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import { CustomizeProfileProvider } from "./CustomizeProfileProvider";

export default function ProfileCustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = getCurrentSessionDataSync();

  return (
    <CustomizeProfileProvider initialUser={user}>
      {children}
    </CustomizeProfileProvider>
  );
}
