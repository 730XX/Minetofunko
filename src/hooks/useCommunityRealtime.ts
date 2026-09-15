import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { CommunityFigure } from '../components/community/CommunityGallery';

export interface RealtimeUpdatePayload {
  id: string;
  downloads_count?: number;
  remix_count?: number;
  rating_avg?: number;
  rating_count?: number;
  title?: string;
  [key: string]: any;
}

interface UseCommunityRealtimeOptions {
  onUpdate?: (updated: RealtimeUpdatePayload) => void;
  onInsert?: (figure: CommunityFigure) => void;
  onDelete?: (id: string) => void;
  enabled?: boolean;
}

export function mapDbItemToFigure(item: any): CommunityFigure {
  const authorProfile = item.profiles;
  const authorName = authorProfile?.username || authorProfile?.display_name || 'Creador Anónimo';
  const initials = authorName.substring(0, 2).toUpperCase();
  const skinFormat = item.config?.skinFormat || 'standard';
  return {
    id: item.id,
    title: item.title,
    author: `@${authorName}`,
    authorInitials: initials,
    avatar_url: authorProfile?.avatar_url,
    image: item.preview_thumbnail_url || item.skin_url,
    alt: item.title,
    tag: item.tags?.[0] ? `#${item.tags[0]}` : '#Comunidad',
    badge2: 'Molde A4 Listo',
    rating: Number(item.rating_avg) || 5.0,
    reviews: Number(item.rating_count) || 1,
    downloads: Number(item.downloads_count) || 0,
    remixes: Number(item.remix_count) || 0,
    specLabel: skinFormat === 'legacy' ? '64x32 Legacy' : '64x64 HD',
    skin_url: item.skin_url,
    config: item.config,
    description: item.description || 'Figura Funko Pop personalizada creada y compartida en Minetofunko.',
    edition: 'Edición Comunidad',
    palette: ['#0f172a', '#10b981', '#4cd7f6', '#ffb95f'],
    created_at: item.created_at,
  };
}

/**
 * Custom Hook para gestionar la sincronización de Supabase Realtime
 * en la galería de la comunidad, aislando la lógica de WebSockets de la UI.
 */
export function useCommunityRealtime({
  onUpdate,
  onInsert,
  onDelete,
  enabled = true,
}: UseCommunityRealtimeOptions) {
  // Mantener referencias estables a los callbacks para evitar reconectar el socket en cada render
  const callbacksRef = useRef({ onUpdate, onInsert, onDelete });
  useEffect(() => {
    callbacksRef.current = { onUpdate, onInsert, onDelete };
  });

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('realtime_community_funkos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_funkos',
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as RealtimeUpdatePayload;
            if (updated?.id) {
              callbacksRef.current.onUpdate?.(updated);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              callbacksRef.current.onDelete?.(deletedId);
            }
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as any;
            if (!inserted || !inserted.is_public) return;

            // Enriquecer el registro con el perfil de autor desde la base de datos
            const { data, error } = await supabase
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
              .eq('id', inserted.id)
              .single();

            if (error || !data) return;
            const newFig = mapDbItemToFigure(data);
            callbacksRef.current.onInsert?.(newFig);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
