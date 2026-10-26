/* === CONTRATO DE APARÊNCIA === */
/* ----- Opções persistidas e migração não destrutiva ----- */
export const APPEARANCE_OPTIONS = Object.freeze({
  accent: ['blue', 'violet', 'green'],
  motion: ['off', 'subtle', 'normal'],
  blur: ['off', 'soft', 'normal', 'strong'],
  transparency: ['solid', 'default', 'high'],
});
export const DEFAULT_APPEARANCE = Object.freeze({
  hideWallpaper: false,
  accent: 'blue',
  motion: 'normal',
  blur: 'normal',
  transparency: 'default',
  accents: Object.freeze({
    dark: Object.freeze({ mode: 'auto', manual: 'blue' }),
    light: Object.freeze({ mode: 'auto', manual: 'blue' }),
  }),
});
export function normalizeAppearance(value) {
  const source = value && typeof value === 'object' ? value : {};
  const result = { accents: {}, hideWallpaper: source.hideWallpaper === true };
  for (const [key, options] of Object.entries(APPEARANCE_OPTIONS)) {
    result[key] = options.includes(source[key]) ? source[key] : DEFAULT_APPEARANCE[key];
  }
  for (const theme of ['dark', 'light']) {
    const entry = source.accents?.[theme];
    const legacy = !source.accents && APPEARANCE_OPTIONS.accent.includes(source.accent);
    result.accents[theme] = {
      mode: entry?.mode === 'manual' || legacy ? 'manual' : 'auto',
      manual: APPEARANCE_OPTIONS.accent.includes(entry?.manual)
        ? entry.manual
        : legacy
          ? source.accent
          : 'blue',
    };
  }
  return result;
}

/* === PALETAS AUTOMÁTICAS === */
/* ----- Amostragem limitada e paletas oficiais com contraste conhecido ----- */
export function accentFromPixels(pixels) {
  const weights = { blue: 0, green: 0, violet: 0 };
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => v / 255);
    const high = Math.max(r, g, b),
      low = Math.min(r, g, b),
      delta = high - low;
    if (delta < 0.15 || high < 0.12 || low > 0.9) continue;
    let hue =
      high === r ? ((g - b) / delta) % 6 : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    const distance = (target) => Math.min(Math.abs(hue - target), 360 - Math.abs(hue - target));
    const hues = { blue: 215, green: 155, violet: 270 };
    const family = Object.keys(hues).reduce(
      (best, color) => (distance(hues[color]) < distance(hues[best]) ? color : best),
      'blue',
    );
    weights[family] += delta;
  }
  return Object.keys(weights).reduce(
    (best, color) => (weights[color] > weights[best] ? color : best),
    'blue',
  );
}

export async function extractWallpaperAccent(url) {
  // Apenas imagens pessoais já decodificadas e mantidas localmente pelo gerenciador.
  if (typeof url !== 'string' || !url.startsWith('blob:')) return 'blue';
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return 'blue';
  context.drawImage(image, 0, 0, 32, 32);
  return accentFromPixels(context.getImageData(0, 0, 32, 32).data);
}
