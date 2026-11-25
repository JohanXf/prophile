import React, { Suspense, lazy } from "react";
import { NavigationProvider, usePathname } from "@/shims/next-navigation";
import ConditionalBackground from "@/components/ConditionalBackground";
import { Toaster } from "@/components/ui/toast";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { subscribeStore } from "@/lib/local-store";
import {
  ALIAS_TOKEN_PLAN_TAG,
  BADGE_TOKEN_PLAN_TAG,
  DOMAIN_TOKEN_PLAN_TAG,
  DONATOR_PLAN_TAG,
  IMAGE_HOST_PLAN_TAG,
  VERIFIED_PLAN_TAG,
} from "@/lib/payments/plans";

const HomeClient = lazy(() => import("@/app/HomeClient"));
const SignInPage = lazy(() => import("@/app/signin/page"));
const RegisterPage = lazy(() => import("@/app/register/page"));
const ForgotPasswordPage = lazy(() => import("@/app/forgot-password/page"));
const NewPasswordPage = lazy(() => import("@/app/auth/new-password/page"));
const NewVerificationPage = lazy(() => import("@/app/auth/new-verification/page"));
const PricingPage = lazy(() => import("@/app/pricing/page"));
const CheckoutPage = lazy(() => import("@/app/checkout/page"));
const PublicLeaderboardPage = lazy(() => import("@/app/leaderboard/page"));
const ChangelogPage = lazy(() => import("@/app/changelog/page"));
const TermsPage = lazy(() => import("@/app/terms/page"));
const PrivacyPage = lazy(() => import("@/app/privacy/page"));
const CopyrightPage = lazy(() => import("@/app/copyright/page"));
const RefundPage = lazy(() => import("@/app/refund/page"));
const CustomDomainPage = lazy(() => import("@/app/custom-domain/page"));
const TemplatePage = lazy(() => import("@/app/template/[slug]/page"));
const PreviewTemplatePage = lazy(() => import("@/app/preview/[templateId]/page"));
const UnlockPage = lazy(() => import("@/app/unlock/[name]/page"));
const NotFound = lazy(() => import("@/app/not-found"));
const ProfileView = lazy(() => import("@/app/[username]/ProfileView"));
const ProfileShotPage = lazy(() => import("@/app/[username]/shot/page"));

const DashboardLayout = lazy(() => import("@/app/dashboard/layout"));
const DashboardPage = lazy(() => import("@/app/dashboard/page"));
const DashboardLeaderboardPage = lazy(() => import("@/app/dashboard/leaderboard/page"));
const SettingsPage = lazy(() => import("@/app/dashboard/settings/page"));
const ImageHostLayout = lazy(() => import("@/app/dashboard/image-host/layout"));
const ImageHostOverviewPage = lazy(() => import("@/app/dashboard/image-host/overview/page"));
const ImageHostUploadPage = lazy(() => import("@/app/dashboard/image-host/upload/page"));
const ImageHostGalleryPage = lazy(() => import("@/app/dashboard/image-host/gallery/page"));

const LinksPage = lazy(() => import("@/app/dashboard/customize/links/page"));
const MusicPage = lazy(() => import("@/app/dashboard/customize/music/page"));
const CollectionPage = lazy(() => import("@/app/dashboard/customize/collection/page"));
const BadgesPage = lazy(() => import("@/app/dashboard/customize/badges/page"));
const TemplatesPage = lazy(() => import("@/app/dashboard/customize/templates/page"));
const MetadataPage = lazy(() => import("@/app/dashboard/customize/metadata/page"));

const ProfileCustomizeLayout = lazy(() => import("@/app/dashboard/customize/profile/layout"));
const GeneralProfilePage = lazy(() => import("@/app/dashboard/customize/profile/general/page"));
const AppearanceProfilePage = lazy(() => import("@/app/dashboard/customize/profile/appearance/page"));
const ColorsProfilePage = lazy(() => import("@/app/dashboard/customize/profile/colors/page"));
const EffectsProfilePage = lazy(() => import("@/app/dashboard/customize/profile/effects/page"));
const FontsProfilePage = lazy(() => import("@/app/dashboard/customize/profile/fonts/page"));
const LayoutProfilePage = lazy(() => import("@/app/dashboard/customize/profile/layout/page"));
const SectionBuilderPage = lazy(() => import("@/app/dashboard/customize/profile/section-builder/page"));
const WidgetsProfilePage = lazy(() => import("@/app/dashboard/customize/profile/widgets/page"));

const AppleMusicWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/apple-music/page"));
const DiscordPresenceWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/discord-presence/page"));
const DiscordServerWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/discord-server/page"));
const GenshinWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/genshin/page"));
const GitHubRepoWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/github-repo/page"));
const GitHubUserWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/github-user/page"));
const InstagramWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/instagram/page"));
const PinterestBoardWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/pinterest-board/page"));
const PinterestProfileWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/pinterest-profile/page"));
const RobloxWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/roblox/page"));
const SoundcloudWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/soundcloud/page"));
const SpotifyWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/spotify/page"));
const SteamWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/steam/page"));
const TelegramWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/telegram/page"));
const TikTokWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/tiktok/page"));
const TwitchWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/twitch/page"));
const ValorantWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/valorant/page"));
const WeatherWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/weather/page"));
const YouTubeWidgetPage = lazy(() => import("@/app/dashboard/customize/profile/widgets/youtube/page"));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-[#f05e23]/30 border-t-[#f05e23] animate-spin" />
    </div>
  );
}

function DashboardInnerLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#f05e23]/30 border-t-[#f05e23] animate-spin" />
    </div>
  );
}

function renderDashboardRoute(path: string) {
  if (path === "/dashboard" || path === "/dashboard/") {
    return <DashboardPage />;
  }
  if (path === "/dashboard/leaderboard") {
    return <DashboardLeaderboardPage />;
  }
  if (path === "/dashboard/settings") {
    return <SettingsPage />;
  }
  if (path.startsWith("/dashboard/image-host")) {
    let inner: React.ReactNode = <ImageHostOverviewPage />;
    if (path === "/dashboard/image-host/upload") {
      inner = <ImageHostUploadPage />;
    } else if (path === "/dashboard/image-host/gallery") {
      inner = <ImageHostGalleryPage />;
    }
    return (
      <ImageHostLayout>
        <Suspense fallback={<DashboardInnerLoader />}>{inner}</Suspense>
      </ImageHostLayout>
    );
  }
  if (path === "/dashboard/customize/links") {
    return <LinksPage />;
  }
  if (path === "/dashboard/customize/music") {
    return <MusicPage />;
  }
  if (path === "/dashboard/customize/collection") {
    return <CollectionPage />;
  }
  if (path === "/dashboard/customize/badges") {
    return <BadgesPage />;
  }
  if (path === "/dashboard/customize/templates") {
    return <TemplatesPage />;
  }
  if (path === "/dashboard/customize/metadata") {
    return <MetadataPage />;
  }
  if (path.startsWith("/dashboard/customize/profile")) {
    let profileContent: React.ReactNode = <GeneralProfilePage />;
    switch (path) {
      case "/dashboard/customize/profile":
      case "/dashboard/customize/profile/general":
        profileContent = <GeneralProfilePage />;
        break;
      case "/dashboard/customize/profile/appearance":
        profileContent = <AppearanceProfilePage />;
        break;
      case "/dashboard/customize/profile/colors":
        profileContent = <ColorsProfilePage />;
        break;
      case "/dashboard/customize/profile/effects":
        profileContent = <EffectsProfilePage />;
        break;
      case "/dashboard/customize/profile/fonts":
        profileContent = <FontsProfilePage />;
        break;
      case "/dashboard/customize/profile/layout":
        profileContent = <LayoutProfilePage />;
        break;
      case "/dashboard/customize/profile/section-builder":
        profileContent = <SectionBuilderPage />;
        break;
      case "/dashboard/customize/profile/widgets":
        profileContent = <WidgetsProfilePage />;
        break;
      case "/dashboard/customize/profile/widgets/apple-music":
        profileContent = <AppleMusicWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/discord-presence":
        profileContent = <DiscordPresenceWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/discord-server":
        profileContent = <DiscordServerWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/genshin":
        profileContent = <GenshinWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/github-repo":
        profileContent = <GitHubRepoWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/github-user":
        profileContent = <GitHubUserWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/instagram":
        profileContent = <InstagramWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/pinterest-board":
        profileContent = <PinterestBoardWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/pinterest-profile":
        profileContent = <PinterestProfileWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/roblox":
        profileContent = <RobloxWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/soundcloud":
        profileContent = <SoundcloudWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/spotify":
        profileContent = <SpotifyWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/steam":
        profileContent = <SteamWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/telegram":
        profileContent = <TelegramWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/tiktok":
        profileContent = <TikTokWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/twitch":
        profileContent = <TwitchWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/valorant":
        profileContent = <ValorantWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/weather":
        profileContent = <WeatherWidgetPage />;
        break;
      case "/dashboard/customize/profile/widgets/youtube":
        profileContent = <YouTubeWidgetPage />;
        break;
      default:
        profileContent = <GeneralProfilePage />;
        break;
    }
    return (
      <ProfileCustomizeLayout>
        <Suspense fallback={<DashboardInnerLoader />}>{profileContent}</Suspense>
      </ProfileCustomizeLayout>
    );
  }
  return <DashboardPage />;
}

