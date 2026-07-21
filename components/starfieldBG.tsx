"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  twinkle: number;
}

interface StarfieldProps {
  count?: number;
  speed?: number;
}

function StarfieldBackground({ count = 150, speed = 1 }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (resolvedTheme !== "dark") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return; // Only render the starfield in dark mode
    }

    let animId: number;
    let stars: Star[] = [];

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (Math.abs(canvas.width - w) < 2 && Math.abs(canvas.height - h) < 2)
        return;
      canvas.width = w;
      canvas.height = h;
    };

    const makeStar = (): Star => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random(),
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    });

    const init = () => {
      stars = Array.from({ length: count }, makeStar);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((s) => {
        s.twinkle += 0.03;
        const depth = 0.3 + s.z * 0.7;
        const flicker = s.alpha + Math.sin(s.twinkle) * 0.15;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * depth, 0, Math.PI * 2);
        const color = "255,255,255";
        ctx.fillStyle = `rgba(${color},${Math.min(1, flicker * depth)})`;
        ctx.fill();

        s.x -= speed * depth * 0.6;
        s.y += speed * depth * 0.08;

        if (s.x < -2) {
          s.x = canvas.width + 2;
          s.y = Math.random() * canvas.height;
        }
        if (s.y > canvas.height + 2) {
          s.y = -2;
          s.x = Math.random() * canvas.width;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    const handleResize = () => resize();
    const resizeTarget = window.visualViewport ?? window;

    resize();
    init();
    draw();

    resizeTarget.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      resizeTarget.removeEventListener("resize", handleResize);
    };
  }, [count, speed, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}

export default StarfieldBackground;
