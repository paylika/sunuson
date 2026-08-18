/**
 * Règles d'image, partagées entre le serveur (validation) et le navigateur
 * (contrôle avant envoi). Ce fichier ne doit donc rien importer de serveur.
 */

export const COVERS_BUCKET = "covers";
export const AUDIO_BUCKET = "audio";

/**
 * Règles du fichier audio.
 *
 * Large sur les formats : un téléphone Android donne du MP3, un iPhone du M4A,
 * et un débutant n'a aucune raison de savoir convertir. Ferme sur le poids, en
 * revanche — c'est le fan qui paiera la data à l'écoute, et 4 Mo de plus par
 * son, ce sont des écoutes en moins au Sénégal.
 */
export const AUDIO_RULES = {
  maxBytes: 25 * 1024 * 1024,
  types: [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/opus",
    "audio/webm",
    "audio/flac",
  ],
} as const;

/** Extension déduite du type MIME du fichier audio. */
export function audioExtensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg") || mime.includes("opus")) return "ogg";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("aac")) return "aac";
  return "mp3";
}

/**
 * Durée du morceau, lue dans le navigateur. Le serveur ne décode pas l'audio :
 * il faudrait une bibliothèque entière pour une information que le lecteur du
 * téléphone donne gratuitement en une seconde.
 */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("audio");

    const fini = (v: number) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };

    el.preload = "metadata";
    el.onloadedmetadata = () =>
      fini(Number.isFinite(el.duration) ? Math.round(el.duration) : 0);
    // Durée inconnue : 0, et la fiche se crée quand même. Un morceau sans
    // durée affichée reste écoutable, c'est ce qui compte.
    el.onerror = () => fini(0);
    el.src = url;
  });
}

/**
 * Repères de pochette — des repères, plus des barrières.
 *
 * La version précédente refusait toute image non carrée et tout ce qui
 * descendait sous 1400 px. C'était juste pour un artiste distribué, et absurde
 * pour un débutant : il photographie sa pochette au téléphone, elle sort en
 * 4:3, et l'application lui répond non. Il abandonne, et on perd exactement
 * celui qu'on voulait servir.
 *
 * On recadre donc nous-mêmes, et on ne prévient que si la définition est trop
 * basse pour une distribution ailleurs — une information, pas un refus.
 */
export const COVER_RULES = {
  /** En dessous, les distributeurs refusent. On le dit sans bloquer. */
  minSize: 1400,
  /** Ce que demandent Apple Music et les kits presse. */
  idealSize: 3000,
  /** Au-delà, on rééchantillonne : personne n'a besoin de 6000 px. */
  maxSize: 3000,
  maxBytes: 15 * 1024 * 1024,
  /** Tout ce qu'un navigateur sait décoder : on réencode en JPEG ensuite. */
  types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
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

export type CoverPrete = {
  ok: true;
  /** L'image recadrée en carré, prête à envoyer. */
  file: File;
  taille: number;
  /** Ce qui a été fait à l'image, à montrer à l'artiste. */
  note: string;
  /** Trop petite pour une distribution ailleurs. Informe, ne bloque pas. */
  faible: boolean;
};

/**
 * Recadre une image en carré, au centre, sans jamais la refuser.
 *
 * Ne fonctionne que dans le navigateur — c'est voulu : le travail se fait sur
 * le téléphone de l'artiste, et ce qui part sur le réseau est déjà le carré
 * final. Une photo de 8 Mo en 4:3 arrive en moins de 500 Ko.
 *
 * Le centre plutôt qu'un cadrage intelligent : sur une pochette, le sujet est
 * au milieu dans l'immense majorité des cas, et un recadrage automatique qui
 * se trompe est bien pire qu'un recadrage prévisible.
 */
export async function prepareCover(
  file: File,
): Promise<CoverPrete | { ok: false; error: string }> {
  try {
    const source = await createImageBitmap(file);
    const { width, height } = source;

    // Le côté du carré : le plus petit côté de la source, plafonné.
    const cote = Math.min(width, height, COVER_RULES.maxSize);
    const decoupe = Math.min(width, height);

    const canvas = document.createElement("canvas");
    canvas.width = cote;
    canvas.height = cote;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "Recadrage impossible sur cet appareil." };

    ctx.drawImage(
      source,
      (width - decoupe) / 2,
      (height - decoupe) / 2,
      decoupe,
      decoupe,
      0,
      0,
      cote,
      cote,
    );
    source.close();

    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.9),
    );
    if (!blob) return { ok: false, error: "Recadrage impossible sur cet appareil." };

    const carre = Math.abs(width / height - 1) < 0.01;
    const faible = cote < COVER_RULES.minSize;

    return {
      ok: true,
      file: new File([blob], "pochette.jpg", { type: "image/jpeg" }),
      taille: cote,
      note: carre
        ? `${cote}×${cote}`
        : `Recadrée au centre : ${width}×${height} → ${cote}×${cote}`,
      faible,
    };
  } catch {
    return { ok: false, error: "Image illisible. Essaie un autre fichier." };
  }
}

/** Extension déduite du type MIME, jamais du nom de fichier (peu fiable). */
export function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
