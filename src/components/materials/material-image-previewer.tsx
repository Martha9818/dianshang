"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MaterialImagePreviewer({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openPreview() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setOpen(true);
  }

  function closePreview() {
    setOpen(false);
    dragRef.current = null;
  }

  return (
    <>
      <button type="button" onClick={openPreview} className="block w-full cursor-zoom-in text-left" aria-label="查看素材大图">
        {children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/82 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="素材大图预览"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <button
            type="button"
            onClick={closePreview}
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/12 text-2xl leading-none text-white shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            aria-label="关闭大图预览"
          >
            ×
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-900/70 px-4 py-2 text-xs text-white/78">
            滚轮缩放，按住拖拽查看细节，Esc 关闭
          </div>

          <div
            className="relative h-full max-h-[88vh] w-full max-w-[92vw] overflow-hidden rounded-[24px] border border-white/12 bg-slate-900 shadow-[0_28px_80px_rgba(0,0,0,0.42)]"
            onWheel={(event) => {
              event.preventDefault();
              const nextScale = clamp(scale + (event.deltaY < 0 ? 0.18 : -0.18), 1, 5);
              setScale(nextScale);
              if (nextScale === 1) setOffset({ x: 0, y: 0 });
            }}
            onPointerDown={(event) => {
              if (scale <= 1) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                offsetX: offset.x,
                offsetY: offset.y,
              };
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setOffset({
                x: drag.offsetX + event.clientX - drag.x,
                y: drag.offsetY + event.clientY - drag.y,
              });
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) {
                dragRef.current = null;
              }
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="92vw"
              className={[
                "h-full w-full select-none object-contain transition-transform duration-100 ease-out",
                scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
              ].join(" ")}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
              draggable={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
