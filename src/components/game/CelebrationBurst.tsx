"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "strip";
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  decay: number;
};

const COLORS = [
  "#f1be2d", // Gold
  "#1f5faa", // Blue
  "#2b8846", // Green
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export function CelebrationBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect reduced motion settings
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];

    // Helper to spawn a burst from an edge
    const spawnBurst = (startX: number, startY: number, angleDegMin: number, angleDegMax: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (angleDegMin + Math.random() * (angleDegMax - angleDegMin)) * (Math.PI / 180);
        const speed = 12 + Math.random() * 16;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#f1be2d";
        const shapeType = Math.random();
        const shape: Particle["shape"] = shapeType < 0.4 ? "rect" : shapeType < 0.7 ? "strip" : "circle";

        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 6,
          color,
          shape,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.1 + Math.random() * 0.1,
          opacity: 1,
          decay: 0.005 + Math.random() * 0.006,
        });
      }
    };

    // Burst from Left and Right edges simultaneously
    const launchCannons = () => {
      const originY = height * 0.72;
      // Left cannon shooting up-right (angles between -75° and -20°)
      spawnBurst(0, originY, -75, -20, 55);
      // Right cannon shooting up-left (angles between -160° and -105°)
      spawnBurst(width, originY, -160, -105, 55);
    };

    // Primary launch
    launchCannons();

    // Small secondary follow-up burst after 400ms for richness
    const secondTimer = setTimeout(() => {
      const originY = height * 0.65;
      spawnBurst(0, originY, -70, -25, 30);
      spawnBurst(width, originY, -155, -110, 30);
    }, 400);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;

        // Physics
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vy += 0.38; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const wobbleScale = Math.sin(p.wobble);

        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, (-p.size / 2) * wobbleScale, p.size, p.size * wobbleScale);
        } else if (p.shape === "strip") {
          ctx.fillRect(-p.size * 0.8, (-p.size * 0.3) * wobbleScale, p.size * 1.6, p.size * 0.6 * wobbleScale);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      clearTimeout(secondTimer);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 h-full w-full"
    />
  );
}
