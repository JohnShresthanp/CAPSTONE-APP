import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { prisma } from '../src/config/db.js';
import { buildMovieSlug } from '../src/utils/tmdbMapper.js';

const require = createRequire(import.meta.url);
const csv = require('csv-parser');

const parseArray = (val) => {
  if (!val) return [];
  return val.split(',').map((s) => s.trim()).filter(Boolean);
};

const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseJson = (val) => {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
};

async function importMovies(csvPath) {
  const results = [];
  let imported = 0;
  let skipped = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of results) {
    const title = row.title?.trim();
    if (!title) {
      skipped++;
      continue;
    }

    const releaseDate = parseDate(row.release_date);
    const slug = buildMovieSlug(title, row.release_date);

    const existing = await prisma.movie.findFirst({
      where: { OR: [{ slug }, { title }] }
    });
    if (existing) {
      skipped++;
      continue;
    }

    const genres = parseArray(row.genres);
    const themes = parseArray(row.themes);
    const castNames = parseArray(row.cast);

    const movie = await prisma.movie.create({
      data: {
        source: 'NEPALI',
        title,
        slug,
        description: row.overview || row.description || null,
        releaseDate,
        posterUrl: row.poster_url || row.posterUrl || null,
        backdropUrl: row.backdrop_url || row.backdropUrl || null,
        language: row.language || 'ne',
        genres,
        themes,
        culturalMetadata: parseJson(row.cultural_metadata || row.culturalMetadata),
        runtime: row.runtime ? parseInt(row.runtime, 10) : null,
        status: row.status || 'Released'
      }
    });

    for (const name of castNames) {
      let person = await prisma.person.findFirst({
        where: { name }
      });
      if (!person) {
        person = await prisma.person.create({
          data: { name }
        });
      }
      await prisma.movieCast.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'ACTOR',
          characterName: null,
          orderIndex: null
        }
      }).catch(() => {});
    }

    const directorNames = parseArray(row.directors || row.director);
    for (const name of directorNames) {
      let person = await prisma.person.findFirst({
        where: { name }
      });
      if (!person) {
        person = await prisma.person.create({
          data: { name }
        });
      }
      await prisma.movieCast.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'DIRECTOR',
          characterName: null,
          orderIndex: null
        }
      }).catch(() => {});
    }

    imported++;
  }

  console.log(`\nImport complete: ${imported} imported, ${skipped} skipped\n`);
  await prisma.$disconnect();
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/importMovies.js <path-to-csv>');
  process.exit(1);
}

importMovies(path.resolve(csvPath));
