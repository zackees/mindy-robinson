import moviesJson from "./movies.json";

export type StreamingServiceKey = "PRIME" | "PLEX" | "TUBI" | "PLUTO" | "APPLE_TV" | "NETFLIX" | "AMC_PLUS" | "IMDB";

export type StreamingMeta = {
  name: string;
  icon: string;
};

export type RawStreamingLink = {
  service: StreamingServiceKey;
  url: string;
};

export type StreamingLink = {
  name: string;
  icon: string;
  url: string;
};

export type Movie = {
  title: string;
  year: string;
  description: string;
  thumbnailSrc: string;
  posterUrl?: string;
  link: string;
  link_text: string;
  link_icon?: string;
  trailerUrl?: string;
  streaming_links?: StreamingLink[];
};

type MoviesData = {
  streamingMeta: Record<StreamingServiceKey, StreamingMeta>;
  movies: Array<{
    title: string;
    year: string;
    description: string;
    thumbnailSrc: string;
    link: string;
    link_text: string;
    link_icon?: string;
    tmdbPosterPath?: string;
    trailerUrl?: string;
    streaming_links?: RawStreamingLink[];
  }>;
};

const data = moviesJson as MoviesData;

export const streamingMeta = data.streamingMeta;

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

export const movies: Movie[] = data.movies.map((movie) => {
  const streamingLinks: StreamingLink[] = movie.streaming_links?.map((link) => ({
    name: data.streamingMeta[link.service].name,
    icon: data.streamingMeta[link.service].icon,
    url: link.url,
  })) ?? [];

  if (movie.trailerUrl) {
    streamingLinks.unshift({
      name: "Watch Trailer",
      icon: "/streaming/youtube.svg",
      url: movie.trailerUrl,
    });
  }

  return {
    ...movie,
    posterUrl: movie.tmdbPosterPath ? `${TMDB_IMG_BASE}${movie.tmdbPosterPath}` : undefined,
    link_icon: movie.link_icon ? data.streamingMeta[movie.link_icon as StreamingServiceKey]?.icon : undefined,
    trailerUrl: movie.trailerUrl,
    streaming_links: streamingLinks.length > 0 ? streamingLinks : undefined,
  };
});
