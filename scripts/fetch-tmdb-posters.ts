import fs from "fs";
import path from "path";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY environment variable is required");
  process.exit(1);
}

interface TMDBSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

interface TMDBSearchResponse {
  results: TMDBSearchResult[];
}

async function searchMovie(title: string, year: string): Promise<string | null> {
  const cleanTitle = title
    .replace(/\s*\(TBS\)\s*$/, "")
    .replace(/\s*\(FOX\)\s*$/, "");
  
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: cleanTitle,
  });

  if (year && year !== "UNKNOWN") {
    params.set("year", year);
  }

  const url = `${TMDB_BASE}/search/movie?${params}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    console.error(`  TMDB API error for "${title}": ${res.status}`);
    return null;
  }

  const data: TMDBSearchResponse = await res.json();

  if (data.results.length === 0) {
    const tvParams = new URLSearchParams({
      api_key: TMDB_API_KEY!,
      query: cleanTitle,
    });
    const tvUrl = `${TMDB_BASE}/search/tv?${tvParams}`;
    const tvRes = await fetch(tvUrl);
    if (tvRes.ok) {
      const tvData = await tvRes.json();
      if (tvData.results.length > 0 && tvData.results[0].poster_path) {
        return tvData.results[0].poster_path;
      }
    }
    return null;
  }

  return data.results[0].poster_path;
}

async function main() {
  const moviesPath = path.resolve("client/src/data/movies.json");
  const raw = fs.readFileSync(moviesPath, "utf-8");
  const data = JSON.parse(raw);

  console.log(`Fetching TMDB posters for ${data.movies.length} movies...\n`);

  let found = 0;
  let notFound = 0;

  for (const movie of data.movies) {
    const posterPath = await searchMovie(movie.title, movie.year);
    
    if (posterPath) {
      movie.tmdbPosterPath = posterPath;
      found++;
      console.log(`✓ ${movie.title} (${movie.year}) → ${posterPath}`);
    } else {
      notFound++;
      console.log(`✗ ${movie.title} (${movie.year}) → NOT FOUND`);
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  fs.writeFileSync(moviesPath, JSON.stringify(data, null, 2) + "\n");

  console.log(`\nDone! Found: ${found}, Not found: ${notFound}`);
  console.log(`Updated ${moviesPath}`);
}

main().catch(console.error);
