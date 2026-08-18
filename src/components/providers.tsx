"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { compterEcoute } from "@/lib/actions";
import { APP_NAME as APP } from "@/lib/config";
import type { Artist, Track } from "@/lib/types";

/* ============================================================== lecteur */

export type QueueItem = { track: Track; artist: Artist };

type PlayerState = {
  track: Track | null;
  artist: Artist | null;
  playing: boolean;
  /** Position de lecture en secondes. */
  position: number;
  /** Lance un morceau seul. Aucun enchaînement ensuite. */
  toggle: (track: Track, artist: Artist) => void;
  /** Lance une file : c'est elle qui débloque suivant et précédent. */
  playQueue: (items: QueueItem[], startIndex: number) => void;
  /** Vrai seulement quand il y a de quoi enchaîner. */
  hasQueue: boolean;
  /** La file en cours, pour montrer ce qui vient après. */
  queue: QueueItem[];
  /** Rang du morceau en cours dans la file. */
  index: number;
  /** Saute à un rang de la file, sans la reconstruire. */
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  repeat: boolean;
  toggleRepeat: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  stop: () => void;
  /** Écran de lecture plein écran ouvert ou non. */
  expanded: boolean;
  expand: () => void;
  collapse: () => void;
};

const PlayerCtx = createContext<PlayerState | null>(null);

