import { memo, useRef, useState, useCallback, createContext, useContext, useMemo } from "react";
import { ChevronsDown } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { movies } from "@/data/movies";

type Movie = (typeof movies)[number];

const CAROUSEL_CONFIG = {
  speed: 5000,
  rows: 5,
  spaceBetween: 0,
  directions: [-1, 1, -1, 1, -1] as const,
} as const;

const SWIPER_CONFIG = {
  loop: true,
  slidesPerView: "auto" as const,
  spaceBetween: CAROUSEL_CONFIG.spaceBetween,
  speed: CAROUSEL_CONFIG.speed,
  allowTouchMove: true,
  grabCursor: true,
  loopedSlides: 4,
  loopAdditionalSlides: 2,
  slideToClickedSlide: false,
  centeredSlides: false,
  watchSlidesProgress: false,
  preventClicks: true,
  preventClicksPropagation: true,
};

const FREEMODE_CONFIG = {
  enabled: true,
  sticky: false,
  momentum: false,
};

type CarouselContextType = {
  activeIndex: string | null;
  setActiveIndex: (id: string | null) => void;
  openCardKey: string | null;
  setOpenCardKey: React.Dispatch<React.SetStateAction<string | null>>;
  switchingKey: string | null;
  setSwitchingKey: (id: string | null) => void;
  closeTimerRef: React.MutableRefObject<number | null>;
};

const CarouselContext = createContext<CarouselContextType | null>(null);

function useCarouselContext() {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("useCarouselContext must be used within CarouselProvider");
  return ctx;
}

function chunkIntoRows<T>(arr: T[], rows: number): T[][] {
  const out: T[][] = Array.from({ length: rows }, () => []);
  for (let i = 0; i < arr.length; i++) out[i % rows].push(arr[i]);
  return out;
}

function getComputedTranslateX(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const matrix = new DOMMatrix(style.transform);
  return matrix.m41;
}

function calculateResumeAnimation(
  currentTranslate: number,
  slideWidth: number,
  spaceBetween: number,
  isReverse: boolean,
  speed: number
) {
  const slideStep = slideWidth + spaceBetween;
  const progressInSlide = Math.abs(currentTranslate) % slideStep;
  const remainingDistance = isReverse ? progressInSlide : slideStep - progressInSlide;
  const proportionalTime = Math.round((remainingDistance / slideStep) * speed);
  const targetTranslate = Math.round(isReverse
    ? currentTranslate + remainingDistance
    : currentTranslate - remainingDistance);
  
  return { targetTranslate, proportionalTime };
}

type MovieCardProps = {
  movie: Movie;
  cardKey: string;
  isActive: boolean;
  isOpen: boolean;
  isSwitching: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onCardClick: () => void;
};

