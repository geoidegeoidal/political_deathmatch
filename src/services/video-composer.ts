import { VideoFrameState, VideoRenderConfig } from '../types/media.js';
import { PersonaProfile } from '../types/debate.js';

export const DEFAULT_RENDER_CONFIG: VideoRenderConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  backgroundColor: '#0B0F19',
  primaryColor: '#E11D48', // Rojo TV Sensacionalista
  accentColor: '#F59E0B', // Amarillo Alerta
  fontFamily: 'system-ui, -apple-system, sans-serif',
  showTensionMeter: true,
  showTicker: true,
  outputDir: './output/video'
};

/**
 * Generador de Layouts Visuales y Compositor de Estudio de Televisión (1080p).
 */
export class VideoComposer {
  private config: VideoRenderConfig;
  private personasMap: Map<string, PersonaProfile>;

  constructor(personas: PersonaProfile[], config: Partial<VideoRenderConfig> = {}) {
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.personasMap = new Map(personas.map(p => [p.id, p]));
  }

  /**
   * Genera el marcado SVG / Template visual para un fotograma o estado de turno específico.
   */
  public generateFrameSvg(state: VideoFrameState): string {
    const speaker = this.personasMap.get(state.activeSpeakerId);
    const opponent = state.targetSpeakerId ? this.personasMap.get(state.targetSpeakerId) : undefined;
    const speakerName = speaker?.name || state.speakerName;
    const speakerAlias = speaker?.alias || state.speakerAlias;

    return `
<svg width="${this.config.width}" height="${this.config.height}" viewBox="0 0 ${this.config.width} ${this.config.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradientes de Estudio TV -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#020617" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    
    <linearGradient id="gcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#991B1B" />
      <stop offset="60%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>

    <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#EF4444" />
    </linearGradient>
  </defs>

  <!-- 1. Fondo de Estudio -->
  <rect width="1920" height="1080" fill="url(#bgGrad)" />
  
  <!-- Luces de Estudio / Focos -->
  <circle cx="960" cy="200" r="500" fill="#3B82F6" opacity="0.08" />
  <circle cx="300" cy="400" r="400" fill="#EF4444" opacity="0.06" />
  <circle cx="1620" cy="400" r="400" fill="#F59E0B" opacity="0.06" />

  <!-- 2. Header / Top Bar -->
  <rect x="0" y="0" width="1920" height="90" fill="#000000" opacity="0.75" />
  <text x="60" y="58" font-family="${this.config.fontFamily}" font-size="32" font-weight="900" fill="#FFFFFF" letter-spacing="2">
    POLITICAL DEATHMATCH <tspan fill="#EF4444">TV</tspan>
  </text>
  
  <rect x="520" y="24" width="140" height="42" rx="6" fill="#DC2626" />
  <text x="590" y="52" font-family="${this.config.fontFamily}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
    BLOQUE ${state.blockNumber}
  </text>

  <!-- Termómetro de Tensión / Rating -->
  ${this.renderTensionMeterSvg(state.tensionScore)}

  <!-- 3. Escenario Principal según Camera Cue -->
  ${this.renderMainStageSvg(state, speaker, opponent)}

  <!-- 4. Generador de Caracteres (GC) / Cintillo Inferior -->
  ${this.renderLowerThirdsSvg(state, speakerName, speakerAlias)}

  <!-- 5. Breaking News Ticker (Barra Rodante) -->
  ${this.renderTickerSvg(state.topicTitle)}
</svg>
    `.trim();
  }

  private renderTensionMeterSvg(tension: number): string {
    const barWidth = 320;
    const fillWidth = Math.min(barWidth, Math.max(10, (tension / 100) * barWidth));
    const tensionLabel = tension >= 75 ? '¡ESTUDIO EN LLAMAS!' : tension >= 50 ? 'TENSIÓN ALTA' : 'DEBATE MODERADO';
    const labelColor = tension >= 75 ? '#EF4444' : tension >= 50 ? '#F59E0B' : '#10B981';

    return `
    <g transform="translate(1480, 24)">
      <text x="0" y="16" font-family="${this.config.fontFamily}" font-size="14" font-weight="800" fill="${labelColor}" letter-spacing="1">
        TENSIÓN: ${tension}% [${tensionLabel}]
      </text>
      <rect x="0" y="24" width="${barWidth}" height="14" rx="7" fill="#1E293B" />
      <rect x="0" y="24" width="${fillWidth}" height="14" rx="7" fill="url(#meterGrad)" />
    </g>
    `;
  }

