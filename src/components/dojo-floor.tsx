"use client";

import { useEffect, useRef } from "react";

/**
 * A dojo floor of tatami, laid in staggered rows so no four corners meet
 * (the everyday 祝儀敷き layout; four-corner grids are kept for temples),
 * drifting very slowly under the page. Purely decorative: it sits behind
 * everything at low contrast, never takes pointer events, renders a single
 * still frame for reduced motion and stops while the tab is hidden.
 */

// Tatami are 2:1. One unit = the short side of a mat.
const MAT_W = 2;
const MAT_H = 1;
const COLS = 26;
const ROWS = 52;
const SPEED = 0.045; // units per second
const PERIOD = 2 * MAT_H; // the stagger repeats every two rows

/**
 * A dojo mat: rush-weave face and no cloth binding. Training-hall tatami
 * have no heri (縁); bound edges belong to living rooms (和室).
 */
function matTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // Face: soft straw, close to the paper so the whole floor stays quiet.
  g.fillStyle = "#e4e3cf";
  g.fillRect(0, 0, W, H);
  // Woven rush: fine lines across the short side, with a little irregularity.
  for (let x = 0; x < W; x += 4) {
    const shade = 0.08 + Math.random() * 0.07;
    g.fillStyle = `rgba(120, 118, 70, ${shade})`;
    g.fillRect(x, 0, 1.4, H);
  }
  // Warp threads along the length.
  g.fillStyle = "rgba(120, 118, 70, 0.06)";
  for (let y = 18; y < H; y += 36) g.fillRect(0, y, W, 1);
  // Seams where mats butt together, on all four sides.
  g.fillStyle = "rgba(80, 76, 50, 0.4)";
  g.fillRect(0, 0, W, 2);
  g.fillRect(0, H - 2, W, 2);
  g.fillRect(0, 0, 2, H);
  g.fillRect(W - 2, 0, 2, H);
  return c;
}

export function DojoFloor() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: the paper ground alone is fine
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.dataset.eyedropperSkip = "";
      el.appendChild(canvas);

      const scene = new THREE.Scene();
      // Fade into the washi ground with distance.
      scene.fog = new THREE.Fog(0xeceee8, 6, 26);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
      const tex = new THREE.CanvasTexture(matTexture());
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      // A thin box per mat, so the edges catch a sliver of shadow.
      const geo = new THREE.BoxGeometry(MAT_W * 0.994, 0.06, MAT_H * 0.99);
      const face = new THREE.MeshLambertMaterial({ map: tex });
      const side = new THREE.MeshLambertMaterial({ color: 0xbdbca5 });
      // Box face order: +x, -x, +y, -y, +z, -z. Only the top shows the weave.
      const mats = new THREE.InstancedMesh(geo, [side, side, face, side, side, side], COLS * ROWS);
      const m = new THREE.Matrix4();
      let i = 0;
      for (let r = 0; r < ROWS; r++) {
        const offset = r % 2 ? MAT_W / 2 : 0;
        for (let k = 0; k < COLS; k++) {
          const x = (k - COLS / 2) * MAT_W + offset;
          const z = -r * MAT_H + 14;
          m.makeTranslation(x, 0, z);
          mats.setMatrixAt(i++, m);
        }
      }
      // Walk the hall at an angle so the seams run diagonally, not as stripes.
      const floor = new THREE.Group();
      floor.add(mats);
      const hall = new THREE.Group();
      hall.rotation.y = 0.42;
      hall.add(floor);
      scene.add(hall);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d6c4, 2.2));
      const sun = new THREE.DirectionalLight(0xfff6e0, 0.9);
      sun.position.set(-4, 6, 3); // low light from the shōji
      scene.add(sun);

      camera.position.set(0, 3.2, 4.2);
      camera.lookAt(0, 0, -3);

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let raf = 0;
      let last = performance.now();
      let travelled = 0;
      const frame = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        travelled = (travelled + dt * SPEED) % PERIOD;
        floor.position.z = travelled;
        // A breath of sideways sway, like walking the length of the hall.
        floor.position.x = Math.sin(now / 18000) * 0.35;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      const play = () => {
        cancelAnimationFrame(raf);
        if (reduced.matches || document.hidden) {
          renderer.render(scene, camera);
          return;
        }
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      play();
      el.dataset.ready = "";

      const onResize = () => {
        resize();
        if (reduced.matches) renderer.render(scene, camera);
      };
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", play);
      reduced.addEventListener("change", play);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", play);
        reduced.removeEventListener("change", play);
        geo.dispose();
        face.dispose();
        side.dispose();
        tex.dispose();
        renderer.dispose();
        canvas.remove();
      };
    };

    // Let the page settle first; the floor is never urgent.
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start) : window.setTimeout(start, 400);
    return () => {
      disposed = true;
      if (!w.requestIdleCallback) clearTimeout(id);
      cleanup();
    };
  }, []);

  return <div ref={host} aria-hidden="true" className="dojo-floor" />;
}
