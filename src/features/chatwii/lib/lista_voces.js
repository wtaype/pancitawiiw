// src/features/chatwii/lib/lista_voces.js
// Catálogo completo de motores de voz con títulos concisos y limpios

export const PROVEEDORES_VOZ = [
  {
    id: 'azure',
    nombre: 'Microsoft Azure Neural (Recomendado)',
    cuota: '500,000 car/mes gratis',
    recomendado: true
  },
  {
    id: 'google',
    nombre: 'Google Cloud TTS (Neural2)',
    cuota: '1,000,000 car/mes gratis',
    recomendado: false
  },
  {
    id: 'elevenlabs',
    nombre: 'ElevenLabs (Hiper-Humana)',
    cuota: '10,000 car/mes gratis',
    recomendado: false
  },
  {
    id: 'webspeech',
    nombre: 'Navegador WebSpeech (Offline Local)',
    cuota: 'Ilimitado Gratis',
    recomendado: false
  }
];

export const LISTA_VOCES = {
  azure: [
    { id: 'es-MX-DaliaNeural', nombre: 'Dalia - Español Latino (Femenina)', genero: 'femenino', lang: 'es-MX' },
    { id: 'es-ES-ElviraNeural', nombre: 'Elvira - Español España (Femenina)', genero: 'femenino', lang: 'es-ES' },
    { id: 'es-ES-AlvaroNeural', nombre: 'Álvaro - Español España (Masculino)', genero: 'masculino', lang: 'es-ES' },
    { id: 'es-MX-JorgeNeural', nombre: 'Jorge - Español Latino (Masculino)', genero: 'masculino', lang: 'es-MX' },
    { id: 'es-US-PalomaNeural', nombre: 'Paloma - Español EE.UU. (Femenina)', genero: 'femenino', lang: 'es-US' },
    { id: 'es-AR-ElenaNeural', nombre: 'Elena - Español Argentina (Femenina)', genero: 'femenino', lang: 'es-AR' }
  ],
  google: [
    { id: 'es-ES-Neural2-A', nombre: 'Google Neural2 A - Español (Femenina)', genero: 'femenino', lang: 'es-ES' },
    { id: 'es-ES-Neural2-B', nombre: 'Google Neural2 B - Español (Masculino)', genero: 'masculino', lang: 'es-ES' },
    { id: 'es-US-Neural2-A', nombre: 'Google Neural2 A - Latino (Femenina)', genero: 'femenino', lang: 'es-US' },
    { id: 'es-US-Neural2-B', nombre: 'Google Neural2 B - Latino (Masculino)', genero: 'masculino', lang: 'es-US' }
  ],
  elevenlabs: [
    { id: '21m00Tcm4TlvDq8ikWAM', nombre: 'Rachel - Expresiva (Femenina)', genero: 'femenino', lang: 'es' },
    { id: 'AZnzlk1XvdvUeBnXmlld', nombre: 'Domi - Cálida (Femenina)', genero: 'femenino', lang: 'es' },
    { id: 'ErXwobaYiN019PkySvjV', nombre: 'Antoni - Profunda (Masculino)', genero: 'masculino', lang: 'es' },
    { id: 'EXAVITQu4vr4xnSDxMaL', nombre: 'Bella - Melódica (Femenina)', genero: 'femenino', lang: 'es' }
  ],
  webspeech: [
    { id: 'ws-es-ES-femenina', nombre: 'Sistema Local - Femenina', genero: 'femenino', lang: 'es-ES' },
    { id: 'ws-es-ES-masculino', nombre: 'Sistema Local - Masculino', genero: 'masculino', lang: 'es-ES' }
  ]
};

export function obtenerVocesPorProveedor(proveedorId) {
  return LISTA_VOCES[proveedorId] || LISTA_VOCES.azure;
}

export function obtenerVozPorId(vozId) {
  for (const prov in LISTA_VOCES) {
    const match = LISTA_VOCES[prov].find(v => v.id === vozId);
    if (match) return { ...match, proveedor: prov };
  }
  return { ...LISTA_VOCES.azure[0], proveedor: 'azure' };
}