function PlayerProvider({ children }: { children: ReactNode }) {
  // Tout passe par une file, même un morceau seul : ça évite deux chemins
  // de lecture à maintenir. Une file d'un élément n'affiche simplement pas
  // les boutons d'enchaînement.
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Un morceau ne se compte qu'une fois par session : sans ça, une boucle
  // activée toute la soirée gonflerait le compteur d'un artiste.
  const comptes = useRef<Set<string>>(new Set());

  const current = queue[index] ?? null;
  const track = current?.track ?? null;
  const artistCourant = current?.artist ?? null;
  const hasQueue = queue.length > 1;

  const advance = useCallback(() => {
    setPosition(0);
    setIndex((i) => {
      if (repeat) return i;
      if (i + 1 < queue.length) return i + 1;
      // Fin de file sans répétition : on s'arrête plutôt que de reboucler.
      setPlaying(false);
      return i;
    });
  }, [repeat, queue.length]);

  /**
   * Deux modes : si le morceau a un fichier, on pilote un <audio> réel ;
   * sinon on simule la progression pour que la démo reste crédible sans
   * héberger de son. Dès que les URLs arrivent, la branche « réel » prend le
   * relais toute seule.
   */
  useEffect(() => {
    if (!playing || !track || track.audioUrl) return;

    const id = window.setInterval(() => {
      setPosition((p) => {
        if (p + 0.25 >= track.duration) {
          advance();
          return 0;
        }
        return p + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, track, advance]);

  /**
   * Charge le fichier du morceau courant, ou vide le lecteur.
   *
   * C'est ce vidage qui manquait : quand on passait sur un morceau SANS
   * fichier — les sons de démonstration, par exemple — React retirait
   * simplement l'attribut `src`, et l'élément continuait de jouer le
   * précédent. Le fan entendait un morceau tout en en regardant un autre.
   *
   * Changer `src` ne suffit pas non plus : sans `load()`, le navigateur
   * continue de lire le flux déjà en mémoire.
   */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const url = track?.audioUrl;

    if (!url) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      return;
    }

    // Comparaison sur l'adresse résolue : `src` peut être relatif, pas
    // `currentSrc`. Sans ce test, un simple pause/reprise rechargerait le
    // fichier et ferait repartir la lecture à zéro.
    const absolue = new URL(url, window.location.href).href;
    if (el.currentSrc !== absolue) {
      el.src = url;
      el.load();
    }
  }, [track?.audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track?.audioUrl) return;
    if (playing) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, track]);

  /**
   * Trente secondes d'écoute valent une écoute, comme sur les grandes
   * plateformes. En dessous, c'est un survol.
   */
  useEffect(() => {
    if (!playing || !track || position < 30) return;
    if (comptes.current.has(track.id)) return;

    comptes.current.add(track.id);
    void compterEcoute(track.id).catch(() => {
      // Un compteur raté ne doit rien interrompre : on ne réessaie pas non
      // plus, l'écoute est déjà marquée comme comptée.
    });
  }, [playing, track, position]);

  const toggle = useCallback(
    (next: Track, artist: Artist) => {
      if (current?.track.id === next.id) {
        setPlaying((p) => !p);
        return;
      }
      setQueue([{ track: next, artist }]);
      setIndex(0);
      setPosition(0);
      setPlaying(true);
    },
    [current],
  );

  const playQueue = useCallback(
    (items: QueueItem[], startIndex: number) => {
      const item = items[startIndex];
      if (!item) return;

      // Le morceau en cours ne redémarre JAMAIS.
      //
      // On écoute un son trouvé dans Découvrir, on passe dans Playlist où il
      // figure aussi, on appuie dessus : avant, une nouvelle file était créée
      // et la lecture repartait à zéro. On change donc la file et la position
      // dans cette file — ce qui débloque suivant et précédent — sans toucher
      // à la lecture elle-même.
      const memeMorceau = current?.track.id === item.track.id;
      // Même morceau ET même contexte : le bouton reste un pause/reprise
      // ordinaire, comme dans n'importe quel lecteur.
      const memeFile = queue.length === items.length;

      if (memeMorceau && memeFile) {
        setPlaying((p) => !p);
        return;
      }

      setQueue(items);
      setIndex(startIndex);

      if (memeMorceau) {
        // Contexte différent, même son : on adopte la nouvelle file — c'est
        // elle qui donne suivant et précédent — sans toucher à la lecture.
        setPlaying(true);
        return;
      }

      setPosition(0);
      setPlaying(true);
    },
    [current, queue.length],
  );

  const next = useCallback(() => {
    setPosition(0);
    setIndex((i) => (i + 1 < queue.length ? i + 1 : 0));
    setPlaying(true);
  }, [queue.length]);

  const previous = useCallback(() => {
    // Réflexe attendu de tous les lecteurs : au-delà de trois secondes, le
    // bouton précédent revient au début du morceau avant de changer de piste.
    if (position > 3) {
      setPosition(0);
      const el = audioRef.current;
      if (el) el.currentTime = 0;
      return;
    }
    setPosition(0);
    setIndex((i) => (i > 0 ? i - 1 : Math.max(0, queue.length - 1)));
    setPlaying(true);
  }, [position, queue.length]);

  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= queue.length) return;
      // Sauter sur le morceau déjà en cours ne le redémarre pas : c'est la
      // même règle que partout ailleurs, on ne coupe jamais une écoute.
      if (i === index) {
        setPlaying(true);
        return;
      }
      setIndex(i);
      setPosition(0);
      setPlaying(true);
    },
    [queue.length, index],
  );

  /**
   * Le clavier, sur ordinateur.
   *
   * Un lecteur de musique sur le web où la barre d'espace ne fait rien
   * trahit une application mobile posée sur un grand écran. Ces raccourcis
   * sont ceux de tout le monde — espace, flèches — donc personne n'a à les
   * apprendre.
   *
   * On ne les capte jamais pendant une saisie : sinon écrire « J'espère »
   * dans un message de soutien mettrait la musique en pause à chaque mot.
   */
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      const saisie =
        cible?.tagName === "INPUT" ||
        cible?.tagName === "TEXTAREA" ||
        cible?.tagName === "SELECT" ||
        cible?.isContentEditable;

      if (saisie || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!current) return;

      const el = audioRef.current;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "ArrowRight":
          e.preventDefault();
          // Maj + flèche change de morceau, la flèche seule avance dans
          // celui-ci : c'est la convention des lecteurs vidéo.
          if (e.shiftKey) next();
          else if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) previous();
          else if (el) el.currentTime = Math.max(0, el.currentTime - 10);
          break;
        case "Escape":
          setExpanded(false);
          break;
        default:
          return;
      }
    }

    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [current, next, previous]);

  /**
   * Écran verrouillé, casque, voiture : les commandes du système.
   *
   * C'est ce qui sépare un lecteur de navigateur d'une vraie application de
   * musique. Sans ça, le fan qui range son téléphone dans sa poche ne voit
   * plus ni le titre ni la pochette, et ne peut pas mettre en pause sans
   * rallumer l'écran et retrouver l'onglet.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    if (!track || !artistCourant) {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistCourant.name,
      album: track.releaseTitle ?? APP,
      artwork: track.coverUrl
        ? [{ src: track.coverUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });

    navigator.mediaSession.playbackState = playing ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
    // Les deux suivantes ne sont posées que dans une file : proposer
    // « suivant » sur un morceau isolé afficherait un bouton mort.
    navigator.mediaSession.setActionHandler(
      "previoustrack",
      queue.length > 1 ? previous : null,
    );
    navigator.mediaSession.setActionHandler(
      "nexttrack",
      queue.length > 1 ? next : null,
    );
  }, [track, artistCourant, playing, queue.length, next, previous]);

  const seek = useCallback((seconds: number) => {
    setPosition(seconds);
    const el = audioRef.current;
    if (el) el.currentTime = seconds;
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      track,
      artist: current?.artist ?? null,
      playing,
      position,
      toggle,
      playQueue,
      hasQueue,
      next,
      previous,
      queue,
      index,
      goTo,
      repeat,
      toggleRepeat: () => setRepeat((r) => !r),
      seek,
      pause: () => setPlaying(false),
      resume: () => setPlaying(true),
      stop: () => {
        setPlaying(false);
        setQueue([]);
        setIndex(0);
        setPosition(0);
        setExpanded(false);
      },
      expanded,
      // Rien à agrandir tant qu'aucun morceau n'est chargé.
      expand: () => setExpanded(current !== null),
      collapse: () => setExpanded(false),
    }),
    [
      track,
      current,
      playing,
      position,
      toggle,
      playQueue,
      hasQueue,
      next,
      previous,
      queue,
      index,
      goTo,
      repeat,
      seek,
      expanded,
    ],
  );

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        // La répétition est confiée au navigateur plutôt qu'au code.
        //
        // Avec `onEnded`, il fallait remettre la lecture en route à la main —
        // et ça ne marchait pas : `advance()` renvoyait le même index, donc
        // l'état ne changeait pas, l'effet ne se rejouait pas et le morceau
        // restait arrêté à la fin. `loop` reboucle sans coupure, et empêche
        // `onEnded` de se déclencher, donc la file n'avance pas non plus.
        loop={repeat}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onEnded={advance}
        hidden
      />
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer doit être utilisé dans <Providers>");
  return ctx;
}

/* ========================================================= déverrouillage */

