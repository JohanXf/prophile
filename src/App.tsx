import React from "react";
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

import HomeClient from "@/app/HomeClient";
import SignInPage from "@/app/signin/page";
import RegisterPage from "@/app/register/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import NewPasswordPage from "@/app/auth/new-password/page";
import NewVerificationPage from "@/app/auth/new-verification/page";
import PricingPage from "@/app/pricing/page";
import CheckoutPage from "@/app/checkout/page";
import PublicLeaderboardPage from "@/app/leaderboard/page";
import ChangelogPage from "@/app/changelog/page";
import TermsPage from "@/app/terms/page";
import PrivacyPage from "@/app/privacy/page";
import CopyrightPage from "@/app/copyright/page";
import RefundPage from "@/app/refund/page";
import CustomDomainPage from "@/app/custom-domain/page";
import TemplatePage from "@/app/template/[slug]/page";
import PreviewTemplatePage from "@/app/preview/[templateId]/page";
import UnlockPage from "@/app/unlock/[name]/page";
import NotFound from "@/app/not-found";
import ProfileView from "@/app/[username]/ProfileView";
import ProfileShotPage from "@/app/[username]/shot/page";

import DashboardLayout from "@/app/dashboard/layout";
import DashboardPage from "@/app/dashboard/page";
import DashboardLeaderboardPage from "@/app/dashboard/leaderboard/page";
import SettingsPage from "@/app/dashboard/settings/page";
import ImageHostLayout from "@/app/dashboard/image-host/layout";
import ImageHostOverviewPage from "@/app/dashboard/image-host/overview/page";
import ImageHostUploadPage from "@/app/dashboard/image-host/upload/page";
import ImageHostGalleryPage from "@/app/dashboard/image-host/gallery/page";

import LinksPage from "@/app/dashboard/customize/links/page";
import MusicPage from "@/app/dashboard/customize/music/page";
import CollectionPage from "@/app/dashboard/customize/collection/page";
import BadgesPage from "@/app/dashboard/customize/badges/page";
import TemplatesPage from "@/app/dashboard/customize/templates/page";
import MetadataPage from "@/app/dashboard/customize/metadata/page";

import ProfileCustomizeLayout from "@/app/dashboard/customize/profile/layout";
import GeneralProfilePage from "@/app/dashboard/customize/profile/general/page";
import AppearanceProfilePage from "@/app/dashboard/customize/profile/appearance/page";
import ColorsProfilePage from "@/app/dashboard/customize/profile/colors/page";
import EffectsProfilePage from "@/app/dashboard/customize/profile/effects/page";
import FontsProfilePage from "@/app/dashboard/customize/profile/fonts/page";
import LayoutProfilePage from "@/app/dashboard/customize/profile/layout/page";
import SectionBuilderPage from "@/app/dashboard/customize/profile/section-builder/page";
import WidgetsProfilePage from "@/app/dashboard/customize/profile/widgets/page";

import AppleMusicWidgetPage from "@/app/dashboard/customize/profile/widgets/apple-music/page";
import DiscordPresenceWidgetPage from "@/app/dashboard/customize/profile/widgets/discord-presence/page";
import DiscordServerWidgetPage from "@/app/dashboard/customize/profile/widgets/discord-server/page";
import GenshinWidgetPage from "@/app/dashboard/customize/profile/widgets/genshin/page";
import GitHubRepoWidgetPage from "@/app/dashboard/customize/profile/widgets/github-repo/page";
import GitHubUserWidgetPage from "@/app/dashboard/customize/profile/widgets/github-user/page";
import InstagramWidgetPage from "@/app/dashboard/customize/profile/widgets/instagram/page";
import PinterestBoardWidgetPage from "@/app/dashboard/customize/profile/widgets/pinterest-board/page";
import PinterestProfileWidgetPage from "@/app/dashboard/customize/profile/widgets/pinterest-profile/page";
import RobloxWidgetPage from "@/app/dashboard/customize/profile/widgets/roblox/page";
import SoundcloudWidgetPage from "@/app/dashboard/customize/profile/widgets/soundcloud/page";
import SpotifyWidgetPage from "@/app/dashboard/customize/profile/widgets/spotify/page";
import SteamWidgetPage from "@/app/dashboard/customize/profile/widgets/steam/page";
import TelegramWidgetPage from "@/app/dashboard/customize/profile/widgets/telegram/page";
import TikTokWidgetPage from "@/app/dashboard/customize/profile/widgets/tiktok/page";
import TwitchWidgetPage from "@/app/dashboard/customize/profile/widgets/twitch/page";
import ValorantWidgetPage from "@/app/dashboard/customize/profile/widgets/valorant/page";
import WeatherWidgetPage from "@/app/dashboard/customize/profile/widgets/weather/page";
import YouTubeWidgetPage from "@/app/dashboard/customize/profile/widgets/youtube/page";

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
    return <ImageHostLayout>{inner}</ImageHostLayout>;
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
    return <ProfileCustomizeLayout>{profileContent}</ProfileCustomizeLayout>;
  }
  return <DashboardPage />;
}

function RouterContent() {
  const [, setVersion] = React.useState(0);
  React.useEffect(() => subscribeStore(() => setVersion((v) => v + 1)), []);

  const rawPathname = usePathname();
  const path = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;
  const { featuredAvatars } = getCurrentSessionDataSync();

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
    return <DashboardLayout>{renderDashboardRoute(path)}</DashboardLayout>;
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
