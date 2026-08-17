import { existsSync, readFileSync } from 'fs';
import path from 'path';
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

export const BRAND_TAGLINE = 'EL PRIMER PODCAST POLÍTICO SIN CENSURA CON IA';

const ASSETS_ROOT = path.join(process.cwd(), 'src', 'assets');

/**
 * Generador de Layouts Visuales y Compositor de Estudio de Televisión (1080p).
 * Soporta poses dinámicas, tiro de cámara real, GC con cuñas en vivo y degradación elegante.
 */
export class VideoComposer {
  private config: VideoRenderConfig;
  private personasMap: Map<string, PersonaProfile>;
  private assetCache = new Map<string, string | undefined>();

  constructor(personas: PersonaProfile[], config: Partial<VideoRenderConfig> = {}) {
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.personasMap = new Map(personas.map(p => [p.id, p]));
  }

  /** Carga un asset PNG como data URI (cacheado). Undefined si no existe. */
  private getAssetDataUri(kind: 'avatar' | 'background', name: string): string | undefined {
    const key = `${kind}:${name}`;
    if (this.assetCache.has(key)) return this.assetCache.get(key);
    const file = path.join(ASSETS_ROOT, kind === 'avatar' ? 'avatars' : 'backgrounds', `${name}.png`);
    let uri: string | undefined;
    if (existsSync(file)) {
      uri = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
    }
    this.assetCache.set(key, uri);
    return uri;
  }

  /**
   * Resuelve el mejor asset de avatar según la emoción, pose y tiro de cámara.
   */
  private resolveAvatarUri(personaId: string, emotion: string, preferredPose?: string): string | undefined {
    if (preferredPose) {
      const poseUri = this.getAssetDataUri('avatar', `${personaId}_${preferredPose}`);
      if (poseUri) return poseUri;
    }
    return (
      this.getAssetDataUri('avatar', `${personaId}_${emotion}`) ||
      this.getAssetDataUri('avatar', `${personaId}_OUTRAGED`) ||
      this.getAssetDataUri('avatar', `${personaId}_ANGRY`) ||
      this.getAssetDataUri('avatar', `${personaId}_SMUG`) ||
      this.getAssetDataUri('avatar', `${personaId}_BASE`) ||
      this.getAssetDataUri('avatar', personaId)
    );
  }

