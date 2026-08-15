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
import { artists, seedSupports, tracks as allTracks } from "@/lib/data";
import type { Artist, Support, Track } from "@/lib/types";
import type { PaymentMethod } from "@/lib/config";

/* ============================================================== lecteur */

type PlayerState = {
  track: Track | null;
  artist: Artist | null;
  playing: boolean;
  /** Position de lecture en secondes. */
  position: number;
  toggle: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  stop: () => void;
};

const PlayerCtx = createContext<PlayerState | null>(null);

function PlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const artist = useMemo(
    () => (track ? (artists.find((a) => a.id === track.artistId) ?? null) : null),
    [track],
  );

  /**
   * Deux modes : si le morceau a un fichier, on pilote un <audio> réel ;
   * sinon on simule la progression pour que la démo reste crédible sans
   * héberger de son. Le jour où les URLs Supabase arrivent, la branche
   * "réel" prend le relais toute seule.
   */
  useEffect(() => {
    if (!playing || !track) return;
    if (track.audioUrl) return;

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
    (next: Track) => {
      if (track?.id === next.id) {
        setPlaying((p) => !p);
        return;
      }
      setTrack(next);
      setPosition(0);
      setPlaying(true);
    },
    [track],
  );

  const seek = useCallback((seconds: number) => {
    setPosition(seconds);
    const el = audioRef.current;
    if (el) el.currentTime = seconds;
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      track,
      artist,
      playing,
      position,
      toggle,
      seek,
      pause: () => setPlaying(false),
      resume: () => setPlaying(true),
      stop: () => {
        setPlaying(false);
        setTrack(null);
        setPosition(0);
      },
    }),
    [track, artist, playing, position, toggle, seek],
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

/* ============================================================= soutiens */

type NewSupport = {
  artistId: string;
  trackId?: string;
  supporterName: string;
  amount: number;
  message?: string;
  method: PaymentMethod;
};

type SupportState = {
  supports: Support[];
  add: (s: NewSupport) => void;
  forArtist: (artistId: string) => Support[];
  totalForArtist: (artistId: string) => number;
  /** Morceaux déverrouillés par un soutien pendant la session. */
  unlocked: Set<string>;
  isUnlocked: (trackId: string) => boolean;
};

const SupportCtx = createContext<SupportState | null>(null);

function SupportProvider({ children }: { children: ReactNode }) {
  const [supports, setSupports] = useState<Support[]>(seedSupports);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const add = useCallback((s: NewSupport) => {
    const entry: Support = {
      ...s,
      id: `s_${Math.round(performance.now() * 1000)}`,
      supporterName: s.supporterName.trim() || "Anonyme",
      createdAt: new Date().toISOString(),
    };
    setSupports((prev) => [entry, ...prev]);

    // Un soutien déverrouille le morceau visé, et sinon tous les inédits de
    // l'artiste : c'est la contrepartie qui transforme le geste en achat.
    setUnlocked((prev) => {
      const next = new Set(prev);
      if (s.trackId) next.add(s.trackId);
      else
        allTracks
          .filter((t) => t.artistId === s.artistId && t.locked)
          .forEach((t) => next.add(t.id));
      return next;
    });
  }, []);

  const value = useMemo<SupportState>(
    () => ({
      supports,
      add,
      unlocked,
      isUnlocked: (trackId) => unlocked.has(trackId),
      forArtist: (artistId) =>
        supports.filter((s) => s.artistId === artistId),
      totalForArtist: (artistId) =>
        supports
          .filter((s) => s.artistId === artistId)
          .reduce((sum, s) => sum + s.amount, 0),
    }),
    [supports, add, unlocked],
  );

  return <SupportCtx.Provider value={value}>{children}</SupportCtx.Provider>;
}

export function useSupports() {
  const ctx = useContext(SupportCtx);
  if (!ctx) throw new Error("useSupports doit être utilisé dans <Providers>");
  return ctx;
}

/* =============================================================== racine */

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupportProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </SupportProvider>
  );
}
