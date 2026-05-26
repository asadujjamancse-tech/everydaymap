/**
 * transitions.ts — Shared Framer Motion Variants
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable animation presets imported by panels and cards across the app.
 * Using shared variants keeps animation timing consistent without copy-pasting.
 *
 *   containerVariants  — staggered fade-in for lists of children (0.1s apart)
 *   itemVariants       — slide-up + fade used for each list item
 *   floatingVariants   — gentle vertical bob (4s loop, used for icons)
 *   glowVariants       — purple glow pulse (3s loop, used for active elements)
 *   pulseVariants      — scale pulse (2s loop, used for live indicators)
 *
 * Usage:
 *   <motion.ul variants={containerVariants} initial="hidden" animate="visible">
 *     <motion.li variants={itemVariants}>...</motion.li>
 *   </motion.ul>
 */

import { motion } from 'framer-motion';

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

export const floatingVariants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const glowVariants = {
    animate: {
        boxShadow: [
            '0 0 20px rgba(139, 92, 246, 0.3)',
            '0 0 40px rgba(139, 92, 246, 0.6)',
            '0 0 20px rgba(139, 92, 246, 0.3)',
        ],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const pulseVariants = {
    animate: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};
