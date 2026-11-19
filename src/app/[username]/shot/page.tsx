import ProfileView from "../ProfileView";

export default function ProfileShotPage({ username }: { username: string }) {
  return <ProfileView username={username} isScreenshot />;
}
