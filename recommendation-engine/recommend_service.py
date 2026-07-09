"""
FilmMosaic v2 — Recommendation service

Loads the 7 trained .pkl artifacts, connects to PostgreSQL for live user
data, and exposes:

    GET  /health                 -> service health + artifact status
    GET  /recommend/{user_id}    -> [tmdbId, tmdbId, ...]   (top N, default 10)
    GET  /recommend/{user_id}?n=20&regional=3&underrated=2

The Node backend (Capstone/easy/backend) calls GET /recommend/{user_id}
through src/utils/recommendationClient.js.

Run:
    uvicorn recommend_service:app --reload --port 8000
"""
from __future__ import annotations

import os
import pickle
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

import asyncpg
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from surprise import SVD, Dataset, Reader

# Lazy-loaded SBERT (for local movie embeddings at runtime)
_sbert = None
def _get_sbert():
    global _sbert
    if _sbert is None:
        from sentence_transformers import SentenceTransformer
        _sbert = SentenceTransformer("all-MiniLM-L6-v2")
    return _sbert

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ARTIFACT_DIR = Path(os.environ.get(
    "FILMMOSAIC_ARTIFACT_DIR",
    Path(__file__).parent,                              # default: alongside this file
))
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres@localhost:5433/cinetrack",
)
REF_DATE = pd.Timestamp("2026-06-01")                 # frozen, same as notebook
HALF_LIFE_DAYS = 180.0

# ---------------------------------------------------------------------------
# Adaptive-weight tables (same as notebook Step 11)
# ---------------------------------------------------------------------------
ARCHETYPE_WEIGHTS = {
    "horror_thriller":   {"content": 0.25, "cf": 0.30, "profile": 0.40, "trending": 0.05},
    "crime_mystery":     {"content": 0.30, "cf": 0.30, "profile": 0.35, "trending": 0.05},
    "sci_fi_fantasy":    {"content": 0.30, "cf": 0.30, "profile": 0.35, "trending": 0.05},
    "mainstream_action": {"content": 0.25, "cf": 0.40, "profile": 0.30, "trending": 0.05},
    "comedy_family":     {"content": 0.30, "cf": 0.30, "profile": 0.30, "trending": 0.10},
    "classic_drama":     {"content": 0.35, "cf": 0.30, "profile": 0.30, "trending": 0.05},
    "drama_romance":     {"content": 0.30, "cf": 0.30, "profile": 0.35, "trending": 0.05},
    "mixed_viewer":      {"content": 0.30, "cf": 0.30, "profile": 0.30, "trending": 0.10},
}
DEFAULT_WEIGHTS = {"content": 0.30, "cf": 0.30, "profile": 0.30, "trending": 0.10}
COLD_OVERRIDE   = {"content": 0.20, "cf": 0.05, "profile": 0.55, "trending": 0.20}
EARLY_OVERRIDE  = {"content": 0.30, "cf": 0.20, "profile": 0.35, "trending": 0.15}

# Profile score weights (used when computing live profile score)
PROFILE_JACCARD_W   = 0.75
PROFILE_ARCHETYPE_W = 0.25
ARCHETYPE_BOOSTS = {
    "horror_thriller":   {"horror", "thriller", "mystery"},
    "crime_mystery":     {"crime", "mystery", "thriller"},
    "sci_fi_fantasy":    {"science fiction", "fantasy", "adventure", "action"},
    "mainstream_action": {"action", "adventure", "thriller"},
    "comedy_family":     {"comedy", "family", "animation"},
    "classic_drama":     {"drama", "history", "war"},
    "drama_romance":     {"drama", "romance"},
    "mixed_viewer":      set(),
}

# ---------------------------------------------------------------------------
# State container (loaded once at startup, shared across requests)
# ---------------------------------------------------------------------------
class Engine:
    """Holds loaded artifacts and the live DB pool."""

    def __init__(self) -> None:
        self.movie_embeddings:   Optional[np.ndarray] = None
        self.content_similarity: Optional[np.ndarray] = None
        self.trending_scores:    dict = {}
        self.underrated_scores:  dict = {}
        self.regional_scores:    dict = {}
        self.profile_matrix:     Optional[pd.DataFrame] = None
        self.movie_index:        dict = {}
        self.cf_model:           Optional[SVD] = None

        # Live Postgres pool
        self.db_pool: Optional[asyncpg.Pool] = None

        # In-memory cache of catalog (small) — keyed by tmdbId
        self.movies_by_tmdb: dict[int, dict] = {}    # tmdbId -> {id, title, genres[], source, language}
        self.tmdb_to_uuid:   dict[int, str]   = {}    # tmdbId -> Movie.id (UUID)
        self.uuid_to_tmdb:   dict[str, int]   = {}    # UUID -> tmdbId (only for TMDB movies)

        # Locally-added movies (no TMDB id) — keyed by UUID
        self.local_movies:              dict[str, dict] = {}    # uuid -> {title, genres, language, source, embedding, _synthetic_id}
        self.local_to_tmdb_similarity:  dict[str, np.ndarray] = {}  # uuid -> (N,) sim to all training movies
        # Synthetic negative ids for local movies (so SVD can train on them)
        self.synthetic_to_uuid:         dict[int, str]   = {}    # -1 -> uuid
        self.uuid_to_synthetic:         dict[str, int]   = {}    # uuid -> -1

        # Nepali movie metadata loaded from XLSX (poster URLs, director, cast, etc.)
        self.nepali_extras_by_tmdb:     dict[int, dict]  = {}    # tmdb_id -> extras
        self.nepali_extras_by_title:    dict[str, dict]  = {}    # lowercase title -> extras
        self.nepali_extras_by_uuid:     dict[str, dict]  = {}    # NPxxx -> extras (for pre-DB-insert movies)

    def ready(self) -> bool:
        return (self.content_similarity is not None
                and self.cf_model is not None
                and self.db_pool is not None)


