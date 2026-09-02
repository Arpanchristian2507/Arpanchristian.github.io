/**
 * <ascii-torus> — browser port of donut.js
 *
 * Same torus projection, luminance shading, and z-buffer as:
 * https://github.com/Arpanchristian2507/Ascii-Art-Torus/blob/main/donut.js
 *
 * Terminal stdout is replaced with a <pre> frame. Auto-rotation can be
 * paused; pointer drag maps to the same A/B rotation angles.
 */
(function registerAsciiTorus() {
  if (customElements.get('ascii-torus')) return;

  const SHADING = '.,-~:;=!*#$@';
  const R1 = 1.0;
  const R2 = 2.0;
  const K2 = 5.0;
  const TWO_PI = 6.28;
  const THETA_STEP = 0.07;
  const PHI_STEP = 0.02;
  const AUTO_A = 0.04;
  const AUTO_B = 0.02;
  const FRAME_MS = 30;

  const styles = `
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      background: #07070f;
      color: #d4d0ff;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: grab;
    }
    :host([dragging]) {
      cursor: grabbing;
    }
    .stage {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    pre {
      margin: 0;
      font-family: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
      font-size: clamp(5.5px, 2.2vw, 8px);
      line-height: 1.05;
      letter-spacing: 0.04em;
      white-space: pre;
      color: inherit;
    }
    .controls {
      position: absolute;
      left: 0.55rem;
      bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      z-index: 1;
    }
    button {
      width: 2rem;
      height: 2rem;
      border: 1px solid rgba(108, 99, 255, 0.45);
      border-radius: 999px;
      background: rgba(12, 12, 22, 0.78);
      color: #e8e6ff;
      display: grid;
      place-items: center;
      cursor: pointer;
      padding: 0;
      backdrop-filter: blur(8px);
    }
    button:hover,
    button:focus-visible {
      border-color: #8b85ff;
      outline: none;
    }
    button svg {
      width: 0.78rem;
      height: 0.78rem;
      fill: currentColor;
    }
    .hint {
      font: 600 0.62rem/1 Inter, system-ui, sans-serif;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(216, 214, 255, 0.72);
      opacity: 0.9;
      pointer-events: none;
      transition: opacity 0.35s ease;
    }
    :host([interacted]) .hint {
      opacity: 0;
    }
  `;

  class AsciiTorus extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.A = 1.0;
      this.B = 0.6;
      this.playing = true;
      this._raf = 0;
      this._acc = 0;
      this._last = 0;
      this._drag = false;
      this._px = 0;
      this._py = 0;
      this._observer = null;
      this._visible = true;
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onToggle = this._onToggle.bind(this);
      this._onKey = this._onKey.bind(this);
      this._tick = this._tick.bind(this);
    }

    connectedCallback() {
      this.width = clampInt(this.getAttribute('cols'), 40, 20, 80);
      this.height = clampInt(this.getAttribute('rows'), 16, 10, 24);
      this.K1 = (this.width * K2 * 3) / (8 * (R1 + R2));

      this.shadowRoot.innerHTML =
        '<style>' + styles + '</style>' +
        '<div class="stage"><pre aria-hidden="true"></pre></div>' +
        '<div class="controls">' +
          '<button type="button" aria-label="Pause animation" aria-pressed="false">' +
            '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9"/><rect x="7" y="1.5" width="3" height="9"/></svg>' +
          '</button>' +
          '<span class="hint">Drag to spin</span>' +
        '</div>';

      this._pre = this.shadowRoot.querySelector('pre');
      this._btn = this.shadowRoot.querySelector('button');

      this.setAttribute('role', 'img');
      this.setAttribute(
        'aria-label',
        'Live ASCII torus. Drag to rotate. Press the button or space to pause or play.'
      );
      this.tabIndex = 0;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.playing = false;
      }

      this._renderFrame(false);
      this._syncButton();

      this.addEventListener('pointerdown', this._onPointerDown);
      this.addEventListener('keydown', this._onKey);
      this._btn.addEventListener('click', this._onToggle);

      this._observer = new IntersectionObserver(
        function (entries) {
          this._visible = entries.some(function (e) { return e.isIntersecting; });
          if (this._visible) this._start();
          else this._stopLoop();
        }.bind(this),
        { threshold: 0.15 }
      );
      this._observer.observe(this);
      this._start();
    }

    disconnectedCallback() {
      this._stopLoop();
      this.removeEventListener('pointerdown', this._onPointerDown);
      this.removeEventListener('keydown', this._onKey);
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
      if (this._observer) this._observer.disconnect();
    }

    _start() {
      if (this._raf || !this._visible) return;
      this._last = 0;
      this._raf = requestAnimationFrame(this._tick);
    }

    _stopLoop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    _tick(now) {
      this._raf = requestAnimationFrame(this._tick);
      if (!this._last) {
        this._last = now;
        return;
      }
      const dt = now - this._last;
      this._last = now;
      if (!this.playing || this._drag) return;
      this._acc += dt;
      while (this._acc >= FRAME_MS) {
        this._acc -= FRAME_MS;
        this.A += AUTO_A;
        this.B += AUTO_B;
        this._renderFrame(false);
      }
    }

    _renderFrame() {
      const width = this.width;
      const height = this.height;
      const K1 = this.K1;
      const A = this.A;
      const B = this.B;
      const cosA = Math.cos(A);
      const sinA = Math.sin(A);
      const cosB = Math.cos(B);
      const sinB = Math.sin(B);

      const output = new Array(width * height).fill(' ');
      const zbuffer = new Array(width * height).fill(0);

      for (let theta = 0; theta < TWO_PI; theta += THETA_STEP) {
        const costheta = Math.cos(theta);
        const sintheta = Math.sin(theta);
        for (let phi = 0; phi < TWO_PI; phi += PHI_STEP) {
          const cosphi = Math.cos(phi);
          const sinphi = Math.sin(phi);

          const circlex = R2 + R1 * costheta;
          const circley = R1 * sintheta;

          const x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB;
          const y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB;
          const z = K2 + cosA * circlex * sinphi + circley * sinA;
          const ooz = 1 / z;

          const xp = Math.floor(width / 2 + K1 * ooz * x);
          const yp = Math.floor(height / 2 - K1 * ooz * y * 0.5);

          const L =
            (costheta * cosphi * sinB - sinA * sinphi * cosB * costheta + cosA * sintheta * cosB) * 0.7071 +
            (cosA * sinphi * costheta + sinA * sintheta) * -0.7071;

          const idx = xp + yp * width;
          if (yp >= 0 && yp < height && xp >= 0 && xp < width && ooz > zbuffer[idx]) {
            zbuffer[idx] = ooz;
            const lumIndex = Math.min(11, Math.floor(Math.max(0, L) * 11));
            output[idx] = SHADING[lumIndex];
          }
        }
      }

      let frame = '';
      for (let row = 0; row < height; row++) {
        frame += output.slice(row * width, row * width + width).join('') + '\n';
      }
      this._pre.textContent = frame;
    }

    _onToggle(event) {
      event.stopPropagation();
      this.playing = !this.playing;
      this._syncButton();
      this.setAttribute('interacted', '');
    }

    _syncButton() {
      this._btn.setAttribute('aria-pressed', this.playing ? 'false' : 'true');
      this._btn.setAttribute('aria-label', this.playing ? 'Pause animation' : 'Play animation');
      this._btn.innerHTML = this.playing
        ? '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9"/><rect x="7" y="1.5" width="3" height="9"/></svg>'
        : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.4v9.2L11 6z"/></svg>';
    }

    _onKey(event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (event.target === this._btn) return;
      event.preventDefault();
      this._onToggle(event);
    }

    _onPointerDown(event) {
      if (event.target === this._btn || this._btn.contains(event.target)) return;
      this._drag = true;
      this._px = event.clientX;
      this._py = event.clientY;
      this.setAttribute('dragging', '');
      this.setAttribute('interacted', '');
      try { this.setPointerCapture(event.pointerId); } catch (e) { /* untrusted or already released */ }
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);
    }

    _onPointerMove(event) {
      if (!this._drag) return;
      const dx = event.clientX - this._px;
      const dy = event.clientY - this._py;
      this._px = event.clientX;
      this._py = event.clientY;
      this.B += dx * 0.02;
      this.A += dy * 0.02;
      this._renderFrame();
    }

    _onPointerUp(event) {
      this._drag = false;
      this.removeAttribute('dragging');
      try { this.releasePointerCapture(event.pointerId); } catch (e) { /* already released */ }
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
    }
  }

  function clampInt(value, fallback, min, max) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  customElements.define('ascii-torus', AsciiTorus);
})();
