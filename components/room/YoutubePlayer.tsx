"use client";

import { useEffect, useRef, useState } from "react";
import type { Playback } from "./types";

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  loadVideoById(o: { videoId: string; startSeconds?: number }): void;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
  setPlaybackQuality(quality: string): void;
  getPlaybackQuality(): string;
  getAvailableQualityLevels(): string[];
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  getAvailablePlaybackRates(): number[];
  loadModule(name: string): void;
  unloadModule(name: string): void;
  setOption(module: string, option: string, value: unknown): void;
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function YouTubePlayer({
  playback,
  volume,
  muted,
  captions = false,
  quality = "auto",
  playbackRate = 1,
  onTime,
  onEnded,
  onQualitiesAvailable,
  onRatesAvailable,
}: {
  playback: Playback;
  volume: number;
  muted: boolean;
  captions?: boolean;
  quality?: string;
  playbackRate?: number;
  onTime: (time: number, duration: number) => void;
  onEnded: () => void;
  onQualitiesAvailable?: (levels: string[]) => void;
  onRatesAvailable?: (rates: number[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const pb = useRef(playback);
  const onTimeRef = useRef(onTime);
  const onEndedRef = useRef(onEnded);
  const onQualitiesRef = useRef(onQualitiesAvailable);
  const onRatesRef = useRef(onRatesAvailable);
  const captionsRef = useRef(captions);

  useEffect(() => {
    pb.current = playback;
    onTimeRef.current = onTime;
    onEndedRef.current = onEnded;
    onQualitiesRef.current = onQualitiesAvailable;
    onRatesRef.current = onRatesAvailable;
    captionsRef.current = captions;
  });

  // Create the player once.
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const host = hostRef.current;
    loadYouTubeApi().then(() => {
      if (cancelled || !host || !window.YT) return;
      const el = document.createElement("div");
      host.appendChild(el);
      const start = pb.current;
      playerRef.current = new window.YT.Player(el, {
        videoId: start.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          cc_load_policy: captionsRef.current ? 1 : 0,
          start: Math.floor(start.time),
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            loadedId.current = start.videoId;
            setReady(true);
            const p = playerRef.current;
            if (p) {
              if (p.getAvailableQualityLevels) {
                const q = p.getAvailableQualityLevels();
                if (q && q.length) onQualitiesRef.current?.(q);
              }
              if (p.getAvailablePlaybackRates) {
                const r = p.getAvailablePlaybackRates();
                if (r && r.length) onRatesRef.current?.(r);
              }
            }
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) onEndedRef.current();
            // Refresh available qualities / rates after video loads
            if (e.data === 1 || e.data === 2) {
              const p = playerRef.current;
              if (p) {
                if (p.getAvailableQualityLevels) {
                  const q = p.getAvailableQualityLevels();
                  if (q && q.length) onQualitiesRef.current?.(q);
                }
                if (p.getAvailablePlaybackRates) {
                  const r = p.getAvailablePlaybackRates();
                  if (r && r.length) onRatesRef.current?.(r);
                }
              }
            }
          },
        },
      });
      timer = window.setInterval(() => {
        const p = playerRef.current;
        if (p?.getCurrentTime) onTimeRef.current(p.getCurrentTime(), p.getDuration() || 0);
      }, 400);
    });
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      playerRef.current?.destroy();
      playerRef.current = null;
      if (host) host.innerHTML = "";
    };
  }, []);

  // Move the player to match the shared state.
  useEffect(() => {
    const p = playerRef.current;
    const s = pb.current;
    if (!p || !ready || !s.videoId) return;
    const target = s.playing ? s.time + (Date.now() - s.updatedAt) / 1000 : s.time;
    if (loadedId.current !== s.videoId) {
      loadedId.current = s.videoId;
      p.loadVideoById({ videoId: s.videoId, startSeconds: target });
      if (!s.playing) p.pauseVideo();
      return;
    }
    if (Math.abs(p.getCurrentTime() - target) > 1.2) p.seekTo(target, true);
    if (s.playing) p.playVideo();
    else p.pauseVideo();
  }, [playback.seq, playback.playing, playback.videoId, playback.time, ready]);

  // Volume & Mute
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    p.setVolume(volume);
    if (muted || volume === 0) p.mute();
    else p.unMute();
  }, [volume, muted, ready]);

  // Captions (CC)
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (captions) {
        p.loadModule("captions");
        p.setOption("captions", "track", { languageCode: "en" });
        p.setOption("captions", "reload", true);
      } else {
        p.unloadModule("captions");
      }
    } catch {
      // Captions might not be available on all videos
    }
  }, [captions, ready]);

  // Playback Quality
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (p.setPlaybackQuality) {
        p.setPlaybackQuality(quality);
      }
    } catch {
      // Ignore
    }
  }, [quality, ready]);

  // Playback Rate (Speed)
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (p.setPlaybackRate) {
        p.setPlaybackRate(playbackRate);
      }
    } catch {
      // Ignore
    }
  }, [playbackRate, ready]);

  return <div ref={hostRef} className="absolute inset-0 [&_iframe]:size-full" />;
}