engine = Engine()


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load artifacts and open DB pool once, at startup."""
    print(">>> FilmMosaic: loading artifacts...")
    with open(ARTIFACT_DIR / "embeddings.pkl", "rb") as f:
        engine.movie_embeddings = pickle.load(f)
    with open(ARTIFACT_DIR / "similarity.pkl", "rb") as f:
        engine.content_similarity = pickle.load(f)
    with open(ARTIFACT_DIR / "trending.pkl", "rb") as f:
        engine.trending_scores = pickle.load(f)
    with open(ARTIFACT_DIR / "underrated.pkl", "rb") as f:
        engine.underrated_scores = pickle.load(f)
    with open(ARTIFACT_DIR / "regional.pkl", "rb") as f:
        engine.regional_scores = pickle.load(f)
    with open(ARTIFACT_DIR / "profile_matrix.pkl", "rb") as f:
        engine.profile_matrix = pickle.load(f)
    with open(ARTIFACT_DIR / "movie_index.pkl", "rb") as f:
        engine.movie_index = pickle.load(f)

    # Build a small int->int lookup for tmdbId similarity lookups
    # (content_similarity is indexed by integer movie_id from the training set)
    engine.movie_id_to_idx = engine.movie_index["movie_id_to_idx"]
    engine.idx_to_movie_id = engine.movie_index["idx_to_movie_id"]
    engine.all_tmdb_ids     = list(engine.movie_id_to_idx.keys())

    print(">>> FilmMosaic: connecting to PostgreSQL...")
    engine.db_pool = await asyncpg.create_pool(
        DATABASE_URL, min_size=1, max_size=5, command_timeout=10
    )

    # Load the live movie catalog once (small, refreshed per /refresh)
    await _refresh_catalog()

    # Pre-train the SVD model on ALL live ratings from Postgres so the CF
    # signal is up-to-date (not just the static training CSV).
    await _retrain_cf_from_db()

    # Load Nepali movie metadata (poster URLs, director, cast) from XLSX
    _load_nepali_extras()

    print(">>> FilmMosaic: ready.")
    yield
    if engine.db_pool:
        await engine.db_pool.close()
    print(">>> FilmMosaic: shut down.")


async def _refresh_catalog() -> None:
    """Reload the movie catalog from Postgres and build tmdb->uuid maps.

    Two catalogs are maintained:
      - movies_by_tmdb: movies that have a TMDB id (5,119 from training, plus
        any imported TMDB movies). These use the existing similarity matrix.
      - local_movies: movies without a TMDB id (locally added Nepali films).
        These get fresh SBERT embeddings at load time, plus cross-similarity
        against all training movies for content-based scoring.

    Falls back to the static combined_movies.csv if the DB isn't migrated
    yet (so the service still works for local dev / demo before Prisma
    migrations have been run).
    """
    engine.movies_by_tmdb.clear()
    engine.tmdb_to_uuid.clear()
    engine.uuid_to_tmdb.clear()
    engine.local_movies.clear()
    engine.local_to_tmdb_similarity.clear()

    db_ok = False
    try:
        async with engine.db_pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT id, "tmdbId", title, genres, language, source, description '
                'FROM "Movie"'
            )
        db_ok = True
    except Exception as e:
        print(f">>> FilmMosaic: DB catalog unavailable ({type(e).__name__}: {e})")

    if not db_ok:
        # Fallback: static CSV (no local movies in this path)
        csv_path = ARTIFACT_DIR / "combined_movies.csv"
        if csv_path.exists():
            df = pd.read_csv(csv_path)
            for _, r in df.iterrows():
                try:
                    tmdb = int(r["movie_id"])
                except (ValueError, TypeError):
                    continue
                is_regional = pd.notna(r.get("is_regional")) and bool(r.get("is_regional"))
                source = "NEPALI" if is_regional else "TMDB"
                engine.movies_by_tmdb[tmdb] = {
                    "id":       str(tmdb),
                    "title":    str(r.get("title", "")),
                    "genres":   str(r.get("genres", "")).strip("[]").replace("'", "").split(", ") if r.get("genres") else [],
                    "language": str(r.get("language", "")) if r.get("language") else "",
                    "source":   source,
                }
                engine.tmdb_to_uuid[tmdb] = str(tmdb)
                engine.uuid_to_tmdb[str(tmdb)] = tmdb
            print(f">>> FilmMosaic: catalog loaded from CSV — {len(engine.movies_by_tmdb):,} movies")
        return

    # DB path: process all movies
    n_tmdb, n_local = 0, 0
    for r in rows:
        uuid = str(r["id"])
        tmdb = r["tmdbId"]
        title = r["title"] or ""
        genres = list(r["genres"] or [])
        language = r["language"] or ""
        source = r["source"] or "TMDB"
        description = r["description"] or ""

        if tmdb is not None:
            # Standard movie: use existing catalog + similarity matrix
            tmdb_int = int(tmdb)
            if tmdb_int in engine.movie_id_to_idx:
                engine.movies_by_tmdb[tmdb_int] = {
                    "id": uuid, "title": title, "genres": genres,
                    "language": language, "source": source,
                }
                engine.tmdb_to_uuid[tmdb_int] = uuid
                engine.uuid_to_tmdb[uuid] = tmdb_int
                n_tmdb += 1
            else:
                # Has a TMDB id but it's not in the training set — treat as local
                pass  # will be handled below

        if tmdb is None:
            # Truly local movie (no TMDB id, added through admin panel)
            # Build the same SBERT text used during training
            sbert_text = _build_local_sbert_text(title, genres, language, source, description)
            try:
                emb = _get_sbert().encode([sbert_text], normalize_embeddings=True)[0]
            except Exception as e:
                print(f">>> FilmMosaic: SBERT encode failed for {uuid} ({e})")
                continue
            engine.local_movies[uuid] = {
                "id": uuid, "title": title, "genres": genres,
                "language": language, "source": source, "embedding": emb,
            }
            # Cross-similarity to all training movies (shape: N,)
            engine.local_to_tmdb_similarity[uuid] = engine.movie_embeddings @ emb
            n_local += 1
        elif int(tmdb) not in engine.movie_id_to_idx:
            # Has a TMDB id but it's NOT in our training set (5,119 movies).
            # We can't score it (no similarity matrix entry, no SVD factors),
            # so skip it from recommendations entirely. Future enhancement:
            # add dynamic embeddings for these too.
            pass

    print(f">>> FilmMosaic: catalog loaded from DB — {n_tmdb} TMDB movies, {n_local} local movies")


def _build_local_sbert_text(title, genres, language, source, description):
    """Build the same text representation used during training (Step 4 in notebook)."""
    parts = []
    if title: parts.append(f"Title: {title}.")
    if genres: parts.append("Genres: " + " ".join(sorted(genres)) + ".")
    if description: parts.append(f"Overview: {description}.")
    if language: parts.append(f"Language: {language}.")
    if source == "NEPALI": parts.append("Regional film.")
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Nepali movie metadata (XLSX)
# ---------------------------------------------------------------------------
NEPALI_XLSX_NAME = "Nepali_movie_details.xlsx"

def _load_nepali_extras() -> None:
    """Load Nepali_movie_details.xlsx for poster URLs and metadata enrichment.

    Builds three lookup tables:
      - engine.nepali_extras_by_tmdb[int]    : match by TMDB id
      - engine.nepali_extras_by_title[str]   : match by lowercased title
      - engine.nepali_extras_by_uuid[str]    : match by NPxxx id (pre-import)
    """
    xlsx_path = ARTIFACT_DIR / NEPALI_XLSX_NAME
    if not xlsx_path.exists():
        # Try project root too
        xlsx_path = Path(__file__).parent / NEPALI_XLSX_NAME
    if not xlsx_path.exists():
        print(">>> FilmMosaic: Nepali extras file not found (skipping enrichment)")
        return

    try:
        df = pd.read_excel(xlsx_path)
    except Exception as e:
        print(f">>> FilmMosaic: failed to read {NEPALI_XLSX_NAME}: {e}")
        return

    loaded = 0
    for _, row in df.iterrows():
        extras = {
            "posterUrl":     _safe_str(row.get("poster_link")),
            "director":       _safe_str(row.get("director")),
            "cast":          _safe_str(row.get("cast")),
            "originalTitle": _safe_str(row.get("original_title")),
            "releaseYear":    int(row["release_year"]) if pd.notna(row.get("release_year")) else None,
            "themesGenres":  _safe_str(row.get("themes_genres")),
            "xlsxMovieUuid": _safe_str(row.get("movie_uuid")),
            "source":         _safe_str(row.get("source")) or "NEPALI",
        }

        tmdb = row.get("tmdb_id")
        if pd.notna(tmdb):
            try:
                engine.nepali_extras_by_tmdb[int(tmdb)] = extras
            except (ValueError, TypeError):
                pass

        title = row.get("title")
        if pd.notna(title):
            engine.nepali_extras_by_title[str(title).lower().strip()] = extras

        xlsx_uuid = row.get("movie_uuid")
        if pd.notna(xlsx_uuid):
            engine.nepali_extras_by_uuid[str(xlsx_uuid).strip()] = extras

        loaded += 1

    print(f">>> FilmMosaic: loaded {loaded} Nepali movie extras from {xlsx_path.name}")


def _safe_str(val) -> str:
    """Return val as a stripped string, or '' if NaN/None."""
    if val is None: return ""
    try:
        if pd.isna(val): return ""
    except (TypeError, ValueError):
        pass
    return str(val).strip()


def _get_extras_for_movie(uuid: Optional[str] = None, tmdb: Optional[int] = None,
                          title: Optional[str] = None,
                          xlsx_uuid: Optional[str] = None) -> dict:
    """Look up Nepali extras for a movie, trying multiple keys in order."""
    if xlsx_uuid and xlsx_uuid in engine.nepali_extras_by_uuid:
        return engine.nepali_extras_by_uuid[xlsx_uuid]
    if tmdb and tmdb in engine.nepali_extras_by_tmdb:
        return engine.nepali_extras_by_tmdb[tmdb]
    if title:
        key = str(title).lower().strip()
        if key in engine.nepali_extras_by_title:
            return engine.nepali_extras_by_title[key]
    return {}


async def _retrain_cf_from_db() -> None:
    """Train the SVD model on the live ratings table.

    Falls back to the static CSV if the DB has very few ratings or the
    reviews table doesn't exist, so the service still works before the
    system has any production interactions.

    Local movies (no TMDB id) get a synthetic negative id (-1, -2, ...)
    so they can also participate in SVD training.
    """
    db_ratings: list[tuple[int, str, float]] = []
    try:
        async with engine.db_pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT "userId", "movieId", rating, "createdAt" FROM "Review" WHERE rating IS NOT NULL'
            )
        db_ratings = [(int(r["userId"]), str(r["movieId"]), float(r["rating"])) for r in rows]
        print(f">>> FilmMosaic: live ratings from DB = {len(db_ratings)}")
    except Exception as e:
        print(f">>> FilmMosaic: DB reviews unavailable ({type(e).__name__}: {e})")

    if len(db_ratings) == 0:
        # DB has no ratings — fall back to static CSV
        print(">>> FilmMosaic: using static CSV for CF training (DB has no ratings)")
        csv_path = ARTIFACT_DIR / "synthetic_movie_ratings_realistic.csv"
        df = pd.read_csv(csv_path)
        df = df[df["rating"].between(0.5, 5.0)]
    else:
        # Assign synthetic ids to local movies that have ratings
        local_uuids_with_ratings = {
            uuid for uid, uuid, r in db_ratings
            if uuid in engine.local_movies
        }
        synth_id_counter = -1
        for uuid in engine.local_movies:
            if uuid in local_uuids_with_ratings and "_synthetic_id" not in engine.local_movies[uuid]:
                engine.local_movies[uuid]["_synthetic_id"] = synth_id_counter
                engine.synthetic_to_uuid[synth_id_counter] = uuid
                engine.uuid_to_synthetic[uuid] = synth_id_counter
                synth_id_counter -= 1

        # Build (user_id, internal_movie_id, rating) triples
        import sys
        triples = []
        skipped = 0
        for uid, uuid, r in db_ratings:
            if uuid in engine.uuid_to_tmdb:
                mid = engine.uuid_to_tmdb[uuid]
            elif uuid in engine.local_movies and "_synthetic_id" in engine.local_movies[uuid]:
                mid = engine.local_movies[uuid]["_synthetic_id"]
            else:
                skipped += 1
                continue
            triples.append((uid, mid, r))
        print(f">>> FilmMosaic: training triples = {len(triples)} (skipped {skipped} unknown movies)")
        print(f">>> FilmMosaic: local movies in training = {len([m for m in engine.local_movies.values() if '_synthetic_id' in m])}")
        df = pd.DataFrame(triples, columns=["user_id", "movie_id", "rating"])

    reader = Reader(rating_scale=(0.5, 5.0))
    data = Dataset.load_from_df(df[["user_id", "movie_id", "rating"]], reader)
    trainset = data.build_full_trainset()
    engine.cf_model = SVD(n_factors=50, n_epochs=30, random_state=42).fit(trainset)
    print(">>> FilmMosaic: SVD (re)trained.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FilmMosaic v2 — Recommendation Service",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {
        "status":       "ok" if engine.ready() else "loading",
        "movies":       len(engine.movies_by_tmdb),
        "trainset":     "live-db" if engine.cf_model else "missing",
        "artifacts":    "loaded" if engine.content_similarity is not None else "missing",
        "ref_date":     REF_DATE.date().isoformat(),
        "checked_at":   datetime.utcnow().isoformat() + "Z",
    }


@app.post("/refresh")
async def refresh():
    """Re-pull the catalog and retrain the CF model from Postgres."""
    await _refresh_catalog()
    await _retrain_cf_from_db()
    return {"status": "ok", "movies": len(engine.movies_by_tmdb)}


# ---------------------------------------------------------------------------
# Per-request DB queries
# ---------------------------------------------------------------------------
async def fetch_user_context(user_id: int) -> dict:
    """Read everything the engine needs for one user from Postgres.

    Falls back to the static CSVs if the DB is unavailable, so the service
    still serves the demo users (1-240 in the training data) without a
    migrated database.

    Returned watched_tmdb field is actually a set of Movie UUIDs (UUIDs work
    for both TMDB movies and locally-added Nepali movies).
    """
    # Try Postgres first
    import sys
    try:
        async with engine.db_pool.acquire() as conn:
            user_row = await conn.fetchrow(
                'SELECT id, "genrePreferences" FROM users WHERE id = $1',
                user_id,
            )
            if user_row is not None:
                # Watched list — table may not exist yet (pre-migration)
                watched_uuids: set[str] = set()
                try:
                    watched_rows = await conn.fetch(
                        """SELECT lm."movieId"
                           FROM "List" l
                           JOIN "ListMovie" lm ON lm."listId" = l.id
                           WHERE l."userId" = $1 AND l."systemType" = 'watched'""",
                        user_id,
                    )
                    watched_uuids = {str(r["movieId"]) for r in watched_rows}
                except Exception as e:
                    print(f">>> FilmMosaic: lists query failed ({type(e).__name__}); treating watched as empty", file=sys.stderr)

                # Ratings — resolve movie UUID -> tmdbId (only for TMDB movies)
                ratings: list[dict] = []
                try:
                    rating_rows = await conn.fetch(
                        'SELECT "movieId", rating, "createdAt" FROM "Review" WHERE "userId" = $1',
                        user_id,
                    )
                    for r in rating_rows:
                        uuid = str(r["movieId"])
                        tmdb = engine.uuid_to_tmdb.get(uuid)
                        if tmdb is None: continue  # local movie rating, no SVD contribution
                        age = max((REF_DATE - pd.Timestamp(r["createdAt"])).days, 0)
                        ratings.append({"tmdb": tmdb, "rating": float(r["rating"]), "age_days": age})
                except Exception as e:
                    print(f">>> FilmMosaic: reviews query failed ({type(e).__name__}); treating ratings as empty", file=sys.stderr)

                # Note: field is named watched_tmdb for backward-compat but contains UUIDs
                return {
                    "user_id":          int(user_row["id"]),
                    "preferred_genres": list(user_row["genrePreferences"] or []),
                    "watched_tmdb":     watched_uuids,    # actually UUIDs (both TMDB + local)
                    "ratings":          ratings,
                }
    except Exception as e:
        print(f">>> FilmMosaic: fetch_user_context DB error ({type(e).__name__}: {e})")
        import traceback
        traceback.print_exc(file=sys.stderr)

    # Fallback: use the static CSVs (training-data users 1-240)
    profiles_csv = ARTIFACT_DIR / "synthetic_movie_user_profiles.csv"
    interactions_csv = ARTIFACT_DIR / "synthetic_movie_interactions_realistic.csv"
    if profiles_csv.exists():
        prof = pd.read_csv(profiles_csv)
        row = prof[prof["user_id"] == user_id]
        if row.empty:
            return None
        preferred = [g.strip() for g in str(row.iloc[0]["preferred_genres"]).split("|") if g.strip()]

        watched_tmdb: set[int] = set()
        ratings: list[dict] = []
        if interactions_csv.exists():
            inter = pd.read_csv(interactions_csv)
            inter["timestamp"] = pd.to_datetime(inter["timestamp"], errors="coerce")
            inter["age_days"] = (REF_DATE - inter["timestamp"]).dt.days.clip(lower=0)
            mine = inter[inter["user_id"] == user_id]
            for _, r in mine.iterrows():
                tmdb = int(r["movie_id"])
                if tmdb in engine.movie_id_to_idx:
                    watched_tmdb.add(tmdb)
                    if r.get("interaction_type") == "rating" and pd.notna(r.get("rating")):
                        ratings.append({
                            "tmdb":     tmdb,
                            "rating":   float(r["rating"]),
                            "age_days": int(r["age_days"]),
                        })

        return {
            "user_id":          int(user_id),
            "preferred_genres": preferred,
            "watched_tmdb":     watched_tmdb,
            "ratings":          ratings,
        }
    return None


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------
def _normalize(d: dict) -> dict:
    if not d: return {}
    vals = np.array(list(d.values()), dtype=float)
    lo, hi = float(np.nanmin(vals)), float(np.nanmax(vals))
    if np.isclose(lo, hi):
        # Only one unique value (single-entry dict or all-equal) —
        # return the raw value clipped to [0, 1] instead of zeroing it out.
        # This matters for local movies (often just 1 candidate) — without
        # this fix, a single local movie gets score 0 and never appears.
        return {k: float(np.clip(v, 0.0, 1.0)) for k, v in d.items()}
    return {k: float((v - lo) / (hi - lo)) for k, v in d.items()}


def _get_user_type(n: int, target: float) -> str:
    cold_t  = max(4,  int(target * 0.10))
    early_t = max(29, int(target * 0.60))
    if n <= cold_t:  return "cold_start"
    if n <= early_t: return "early_user"
    return "active_user"


def _get_weights(archetype: str | None) -> dict:
    if not archetype: return DEFAULT_WEIGHTS
    return ARCHETYPE_WEIGHTS.get(archetype, DEFAULT_WEIGHTS)


def _infer_archetype(preferred_genres: list[str]) -> str:
    """Map the user's genrePreferences to a coarse archetype."""
    if not preferred_genres:
        return "mixed_viewer"
    g = {x.strip().lower() for x in preferred_genres if x.strip()}
    if g & {"horror", "thriller", "mystery"} and len(g & {"horror", "thriller", "mystery"}) >= 2:
        return "horror_thriller"
    if g & {"crime", "mystery"}:
        return "crime_mystery"
    if g & {"science fiction", "fantasy"}:
        return "sci_fi_fantasy"
    if g & {"action", "adventure"}:
        return "mainstream_action"
    if g & {"comedy", "family", "animation"}:
        return "comedy_family"
    if g & {"history", "war"}:
        return "classic_drama"
    if g & {"romance"}:
        return "drama_romance"
    if g & {"drama"}:
        return "classic_drama"
    return "mixed_viewer"