/**
 * Les soutiens vivent en base : ils reviennent du serveur à chaque rendu.
 * Ce qui reste côté client, c'est uniquement la mémoire des morceaux
 * débloqués pendant la session — tant qu'il n'y a pas de comptes, on ne peut
 * pas rattacher un déblocage à quelqu'un.
 */
type UnlockState = {
  isUnlocked: (trackId: string) => boolean;
  unlock: (trackIds: string | string[]) => void;
};

const UnlockCtx = createContext<UnlockState | null>(null);

function UnlockProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const unlock = useCallback((ids: string | string[]) => {
    setUnlocked((prev) => {
      const next = new Set(prev);
      for (const id of Array.isArray(ids) ? ids : [ids]) next.add(id);
      return next;
    });
  }, []);

  const value = useMemo<UnlockState>(
    () => ({ unlock, isUnlocked: (id) => unlocked.has(id) }),
    [unlock, unlocked],
  );

  return <UnlockCtx.Provider value={value}>{children}</UnlockCtx.Provider>;
}

export function useUnlock() {
  const ctx = useContext(UnlockCtx);
  if (!ctx) throw new Error("useUnlock doit être utilisé dans <Providers>");
  return ctx;
}

/* ============================================================== playlist */

const PLAYLIST_KEY = "sunu:playlist";

/**
 * La playlist vit dans le navigateur du fan, pas en base.
 *
 * Il n'a pas de compte, et lui en demander un pour garder un son casserait
 * exactement ce qui fait marcher le produit : on arrive par un lien, on
 * écoute, on soutient. Le jour où l'authentification existera, cette liste
 * pourra être remontée sur le compte au premier login.
 */
type PlaylistState = {
  ids: string[];
  has: (trackId: string) => boolean;
  toggle: (trackId: string) => void;
  /** Ajout groupé, sans doublon. Sert au remplissage de démonstration. */
  addMany: (trackIds: string[]) => void;
  /** Faux tant que le localStorage n'a pas été lu, pour éviter un écart
      entre le rendu serveur et le premier rendu client. */
  ready: boolean;
};

const PlaylistCtx = createContext<PlaylistState | null>(null);

function PlaylistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLAYLIST_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      /* stockage indisponible ou contenu illisible : on repart d'une liste vide */
    }
    setReady(true);
  }, []);

  const toggle = useCallback((trackId: string) => {
    setIds((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [trackId, ...prev];
      try {
        window.localStorage.setItem(PLAYLIST_KEY, JSON.stringify(next));
      } catch {
        /* navigation privée : la liste reste valable le temps de la session */
      }
      return next;
    });
  }, []);

  const addMany = useCallback((trackIds: string[]) => {
    setIds((prev) => {
      const next = [...new Set([...trackIds, ...prev])];
      try {
        window.localStorage.setItem(PLAYLIST_KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  }, []);

  const value = useMemo<PlaylistState>(
    () => ({ ids, has: (id) => ids.includes(id), toggle, addMany, ready }),
    [ids, toggle, addMany, ready],
  );

  return (
    <PlaylistCtx.Provider value={value}>{children}</PlaylistCtx.Provider>
  );
}

export function usePlaylist() {
  const ctx = useContext(PlaylistCtx);
  if (!ctx) throw new Error("usePlaylist doit être utilisé dans <Providers>");
  return ctx;
}

/* =============================================================== racine */

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PlaylistProvider>
      <UnlockProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </UnlockProvider>
    </PlaylistProvider>
  );
}
