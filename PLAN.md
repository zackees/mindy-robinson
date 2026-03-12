# Swiper.js Migration Plan

## Overview
Migrate the movie carousel from Embla Carousel to Swiper.js for improved performance. The carousel has 5 rows with alternating scroll directions, infinite loop, auto-scroll, and drag support.

---

## Current State
- **Library**: Embla Carousel with auto-scroll plugin
- **Rows**: 5 rows with alternating directions (0/2/4 left, 1/3 right)
- **Loop**: 2x movie duplication for seamless infinite scroll
- **Performance**: 7,685 DOM nodes, 621 event listeners (still slow)

---

## Migration Steps

### Step 1: Update Dependencies
```bash
npm uninstall embla-carousel-react embla-carousel-auto-scroll
npm install swiper
```

### Step 2: Refactor MoviesCarousel Component
Replace Embla hooks with Swiper React components:

```tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
```

**Key Configuration per Row:**
| Option | Value | Purpose |
|--------|-------|---------|
| `loop` | `true` | Infinite scroll |
| `slidesPerView` | `"auto"` | Variable width slides |
| `spaceBetween` | `16` | Gap between cards |
| `speed` | `8000-12000` | Smooth continuous scroll |
| `autoplay.delay` | `0` | Continuous motion |
| `autoplay.reverseDirection` | `rowIndex % 2 === 1` | Alternating directions |
| `autoplay.disableOnInteraction` | `false` | Resume after drag |
| `allowTouchMove` | `true` | Enable drag |
| `grabCursor` | `true` | Visual drag feedback |
| `loopAdditionalSlides` | `3` | Extra slides for smooth loop |

### Step 3: Update InfiniteRow Component

```tsx
function InfiniteRow({ rowIndex, movies, ... }) {
  const isReverse = rowIndex % 2 === 1;
  
  return (
    <Swiper
      modules={[Autoplay]}
      loop={true}
      slidesPerView="auto"
      spaceBetween={16}
      speed={10000}
      autoplay={{
        delay: 0,
        disableOnInteraction: false,
        reverseDirection: isReverse,
      }}
      allowTouchMove={true}
      grabCursor={true}
      loopAdditionalSlides={3}
    >
      {infiniteMovies.map((movie, idx) => (
        <SwiperSlide key={`${rowIndex}-${idx}`} style={{ width: 'auto' }}>
          <MovieCard ... />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
```

### Step 4: CSS Updates
Replace Embla class selectors with Swiper equivalents:

| Embla Class | Swiper Class |
|-------------|--------------|
| `.embla` | `.swiper` |
| `.embla__viewport` | `.swiper` |
| `.embla__container` | `.swiper-wrapper` |
| `.embla__slide` | `.swiper-slide` |

**Update index.css:**
```css
.movie-carousel__row .swiper {
  overflow: hidden;
  cursor: grab;
}

.movie-carousel__row .swiper-wrapper {
  display: flex;
  transition-timing-function: linear;
}

.movie-carousel__row .swiper-slide {
  flex: 0 0 auto;
  width: 200px;
  content-visibility: auto;
  contain-intrinsic-size: 200px 300px;
}
```

### Step 5: Preserve MovieCard Component
- Keep `React.memo` wrapper
- Keep conditional streaming links rendering
- Keep all hover/click handlers unchanged
- MovieCard is rendered inside SwiperSlide

### Step 6: Performance Validation
Run Playwright performance test to verify:
- [ ] DOM nodes reduced or maintained
- [ ] Event listeners reduced
- [ ] Smooth 60fps scrolling
- [ ] No gaps during infinite loop
- [ ] Drag works correctly
- [ ] Auto-scroll resumes after drag

---

## Acceptance Criteria
1. All 5 rows scroll infinitely with no gaps
2. Rows alternate direction (0/2/4 left, 1/3 right)
3. Smooth continuous auto-scroll animation
4. Drag/swipe works and auto-scroll resumes
5. Movie cards maintain hover and click interactions
6. Performance equal or better than Embla implementation

---

## Rollback Plan
If Swiper causes issues, revert to commit `5324ea3b` (Embla implementation with memoization).
