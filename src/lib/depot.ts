"use client";

import { signerDepot } from "./actions";

export type Depose =
  | { ok: true; key: string }
  | { ok: false; error: string };

/**
 * Envoie un fichier du téléphone directement au stockage.
 *
 * Il ne passe PAS par le serveur, et ce n'est pas une optimisation : une
 * Server Action de Next.js est plafonnée à 1 Mo, quand un MP3 de quatre
 * minutes en pèse quatre. Le serveur ne délivre qu'une autorisation d'écriture
 * sur un chemin qu'il a choisi, après avoir vérifié à qui appartient la page.
 *
 * Effet de bord heureux : sur un projet de dix morceaux, les quarante
 * mégaoctets ne traversent jamais le Worker, donc ni sa mémoire ni sa
 * facture.
 */
export async function deposer(
  artistId: string,
  kind: "audio" | "cover",
  file: File,
): Promise<Depose> {
  const autorisation = await signerDepot({
    artistId,
    kind,
    mime: file.type || (kind === "audio" ? "audio/mpeg" : "image/jpeg"),
  });

  if (!autorisation.ok) return autorisation;

  try {
    const res = await fetch(autorisation.url, {
      method: "PUT",
      headers: {
        "content-type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status === 413
            ? "Fichier trop lourd pour le stockage."
            : `Envoi refusé (${res.status}). Vérifie ta connexion.`,
      };
    }
  } catch {
    // Coupure réseau en plein envoi : fréquent en 3G, et il faut le dire
    // franchement plutôt que de laisser le bouton tourner dans le vide.
    return { ok: false, error: "Envoi interrompu. Réessaie." };
  }

  return { ok: true, key: autorisation.key };
}
