"use client";

import { memo } from "react";

export const IconPickup = memo(function IconPickup() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1.2 10.5a1.5 1.5 0 0 1-1.49 1.33H8.69A1.5 1.5 0 0 1 7.2 18.5L6 8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
});

export const IconDelivery = memo(function IconDelivery() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h11v8H3V7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 10h3.5L20 13v2h-6v-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
});
