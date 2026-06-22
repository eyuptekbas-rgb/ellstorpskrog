"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPosTerminalProfile, isPosTerminalProfile } from "@/lib/pos/terminal-profile";

type Options = {
  autoOnTerminal?: boolean;
};

export function usePosFullscreen(options: Options = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = rootRef.current ?? document.documentElement;
    if (document.fullscreenElement) return;
    try {
      await el.requestFullscreen();
    } catch {
      // Fullscreen may require user gesture — ignore.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // Ignore.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  useEffect(() => {
    if (!options.autoOnTerminal) return;
    const profile = detectPosTerminalProfile(window.innerWidth, window.innerHeight);
    if (isPosTerminalProfile(profile)) {
      const timer = setTimeout(() => void enterFullscreen(), 600);
      return () => clearTimeout(timer);
    }
  }, [options.autoOnTerminal, enterFullscreen]);

  return { rootRef, fullscreen, toggleFullscreen, enterFullscreen, exitFullscreen };
}