def _profile_score_for(preferred_genres: list[str], archetype: str,
                       movie_genres: list[str]) -> float:
    pref  = {g.strip().lower() for g in preferred_genres if g}
    boost = ARCHETYPE_BOOSTS.get(archetype, set())
    mg    = {g.strip().lower() for g in movie_genres if g}
    if not mg or (not pref and not boost):
        return 0.0
    jacc = (len(pref & mg) / len(pref | mg)) if (pref | mg) else 0.0
    arc  = (len(boost & mg) / len(boost)) if boost else 0.0
    return float(np.clip(PROFILE_JACCARD_W * jacc + PROFILE_ARCHETYPE_W * arc, 0.0, 1.0))


def _content_score(ctx: dict, candidate_tmdb: list[int]) -> dict[int, float]:
    """Vectorized content score with time decay over the user's watched + rated movies."""
    # Build a (movie_id, age_days) list from both watched and rated
    history: list[tuple[int, int]] = []      # (tmdbId, age_days)
    watched = ctx["watched_tmdb"]
    for tmdb in watched:
        if tmdb in engine.movie_id_to_idx:
            history.append((tmdb, 0))        # assume recent for watched
    for r in ctx["ratings"]:
        if r["tmdb"] in engine.movie_id_to_idx:
            history.append((r["tmdb"], int(r["age_days"])))
    if not history:
        return {m: 0.0 for m in candidate_tmdb}

    decay = np.exp(-np.array([h[1] for h in history], dtype=float) / HALF_LIFE_DAYS)
    widx  = [engine.movie_id_to_idx[h[0]] for h in history]

    out: dict[int, float] = {}
    for tmdb in candidate_tmdb:
        if tmdb not in engine.movie_id_to_idx:
            out[tmdb] = 0.0; continue
        cidx = engine.movie_id_to_idx[tmdb]
        sims = engine.content_similarity[np.ix_(widx, [cidx])].ravel()
        out[tmdb] = float(np.dot(sims, decay) / max(decay.sum(), 1e-9))
    return out


