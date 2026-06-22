"use client";

import { useEffect, useState } from "react";
import {
  getPosScreenSize,
  isCoarsePointer,
  type PosScreenSize,
} from "./device";
import {
  detectPosTerminalProfile,
  type PosTerminalProfile,
} from "./terminal-profile";

type PosDeviceState = {
  screenSize: PosScreenSize;
  isTouch: boolean;
  width: number;
  profile: PosTerminalProfile;
};

function readDeviceState(): PosDeviceState {
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;
  const height = typeof window !== "undefined" ? window.innerHeight : 768;
  return {
    screenSize: getPosScreenSize(width),
    isTouch: isCoarsePointer(),
    width,
    profile: detectPosTerminalProfile(width, height),
  };
}

export function usePosDevice(): PosDeviceState {
  const [state, setState] = useState<PosDeviceState>(readDeviceState);

  useEffect(() => {
    const update = () => setState(readDeviceState());

    const coarseQuery = window.matchMedia("(pointer: coarse)");
    coarseQuery.addEventListener("change", update);
    window.addEventListener("resize", update);

    update();

    return () => {
      coarseQuery.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return state;
}
