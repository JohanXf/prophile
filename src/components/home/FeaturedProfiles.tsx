import Image from "next/image";
import Link from "next/link";

export const FEATURED_USERNAMES = ["faizen"];

export type FeaturedAvatars = Record<string, string | null>;

function ProfileChip({ username, avatar, tabIndex }: { username: string; avatar: string | null; tabIndex?: number }) {
  return (
    <Link
      href={`/${username}`}
      tabIndex={tabIndex}
      className="flex items-center gap-3 text-white/85 hover:text-white transition-colors"
      style={{ fontFamily: "var(--font-comfortaa)" }}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={username}
          width={32}
          height={32}
          unoptimized
          draggable={false}
          className="h-8 w-8 rounded-full object-cover bg-white/5 ring-1 ring-white/10"
        />
      ) : (
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f05e23]/15 border border-[#f05e23]/30 text-[13px] uppercase text-[#f47b47]">
          {username[0]}
        </span>
      )}
      <span className="text-[14px] font-medium">/{username}</span>
    </Link>
  );
}

export default function FeaturedProfiles({ avatars }: { avatars: FeaturedAvatars }) {
  const realUsernames = Object.keys(avatars);
  const usernames = realUsernames.length > 0 ? realUsernames : FEATURED_USERNAMES;

  if (usernames.length <= 4) {
    return (
      <section aria-label="Featured profiles" className="relative z-10 w-full pt-4 pb-14 sm:pb-20">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-center gap-8">
          {usernames.map((username) => (
            <ProfileChip key={username} username={username} avatar={avatars[username] ?? null} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Featured profiles"
      className="relative z-10 w-full overflow-hidden pt-4 pb-14 sm:pb-20"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="featured-marquee flex w-max">
        {[false, true].map((copy) => (
          <ul key={copy ? "copy" : "main"} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={copy || undefined}>
            {usernames.map((username) => (
              <li key={username}>
                <ProfileChip username={username} avatar={avatars[username] ?? null} tabIndex={copy ? -1 : undefined} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
