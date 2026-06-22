"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload, X, ZoomIn } from "lucide-react";

type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Props = {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onUploaded: (url: string) => void;
};

export default function ImageCropModal({
  open,
  file,
  onClose,
  onUploaded,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [display, setDisplay] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) {
      setCrop(null);
      setError("");
      setUploading(false);
    }
  }, [open]);

  const syncCropToSquare = useCallback(() => {
    const img = imgRef.current;
    if (!img || !display.width || !display.height) return;
    const size = Math.min(display.width, display.height) * 0.82;
    setCrop({
      left: (display.width - size) / 2,
      top: (display.height - size) / 2,
      width: size,
      height: size,
    });
  }, [display.height, display.width]);

  const onImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    setDisplay({ width: img.clientWidth, height: img.clientHeight });
    const size = Math.min(img.clientWidth, img.clientHeight) * 0.82;
    setCrop({
      left: (img.clientWidth - size) / 2,
      top: (img.clientHeight - size) / 2,
      width: size,
      height: size,
    });
  };

  const scaleToNatural = (rect: CropRect): CropRect => {
    if (!display.width || !display.height) return rect;
    const scaleX = natural.width / display.width;
    const scaleY = natural.height / display.height;
    return {
      left: rect.left * scaleX,
      top: rect.top * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    setDragging(true);
    setOrigin({ x: e.clientX - crop.left, y: e.clientY - crop.top });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !crop) return;
    const nextLeft = Math.max(
      0,
      Math.min(e.clientX - origin.x, display.width - crop.width)
    );
    const nextTop = Math.max(
      0,
      Math.min(e.clientY - origin.y, display.height - crop.height)
    );
    setCrop({ ...crop, left: nextLeft, top: nextTop });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const upload = async () => {
    if (!file || !crop) return;
    setUploading(true);
    setError("");
    try {
      const scaled = scaleToNatural(crop);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cropLeft", String(Math.round(scaled.left)));
      formData.append("cropTop", String(Math.round(scaled.top)));
      formData.append("cropWidth", String(Math.round(scaled.width)));
      formData.append("cropHeight", String(Math.round(scaled.height)));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      onUploaded(data.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ladda upp bilden.");
    } finally {
      setUploading(false);
    }
  };

  if (!open || !file || !previewUrl) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#b85c38]/25 bg-[#141414] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="font-serif text-xl text-white">Bild & beskärning</h2>
            <p className="text-xs text-white/45">Dra ramen för att beskära</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-white"
            aria-label="Stäng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl bg-[#0a0a0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Förhandsgranskning"
              className="mx-auto block max-h-[50vh] w-full object-contain"
              onLoad={onImageLoad}
            />
            {crop && (
              <div
                className="absolute touch-none border-2 border-[#b85c38] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={{
                  left: crop.left,
                  top: crop.top,
                  width: crop.width,
                  height: crop.height,
                  cursor: dragging ? "grabbing" : "grab",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={syncCropToSquare}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white"
            >
              <ZoomIn size={14} />
              Centrera beskärning
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={upload}
            disabled={uploading || !crop}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-3.5 text-sm font-semibold text-white transition hover:bg-[#9e4e2f] disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {uploading ? "Laddar upp…" : "Spara bild"}
          </button>
        </div>
      </div>
    </div>
  );
}
