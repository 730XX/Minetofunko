import { supabase } from '../lib/supabase';
import type { PartTransformation } from '../core/engine/types';

export interface PublishFunkoPayload {
  title: string;
  description?: string;
  tags: string[];
  skinCanvas: HTMLCanvasElement;
  previewCanvas: HTMLCanvasElement;
  parts: PartTransformation[];
  overlayParts: PartTransformation[];
  skinFormat: string;
  skinName: string;
  isPublic?: boolean;
}

// Convierte un canvas en Blob para subir a Supabase Storage
function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar el blob del canvas'));
    }, type, quality);
  });
}

export async function publishFunkoToCommunity(payload: PublishFunkoPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para publicar un Funko.');
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  // 1. Subir PNG de la skin
  const skinBlob = await canvasToBlob(payload.skinCanvas, 'image/png');
  const skinPath = `${user.id}/skin_${timestamp}_${randomSuffix}.png`;
  const { error: skinUploadError } = await supabase.storage
    .from('skins')
    .upload(skinPath, skinBlob, { contentType: 'image/png', upsert: true });

  if (skinUploadError) {
    console.error('Error subiendo skin:', skinUploadError);
    throw new Error('No se pudo subir la imagen de la skin a Supabase Storage.');
  }

  const { data: { publicUrl: skinUrl } } = supabase.storage
    .from('skins')
    .getPublicUrl(skinPath);

  // 2. Subir miniatura de preview (WebP optimizado)
  const previewBlob = await canvasToBlob(payload.previewCanvas, 'image/webp', 0.85);
  const previewPath = `${user.id}/preview_${timestamp}_${randomSuffix}.webp`;
  const { error: previewUploadError } = await supabase.storage
    .from('previews')
    .upload(previewPath, previewBlob, { contentType: 'image/webp', upsert: true });

  if (previewUploadError) {
    console.error('Error subiendo preview:', previewUploadError);
    throw new Error('No se pudo subir la miniatura del Funko a Supabase Storage.');
  }

  const { data: { publicUrl: previewThumbnailUrl } } = supabase.storage
    .from('previews')
    .getPublicUrl(previewPath);

  // 3. Guardar registro en la tabla community_funkos
  const { data, error: insertError } = await supabase
    .from('community_funkos')
    .insert({
      author_id: user.id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      tags: payload.tags,
      skin_url: skinUrl,
      preview_thumbnail_url: previewThumbnailUrl,
      config: {
        parts: payload.parts,
        overlayParts: payload.overlayParts,
        skinFormat: payload.skinFormat,
        skinName: payload.skinName,
      },
      is_public: payload.isPublic ?? true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error insertando funko en base de datos:', insertError);
    throw new Error('No se pudo registrar el Funko en la base de datos.');
  }

  return data;
}

export interface FunkoQueryOptions {
  sortBy?: 'trending' | 'top' | 'downloads' | 'newest';
  tag?: string;
  search?: string;
  authorId?: string;
}

export async function fetchCommunityFunkos(options?: FunkoQueryOptions) {
  try {
    let query = supabase
      .from('community_funkos')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('is_public', true);

    if (options?.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    if (options?.tag && options.tag !== 'all' && options.tag !== '#Todos' && options.tag !== '#TODOS') {
      const cleanTag = options.tag.replace('#', '').toLowerCase();
      query = query.contains('tags', [cleanTag]);
    }

    if (options?.search && options.search.trim() !== '') {
      query = query.ilike('title', `%${options.search.trim()}%`);
    }

    if (options?.sortBy === 'top') {
      query = query.order('rating_avg', { ascending: false });
    } else if (options?.sortBy === 'downloads') {
      query = query.order('downloads_count', { ascending: false });
    } else if (options?.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('views_count', { ascending: false }).order('downloads_count', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Advertencia al consultar funkos de la comunidad:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error al conectar con el servidor', err);
    return [];
  }
}

export async function incrementFunkoDownload(id: string) {
  try {
    const { error } = await supabase.rpc('increment_funko_download', { target_funko_id: id });
    if (error) {
      console.warn('Error registrando descarga en Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Error registrando descarga:', err);
  }
}

export async function incrementFunkoView(id: string) {
  try {
    const { error } = await supabase.rpc('increment_funko_view', { target_funko_id: id });
    if (error) {
      console.warn('Error registrando vista en Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Error registrando vista:', err);
  }
}

export async function registerFunkoRemix(id: string) {
  try {
    const { error } = await supabase.rpc('register_funko_remix', { parent_funko_id: id });
    if (error) {
      console.warn('Error registrando remix en Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Error registrando remix:', err);
  }
}

