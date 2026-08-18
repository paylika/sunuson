import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { currentUser } from "@/lib/auth";
import {
  getArtistByUser,
  getBalance,
  getPayoutSettings,
  imageUrl,
} from "@/lib/queries";
import { ParametresView } from "@/components/parametres-view";
import { Shell } from "@/components/shell";

export const metadata: Metadata = { title: `Paramètres — ${APP_NAME}` };

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const user = await currentUser();

  // Rien à régler sans compte : écouter et soutenir ne demandent pas de
  // paramètres, et un écran vide donnerait l'impression du contraire.
  if (!user) redirect("/connexion");

  const artist = await getArtistByUser(user.id);
  const [payout, balance] = artist
    ? await Promise.all([
        getPayoutSettings(artist.id, user.id),
        getBalance(artist.id),
      ])
    : [null, null];

  return (
    <Shell>
      <ParametresView
        email={user.email ?? ""}
        artist={artist}
        payout={payout}
        balance={balance}
        avatarUrl={imageUrl(
          (user.user_metadata as { avatar_key?: string } | null)?.avatar_key,
        )}
        nom={
          (user.user_metadata as { display_name?: string } | null)?.display_name
        }
      />
    </Shell>
  );
}
