import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = '5ee2ab49-8a04-436d-ae88-cf6943b51018';
const BASE = 'https://kinopoiskapiunofficial.tech/api';

/**
 * API для автоматического заполнения базы фильмов и сериалов.
 * Вызов: /api/kinokadr/seed?page=1&type=TOP_250_BEST_FILMS
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || 'TOP_250_BEST_FILMS'; // TOP_250_BEST_FILMS, TOP_100_POPULAR_FILMS, TOP_AWAIT_FILMS

  try {
    // 1. Получаем список фильмов
    const listRes = await fetch(`${BASE}/v2.2/films/top?type=${type}&page=${page}`, {
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
    });
    const listData = await listRes.json();

    if (!listData.films || listData.films.length === 0) {
      return NextResponse.json({ error: 'No films found', data: listData });
    }

    const results = [];

    // 2. Формируем данные
    for (const film of listData.films) {
      const movieData = {
        id: `kp-${film.filmId}`,
        title: film.nameEn || film.nameRu,
        title_ru: film.nameRu,
        image_url: film.posterUrl, // Используем постер
        type: film.type === 'TV_SERIES' ? 'series' : 'movie',
        category: film.genres?.[0]?.genre || 'Кино',
        year: parseInt(film.year) || null
      };

      // 3. Сохраняем в Supabase
      const { error } = await supabase
        .from('kinokadr_movies')
        .upsert(movieData, { onConflict: 'id' });

      results.push({ 
        title: film.nameRu, 
        status: error ? 'error' : 'success',
        error: error?.message 
      });
    }

    return NextResponse.json({
      message: `Processed page ${page}`,
      count: results.length,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