  /**
   * Tarjeta de la intro del programa (design 005: 4 tarjetas, ~15s total).
   */
  public renderIntroCardSvg(card: number, agendaTopics: string[] = []): string {
    const bg = this.getAssetDataUri('background', 'SPEAKER_FOCUS_1') || this.getAssetDataUri('background', 'SPEAKER_FOCUS');
    const bgTag = bg
      ? `<image href="${bg}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />`
      : `<rect width="1920" height="1080" fill="#020617" />`;
    const avatar = (id: string, emotion = 'BASE') => this.resolveAvatarUri(id, emotion);
    const avatarCircle = (id: string, cx: number, cy: number, r: number, label: string, badge?: string) => {
      const uri = avatar(id, badge || 'BASE');
      const name = xmlEscape(truncateText(stripNickname(this.personasMap.get(id)?.name || id).toUpperCase(), 18));
      return `
      <g transform="translate(${cx - r}, ${cy - r})">
        <circle cx="${r}" cy="${r}" r="${r}" fill="#1E293B" stroke="#DC2626" stroke-width="4" />
        ${uri ? `<clipPath id="ci${id}"><circle cx="${r}" cy="${r}" r="${r - 4}" /></clipPath>
        <image href="${uri}" x="0" y="0" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ci${id})" />`
        : `<text x="${r}" y="${r + 10}" font-family="${this.config.fontFamily}" font-size="44" text-anchor="middle">🎙️</text>`}
        <rect x="${-r + 10}" y="${r * 2 - 34}" width="${r * 2 - 20}" height="28" rx="6" fill="#000000" opacity="0.75" />
        <text x="${0}" y="${r * 2 - 14}" font-family="${this.config.fontFamily}" font-size="13" font-weight="700" fill="#FACC15" text-anchor="middle">${name}</text>
        ${badge ? `<rect x="${r - 60}" y="${-10}" width="120" height="24" rx="12" fill="#DC2626" />
        <text x="${r}" y="7" font-family="${this.config.fontFamily}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">${badge}</text>` : ''}
      </g>`;
    };

    if (card === 0) {
      return `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  ${bgTag}
  <rect x="0" y="0" width="1920" height="1080" fill="#020617" opacity="0.45" />
  <rect x="560" y="40" width="800" height="44" rx="22" fill="#DC2626" />
  <text x="960" y="70" font-family="${this.config.fontFamily}" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">🔴 SEÑAL EN VIVO // SIN CENSURA</text>
  <text x="960" y="470" font-family="${this.config.fontFamily}" font-size="110" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">POLITICAL DEATHMATCH <tspan fill="#EF4444">TV</tspan></text>
  <text x="960" y="560" font-family="${this.config.fontFamily}" font-size="34" font-weight="700" fill="#FACC15" text-anchor="middle" letter-spacing="2">${BRAND_TAGLINE}</text>
  <circle cx="960" cy="750" r="26" fill="#EF4444" /><circle cx="1040" cy="750" r="26" fill="#EF4444" /><circle cx="1120" cy="750" r="26" fill="#EF4444" />
</svg>`;
    }

    if (card === 1) {
      return `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  ${bgTag}
  <rect x="0" y="0" width="1920" height="90" fill="#000000" opacity="0.8" />
  <text x="960" y="58" font-family="${this.config.fontFamily}" font-size="34" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">EL LINEUP DE FUEGO CRUZADO</text>
  <rect x="90" y="120" width="520" height="840" rx="20" fill="#0F172A" opacity="0.9" stroke="#3B82F6" stroke-width="4" />
  <text x="350" y="170" font-family="${this.config.fontFamily}" font-size="24" font-weight="800" fill="#60A5FA" text-anchor="middle">BLOQUE POPULAR</text>
  ${avatarCircle('comandante_moncada', 350, 380, 150, '', 'OUTRAGED')}
  ${avatarCircle('gladis_recabarren', 350, 660, 150, '', 'ANGRY')}
  ${avatarCircle('dra_astorga_vicuna', 350, 930, 120, '', 'CALM')}
  <rect x="700" y="120" width="520" height="840" rx="20" fill="#09090B" opacity="0.9" stroke="#FACC15" stroke-width="4" />
  <text x="960" y="170" font-family="${this.config.fontFamily}" font-size="24" font-weight="800" fill="#FACC15" text-anchor="middle">CONDUCTOR Y ÁRBITRO</text>
  ${avatarCircle('moderador_falcon', 960, 520, 230, '', 'EN VIVO')}
  <rect x="1310" y="120" width="520" height="840" rx="20" fill="#0F172A" opacity="0.9" stroke="#DC2626" stroke-width="4" />
  <text x="1570" y="170" font-family="${this.config.fontFamily}" font-size="24" font-weight="800" fill="#F87171" text-anchor="middle">BLOQUE PUNITIVO</text>
  ${avatarCircle('capitan_sotomayor', 1570, 380, 150, '', 'OUTRAGED')}
  ${avatarCircle('senora_patricia_maturana', 1570, 660, 150, '', 'ANGRY')}
  ${avatarCircle('maximiliano_vondercrypt', 1570, 930, 120, '', 'MOCKING')}
</svg>`;
    }

    if (card === 2) {
      const topics = agendaTopics.slice(0, 4);
      return `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  ${bgTag}
  <rect x="0" y="0" width="1920" height="1080" fill="#020617" opacity="0.6" />
  <text x="960" y="90" font-family="${this.config.fontFamily}" font-size="40" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">EPISODIO SEMANAL // CARTELERA DE COMBATE</text>
  ${topics.map((t, i) => `
  <rect x="160" y="${180 + i * 150}" width="1240" height="120" rx="12" fill="#111827" stroke="#DC2626" stroke-width="3" />
  <text x="200" y="${240 + i * 150}" font-family="${this.config.fontFamily}" font-size="30" font-weight="800" fill="#FACC15">BLOQUE ${i + 1}</text>
  <text x="200" y="${278 + i * 150}" font-family="${this.config.fontFamily}" font-size="24" font-weight="600" fill="#FFFFFF">${xmlEscape(truncateText(t.toUpperCase(), 60))}</text>`).join('')}
  <g transform="translate(1500, 180)">
    <text x="0" y="20" font-family="${this.config.fontFamily}" font-size="20" font-weight="900" fill="#EF4444">¡ESTUDIO EN LLAMAS! 95%</text>
    <rect x="0" y="36" width="260" height="18" rx="9" fill="#1E293B" />
    <rect x="0" y="36" width="247" height="18" rx="9" fill="url(#bgGrad)" style="fill:#EF4444" />
  </g>
</svg>`;
    }

    const guzman = avatar('moderador_falcon', 'OUTRAGED');
    return `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  ${bgTag}
  <rect x="0" y="0" width="1920" height="1080" fill="#020617" opacity="0.4" />
  ${guzman ? `<clipPath id="ciGuz"><circle cx="960" cy="480" r="300" /></clipPath>
  <image href="${guzman}" x="660" y="180" width="600" height="600" preserveAspectRatio="xMidYMid slice" clip-path="url(#ciGuz)" />
  <circle cx="960" cy="480" r="300" fill="none" stroke="#FACC15" stroke-width="8" />`
  : `<text x="960" y="520" font-family="${this.config.fontFamily}" font-size="160" text-anchor="middle">🎙️</text>`}
  <rect x="0" y="820" width="1920" height="110" fill="url(#gcGrad)" stroke="#FEF08A" stroke-width="2" />
  <text x="60" y="885" font-family="${this.config.fontFamily}" font-size="38" font-weight="900" fill="#FFFFFF">GUZMÁN FALCÓN // EN VIVO</text>
  <text x="60" y="915" font-family="${this.config.fontFamily}" font-size="20" font-weight="600" fill="#FDE68A">¿QUIÉN DOMINARÁ LA MESA HOY?</text>
</svg>`;
  }

  /**
   * Genera el marcado SVG / Template visual para un fotograma o estado de turno específico.
   */
  public generateFrameSvg(state: VideoFrameState): string {
    const speaker = this.personasMap.get(state.activeSpeakerId);
    const opponent = state.targetSpeakerId ? this.personasMap.get(state.targetSpeakerId) : undefined;
    const speakerName = xmlEscape(stripNickname(speaker?.name || state.speakerName));

    const backgroundUri =
      this.getAssetDataUri('background', `${state.cameraCue}_${(state.blockNumber % 3) + 1}`) ||
      this.getAssetDataUri('background', state.cameraCue);

    // Selección dinámica de pose y emoción del orador y del oponente
    const speakerUri = this.resolveAvatarUri(state.activeSpeakerId, state.emotion, state.cameraCue === 'WIDE_PANEL' ? 'PANEL' : undefined);
    const opponentUri = state.targetSpeakerId
      ? this.resolveAvatarUri(state.targetSpeakerId, 'ANGRY', 'OUTRAGED')
      : undefined;

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

  <!-- 1. Fondo de Estudio (asset persistente o gradiente de fallback) -->
  ${backgroundUri
    ? `<image href="${backgroundUri}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />`
    : `<rect width="1920" height="1080" fill="url(#bgGrad)" />`}
  
  <!-- Luces de Estudio / Focos -->
  <circle cx="960" cy="200" r="500" fill="#3B82F6" opacity="0.08" />
  <circle cx="300" cy="400" r="400" fill="#EF4444" opacity="0.06" />
  <circle cx="1620" cy="400" r="400" fill="#F59E0B" opacity="0.06" />

  <!-- 2. Header / Top Bar -->
  <rect x="0" y="0" width="1920" height="90" fill="#000000" opacity="0.85" />
  <text x="60" y="48" font-family="${this.config.fontFamily}" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="2">
    POLITICAL DEATHMATCH <tspan fill="#EF4444">TV</tspan>
  </text>
  <text x="60" y="72" font-family="${this.config.fontFamily}" font-size="13" font-weight="600" fill="#FACC15" letter-spacing="1">
    ${BRAND_TAGLINE}
  </text>
  
  <rect x="520" y="24" width="140" height="42" rx="6" fill="#DC2626" />
  <text x="590" y="52" font-family="${this.config.fontFamily}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
    ${state.blockNumber === 0 ? 'DUELO FINAL' : `BLOQUE ${state.blockNumber}`}
  </text>

  <!-- Termómetro de Tensión / Rating -->
  ${this.renderTensionMeterSvg(state.tensionScore)}

  <!-- 3. Escenario Principal según Camera Cue y Poses Reales -->
  ${this.renderMainStageSvg(state, speaker, opponent, speakerUri, opponentUri)}

  <!-- 4. Generador de Caracteres Dinámico (GC) / Cintillo Inferior con Cuñas -->
  ${this.renderLowerThirdsSvg(state, speakerName)}

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

  private renderMainStageSvg(
    state: VideoFrameState,
    speaker?: PersonaProfile,
    opponent?: PersonaProfile,
    speakerUri?: string,
    opponentUri?: string
  ): string {
    const speakerName = xmlEscape(stripNickname(speaker?.name || state.speakerName));
    const opponentName = opponent ? xmlEscape(stripNickname(opponent.name)) : '';

    if (state.cameraCue === 'SPLIT_SCREEN_VERSUS' && opponent) {
      return `
      <!-- SPLIT SCREEN VERSUS -->
      <!-- Panel Izquierdo: Orador Activo con Pose Reactiva -->
      <g transform="translate(100, 130)">
        <rect width="820" height="660" rx="16" fill="#1E293B" stroke="#DC2626" stroke-width="4" />
        ${speakerUri
          ? `<clipPath id="clipLeft"><rect x="0" y="0" width="820" height="660" rx="16" /></clipPath>
             <image href="${speakerUri}" x="0" y="0" width="820" height="660" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipLeft)" />`
          : `<text x="410" y="340" font-family="${this.config.fontFamily}" font-size="120" text-anchor="middle">🗣️</text>`}
        <rect x="20" y="570" width="780" height="70" rx="8" fill="#000000" opacity="0.85" />
        <text x="410" y="615" font-family="${this.config.fontFamily}" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          ${speakerName}
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
      <g transform="translate(1000, 130)">
        <rect width="820" height="660" rx="16" fill="#0F172A" stroke="#475569" stroke-width="3" />
        ${opponentUri
          ? `<clipPath id="clipRight"><rect x="0" y="0" width="820" height="660" rx="16" /></clipPath>
             <image href="${opponentUri}" x="0" y="0" width="820" height="660" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipRight)" />`
          : `<text x="410" y="340" font-family="${this.config.fontFamily}" font-size="120" text-anchor="middle">😠</text>`}
        <rect x="20" y="570" width="780" height="70" rx="8" fill="#000000" opacity="0.85" />
        <text x="410" y="615" font-family="${this.config.fontFamily}" font-size="28" font-weight="800" fill="#94A3B8" text-anchor="middle">
          ${opponentName}
        </text>
      </g>
      `;
    }

    // WIDE_PANEL (Plano General: panelista activo + fila limpia de mini-avatares)
    if (state.cameraCue === 'WIDE_PANEL') {
      const panelUri = this.resolveAvatarUri(state.activeSpeakerId, state.emotion, 'PANEL') || speakerUri;
      const panelists = [...this.personasMap.values()]
        .filter(p => p.role === 'PANELIST')
        .slice(0, 6);
      return `
      <!-- WIDE_PANEL -->
      <g transform="translate(80, 130)">
        <!-- Panelista activo en plano medio -->
        <rect x="0" y="0" width="660" height="660" rx="20" fill="#0F172A" stroke="#FACC15" stroke-width="4" />
        ${panelUri
          ? `<clipPath id="clipPanel"><rect x="0" y="0" width="660" height="660" rx="20" /></clipPath>
             <image href="${panelUri}" x="0" y="0" width="660" height="660" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipPanel)" />`
          : `<text x="330" y="340" font-family="${this.config.fontFamily}" font-size="120" text-anchor="middle">${this.getEmotionEmoji(state.emotion)}</text>`}
        <rect x="16" y="600" width="628" height="46" rx="8" fill="#000000" opacity="0.85" />
        <text x="330" y="630" font-family="${this.config.fontFamily}" font-size="24" font-weight="800" fill="#FACC15" text-anchor="middle">
          ${truncateText(speakerName.toUpperCase(), 34)}
        </text>
      </g>

      <!-- Fila del panel: mini-avatares limpios -->
      <g transform="translate(780, 150)">
        <text x="20" y="30" font-family="${this.config.fontFamily}" font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="2">
          EL PANEL
        </text>
        ${panelists.map((p, i) => {
          const uri = this.resolveAvatarUri(p.id, 'BASE');
          const active = p.id === state.activeSpeakerId;
          const cx = 80 + (i % 3) * 340;
          const cy = 90 + Math.floor(i / 3) * 260;
          return `
          <g transform="translate(${cx}, ${cy})">
            <circle cx="80" cy="80" r="76" fill="#1E293B" stroke="${active ? '#FACC15' : '#475569'}" stroke-width="${active ? 5 : 3}" />
            ${uri
              ? `<clipPath id="clipMini${i}"><circle cx="80" cy="80" r="70" /></clipPath>
                 <image href="${uri}" x="10" y="10" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipMini${i})" />`
              : `<text x="80" y="95" font-family="${this.config.fontFamily}" font-size="44" text-anchor="middle">🎙️</text>`}
            <rect x="-30" y="165" width="220" height="34" rx="6" fill="#000000" opacity="0.8" />
            <text x="80" y="188" font-family="${this.config.fontFamily}" font-size="15" font-weight="800" fill="${active ? '#FACC15' : '#CBD5E1'}" text-anchor="middle">
              ${xmlEscape(truncateText(stripNickname(p.name).toUpperCase(), 18))}
            </text>
          </g>`;
        }).join('')}
      </g>
      `;
    }

    // SPEAKER FOCUS (Primer Plano con Pose Dinámica)
    return `
    <!-- SPEAKER FOCUS -->
    <g transform="translate(540, 120)">
      <rect width="840" height="680" rx="24" fill="#1E293B" stroke="#3B82F6" stroke-width="4" />
      
      <!-- Avatar con Pose y Emoción Real -->
      ${speakerUri
        ? `<clipPath id="clipSpeaker"><rect x="0" y="0" width="840" height="680" rx="24" /></clipPath>
           <image href="${speakerUri}" x="0" y="0" width="840" height="680" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipSpeaker)" />`
        : `<circle cx="420" cy="320" r="180" fill="#0F172A" stroke="#60A5FA" stroke-width="6" />
           <text x="420" y="370" font-family="${this.config.fontFamily}" font-size="140" text-anchor="middle">
             ${this.getEmotionEmoji(state.emotion)}
           </text>`}

      <!-- Badge de Emoción / Estado -->
      <rect x="295" y="610" width="250" height="44" rx="22" fill="#0284C7" />
      <text x="420" y="640" font-family="${this.config.fontFamily}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
        ESTADO: ${state.emotion}
      </text>
    </g>
    `;
  }

  /**
   * Generador de Caracteres Dinámico (GC): Rescata cuñas en vivo del orador activo y el titular del bloque.
   */
  private renderLowerThirdsSvg(state: VideoFrameState, name: string): string {
    // Si hay una cuña dinámica específica del orador, usarla; si no, usar el headline del bloque
    const mainText = state.quoteGC && state.quoteGC.trim().length > 6
      ? state.quoteGC.toUpperCase()
      : (state.headlineGC || state.topicTitle || 'DEBATE EN VIVO').toUpperCase();

    const isQuote = Boolean(state.quoteGC && state.quoteGC.trim().length > 6);
    const lines = wrapHeadline(mainText, isQuote ? 44 : 48).slice(0, 2);
    const fontSize = mainText.length > 80 ? 26 : mainText.length > 50 ? 30 : 34;
    const firstY = lines.length === 1 ? 72 : 52;
    const lineDelta = 40;
    const displayName = xmlEscape(truncateText(name.toUpperCase(), 32));

    return `
    <!-- GC / LOWER THIRDS DINÁMICO -->
    <g transform="translate(100, 810)">
      <!-- Barra Principal del Titular (Rojo Intenso) -->
      <rect x="0" y="0" width="1720" height="110" rx="10" fill="url(#gcGrad)" stroke="#FEF08A" stroke-width="2" />
      
      <!-- Badge de Tipo de Contenido GC -->
      <rect x="30" y="10" width="${isQuote ? 180 : 140}" height="24" rx="4" fill="#000000" opacity="0.8" />
      <text x="${isQuote ? 120 : 100}" y="27" font-family="${this.config.fontFamily}" font-size="13" font-weight="900" fill="#FACC15" text-anchor="middle" letter-spacing="1">
        ${isQuote ? '🔴 CUÑA EN VIVO' : 'TITULAR DE LA HORA'}
      </text>

      <!-- Texto del GC (Cuña o Titular envuelto en hasta 2 líneas) -->
      ${lines.map((line, i) => `
      <text x="40" y="${firstY + i * lineDelta}" font-family="${this.config.fontFamily}" font-size="${fontSize}" font-weight="900" fill="${isQuote ? '#FEF08A' : '#FFFFFF'}" letter-spacing="1">
        ${xmlEscape(line)}
      </text>`).join('')}

      <!-- Caja de Identificación del Orador (Negro/Dorado) -->
      <rect x="0" y="-56" width="560" height="56" rx="6" fill="#09090B" stroke="#DC2626" stroke-width="2" />
      <text x="24" y="-18" font-family="${this.config.fontFamily}" font-size="22" font-weight="800" fill="#FACC15">
        ${displayName} <tspan font-size="16" font-weight="600" fill="#94A3B8">| EN VIVO</tspan>
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
        ${BRAND_TAGLINE} • DEBATIENDO EN VIVO SOBRE "${xmlEscape(truncateText(topicTitle.toUpperCase(), 70))}" • EMISIÓN SIN FILTROS
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

/** Quita los sobrenombres entre comillas del nombre para pantalla. */
function stripNickname(name: string): string {
  return name.replace(/\s*"[^"]*"/g, '').trim();
}

/** Corta un texto con elipsis si excede maxChars. */
function truncateText(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

/** Escapa entidades XML en texto. */
function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Envuelve un titular en líneas de hasta maxChars (corta en espacios). */
function wrapHeadline(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && current.length + word.length + 1 > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
