import React, { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '../../store/mapStore';

// ── Great-circle bezier helpers ───────────────────────────────────────────────

/** Project lon/lat to canvas pixel */
function project(lon: number, lat: number, w: number, h: number) {
    return {
        x: ((lon + 180) / 360) * w,
        y: ((90 - lat) / 180) * h,
    };
}

/** Quadratic bezier point at t */
function bezierAt(t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
    const mt = 1 - t;
    return {
        x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
        y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
    };
}

/** Bezier tangent direction at t (for airplane rotation) */
function bezierTangent(t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
    const mt = 1 - t;
    return {
        dx: 2 * mt * (cx - x0) + 2 * t * (x1 - cx),
        dy: 2 * mt * (cy - y0) + 2 * t * (y1 - cy),
    };
}

/** Compute control point for a great-circle arc (elevated above midpoint) */
function arcControl(x0: number, y0: number, x1: number, y1: number) {
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const lift = Math.min(dist * 0.35, 120);
    return { cx: mx, cy: my - lift };
}

// ── Component ─────────────────────────────────────────────────────────────────
export const RouteAnimator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const progressRef = useRef(0);
    const { activeRoute, isRouteAnimating, stopRouteAnimation, setRouteProgress } = useMapStore();

    const drawFrame = useCallback((progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const pts = activeRoute?.points ?? [];
        if (pts.length < 2) return;

        // Precompute all projected points + bezier controls
        type Seg = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number };
        const segs: Seg[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = project(pts[i].coordinates[0], pts[i].coordinates[1], W, H);
            const p1 = project(pts[i + 1].coordinates[0], pts[i + 1].coordinates[1], W, H);
            const { cx, cy } = arcControl(p0.x, p0.y, p1.x, p1.y);
            segs.push({ x0: p0.x, y0: p0.y, cx, cy, x1: p1.x, y1: p1.y });
        }

        const totalSegs = segs.length;
        const globalProgress = progress; // 0-1 across all segments

        // ── Draw complete arcs (faded) ──────────────────────────────────
        segs.forEach((seg) => {
            ctx.beginPath();
            ctx.moveTo(seg.x0, seg.y0);
            ctx.quadraticCurveTo(seg.cx, seg.cy, seg.x1, seg.y1);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.18)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // ── Draw animated portion ──────────────────────────────────────
        const segProgress = globalProgress * totalSegs;
        const completedSegs = Math.floor(segProgress);
        const currentSegT = segProgress - completedSegs;

        // Fully completed segments
        for (let i = 0; i < completedSegs && i < totalSegs; i++) {
            const seg = segs[i];
            ctx.beginPath();
            ctx.moveTo(seg.x0, seg.y0);
            ctx.quadraticCurveTo(seg.cx, seg.cy, seg.x1, seg.y1);

            const grad = ctx.createLinearGradient(seg.x0, seg.y0, seg.x1, seg.y1);
            grad.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Partial current segment
        if (completedSegs < totalSegs) {
            const seg = segs[completedSegs];
            const steps = 60;
            const drawSteps = Math.floor(currentSegT * steps);

            if (drawSteps > 0) {
                ctx.beginPath();
                const start = bezierAt(0, seg.x0, seg.y0, seg.cx, seg.cy, seg.x1, seg.y1);
                ctx.moveTo(start.x, start.y);
                for (let s = 1; s <= drawSteps; s++) {
                    const pt = bezierAt(s / steps, seg.x0, seg.y0, seg.cx, seg.cy, seg.x1, seg.y1);
                    ctx.lineTo(pt.x, pt.y);
                }
                const grad = ctx.createLinearGradient(seg.x0, seg.y0, seg.x1, seg.y1);
                grad.addColorStop(0, 'rgba(139, 92, 246, 0.85)');
                grad.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(139, 92, 246, 0.7)';
                ctx.shadowBlur = 16;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        // ── Airplane icon ─────────────────────────────────────────────
        if (globalProgress > 0 && globalProgress < 1) {
            const segIdx = Math.min(completedSegs, totalSegs - 1);
            const segT = segIdx === completedSegs ? currentSegT : 1;
            const seg = segs[segIdx];
            const ap = bezierAt(segT, seg.x0, seg.y0, seg.cx, seg.cy, seg.x1, seg.y1);
            const tang = bezierTangent(segT, seg.x0, seg.y0, seg.cx, seg.cy, seg.x1, seg.y1);
            const angle = Math.atan2(tang.dy, tang.dx);

            // Glowing ring
            const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.006);
            ctx.beginPath();
            ctx.arc(ap.x, ap.y, 22 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ap.x, ap.y, 12 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
            ctx.fill();

            // Rotated airplane
            ctx.save();
            ctx.translate(ap.x, ap.y);
            ctx.rotate(angle);
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✈', 0, 0);
            ctx.restore();
        }

        // ── Stop markers ──────────────────────────────────────────────
        pts.forEach((pt, i) => {
            const p = project(pt.coordinates[0], pt.coordinates[1], W, H);
            const isStart = i === 0;
            const isEnd = i === pts.length - 1;
            const color = isStart ? '#10b981' : isEnd ? '#ef4444' : '#8b5cf6';
            const glowColor = isStart ? '16,185,129' : isEnd ? '239,68,68' : '139,92,246';

            // Pulse glow
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004 + i);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 18 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glowColor}, 0.15)`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(pt.country, p.x, p.y - 16);
        });
    }, [activeRoute]);

    useEffect(() => {
        if (!isRouteAnimating || !activeRoute) return;
        progressRef.current = 0;

        const duration = 8000; // 8 seconds for full route
        const start = performance.now();

        const loop = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            progressRef.current = progress;
            setRouteProgress(progress);
            drawFrame(progress);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(loop);
            } else {
                stopRouteAnimation();
            }
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [isRouteAnimating, activeRoute, drawFrame, setRouteProgress, stopRouteAnimation]);

    // Resize canvas to fill window
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    if (!activeRoute || !isRouteAnimating) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-20"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