function RouterContent() {
  const [, setVersion] = React.useState(0);
  React.useEffect(() => subscribeStore(() => setVersion((v) => v + 1)), []);

  const rawPathname = usePathname();
  const path = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;
  const { featuredAvatars } = getCurrentSessionDataSync();

  const renderPage = () => {
    if (path === "/") {
      return <HomeClient featuredAvatars={featuredAvatars} />;
    }
    if (path === "/signin") return <SignInPage />;
    if (path === "/register") return <RegisterPage />;
    if (path === "/forgot-password") return <ForgotPasswordPage />;
    if (path === "/auth/new-password" || path === "/new-password") return <NewPasswordPage />;
    if (path === "/auth/new-verification" || path === "/new-verification") return <NewVerificationPage />;
    if (path === "/pricing") return <PricingPage />;

    if (path === "/checkout") return <CheckoutPage />;
    if (path === "/checkout/alias-token") return <CheckoutPage product={ALIAS_TOKEN_PLAN_TAG} />;
    if (path === "/checkout/badge-token") return <CheckoutPage product={BADGE_TOKEN_PLAN_TAG} />;
    if (path === "/checkout/domain-token") return <CheckoutPage product={DOMAIN_TOKEN_PLAN_TAG} />;
    if (path === "/checkout/donator") return <CheckoutPage product={DONATOR_PLAN_TAG} />;
    if (path === "/checkout/image-host") return <CheckoutPage product={IMAGE_HOST_PLAN_TAG} />;
    if (path === "/checkout/verified") return <CheckoutPage product={VERIFIED_PLAN_TAG} />;

    if (path === "/leaderboard") return <PublicLeaderboardPage />;
    if (path === "/changelog") return <ChangelogPage />;
    if (path === "/terms") return <TermsPage />;
    if (path === "/privacy") return <PrivacyPage />;
    if (path === "/copyright") return <CopyrightPage />;
    if (path === "/refund") return <RefundPage />;
    if (path === "/custom-domain") return <CustomDomainPage />;

    if (path.startsWith("/template/")) {
      const slug = decodeURIComponent(path.slice("/template/".length));
      return <TemplatePage slug={slug} />;
    }
    if (path.startsWith("/preview/")) {
      const templateId = decodeURIComponent(path.slice("/preview/".length));
      return <PreviewTemplatePage templateId={templateId} />;
    }
    if (path.startsWith("/unlock/")) {
      const name = decodeURIComponent(path.slice("/unlock/".length));
      return <UnlockPage name={name} />;
    }

    if (path.startsWith("/dashboard")) {
      return (
        <DashboardLayout>
          <Suspense fallback={<DashboardInnerLoader />}>{renderDashboardRoute(path)}</Suspense>
        </DashboardLayout>
      );
    }

    const shotMatch = path.match(/^\/@?([^/]+)\/shot$/);
    if (shotMatch) {
      return <ProfileShotPage username={decodeURIComponent(shotMatch[1])} />;
    }

    const profileMatch = path.match(/^\/@?([^/]+)$/);
    if (profileMatch) {
      return <ProfileView username={decodeURIComponent(profileMatch[1])} />;
    }

    return <NotFound />;
  };

  return <Suspense fallback={<RouteLoader />}>{renderPage()}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <div className="min-h-screen flex flex-col relative text-white selection:bg-white/20 selection:text-white antialiased">
          <ConditionalBackground />
          <RouterContent />
          <Toaster />
        </div>
      </NavigationProvider>
    </AuthProvider>
  );
}
