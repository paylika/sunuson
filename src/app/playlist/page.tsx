import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { PlaylistView } from "@/components/playlist-view";
import { Shell } from "@/components/shell";

export const metadata: Metadata = { title: `Ma playlist — ${APP_NAME}` };

/**
 * La liste vit dans le navigateur du fan : la page est donc entièrement
 * cliente, et va chercher les morceaux une fois les identifiants lus.
 */
export default function PlaylistPage() {
  return (
    <Shell>
      <PlaylistView />
    </Shell>
  );
}
