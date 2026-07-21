// src/features/musica/lista/lista.js
// Proveedor de Datos de Música Predeterminada de Pancita (8 Canciones Reales)

export const PLAYLIST_REALES = [
  {
    id: 1,
    titulo: 'ATC - Around The World (Slowed & Reverb)',
    archivo: 'ATC - Around The World (Slowed & Reverb) ｜ Wesker Edit.mp3',
    peso: '8.5 MB',
    url: new URL('./ATC - Around The World (Slowed & Reverb) ｜ Wesker Edit.mp3', import.meta.url).href
  },
  {
    id: 2,
    titulo: 'Bazovyy Minimum (Базовый Минимум)',
    archivo: 'Bazovyy_Minimum.mp3',
    peso: '7.9 MB',
    url: new URL('./Bazovyy_Minimum.mp3', import.meta.url).href
  },
  {
    id: 3,
    titulo: 'bye (Altare remix) - Ariana Grande',
    archivo: 'bye (Altare remix) - Ariana Grande (slowed + reverb).mp3',
    peso: '7.2 MB',
    url: new URL('./bye (Altare remix) - Ariana Grande (slowed + reverb).mp3', import.meta.url).href
  },
  {
    id: 4,
    titulo: 'Cryon (sped up + extended), SR2X',
    archivo: 'Cryon (sped up + extended), SR2X.mp3',
    peso: '4.5 MB',
    url: new URL('./Cryon (sped up + extended), SR2X.mp3', import.meta.url).href
  },
  {
    id: 5,
    titulo: 'LOYALTY (Slowed)',
    archivo: 'LOYALTY (Slowed).mp3',
    peso: '6.1 MB',
    url: new URL('./LOYALTY (Slowed).mp3', import.meta.url).href
  },
  {
    id: 6,
    titulo: 'mike posner & seeb - i took a pill in ibiza',
    archivo: 'mike posner & seeb - i took a pill in ibiza ( slowed + reverb ).mp3',
    peso: '6.8 MB',
    url: new URL('./mike posner & seeb - i took a pill in ibiza ( slowed + reverb ).mp3', import.meta.url).href
  },
  {
    id: 7,
    titulo: 'Montagem Celestial Esperanza (EXTENDED)',
    archivo: 'Montagem Celestial Esperanza (EXTENDED) — Super Slowed + Reverb ｜ Best Version.mp3',
    peso: '10.0 MB',
    url: new URL('./Montagem Celestial Esperanza (EXTENDED) — Super Slowed + Reverb ｜ Best Version.mp3', import.meta.url).href
  },
  {
    id: 8,
    titulo: 'Sem Tempo (EXTENDED) — Ultra Slowed',
    archivo: 'Sem Tempo (EXTENDED) — Ultra Slowed + Reverb ｜ Best Version.mp3',
    peso: '11.0 MB',
    url: new URL('./Sem Tempo (EXTENDED) — Ultra Slowed + Reverb ｜ Best Version.mp3', import.meta.url).href
  }
];

export function obtenerListaPredeterminada() {
  return PLAYLIST_REALES;
}