def _collaborative_score(user_id: int, candidate_tmdb: list[int]) -> dict[int, float]:
    out = {}
    for tmdb in candidate_tmdb:
        pred = engine.cf_model.predict(uid=user_id, iid=tmdb).est
        out[tmdb] = float(np.clip((pred - 0.5) / 4.5, 0.0, 1.0))
    return out

def _local_collaborative_score(user_id: int, candidate_uuids: list[str]) -> dict[str, float]:
    """CF score for local movies using their synthetic TMDB ids in SVD."""
    out = {}
    for uuid in candidate_uuids:
        info = engine.local_movies.get(uuid)
        if not info or "_synthetic_id" not in info:
            out[uuid] = 0.0
            continue
        synthetic = info["_synthetic_id"]
        try:
            pred = engine.cf_model.predict(uid=user_id, iid=synthetic).est
            out[uuid] = float(np.clip((pred - 0.5) / 4.5, 0.0, 1.0))
        except Exception:
            out[uuid] = 0.0
    return out


def _profile_score(archetype: str, preferred: list[str],
                   candidate_tmdb: list[int]) -> dict[int, float]:
    return {
        tmdb: _profile_score_for(preferred, archetype, engine.movies_by_tmdb.get(tmdb, {}).get("genres", []))
        for tmdb in candidate_tmdb
    }


