/**
 * La marque, servie depuis les fichiers fournis par le studio.
 *
 * Pas de next/image : l'optimiseur d'images ne tourne pas sur Cloudflare
 * Workers, et ces fichiers sont déjà dimensionnés à l'usage.
 *
 * Les originaux livrés étaient sur fond noir opaque. Ils ont été détourés une
 * fois pour toutes vers public/ ; les sources restent dans design/, hors du
 * dossier servi, pour ne pas alourdir chaque déploiement.
 */

/** L'icône carrée, fond acide. */
export function MarkTile({
  className,
  size = 44,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon-192.png"
      alt="Amplifan"
      width={size}
      height={size}
      className={`shrink-0 rounded-[24%] ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Le lockup complet : la marque et le nom. */
export function Wordmark({
  size = 22,
  className,
}: {
  /** Hauteur en pixels. La largeur suit le rapport du fichier. */
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-wordmark.png"
      alt="Amplifan"
      className={className}
      style={{ height: size, width: "auto" }}
    />
  );
}
