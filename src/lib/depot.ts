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
  /** Fraction envoyée, de 0 à 1. Appelée plusieurs fois par fichier. */
  onProgres?: (fraction: number) => void,
): Promise<Depose> {
  const autorisation = await signerDepot({
    artistId,
    kind,
    mime: file.type || (kind === "audio" ? "audio/mpeg" : "image/jpeg"),
  });

  if (!autorisation.ok) return autorisation;

  // XMLHttpRequest et non fetch : lui seul rapporte l'avancement octet par
  // octet. Sur une connexion mobile, un envoi de 5 Mo dure assez longtemps
  // pour qu'une barre figée passe pour une panne.
  const statut = await new Promise<{ ok: boolean; code: number }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", autorisation.url, true);
    xhr.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgres) onProgres(e.loaded / e.total);
    };

    xhr.onload = () => {
      if (onProgres) onProgres(1);
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, code: xhr.status });
    };
    xhr.onerror = () => resolve({ ok: false, code: 0 });
    xhr.onabort = () => resolve({ ok: false, code: 0 });

    xhr.send(file);
  });

  if (!statut.ok) {
    return {
      ok: false,
      error:
        statut.code === 0
          ? // Coupure réseau en plein envoi : fréquent en 3G, et il faut le
            // dire franchement plutôt que de laisser tourner dans le vide.
            "Envoi interrompu. Vérifie ta connexion."
          : statut.code === 413
            ? "Fichier trop lourd pour le stockage."
            : `Envoi refusé (${statut.code}).`,
    };
  }

  return { ok: true, key: autorisation.key };
}
