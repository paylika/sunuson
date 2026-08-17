/**
 * Règles d'image, partagées entre le serveur (validation) et le navigateur
 * (contrôle avant envoi). Ce fichier ne doit donc rien importer de serveur.
 */

export const COVERS_BUCKET = "covers";

/**
 * Normes des plateformes de streaming pour une pochette. Elles sont
 * volontairement strictes : une pochette refusée par Spotify ou Apple, c'est
 * une sortie repoussée d'une semaine.
 */
export const COVER_RULES = {
  /** Les distributeurs refusent en dessous. */
  minSize: 1400,
  /** Ce que demandent Apple Music et les kits presse. */
  idealSize: 3000,
  maxBytes: 10 * 1024 * 1024,
  types: ["image/jpeg", "image/png"],
  /** Tolérance sur le carré : 1 % d'écart passe, au-delà c'est un rectangle. */
  squareTolerance: 0.01,
} as const;

export const PHOTO_RULES = {
  minSize: 400,
  maxBytes: 8 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type ImageCheck = { ok: true } | { ok: false; error: string };

/** Contrôles réalisables sans décoder l'image — donc utilisables côté serveur. */
export function checkImageFile(
  file: { type: string; size: number },
  rules: { types: readonly string[]; maxBytes: number },
): ImageCheck {
  if (!rules.types.includes(file.type)) {
    return {
      ok: false,
      error: `Format non accepté. Utilise ${rules.types
        .map((t) => t.replace("image/", "").toUpperCase())
        .join(" ou ")}.`,
    };
  }
  if (file.size > rules.maxBytes) {
    return {
      ok: false,
      error: `Fichier trop lourd (${Math.round(file.size / 1024 / 1024)} Mo). Maximum ${Math.round(rules.maxBytes / 1024 / 1024)} Mo.`,
    };
  }
  return { ok: true };
}

/**
 * Vérifie les dimensions. Ne fonctionne que dans le navigateur : c'est là
 * qu'on veut le retour, avant de faire monter 10 Mo pour rien.
 */
export function checkCoverDimensions(
  file: File,
): Promise<ImageCheck & { width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const ratio = width / height;

      if (Math.abs(ratio - 1) > COVER_RULES.squareTolerance) {
        resolve({
          ok: false,
          error: `La pochette doit être carrée. La tienne fait ${width}×${height}.`,
          width,
          height,
        });
        return;
      }
      if (width < COVER_RULES.minSize) {
        resolve({
          ok: false,
          error: `Trop petite : ${width}×${height}. Minimum ${COVER_RULES.minSize}×${COVER_RULES.minSize}, idéal ${COVER_RULES.idealSize}×${COVER_RULES.idealSize}.`,
          width,
          height,
        });
        return;
      }
      resolve({ ok: true, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Image illisible." });
    };

    img.src = url;
  });
}

/** Extension déduite du type MIME, jamais du nom de fichier (peu fiable). */
export function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