const StreamingLink = memo(function StreamingLink({
  href,
  icon,
  label,
  testIdPrefix,
}: {
  href: string;
  icon: string;
  label: string;
  testIdPrefix: string;
}) {
  return (
    <a
      data-testid={`link-${testIdPrefix}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="movie-stream"
      onClick={(e) => e.stopPropagation()}
      title={label}
    >
      <img
        data-testid={`img-${testIdPrefix}`}
        src={icon}
        alt={label}
        className="movie-stream__icon"
        loading="eager"
        draggable={false}
      />
      <span data-testid={`text-${testIdPrefix}`} className="movie-card__metaText movie-stream__label">
        <span className="movie-stream__labelClip">{label}</span>
      </span>
    </a>
  );
});

const MovieCard = memo(function MovieCard({
  movie: m,
  cardKey: key,
  isActive,
  isOpen,
  isSwitching,
  onMouseEnter,
  onMouseLeave,
  onCardClick,
}: MovieCardProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick();
    }
  }, [onCardClick]);

  const handleHintClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget.closest(".dvd-case") as HTMLElement | null)?.click();
  }, []);

  return (
    <div
      data-testid={`card-movie-${key}`}
      className={`movie-carousel__item${isActive ? " is-active" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        data-testid={`button-card-${key}`}
        className={`dvd-case group${isOpen ? " is-open-streaming" : ""}`}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onCardClick(); }}
        onKeyDown={handleKeyDown}
      >
        <div className="movie-card__clip" aria-hidden="true">
          <img
            data-testid={`img-movie-${key}`}
            className="movie-card__poster"
            src={m.posterUrl || m.thumbnailSrc}
            alt={m.title}
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div className="movie-card__posterShade" />
        </div>

        <div className="movie-card__content">
          <div
            data-testid={`hint-clickable-outer-${key}`}
            className="movie-card__clickHintWrap movie-card__clickHintWrap--outer"
            aria-hidden="true"
            data-face={isOpen ? "stream" : "desc"}
            data-switching={isSwitching ? "true" : "false"}
          >
            <button
              data-testid={`button-hint-${key}`}
              type="button"
              className="movie-card__clickHintButton"
              tabIndex={-1}
              aria-hidden="true"
              onClick={handleHintClick}
            >
              <ChevronsDown className="movie-card__clickHintIcon" />
            </button>
          </div>

          <div className="movie-card__meta absolute left-3 right-3 top-3 z-20">
            <div
              data-testid={`text-movie-title-${key}`}
              className="movie-card__metaText font-serif text-sm font-medium leading-tight text-white text-left tracking-[0.06em]"
            >
              {m.title}
            </div>
            <div
              data-testid={`text-movie-year-${key}`}
              className="movie-card__metaText mt-1 text-[9px] tracking-[0.28em] text-white uppercase font-medium text-left"
            >
              {m.year}
            </div>

            <div
              data-testid={`text-movie-description-${key}`}
              className={`movie-card__desc movie-card__descText mt-3 text-[11px] leading-snug text-white${isSwitching ? " is-face-switching" : ""}`}
            >
              <div
                data-testid={`panel-movie-desc-${key}`}
                className={`movie-card__face movie-card__face--desc${isOpen ? " is-face-switching" : ""}`}
                style={{
                  position: isOpen ? "absolute" : "relative",
                  inset: isOpen ? 0 : undefined,
                  pointerEvents: isOpen ? "none" : "auto",
                }}
              >
                {m.description}
              </div>

              <div
                data-testid={`panel-movie-link-${key}`}
                className={`movie-card__face movie-card__face--link space-y-2${isOpen ? " is-stream-visible" : ""}`}
              >
                <StreamingLink
                  href={m.link}
                  icon={(m as any).link_icon || "/streaming/imdb.png"}
                  label={m.link_text}
                  testIdPrefix={`movie-${key}`}
                />

                {Array.isArray(m.streaming_links) && m.streaming_links.length > 0 && (
                  <ul data-testid={`list-streaming-${key}`} className="movie-streams" role="list">
                    {m.streaming_links.map((s, i) => (
                      <li key={`${key}-stream-${i}`} data-testid={`item-streaming-${key}-${i}`} className="movie-streams__item">
                        <StreamingLink
                          href={s.url}
                          icon={s.icon}
                          label={s.name}
                          testIdPrefix={`streaming-${key}-${i}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

type InfiniteRowProps = {
  rowIndex: number;
  rowMovies: Movie[];
  direction: 1 | -1;
};

function InfiniteRow({ rowIndex, rowMovies, direction }: InfiniteRowProps) {
  const { activeIndex, setActiveIndex, openCardKey, setOpenCardKey, switchingKey, setSwitchingKey, closeTimerRef } = useCarouselContext();
  const swiperRef = useRef<SwiperType | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Duplicate once to ensure enough slides for seamless loop (need > viewport width)
  const slides = useMemo(() => [...rowMovies, ...rowMovies], [rowMovies]);
  const isReverse = direction === 1;

  const handleRowMouseEnter = useCallback(() => {
    const swiper = swiperRef.current as any;
    if (!swiper?.wrapperEl) return;
    
    swiper.autoplay.stop();
    const currentX = getComputedTranslateX(swiper.wrapperEl);
    swiper.setTransition(0);
    swiper.setTranslate(currentX);
    setIsPaused(true);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    const swiper = swiperRef.current as any;
    if (!swiper) return;
    
    setIsPaused(false);
    
    const currentTranslate = swiper.getTranslate();
    const slideWidth = swiper.slides[0]?.offsetWidth || 200;
    const { targetTranslate, proportionalTime } = calculateResumeAnimation(
      currentTranslate,
      slideWidth,
      swiper.params.spaceBetween || CAROUSEL_CONFIG.spaceBetween,
      isReverse,
      CAROUSEL_CONFIG.speed
    );
    
    swiper.setTransition(proportionalTime);
    swiper.setTranslate(targetTranslate);
    
    setTimeout(() => {
      if (swiper?.autoplay) {
        swiper.setTransition(CAROUSEL_CONFIG.speed);
        swiper.autoplay.start();
      }
    }, proportionalTime);
  }, [isReverse]);

  const handleCardMouseEnter = useCallback((key: string) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveIndex(key);
  }, [closeTimerRef, setActiveIndex]);

  const handleCardMouseLeave = useCallback((key: string) => {
    setActiveIndex(null);
    if (openCardKey === key) {
      setSwitchingKey(key);
      closeTimerRef.current = window.setTimeout(() => {
        setOpenCardKey(null);
        window.setTimeout(() => {
          setSwitchingKey(null);
          closeTimerRef.current = null;
        }, 170);
      }, 160);
    } else {
      setOpenCardKey(null);
      setSwitchingKey(null);
    }
  }, [openCardKey, closeTimerRef, setOpenCardKey, setSwitchingKey, setActiveIndex]);

  const handleCardClick = useCallback((key: string) => {
    if (isDraggingRef.current) return;
    setSwitchingKey(key);
    setOpenCardKey((prev) => (prev === key ? null : key));
    window.setTimeout(() => setSwitchingKey(null), 170);
  }, [setSwitchingKey, setOpenCardKey]);

  const autoplayConfig = useMemo(() => ({
    delay: 0,
    disableOnInteraction: false,
    reverseDirection: isReverse,
  }), [isReverse]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  return (
    <div
      ref={rowRef}
      data-testid={`row-movies-${rowIndex}`}
      className={`movie-carousel__row${isPaused ? " is-paused" : ""}`}
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={handleRowMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Swiper
        modules={[Autoplay, FreeMode]}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onTouchStart={() => rowRef.current?.classList.add('is-row-dragging')}
        onTouchEnd={() => rowRef.current?.classList.remove('is-row-dragging')}
        {...SWIPER_CONFIG}
        autoplay={autoplayConfig}
        freeMode={FREEMODE_CONFIG}
        className="movie-carousel__swiper"
      >
        {slides.map((movie, idx) => {
          const key = `${rowIndex}-${idx}`;
          return (
            <SwiperSlide key={key} style={{ width: "auto" }}>
              <MovieCard
                movie={movie}
                cardKey={key}
                isActive={activeIndex === key}
                isOpen={openCardKey === key}
                isSwitching={switchingKey === key}
                onMouseEnter={() => handleCardMouseEnter(key)}
                onMouseLeave={() => handleCardMouseLeave(key)}
                onCardClick={() => handleCardClick(key)}
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export function MoviesCarousel() {
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [openCardKey, setOpenCardKey] = useState<string | null>(null);
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const contextValue = useMemo<CarouselContextType>(() => ({
    activeIndex,
    setActiveIndex,
    openCardKey,
    setOpenCardKey,
    switchingKey,
    setSwitchingKey,
    closeTimerRef,
  }), [activeIndex, openCardKey, switchingKey]);

  const baseRows = useMemo(() => chunkIntoRows([...movies], CAROUSEL_CONFIG.rows), []);

  return (
    <CarouselContext.Provider value={contextValue}>
      <div data-testid="carousel-movies" className="relative rounded-3xl overflow-visible movie-carousel">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent md:w-20 z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent md:w-20 z-10" />

        <div data-testid="carousel-rows" className="movie-carousel__rows">
          {baseRows.map((rowMovies, rowIndex) => (
            <InfiniteRow
              key={rowIndex}
              rowIndex={rowIndex}
              rowMovies={rowMovies}
              direction={CAROUSEL_CONFIG.directions[rowIndex]}
            />
          ))}
        </div>
      </div>
    </CarouselContext.Provider>
  );
}