def _trending_score(candidate_tmdb: list[int]) -> dict[int, float]:
    return {tmdb: float(engine.trending_scores.get(tmdb, 0.0)) for tmdb in candidate_tmdb}


# ---------------------------------------------------------------------------
# Main recommendation endpoint
# ---------------------------------------------------------------------------
@app.get("/recommend/{user_id}")
async def recommend(
    user_id: int,
    n: int = Query(10, ge=1, le=50, description="Number of items to return"),
    regional: int = Query(2, ge=0, le=10, description="Min regional films in slate"),
    underrated: int = Query(1, ge=0, le=10, description="Min underrated films in slate"),
    explain: bool = Query(False, description="If true, return full breakdown"),
):
    """Return top-N Movie UUIDs for a user.

    Default response (matches Node client's expected shape):
        ["uuid1", "uuid2", "uuid3", ...]

    With ?explain=true, returns:
        {"movieIds": [...], "items": [{...full per-signal breakdown...}]}
    """
    if not engine.ready():
        raise HTTPException(503, "Engine still loading")

    ctx = await fetch_user_context(user_id)
    if ctx is None:
        raise HTTPException(404, f"User {user_id} not found")

    # ---- Candidate sets -----------------------------------------------------
    watched_uuids = ctx["watched_tmdb"]  # this is actually UUIDs now (see fetch_user_context)
    # Note: we rename the field semantically — it's really UUIDs from the DB
    watched_uuids_set = set(watched_uuids)

    # TMDB candidates: movies in training set, not watched
    tmdb_candidates = [m for m in engine.all_tmdb_ids
                      if engine.tmdb_to_uuid.get(m) not in watched_uuids_set]
    # Local candidates: locally-added movies, not watched
    local_candidates = [u for u in engine.local_movies if u not in watched_uuids_set]

    if not tmdb_candidates and not local_candidates:
        return {"movieIds": [], "items": []} if explain else []

    # ---- Per-signal scores ---------------------------------------------------
    archetype = _infer_archetype(ctx["preferred_genres"])
    user_type = _get_user_type(
        n=len(watched_uuids_set) + len(ctx["ratings"]),
        target=40.0,
    )
    preferred = ctx["preferred_genres"]

    # TMDB scores (using existing logic)
    cs_t = _normalize(_content_score(ctx, tmdb_candidates))
    fs_t = _normalize(_collaborative_score(user_id, tmdb_candidates))
    ps_t = _normalize(_profile_score(archetype, preferred, tmdb_candidates))
    ts_t = _trending_score(tmdb_candidates)

    # Local scores — content + CF (via synthetic ids) + profile (no trending)
    cs_l = _normalize(_local_content_score(ctx, local_candidates))
    fs_l = _normalize(_local_collaborative_score(user_id, local_candidates))
    ps_l = _normalize(_local_profile_score(archetype, preferred, local_candidates))
    ts_l = {u: 0.0 for u in local_candidates}  # no trending for local

    # Weights
    w = (COLD_OVERRIDE if user_type == "cold_start"
         else EARLY_OVERRIDE if user_type == "early_user"
         else _get_weights(archetype))

    # Combined scores — keyed by UUID
    final_uuid_to_score: dict[str, float] = {}
    cs_norm: dict[str, float] = {}
    fs_norm: dict[str, float] = {}
    ps_norm: dict[str, float] = {}
    ts_norm: dict[str, float] = {}

    for tmdb in tmdb_candidates:
        uuid = engine.tmdb_to_uuid.get(tmdb)
        if not uuid: continue
        final_uuid_to_score[uuid] = (
            w["content"]  * cs_t.get(tmdb, 0) +
            w["cf"]       * fs_t.get(tmdb, 0) +
            w["profile"]  * ps_t.get(tmdb, 0) +
            w["trending"] * ts_t.get(tmdb, 0)
        )
        cs_norm[uuid] = cs_t.get(tmdb, 0)
        fs_norm[uuid] = fs_t.get(tmdb, 0)
        ps_norm[uuid] = ps_t.get(tmdb, 0)
        ts_norm[uuid] = ts_t.get(tmdb, 0)

    for uuid in local_candidates:
        final_uuid_to_score[uuid] = (
            w["content"]  * cs_l.get(uuid, 0) +
            w["cf"]       * fs_l.get(uuid, 0) +
            w["profile"]  * ps_l.get(uuid, 0) +
            w["trending"] * ts_l.get(uuid, 0)
        )
        cs_norm[uuid] = cs_l.get(uuid, 0)
        fs_norm[uuid] = fs_l.get(uuid, 0)
        ps_norm[uuid] = ps_l.get(uuid, 0)
        ts_norm[uuid] = 0.0
        ts_norm[uuid] = 0.0

    ranked = sorted(final_uuid_to_score.items(), key=lambda x: x[1], reverse=True)

    # ---- Reserve diversity slots --------------------------------------------
    n_reg = min(regional,
                sum(1 for u in final_uuid_to_score
                    if _is_regional_uuid(u)))
    n_und = min(underrated,
                sum(1 for u in final_uuid_to_score
                    if _is_underrated_uuid(u)))
    main_slots = max(n - n_reg - n_und, 0)

    chosen: list[tuple[str, float]] = []
    chosen_ids: set[str] = set()
    for uuid, sc in ranked:
        if len(chosen) >= main_slots: break
        if uuid in chosen_ids: continue
        chosen.append((uuid, sc)); chosen_ids.add(uuid)

    for uuid, sc in sorted([(u, s) for u, s in ranked
                            if _is_regional_uuid(u) and u not in chosen_ids],
                           key=lambda x: -x[1])[:n_reg]:
        chosen.append((uuid, sc)); chosen_ids.add(uuid)

    for uuid, sc in sorted([(u, s) for u, s in ranked
                            if _is_underrated_uuid(u) and u not in chosen_ids],
                           key=lambda x: -x[1])[:n_und]:
        chosen.append((uuid, sc)); chosen_ids.add(uuid)

    while len(chosen) < n:
        for uuid, sc in ranked:
            if len(chosen) >= n: break
            if uuid not in chosen_ids:
                chosen.append((uuid, sc)); chosen_ids.add(uuid)

    chosen = chosen[:n]
    movie_uuids = [u for u, _ in chosen]

    if not explain:
        return movie_uuids

    items = []
    for uuid, sc in chosen:
        info = _movie_info_by_uuid(uuid)
        comps = {"content": cs_norm.get(uuid, 0), "cf": fs_norm.get(uuid, 0),
                 "profile": ps_norm.get(uuid, 0), "trending": ts_norm.get(uuid, 0)}
        top = max(comps, key=comps.get)
        reason = {
            "content":  "Semantically similar to films you watched.",
            "cf":       "Users with similar taste rated this highly.",
            "profile":  "Matches your archetype and stated genre preferences.",
            "trending": "Trending on FilmMosaic right now.",
        }[top]
        if info.get("source") == "NEPALI":
            reason += " Regional / under-represented film."

        # Enrich with Nepali movie metadata (poster, director, cast, etc.) from XLSX
        extras = _get_extras_for_movie(
            uuid=uuid,
            tmdb=engine.uuid_to_tmdb.get(uuid),
            title=info.get("title", ""),
        )

        items.append({
            "id":             uuid,
            "tmdbId":         engine.uuid_to_tmdb.get(uuid),
            "title":          info.get("title", ""),
            "posterUrl":      extras.get("posterUrl") or info.get("posterUrl", ""),
            "originalTitle":  extras.get("originalTitle", ""),
            "releaseYear":    extras.get("releaseYear"),
            "director":       extras.get("director", ""),
            "cast":           extras.get("cast", ""),
            "genres":         info.get("genres", []),
            "language":       info.get("language", ""),
            "source":         info.get("source", "TMDB"),
            "isLocal":        uuid in engine.local_movies,
            "final_score":    float(sc),
            "content_score":  comps["content"],
            "cf_score":       comps["cf"],
            "profile_score":  comps["profile"],
            "trending_score": comps["trending"],
            "reason":         reason,
        })
    return {"movieIds": movie_uuids, "items": items, "userType": user_type, "archetype": archetype}


