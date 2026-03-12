# Mindy Robinson - Official Landing Page

## Overview

This is an official landing page and portfolio site for Mindy Robinson, an actress and model. The project is a modern replacement for a legacy WordPress.com site, designed to showcase her film/TV work, facilitate bookings, press inquiries, and brand collaborations. The site features a hero video section, an interactive movies carousel, contact form panel, and responsive design optimized for conversion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS v4 with custom theme variables, using the `@tailwindcss/vite` plugin
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and micro-interactions
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Carousel**: Embla Carousel with custom auto-scroll plugin and a custom `CarouselEngine` class for infinite scrolling logic

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx for development, esbuild for production bundling
- **API Structure**: RESTful routes prefixed with `/api`, defined in `server/routes.ts`
- **Static Serving**: Production builds serve from `dist/public`

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using Drizzle's pgTable definitions
- **Migrations**: Managed via `drizzle-kit push`
- **Current Storage**: In-memory storage class (`MemStorage`) as default, with PostgreSQL ready when DATABASE_URL is configured

### Build System
- **Client**: Vite builds to `dist/public`
- **Server**: esbuild bundles to `dist/index.cjs` with select dependencies bundled for faster cold starts
- **Scripts**: `npm run dev` for development, `npm run build` for production, `npm run db:push` for schema sync

### Testing
- **Unit Tests**: Vitest with jsdom environment for component/engine testing
- **E2E Tests**: Playwright for browser-based testing
- **Test Files**: Located alongside source files with `.test.ts` suffix

## External Dependencies

### Third-Party Services
- **Fonts**: Google Fonts (DM Sans, Playfair Display, Anton, Montserrat) loaded via CDN
- **Video Hosting**: Hero video served from local assets (`/src/assets/videos/`)

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide React icons, class-variance-authority, clsx, tailwind-merge
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Carousel**: embla-carousel-react, embla-carousel-auto-scroll
- **Gestures**: @use-gesture/react for drag interactions
- **Database**: drizzle-orm, pg (PostgreSQL client), drizzle-zod for schema validation

### Asset Management
- Legacy site assets scraped and stored in `client/src/assets/legacy/`
- Movie data stored as JSON in `client/src/data/movies.json`
- Streaming service icons in `client/public/streaming/`

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` for development error overlay
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` for development tools
- Custom `vite-plugin-meta-images` for OpenGraph image URL injection