"use client";

import { useEffect, useRef } from "react";
import {
  Renderer,
  Program,
  Mesh,
  Triangle,
  Texture,
  Vec2,
  Flowmap,
} from "ogl";

interface FlowmapBackgroundProps {
  /** Path to the background image to distort */
  src: string;
  /** Extra classes for the wrapping container (positioning is handled internally) */
  className?: string;
  /** How strongly the flow displaces the image lookup. Default 0.1 */
  strength?: number;
}

/**
 * Full-bleed animated background: renders `src` through a WebGL canvas and
 * distorts it using a mouse/touch-driven flowmap (fluid-like displacement),
 * adapted from oframe/ogl's mouse-flowmap example (used by robin-dela's
 * flowmap-effect demo: https://github.com/robin-dela/flowmap-effect).
 *
 * Usage: drop this as the first child of a `position: relative` container,
 * it will size itself to fill that container (`absolute inset-0`).
 */
export default function FlowmapBackground({
  src,
  className = "",
  strength = 0.1,
}: FlowmapBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDestroyed = false;
    let rafId = 0;
    let isTabVisible = document.visibilityState === "visible";
    let aspect = 1;
    let lastTime = 0;

    const mouse = new Vec2(-1);
    const velocity = new Vec2();
    const lastMouse = new Vec2();

    // ── Renderer / GL setup ──────────────────────────────────────────
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    Object.assign(gl.canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(gl.canvas);

    // ── Flowmap + geometry + texture ─────────────────────────────────
    const flowmap = new Flowmap(gl, {
      falloff: 0.3,
      alpha: 1,
      dissipation: 0.96,
    });

    const geometry = new Triangle(gl);
    const texture = new Texture(gl, { generateMipmaps: false });

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      uniform sampler2D tMap;
      uniform sampler2D tFlow;
      uniform vec2 uImageSize;
      uniform vec2 uResolution;
      uniform float uStrength;
      varying vec2 vUv;

      void main() {
        vec3 flow = texture2D(tFlow, vUv).rgb;

        // "background-size: cover" uv fit — scales down (crops) whichever
        // axis overflows, so the image is never stretched to fill the gap.
        float texAspect = uImageSize.x / uImageSize.y;
        float screenAspect = uResolution.x / uResolution.y;
        vec2 ratio = vec2(
        min(screenAspect / texAspect, 1.0),
        min(texAspect / screenAspect, 1.0)
        );
        vec2 uv = vUv * ratio + (1.0 - ratio) * 0.5;

        // displace the lookup by the flow velocity
        uv -= flow.xy * uStrength;

        vec3 tex = texture2D(tMap, uv).rgb;
        gl_FragColor = vec4(tex, 1.0);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: texture },
        tFlow: flowmap.uniform,
        uImageSize: { value: new Vec2(1, 1) },
        uResolution: {
          value: new Vec2(container.clientWidth, container.clientHeight),
        },
        uStrength: { value: strength },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isDestroyed) return;
      texture.image = img;
      program.uniforms.uImageSize.value.set(img.naturalWidth, img.naturalHeight);
    };
    img.src = src;

    // ── Resize handling (container-based, not window-based) ─────────
    function resize() {
      const { clientWidth, clientHeight } = container!;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      aspect = clientWidth / clientHeight;
      program.uniforms.uResolution.value.set(clientWidth, clientHeight);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // ── Mouse / touch tracking, relative to the container ───────────
    function getRelativePos(clientX: number, clientY: number) {
      const rect = container!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function updateMouse(e: MouseEvent | TouchEvent) {
      let clientX: number;
      let clientY: number;

      if ("changedTouches" in e && e.changedTouches.length) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const { x, y } = getRelativePos(clientX, clientY);
      const { clientWidth, clientHeight } = container!;

      // The canvas sits behind other content (lower z-index), so it never
      // receives pointer events directly — we track on window instead and
      // only react while the pointer is within the container's bounds.
      const isInside = x >= 0 && x <= clientWidth && y >= 0 && y <= clientHeight;
      if (!isInside) {
        mouse.set(-1, -1);
        velocity.set(0, 0);
        (velocity as Vec2 & { needsUpdate?: boolean }).needsUpdate = false;
        lastTime = 0;
        return;
      }

      // 0-1 range, y flipped to match GL coordinate space
      mouse.set(x / clientWidth, 1 - y / clientHeight);

      if (!lastTime) {
        lastTime = performance.now();
        lastMouse.set(x, y);
      }

      const deltaX = x - lastMouse.x;
      const deltaY = y - lastMouse.y;
      lastMouse.set(x, y);

      const time = performance.now();
      const delta = Math.max(14, time - lastTime);
      lastTime = time;

      velocity.x = deltaX / delta;
      velocity.y = deltaY / delta;
      (velocity as Vec2 & { needsUpdate?: boolean }).needsUpdate = true;
    }

    const isTouchCapable = "ontouchstart" in window;
    window.addEventListener("mousemove", updateMouse);
    if (isTouchCapable) {
      window.addEventListener("touchmove", updateMouse, { passive: true });
      window.addEventListener("touchstart", updateMouse, { passive: true });
    }

    // ── Pause rendering when the tab isn't visible ───────────────────
    function handleVisibilityChange() {
      isTabVisible = document.visibilityState === "visible";
      if (isTabVisible && rafId === 0 && !isDestroyed) {
        rafId = requestAnimationFrame(update);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Render loop ───────────────────────────────────────────────────
    function update(t: number) {
      if (isDestroyed) return;

      if (!isTabVisible) {
        // Stop the loop entirely; visibilitychange restarts it.
        rafId = 0;
        return;
      }

      rafId = requestAnimationFrame(update);

      const v = velocity as Vec2 & { needsUpdate?: boolean };
      if (!v.needsUpdate) {
        mouse.set(-1, -1);
        velocity.set(0, 0);
      }
      v.needsUpdate = false;

      flowmap.aspect = aspect;
      flowmap.mouse.copy(mouse);
      // Ease velocity input, slower fade-out when idle
      flowmap.velocity.lerp(velocity, velocity.len() ? 0.5 : 0.1);
      flowmap.update();

      renderer.render({ scene: mesh });
    }

    rafId = requestAnimationFrame(update);

    // ── Cleanup: destroy renderer, listeners, observers ──────────────
    return () => {
      isDestroyed = true;
      cancelAnimationFrame(rafId);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();

      if (isTouchCapable) {
        window.removeEventListener("touchmove", updateMouse);
        window.removeEventListener("touchstart", updateMouse);
      }
      window.removeEventListener("mousemove", updateMouse);

      // Free the WebGL context to avoid leaking GPU resources
      const loseContextExt = gl.getExtension("WEBGL_lose_context");
      if (loseContextExt) loseContextExt.loseContext();


      try {
        if (gl.canvas.parentElement === container) {
          container.removeChild(gl.canvas);
        }
      } catch {
        // Container may already have been detached by React during a fast
        // route change/unmount — safe to ignore, the node is gone either way.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, strength]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}