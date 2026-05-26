/**
 * DraggableFloatButton.tsx — 3D Draggable Floating Action Button
 * ─────────────────────────────────────────────────────────────────────────────
 * A reusable floating button that users can drag freely around the screen.
 * Features:
 *  • Framer Motion `drag` with spring momentum and inertia
 *  • 3D tilt effect: tracks mouse position within button → rotateX/rotateY springs
 *  • Brightness boost on hover/drag via useTransform
 *  • Radial gradient shine overlay that follows tilt direction
 *  • Optional badge (green online dot, top-right)
 *  • Tooltip label on hover
 *
 * Props:
 *   icon        — emoji displayed in the centre
 *   label       — tooltip text shown on hover
 *   gradient    — CSS gradient for button background
 *   shadowColor — glow color (e.g. 'rgba(139,92,246,0.6)')
 *   size        — diameter in px (default 56)
 *   badge       — whether to show the green online indicator dot
 *   onClick     — called on tap/click (not drag)
 *
 * Used by: RouteBuilder (✈️), AIAssistant (🤖), DiscoverMode (🎲, 🌍)
 */
import React, { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface DraggableFloatButtonProps {
    icon: string;
    label: string;
    onClick?: () => void;
    gradient: string;
    shadowColor: string;
    size?: number;
    badge?: boolean;
    className?: string;
}

export const DraggableFloatButton: React.FC<DraggableFloatButtonProps> = ({
    icon,
    label,
    onClick,
    gradient,
    shadowColor,
    size = 56,
    badge = false,
    className = '',
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showLabel, setShowLabel] = useState(false);

    // 3D tilt tracking
    const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
    const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
    const scale = useSpring(1, { stiffness: 300, damping: 25 });
    const brightnessVal = useSpring(1, { stiffness: 300, damping: 25 });
    const filterStyle = useTransform(brightnessVal, (v) => `brightness(${v})`);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        rotateX.set(-dy * 20);
        rotateY.set(dx * 20);
        brightnessVal.set(1.15);
    }, [isDragging, rotateX, rotateY, brightnessVal]);

    const handleMouseLeave = useCallback(() => {
        rotateX.set(0);
        rotateY.set(0);
        scale.set(1);
        brightnessVal.set(1);
        setShowLabel(false);
    }, [rotateX, rotateY, scale, brightnessVal]);

    const handleMouseEnter = useCallback(() => {
        if (!isDragging) {
            scale.set(1.12);
            setShowLabel(true);
        }
    }, [isDragging, scale]);

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Label tooltip */}
            {showLabel && !isDragging && (
                <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1 bg-slate-900/95 border border-white/10 rounded-lg text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none"
                >
                    {label}
                </motion.div>
            )}

            <motion.div
                ref={ref}
                drag
                dragMomentum={false}
                dragElastic={0.08}
                onDragStart={() => { setIsDragging(true); setShowLabel(false); scale.set(1.08); }}
                onDragEnd={() => { setIsDragging(false); scale.set(1); }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => { if (!isDragging) onClick?.(); }}
                style={{
                    width: size,
                    height: size,
                    rotateX,
                    rotateY,
                    scale,
                    filter: filterStyle,
                    transformStyle: 'preserve-3d',
                    perspective: 600,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    borderRadius: '50%',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: `0 8px 32px ${shadowColor}, 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                whileTap={{ scale: isDragging ? 1.08 : 0.93 }}
                title={label}
            >
                {/* 3D shine overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, transparent 65%)',
                        pointerEvents: 'none',
                    }}
                />
                {/* Bottom shadow face for 3D depth */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.25) 100%)',
                        pointerEvents: 'none',
                    }}
                />

                <span style={{ fontSize: size * 0.43, lineHeight: 1, position: 'relative', zIndex: 1, userSelect: 'none' }}>
                    {icon}
                </span>

                {badge && (
                    <span
                        style={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#4ade80',
                            border: '2px solid #0f172a',
                            animation: 'pulse 2s infinite',
                        }}
                    />
                )}

                {/* Drag indicator ring */}
                {isDragging && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            border: '2px dashed rgba(255,255,255,0.4)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
};
