/**
 * Obtiene la skin de un jugador de Minecraft por su nickname.
 * Usa Minotar / Crafatar / Ashcon para evitar bloqueos de CORS directos del navegador con api.mojang.com.
 */
export async function fetchSkinByUsername(username: string): Promise<string> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('El nombre de usuario no puede estar vacío');
  }

  // Minotar provee la textura de la skin directa y con headers CORS permisivos
  const skinUrl = `https://minotar.net/skin/${encodeURIComponent(cleanUsername)}`;

  // Validar cargando la imagen para confirmar que existe
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(skinUrl);
    img.onerror = () => reject(new Error(`No se pudo cargar la skin para el usuario "${cleanUsername}"`));
    img.src = skinUrl;
  });
}

/**
 * Carga una imagen HTML desde una URL o Data URL y retorna el elemento HTMLImageElement listo
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Error al cargar imagen: ${src} (${err})`));
    img.src = src;
  });
}
