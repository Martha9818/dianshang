import Image from "next/image";
import { MockThumb } from "@/components/dashboard/primitives";

export function ProductImage({
  src,
  alt,
  label,
  square = false,
  missing = false,
  large = false,
  fit = "cover",
}: {
  src?: string | null;
  alt: string;
  label: string;
  square?: boolean;
  missing?: boolean;
  large?: boolean;
  fit?: "cover" | "contain";
}) {
  const imagePath = src?.replace(/^uploads[\\/]/, "");

  if (!src || missing) {
    return (
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-xs font-medium text-slate-400",
          large ? "aspect-square w-full" : square ? "h-16 w-16" : "h-12 w-12",
        ].join(" ")}
      >
        {missing ? "文件缺失" : <MockThumb label={label} tone="slate" square={square} />}
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/80 bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        large ? "aspect-square w-full" : square ? "h-16 w-16" : "h-12 w-12",
      ].join(" ")}
    >
      <Image
        src={`/api/uploads/${imagePath}`}
        alt={alt}
        fill
        sizes={large ? "(min-width: 1280px) 360px, 100vw" : square ? "64px" : "48px"}
        className={fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
