"use client";

import { useEffect, useRef } from "react";

type Token = {
  lane: number;
  x: number;
  w: number;
  h: number;
  speed: number;
  color: string;
  label: string;
};

const STATUS_COLORS = ["#3B82F6", "#F59E0B", "#22C55E", "#F97316", "#EF4444"];
const STATUS_LABELS = ["APPLIED", "RESPONDED", "INTERVIEW", "OFFER", "FOLLOW-UP"];

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function NotFoundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();

    const tokens: Token[] = Array.from({ length: 10 }).map((_, index) => ({
      lane: index % 5,
      x: Math.random() * 800,
      w: 116,
      h: 36,
      speed: 45 + Math.random() * 35,
      color: STATUS_COLORS[index % STATUS_COLORS.length],
      label: STATUS_LABELS[index % STATUS_LABELS.length]
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;

      context.clearRect(0, 0, width, height);

      roundedRectPath(context, 2, 2, width - 4, height - 4, 18);
      context.fillStyle = "#fffdf7";
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = "#0F172A";
      context.stroke();

      const laneGap = (height - 40) / 5;
      for (let i = 0; i < 5; i += 1) {
        const y = 20 + laneGap * i;
        context.setLineDash([8, 10]);
        context.beginPath();
        context.moveTo(16, y + 18);
        context.lineTo(width - 16, y + 18);
        context.strokeStyle = "#CBD5E1";
        context.lineWidth = 1;
        context.stroke();
      }
      context.setLineDash([]);

      tokens.forEach((token) => {
        const laneY = 12 + laneGap * token.lane;
        token.x += token.speed * dt;
        if (token.x > width + 140) {
          token.x = -150;
        }

        const floatOffset = Math.sin((time / 350) + token.lane) * 2;
        const drawY = laneY + floatOffset;

        roundedRectPath(context, token.x, drawY, token.w, token.h, 10);
        context.fillStyle = token.color;
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#0F172A";
        context.stroke();

        context.fillStyle = "#ffffff";
        context.font = "700 11px Inter, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(token.label, token.x + token.w / 2, drawY + token.h / 2 + 0.5);
      });

      const pulse = 1 + Math.sin(time / 400) * 0.03;
      context.save();
      context.translate(width / 2, height / 2);
      context.scale(pulse, pulse);
      context.fillStyle = "#0F172A";
      context.font = "900 58px 'Space Grotesk', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("404", 0, 0);
      context.restore();

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[240px] w-full rounded-[16px] border-2 border-slate-900 bg-white shadow-[4px_4px_0_rgb(15_23_42)]"
      aria-label="Animated 404 tracker illustration"
    />
  );
}