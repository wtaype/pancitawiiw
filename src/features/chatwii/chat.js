// src/features/chatwii/chat.js
import './chat.css';
import { coachPersona } from './personalidad.js';

export function arrancar(container) {
  container.innerHTML = `
    <div class="chat_feature_wrap">
      <div class="chat_card">
        <h3><i class="fas fa-robot"></i> Asistente Pancita</h3>
        <p>🤖 ${coachPersona.saludos.es[0]}</p>
        <p>Aquí irá la interfaz interactiva de chat y comandos de voz hablados (SpeechSynthesis).</p>
      </div>
    </div>
  `;
}
