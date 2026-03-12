import { useState, useCallback, useEffect, useMemo } from "react";
import { X } from "lucide-react";

import photo01 from "@/assets/legacy/20131223-174839.jpg";
import photo02 from "@/assets/legacy/20131223-175007.jpg";
import photo03 from "@/assets/legacy/20131223-175032.jpg";
import photo04 from "@/assets/legacy/20131223-175059.jpg";
import photo05 from "@/assets/legacy/20131223-175145.jpg";
import photo06 from "@/assets/legacy/20131223-175228.jpg";
import photo07 from "@/assets/legacy/20131223-175324.jpg";
import photo08 from "@/assets/legacy/20131223-175338.jpg";
import photo09 from "@/assets/legacy/20131223-175422.jpg";
import photo10 from "@/assets/legacy/20131223-175442.jpg";
import photo11 from "@/assets/legacy/20131223-175505.jpg";
import photo12 from "@/assets/legacy/20131223-175554.jpg";
import photo13 from "@/assets/legacy/20131223-175618.jpg";
import photo14 from "@/assets/legacy/20131223-175638.jpg";
import photo15 from "@/assets/legacy/20131223-175713.jpg";
import photo16 from "@/assets/legacy/20131223-175752.jpg";
import photo17 from "@/assets/legacy/20131223-175829.jpg";
import photo18 from "@/assets/legacy/20131223-175842.jpg";
import photo19 from "@/assets/legacy/20131223-175924.jpg";
import photo20 from "@/assets/legacy/20131223-180056.jpg";

const PHOTOS = [
  photo01, photo02, photo03, photo04, photo05,
  photo06, photo07, photo08, photo09, photo10,
  photo11, photo12, photo13, photo14, photo15,
  photo16, photo17, photo18, photo19, photo20,
];

function distributePhotos(photos: string[], cols: number): string[][] {
  const columns: string[][] = Array.from({ length: cols }, () => []);
  photos.forEach((photo, i) => {
    columns[i % cols].push(photo);
  });
  return columns;
}

export function PublicityPics() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const openLightbox = useCallback((src: string) => {
    setLightboxSrc(src);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (lightboxSrc) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeLightbox();
      };
      window.addEventListener("keydown", handleKey);

      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", handleKey);
      };
    }
  }, [lightboxSrc, closeLightbox]);

  const cols2 = useMemo(() => distributePhotos(PHOTOS, 2), []);
  const cols3 = useMemo(() => distributePhotos(PHOTOS, 3), []);
  const cols4 = useMemo(() => distributePhotos(PHOTOS, 4), []);

  return (
    <section className="relative py-24" data-testid="section-publicity">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground mb-4">
          GALLERY
        </p>
        <h2 className="font-serif text-3xl md:text-4xl mb-12 leading-tight">
          Publicity Pics
        </h2>

        <div
          className="hidden md:grid lg:hidden gap-3"
          style={{ gridTemplateColumns: `repeat(3, 1fr)` }}
        >
          {cols3.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              {col.map((src, pi) => (
                <button
                  key={pi}
                  data-testid={`button-photo-${ci}-${pi}`}
                  className="group relative overflow-hidden rounded-sm bg-muted cursor-pointer border-0 p-0"
                  onClick={() => openLightbox(src)}
                >
                  <img
                    src={src}
                    alt={`Mindy Robinson publicity photo ${ci * 10 + pi + 1}`}
                    className="w-full h-auto object-cover saturate-[0.3] transition duration-500 group-hover:saturate-[0.8] group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div
          className="hidden lg:grid gap-3"
          style={{ gridTemplateColumns: `repeat(4, 1fr)` }}
        >
          {cols4.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              {col.map((src, pi) => (
                <button
                  key={pi}
                  data-testid={`button-photo-lg-${ci}-${pi}`}
                  className="group relative overflow-hidden rounded-sm bg-muted cursor-pointer border-0 p-0"
                  onClick={() => openLightbox(src)}
                >
                  <img
                    src={src}
                    alt={`Mindy Robinson publicity photo ${ci * 10 + pi + 1}`}
                    className="w-full h-auto object-cover saturate-[0.3] transition duration-500 group-hover:saturate-[0.8] group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div
          className="grid md:hidden gap-3"
          style={{ gridTemplateColumns: `repeat(2, 1fr)` }}
        >
          {cols2.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              {col.map((src, pi) => (
                <button
                  key={pi}
                  data-testid={`button-photo-sm-${ci}-${pi}`}
                  className="group relative overflow-hidden rounded-sm bg-muted cursor-pointer border-0 p-0"
                  onClick={() => openLightbox(src)}
                >
                  <img
                    src={src}
                    alt={`Mindy Robinson publicity photo ${ci * 10 + pi + 1}`}
                    className="w-full h-auto object-cover saturate-[0.3] transition duration-500 group-hover:saturate-[0.8] group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {lightboxSrc && (
        <div
          data-testid="lightbox-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
          onClick={closeLightbox}
        >
          <button
            data-testid="button-lightbox-close"
            className="absolute top-6 right-6 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition border-0 cursor-pointer"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Mindy Robinson publicity photo full size"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
