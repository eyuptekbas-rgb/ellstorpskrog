"use client";

import { memo } from "react";
import { formatPosClock, formatPosDate } from "@/lib/pos/display";
import { usePosHardwareStatus } from "../usePosHardwareStatus";

type Props = {
  restaurantName: string;
  logoUrl: string | null;
  newOrderCount: number;
  nowMs: number;
};

function PosProHeader({
  restaurantName,
  logoUrl,
  newOrderCount,
  nowMs,
}: Props) {
  const { online, printerReady } = usePosHardwareStatus();
  const initial = restaurantName.trim().charAt(0).toUpperCase() || "R";

  return (
    <header className="pos-pro-header">
      <div className="pos-pro-header__brand">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="pos-pro-header__logo" />
        ) : (
          <div className="pos-pro-header__logo-fallback" aria-hidden>
            {initial}
          </div>
        )}
        <div className="pos-pro-header__titles">
          <span className="pos-pro-header__name">{restaurantName}</span>
          <span className="pos-pro-header__tag">Kassa</span>
        </div>
      </div>

      <div className="pos-pro-header__status">
        <div className="pos-pro-header__group">
          <div
            className={`pos-pro-header__pill${
              online ? "" : " pos-pro-header__pill--alert"
            }`}
          >
            <span className="pos-pro-header__dot" aria-hidden />
            <span>Internet</span>
          </div>
          <div
            className={`pos-pro-header__pill${
              printerReady ? "" : " pos-pro-header__pill--alert"
            }`}
          >
            <span className="pos-pro-header__dot" aria-hidden />
            <span>Skrivare</span>
          </div>
        </div>

        <div className="pos-pro-header__orders">
          <span className="pos-pro-header__orders-value">{newOrderCount}</span>
          <span className="pos-pro-header__orders-label">Nya ordrar</span>
        </div>

        <div className="pos-pro-header__clock">
          <div className="pos-pro-header__time">{formatPosClock(nowMs)}</div>
          <div className="pos-pro-header__date">{formatPosDate(nowMs)}</div>
        </div>
      </div>
    </header>
  );
}

export default memo(PosProHeader);
