"use client";

import { useEffect } from "react";
import {
  detectPosTerminalProfile,
  isPosTerminalProfile,
} from "@/lib/pos/terminal-profile";
import { usePosFullscreen } from "./usePosFullscreen";

export default function PosTerminalEnhancer() {
  const { rootRef, enterFullscreen } = usePosFullscreen({ autoOnTerminal: true });

  useEffect(() => {
    const apply = () => {
      const profile = detectPosTerminalProfile(window.innerWidth, window.innerHeight);
      const isTerminal = isPosTerminalProfile(profile);

      document.documentElement.classList.toggle("pos-terminal-mode", isTerminal);
      document.documentElement.dataset.posProfile = profile.id;

      if (isTerminal && profile.autoFullscreen) {
        void enterFullscreen();
      }
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      document.documentElement.classList.remove("pos-terminal-mode");
      delete document.documentElement.dataset.posProfile;
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, [enterFullscreen]);

  return (
    <>
      <div ref={rootRef} className="pos-pro-hidden" aria-hidden />
      <div className="pos-pro-portrait" role="alert">
        <p className="pos-pro-portrait__title">Vänd enheten</p>
        <p className="pos-pro-portrait__sub">Kassan kräver liggande visning.</p>
      </div>
    </>
  );
}