# ---- Helpers for local movies ---------------------------------------------
def _is_regional_uuid(uuid: str) -> bool:
    """True if this movie is regional (Nepali)."""
    if uuid in engine.local_movies:
        return engine.local_movies[uuid].get("source") == "NEPALI"
    tmdb = engine.uuid_to_tmdb.get(uuid)
    if tmdb is None:
        return False
    return bool(engine.regional_scores.get(tmdb, 0))

def _is_underrated_uuid(uuid: str) -> bool:
    if uuid in engine.local_movies:
        # Locally-added movies are "new" — treat as underrated if they have decent metadata
        return len(engine.local_movies[uuid].get("genres", [])) > 0
    tmdb = engine.uuid_to_tmdb.get(uuid)
    if tmdb is None:
        return False
    return engine.underrated_scores.get(tmdb, 0) > 0.7

def _movie_info_by_uuid(uuid: str) -> dict:
    if uuid in engine.local_movies:
        m = engine.local_movies[uuid]
        return {"title": m["title"], "genres": m["genres"],
                "language": m["language"], "source": m["source"]}
    tmdb = engine.uuid_to_tmdb.get(uuid)
    if tmdb is None:
        return {}
    return engine.movies_by_tmdb.get(tmdb, {})

def _local_content_score(ctx: dict, candidate_uuids: list[str]) -> dict[str, float]:
    """Content score for local movies using cross-similarity to watched movies."""
    if not candidate_uuids:
        return {}
    out: dict[str, float] = {}

    # Build (movie_id, age_days) from both watched (UUIDs) and rated TMDB ids
    history: list[tuple[int, int]] = []  # (idx_in_similarity_matrix, age_days)
    # The watched_uuids set is actually UUIDs in this code (renamed semantically)
    # We need to translate watched UUIDs -> tmdb ids for the cross-similarity lookup
    for uuid in ctx["watched_tmdb"]:  # really UUIDs
        tmdb = engine.uuid_to_tmdb.get(uuid)
        if tmdb is not None and tmdb in engine.movie_id_to_idx:
            history.append((engine.movie_id_to_idx[tmdb], 0))
    for r in ctx["ratings"]:
        if r["tmdb"] in engine.movie_id_to_idx:
            history.append((engine.movie_id_to_idx[r["tmdb"]], int(r["age_days"])))

    if not history:
        return {u: 0.0 for u in candidate_uuids}

    decay = np.exp(-np.array([h[1] for h in history], dtype=float) / HALF_LIFE_DAYS)
    widx = [h[0] for h in history]

    for uuid in candidate_uuids:
        sims = engine.local_to_tmdb_similarity.get(uuid)
        if sims is None:
            out[uuid] = 0.0; continue
        out[uuid] = float(np.dot(sims[widx], decay) / max(decay.sum(), 1e-9))
    return out

def _local_profile_score(archetype: str, preferred: list[str],
                         candidate_uuids: list[str]) -> dict[str, float]:
    return {
        uuid: _profile_score_for(preferred, archetype,
                                  engine.local_movies.get(uuid, {}).get("genres", []))
        for uuid in candidate_uuids
    }


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("recommend_service:app", host="0.0.0.0", port=8000, reload=False)