  private renderMainStageSvg(state: VideoFrameState, speaker?: PersonaProfile, opponent?: PersonaProfile): string {
    if (state.cameraCue === 'SPLIT_SCREEN_VERSUS' && opponent) {
      return `
      <!-- SPLIT SCREEN VERSUS -->
      <!-- Panel Izquierdo: Orador Activo -->
      <g transform="translate(100, 140)">
        <rect width="820" height="640" rx="16" fill="#1E293B" stroke="#DC2626" stroke-width="4" />
        <text x="410" y="340" font-family="${this.config.fontFamily}" font-size="120" text-anchor="middle">🗣️</text>
        <rect x="20" y="550" width="780" height="70" rx="8" fill="#000000" opacity="0.8" />
        <text x="410" y="595" font-family="${this.config.fontFamily}" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          ${speaker?.name || state.speakerName}
        </text>
        ${state.isInterruption ? `
          <rect x="260" y="30" width="300" height="46" rx="6" fill="#DC2626" />
          <text x="410" y="62" font-family="${this.config.fontFamily}" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle">
            ¡INTERRUPCIÓN EN VIVO!
          </text>
        ` : ''}
      </g>

      <!-- Divisor Versus -->
      <circle cx="960" cy="460" r="50" fill="#DC2626" stroke="#FFFFFF" stroke-width="4" />
      <text x="960" y="475" font-family="${this.config.fontFamily}" font-size="36" font-weight="900" fill="#FFFFFF" text-anchor="middle">VS</text>

      <!-- Panel Derecho: Oponente Interpelado -->
      <g transform="translate(1000, 140)">
        <rect width="820" height="640" rx="16" fill="#0F172A" stroke="#475569" stroke-width="3" />
        <text x="410" y="340" font-family="${this.config.fontFamily}" font-size="120" text-anchor="middle">😠</text>
        <rect x="20" y="550" width="780" height="70" rx="8" fill="#000000" opacity="0.8" />
        <text x="410" y="595" font-family="${this.config.fontFamily}" font-size="28" font-weight="800" fill="#94A3B8" text-anchor="middle">
          ${opponent.name}
        </text>
      </g>
      `;
    }

    // SPEAKER FOCUS (Primer Plano)
    return `
    <!-- SPEAKER FOCUS -->
    <g transform="translate(560, 130)">
      <rect width="800" height="660" rx="24" fill="#1E293B" stroke="#3B82F6" stroke-width="4" />
      
      <!-- Avatar Placeholder con Emoción -->
      <circle cx="400" cy="300" r="160" fill="#0F172A" stroke="#60A5FA" stroke-width="6" />
      <text x="400" y="350" font-family="${this.config.fontFamily}" font-size="140" text-anchor="middle">
        ${this.getEmotionEmoji(state.emotion)}
      </text>

      <!-- Badge de Emoción -->
      <rect x="275" y="490" width="250" height="44" rx="22" fill="#0284C7" />
      <text x="400" y="520" font-family="${this.config.fontFamily}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
        ESTADO: ${state.emotion}
      </text>
    </g>
    `;
  }

  private renderLowerThirdsSvg(state: VideoFrameState, name: string, alias: string): string {
    return `
    <!-- GC / LOWER THIRDS -->
    <g transform="translate(100, 810)">
      <!-- Barra Principal del Titular (Rojo Intenso) -->
      <rect x="0" y="0" width="1720" height="110" rx="10" fill="url(#gcGrad)" stroke="#FEF08A" stroke-width="2" />
      
      <!-- Titular GC -->
      <text x="40" y="70" font-family="${this.config.fontFamily}" font-size="34" font-weight="900" fill="#FFFFFF" letter-spacing="1">
        ${state.headlineGC.toUpperCase()}
      </text>

      <!-- Caja de Identificación del Orador (Negro/Dorado) -->
      <rect x="0" y="-56" width="620" height="56" rx="6" fill="#09090B" stroke="#DC2626" stroke-width="2" />
      <text x="24" y="-18" font-family="${this.config.fontFamily}" font-size="24" font-weight="800" fill="#FACC15">
        ${name.toUpperCase()} <tspan font-size="18" font-weight="500" fill="#E2E8F0">| ${alias}</tspan>
      </text>
    </g>
    `;
  }

  private renderTickerSvg(topicTitle: string): string {
    return `
    <!-- TICKER INFERIOR -->
    <g transform="translate(0, 1030)">
      <rect x="0" y="0" width="1920" height="50" fill="#09090B" />
      <rect x="0" y="0" width="220" height="50" fill="#F59E0B" />
      <text x="110" y="32" font-family="${this.config.fontFamily}" font-size="18" font-weight="900" fill="#000000" text-anchor="middle">
        ÚLTIMO MINUTO
      </text>
      <text x="260" y="32" font-family="${this.config.fontFamily}" font-size="18" font-weight="600" fill="#FFFFFF">
        POLITICAL DEATHMATCH: DEBATIENDO EN VIVO SOBRE "${topicTitle.toUpperCase()}" • EMISIÓN SIN FILTROS
      </text>
    </g>
    `;
  }

  private getEmotionEmoji(emotion: string): string {
    switch (emotion) {
      case 'OUTRAGED':
      case 'ANGRY':
        return '🤬';
      case 'MOCKING':
      case 'SMUG':
        return '😏';
      case 'INTERRUPTING':
        return '💥';
      case 'TALKING':
      default:
        return '🎙️';
    }
  }
}
