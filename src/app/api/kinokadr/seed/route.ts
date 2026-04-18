import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = '5ee2ab49-8a04-436d-ae88-cf6943b51018';
const BASE = 'https://kinopoiskapiunofficial.tech/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || 'TOP_250_BEST_FILMS';
  const cat = searchParams.get('cat') || 'films'; // films or series

  try {
    let url = `${BASE}/v2.2/films/top?type=${type}&page=${page}`;
    
    // Если нужны именно сериалы, используем другой эндпоинт с фильтрами
    if (cat === 'series') {
      url = `${BASE}/v2.2/films?order=RATING&type=TV_SERIES&page=${page}`;
    }

    const listRes = await fetch(url, {
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
    });
    const listData = await listRes.json();

    const items = listData.films || listData.items;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items found', data: listData });
    }

    const results = [];

    for (const item of items) {
      const filmId = item.filmId || item.kinopoiskId;
      const movieData = {
        id: `kp-${filmId}`,
        title: item.nameEn || item.nameRu || 'Unknown',
        title_ru: item.nameRu || item.nameEn || 'Без названия',
        image_url: item.posterUrl,
        type: (item.type === 'TV_SERIES' || cat === 'series') ? 'series' : 'movie',
        category: item.genres?.[0]?.genre || 'Кино',
        year: parseInt(item.year) || null
      };

      const { error } = await supabase
        .from('kinokadr_movies')
        .upsert(movieData, { onConflict: 'id' });

      results.push({ 
        title: movieData.title_ru, 
        status: error ? 'error' : 'success',
        error: error?.message 
      });
    }

    return NextResponse.json({
      message: `Processed page ${page} of ${cat}`,
      count: results.length,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
