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
import type { Artist, Track } from "@/lib/types";

/* ============================================================== lecteur */

type PlayerState = {
  track: Track | null;
  artist: Artist | null;
  playing: boolean;
  /** Position de lecture en secondes. */
  position: number;
  toggle: (track: Track, artist: Artist) => void;
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
  const [current, setCurrent] = useState<{
    track: Track;
    artist: Artist;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = current?.track ?? null;

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
          setPlaying(false);
          return 0;
        }
        return p + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, track]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track?.audioUrl) return;
    if (playing) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, track]);

  const toggle = useCallback(
    (next: Track, artist: Artist) => {
      if (current?.track.id === next.id) {
        setPlaying((p) => !p);
        return;
      }
      setCurrent({ track: next, artist });
      setPosition(0);
      setPlaying(true);
    },
    [current],
  );

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
      seek,
      pause: () => setPlaying(false),
      resume: () => setPlaying(true),
      stop: () => {
        setPlaying(false);
        setCurrent(null);
        setPosition(0);
        setExpanded(false);
      },
      expanded,
      // Rien à agrandir tant qu'aucun morceau n'est chargé.
      expand: () => setExpanded(current !== null),
      collapse: () => setExpanded(false),
    }),
    [track, current, playing, position, toggle, seek, expanded],
  );

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={track?.audioUrl}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setPosition(0);
        }}
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

  const value = useMemo<PlaylistState>(
    () => ({ ids, has: (id) => ids.includes(id), toggle, ready }),
    [ids, toggle, ready],
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
