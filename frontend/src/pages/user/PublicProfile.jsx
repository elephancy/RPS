import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../api";
import { BadgeCheck } from "lucide-react";
import { EmptyState, LoadingState, PageFrame, PageHero, SectionHeader, StatCard } from "../../components/ui/page";
import ItemMark from "../../components/ItemMark";

export default function PublicProfile() {
  const { username } = useParams();
  const [user,   setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function fetchPublicProfile() {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/user/public/${username}`
        );

        const formattedItems = (data.inventory || []).map(({ item, quantity }) => ({
          _id:      item?._id ?? "unknown",
          name:     item?.name ?? "Unknown Item",
          image:    item?.image
                      ? item.image.startsWith("http")
                        ? item.image
                        : `${API_BASE}${item.image}`
                      : null,
          emoji:    item?.emoji ?? "◆",
          quantity: quantity ?? 1,
        }));

        setUser({
          ...data,
          items: formattedItems,
          profileImage: data.profileImage
            ? data.profileImage.startsWith("http")
              ? data.profileImage
              : `${API_BASE}${data.profileImage}`
            : "/assets/avatars/default-avatar.ico",
        });
      } catch (err) {
        console.error(err);
        setError("User not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchPublicProfile();
  }, [username]);

  if (loading) return <LoadingState label="Loading profile" />;
  if (error || !user) return <PageFrame><EmptyState title="Profile unavailable" description={error || "No user."} /></PageFrame>;

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_4%,rgba(250,204,21,0.12),transparent_32%),linear-gradient(180deg,#020617_0%,#09090b_55%,#020202_100%)]">
      <div className="mx-auto max-w-5xl">
        <PageHero
          title={`@${user.username}`}
          description="Public player profile, unlocked rewards, badges, and inventory."
          actions={(
            <>
              <img
                src={user.profileImage}
                alt={`${user.username}'s profile`}
                className="h-20 w-20 rounded-3xl border border-white/15 object-cover shadow-2xl"
              />
              <StatCard label="Balance" value={`${Number(user.balance || 0).toLocaleString()} coins`} tone="text-emerald-100" />
              <StatCard label="Achievements" value={user.achievements?.length || 0} tone="text-cyan-100" />
            </>
          )}
        />

        <div className="space-y-10">
        <section>
          <SectionHeader title="Achievements" description="Claimed milestones and reward badges." />
          {user.achievements?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.achievements.map((ach, i) => (
                <div
                  key={`${ach._id}-${i}`}
                  className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 text-center shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-200/25"
                >
                  {ach.icon && (ach.icon.startsWith("http") || ach.icon.startsWith("/")) ? (
                    <img
                      src={ach.icon.startsWith("http") ? ach.icon : `${API_BASE}${ach.icon}`}
                      alt={ach.title}
                      className="w-12 h-12 mx-auto mb-2 object-cover"
                    />
                  ) : (
                    <ItemMark name={ach.title || ach.name || 'Achievement'} className="mx-auto mb-2 h-12 w-12 text-sm" />
                  )}
                  <div className="font-semibold">{ach.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No achievements yet" description="This profile has not claimed an achievement." />
          )}
        </section>
        <section>
          <SectionHeader title="Badges" description="Visible profile badges and special recognitions." />
          {user.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {user.badges.map(badge => (
                <div
                  key={badge._id}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-4 transition hover:-translate-y-1 hover:border-amber-200/30"
                >
                  <BadgeCheck className="mb-3 h-7 w-7 text-amber-100" />
                  <div className="font-medium">{badge.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No badges yet" description="Badges will appear here once earned." />
          )}
        </section>
        <section>
          <SectionHeader title="Inventory" description="Publicly visible items and quantities." />
          {user.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {user.items.map((item, i) => (
                <div
                  key={`${item._id}-${i}`}
                  className="relative rounded-[24px] border border-white/10 bg-white/[0.05] p-4 text-center shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <ItemMark name={item.name} className="mx-auto mb-2 h-12 w-12 text-sm" />
                  )}
                  <div className="font-semibold">{item.name}</div>
                  {item.quantity > 1 && (
                    <div className="absolute right-3 top-3 rounded-full border border-cyan-200/20 bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-50">
                      ×{item.quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No public inventory" description="No visible items are attached to this profile." />
          )}
        </section>
        </div>
      </div>
    </PageFrame>
  );
}
