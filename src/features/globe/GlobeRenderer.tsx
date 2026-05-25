import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface GlobeRendererProps {
    onLocationSelect?: (lat: number, lng: number) => void;
    /** Fires when the user scrolls in past the zoom threshold. Receives the lat/lng at screen center. */
    onZoomIn?: (lat: number, lng: number) => void;
    /** When set, the globe smoothly re-orients to show this coordinate at screen center. */
    targetCenter?: { lat: number; lng: number } | null;
}

const EARTH_TEXTURE  = 'https://unpkg.com/three-globe@2.30.0/example/img/earth-blue-marble.jpg';
const CLOUDS_TEXTURE = 'https://unpkg.com/three-globe@2.30.0/example/img/earth-clouds.png';

// Camera Z distance at which we trigger the zoom-in handoff to Mapbox
const ZOOM_IN_TRIGGER = 1.72;
// Camera Z distance at which the "zooming in" hint starts appearing
const ZOOM_HINT_START = 2.4;

export const GlobeRenderer: React.FC<GlobeRendererProps> = ({
    onLocationSelect,
    onZoomIn,
    targetCenter,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { globeRotation } = useMapStore();
    const globeRotationRef = useRef(globeRotation);
    globeRotationRef.current = globeRotation;

    // Keep callback refs fresh so they never become stale inside the effect closure
    const onLocationSelectRef = useRef(onLocationSelect);
    onLocationSelectRef.current = onLocationSelect;
    const onZoomInRef = useRef(onZoomIn);
    onZoomInRef.current = onZoomIn;

    // ── Shared mutable state readable both inside and outside the effect ──────
    // The animation loop writes cameraZ, centerLat/Lng, and zoomFirered.
    // targetCenter changes (from outside) write pendingTarget so the loop picks them up.
    const stateRef = useRef({
        // Rotation driven by user drag + auto-rotate
        targetRotX: 0,
        targetRotY: 0,
        autoRotY: 0,
        velocity: { x: 0, y: 0 },
        isDragging: false,
        autoRotate: true,
        // Camera zoom
        cameraZ: 3,
        // Current screen-center coordinate (updated every frame via raycasting)
        centerLat: 0,
        centerLng: 0,
        // Whether zoom-in handoff has already been fired for this scroll session
        zoomFired: false,
        // Pending external re-orientation request
        pendingTarget: null as { lat: number; lng: number } | null,
    });

    // ── When targetCenter prop changes, schedule a re-orientation ─────────────
    useEffect(() => {
        if (targetCenter) {
            stateRef.current.pendingTarget = { lat: targetCenter.lat, lng: targetCenter.lng };
            // Reset fired flag so the user can zoom in again after returning
            stateRef.current.zoomFired = false;
            // Reset camera back to "zoomed out" so the globe looks correct
            stateRef.current.cameraZ = 3;
        }
    }, [targetCenter]);

    // ── Main Three.js setup (runs once) ────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        let cleanup: (() => void) | undefined;

        import('three').then((THREE) => {
            if (!container) return;

            // ── Scene ────────────────────────────────────────────────────
            const scene = new THREE.Scene();

            // ── Camera ───────────────────────────────────────────────────
            const camera = new THREE.PerspectiveCamera(
                45,
                container.clientWidth / container.clientHeight,
                0.1,
                1000,
            );
            camera.position.set(0, 0, 3);

            // ── Renderer ─────────────────────────────────────────────────
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // ── Globe group ───────────────────────────────────────────────
            const globeGroup = new THREE.Group();
            scene.add(globeGroup);

            // ── Stars ─────────────────────────────────────────────────────
            const starsGeo = new THREE.BufferGeometry();
            const starsCount = 12000;
            const starsPos = new Float32Array(starsCount * 3);
            for (let i = 0; i < starsCount * 3; i++) starsPos[i] = (Math.random() - 0.5) * 300;
            starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
            scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({
                color: 0xffffff, size: 0.15, sizeAttenuation: true, transparent: true, opacity: 0.85,
            })));

            // ── Lights ────────────────────────────────────────────────────
            scene.add(new THREE.AmbientLight(0x333355, 0.5));
            const sunLight = new THREE.DirectionalLight(0xfff0e0, 1.8);
            sunLight.position.set(5, 2, 5);
            sunLight.castShadow = true;
            scene.add(sunLight);

            // ── Earth mesh ────────────────────────────────────────────────
            const earthGeo = new THREE.SphereGeometry(1, 64, 64);
            const loader  = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';

            let earthMesh: THREE.Mesh | null = null;
            let cloudMesh: THREE.Mesh | null = null;

            const createFallback = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 2048; canvas.height = 1024;
                const ctx = canvas.getContext('2d')!;
                const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
                g.addColorStop(0, '#0a1628'); g.addColorStop(0.5, '#0d2644'); g.addColorStop(1, '#0a1628');
                ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#1a4d2e';
                [[150,150,280,320],[240,430,160,280],[870,120,140,200],[880,280,180,380],
                 [1010,80,580,380],[1250,510,220,200],[320,50,120,100]].forEach(([x,y,w,h]) => {
                    ctx.beginPath(); ctx.ellipse(x+w/2, y+h/2, w/2, h/2, 0, 0, Math.PI*2); ctx.fill();
                });
                ctx.fillStyle = '#cce8ff';
                ctx.fillRect(0, 0, canvas.width, 60);
                ctx.fillRect(0, canvas.height-60, canvas.width, 60);
                return new THREE.CanvasTexture(canvas);
            };

            const buildEarth = (tex: THREE.Texture) => {
                earthMesh = new THREE.Mesh(earthGeo, new THREE.MeshPhongMaterial({
                    map: tex, specular: new THREE.Color(0x222244), shininess: 15,
                }));
                earthMesh.castShadow = true;
                earthMesh.receiveShadow = true;
                globeGroup.add(earthMesh);
            };

            const buildClouds = (tex: THREE.Texture) => {
                cloudMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(1.003, 64, 64),
                    new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false }),
                );
                globeGroup.add(cloudMesh);
            };

            loader.load(EARTH_TEXTURE, (t) => {
                buildEarth(t);
                loader.load(CLOUDS_TEXTURE, (ct) => buildClouds(ct), undefined, () => {});
            }, undefined, () => buildEarth(createFallback()));

            // ── Atmosphere glow ──────────────────────────────────────────
            const makeAtmos = (radius: number, vShader: string, fShader: string, side: THREE.Side) => {
                scene.add(new THREE.Mesh(
                    new THREE.SphereGeometry(radius, 64, 64),
                    new THREE.ShaderMaterial({
                        vertexShader: vShader, fragmentShader: fShader,
                        blending: THREE.AdditiveBlending, side, transparent: true, depthWrite: false,
                    }),
                ));
            };
            const normalVS = `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
            makeAtmos(1.08, normalVS, `varying vec3 vNormal; void main() { float i = pow(0.65 - dot(vNormal, vec3(0,0,1)), 4.0); vec3 c = mix(vec3(0.1,0.4,1.0), vec3(0.4,0.7,1.0), i); gl_FragColor = vec4(c, i*1.2); }`, THREE.BackSide);
            makeAtmos(1.015, normalVS, `varying vec3 vNormal; void main() { float i = pow(0.72 - dot(vNormal, vec3(0,0,1)), 5.0); gl_FragColor = vec4(0.15,0.55,1.0, i*0.6); }`, THREE.FrontSide);

            // ── Raycaster (shared, used in both click and center-tracking) ────
            const raycaster = new THREE.Raycaster();
            const screenCenter = new THREE.Vector2(0, 0); // constant center of screen

            // ── Interaction handlers ─────────────────────────────────────
            const s = stateRef.current; // shorthand

            const onPointerDown = (e: PointerEvent) => {
                s.isDragging = true; s.autoRotate = false;
                s.velocity = { x: 0, y: 0 };
                (stateRef.current as any)._prevMouse = { x: e.clientX, y: e.clientY };
            };
            const onPointerMove = (e: PointerEvent) => {
                if (!s.isDragging) return;
                const prev = (stateRef.current as any)._prevMouse ?? { x: e.clientX, y: e.clientY };
                const dx = e.clientX - prev.x;
                const dy = e.clientY - prev.y;
                s.velocity = { x: dx * 0.004, y: dy * 0.004 };
                s.targetRotY += dx * 0.004;
                s.targetRotX += dy * 0.004;
                s.targetRotX = Math.max(-1.2, Math.min(1.2, s.targetRotX));
                (stateRef.current as any)._prevMouse = { x: e.clientX, y: e.clientY };
            };
            const onPointerUp = () => {
                s.isDragging = false;
                setTimeout(() => { s.autoRotate = true; }, 3000);
            };

            const onWheel = (e: WheelEvent) => {
                s.cameraZ += e.deltaY * 0.002;
                s.cameraZ = Math.max(1.5, Math.min(6, s.cameraZ));

                // When camera gets close enough, hand off to Mapbox
                if (s.cameraZ <= ZOOM_IN_TRIGGER && !s.zoomFired && onZoomInRef.current) {
                    s.zoomFired = true;
                    onZoomInRef.current(s.centerLat, s.centerLng);
                }

                // Reset fired flag when zooming back out
                if (s.cameraZ > ZOOM_IN_TRIGGER + 0.1) {
                    s.zoomFired = false;
                }
            };

            // Double-click: precise raycast location
            const mouse = new THREE.Vector2();
            const onDblClick = (e: MouseEvent) => {
                if (!earthMesh) return;
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
                mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObject(earthMesh);
                if (hits.length > 0) {
                    const lp  = earthMesh.worldToLocal(hits[0].point.clone());
                    const lat = Math.asin(Math.max(-1, Math.min(1, lp.y))) * (180 / Math.PI);
                    const lng = Math.atan2(-lp.z, lp.x) * (180 / Math.PI);
                    onLocationSelectRef.current?.(lat, lng);
                }
            };

            renderer.domElement.addEventListener('pointerdown',  onPointerDown);
            renderer.domElement.addEventListener('pointermove',  onPointerMove);
            renderer.domElement.addEventListener('pointerup',    onPointerUp);
            renderer.domElement.addEventListener('pointerleave', onPointerUp);
            renderer.domElement.addEventListener('wheel',        onWheel, { passive: true });
            renderer.domElement.addEventListener('dblclick',     onDblClick);

            // ── Animation loop ────────────────────────────────────────────
            let frameId: number;

            const animate = () => {
                frameId = requestAnimationFrame(animate);
                const st = stateRef.current;

                // ── Handle pending external re-orientation ────────────────
                if (st.pendingTarget) {
                    // Convert (lat, lng) to globe rotation values.
                    // Convention: atan2(-z, x) → lng, asin(y) → lat
                    // Approximate inverse: rotY ≈ -lng * π/180, rotX ≈ -lat * π/180
                    const targetRY = -(st.pendingTarget.lng * Math.PI / 180) - st.autoRotY;
                    const targetRX = -(st.pendingTarget.lat * Math.PI / 180);
                    st.autoRotate = false;

                    // Lerp towards target
                    const lerpSpeed = 0.07;
                    st.targetRotY += (targetRY - st.targetRotY) * lerpSpeed;
                    st.targetRotX += (targetRX - st.targetRotX) * lerpSpeed;

                    // Clear when close enough
                    if (Math.abs(targetRY - st.targetRotY) < 0.003 && Math.abs(targetRX - st.targetRotX) < 0.003) {
                        st.pendingTarget = null;
                        setTimeout(() => { st.autoRotate = true; }, 2000);
                    }
                }

                // ── Auto-rotate ───────────────────────────────────────────
                if (st.autoRotate && !st.isDragging && !st.pendingTarget && globeRotationRef.current) {
                    st.autoRotY += 0.0012;
                }

                // ── Inertia ───────────────────────────────────────────────
                if (!st.isDragging) {
                    st.velocity.x *= 0.94;
                    st.velocity.y *= 0.94;
                    st.targetRotY += st.velocity.x;
                    st.targetRotX += st.velocity.y;
                }

                globeGroup.rotation.y = st.autoRotY + st.targetRotY;
                globeGroup.rotation.x = st.targetRotX;
                if (cloudMesh) cloudMesh.rotation.y += 0.0003;

                // ── Smooth camera zoom ────────────────────────────────────
                camera.position.z += (st.cameraZ - camera.position.z) * 0.06;

                // ── Track screen-center coordinate every frame ─────────────
                if (earthMesh) {
                    raycaster.setFromCamera(screenCenter, camera);
                    const hits = raycaster.intersectObject(earthMesh);
                    if (hits.length > 0) {
                        const lp = earthMesh.worldToLocal(hits[0].point.clone());
                        st.centerLat = Math.asin(Math.max(-1, Math.min(1, lp.y))) * (180 / Math.PI);
                        st.centerLng = Math.atan2(-lp.z, lp.x) * (180 / Math.PI);
                    }
                }

                renderer.render(scene, camera);
            };
            animate();

            // ── Resize ────────────────────────────────────────────────────
            const onResize = () => {
                if (!container) return;
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            };
            window.addEventListener('resize', onResize);

            // ── Cleanup ───────────────────────────────────────────────────
            cleanup = () => {
                cancelAnimationFrame(frameId);
                window.removeEventListener('resize', onResize);
                renderer.domElement.removeEventListener('pointerdown',  onPointerDown);
                renderer.domElement.removeEventListener('pointermove',  onPointerMove);
                renderer.domElement.removeEventListener('pointerup',    onPointerUp);
                renderer.domElement.removeEventListener('pointerleave', onPointerUp);
                renderer.domElement.removeEventListener('wheel',        onWheel);
                renderer.domElement.removeEventListener('dblclick',     onDblClick);
                renderer.dispose();
                try { container.removeChild(renderer.domElement); } catch (_) {}
            };
        }).catch(console.error);

        return () => { cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — all live values read via refs

    // ── Zoom progress for the hint overlay ───────────────────────────────────
    // Computed reactively is tricky since cameraZ lives inside the effect.
    // We expose it via stateRef and read it in a simple way via a re-render
    // triggered by the wheel event on the container (passive, for the overlay only).

    return (
        <div className="relative w-full h-full">
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ background: 'radial-gradient(ellipse at center, #0a0e1a 0%, #020617 100%)' }}
            />
            {/* ── Zoom-in hint overlay ─────────────────────────────────── */}
            <ZoomHint stateRef={stateRef} />
        </div>
    );
};

// ── Separate component so the hint can re-render without the globe ─────────────
const ZoomHint: React.FC<{ stateRef: React.MutableRefObject<{ cameraZ: number; centerLat: number; centerLng: number }> }> = ({ stateRef }) => {
    const [cameraZ, setCameraZ] = React.useState(3);

    // Sync cameraZ from the animation loop to React state at ~10fps (enough for UI)
    React.useEffect(() => {
        const interval = setInterval(() => {
            const z = stateRef.current.cameraZ;
            setCameraZ(z);
        }, 100);
        return () => clearInterval(interval);
    }, [stateRef]);

    // Progress 0→1 as cameraZ goes from ZOOM_HINT_START down to ZOOM_IN_TRIGGER
    const progress = Math.max(0, Math.min(1,
        (ZOOM_HINT_START - cameraZ) / (ZOOM_HINT_START - ZOOM_IN_TRIGGER)
    ));

    const isClose = cameraZ < ZOOM_HINT_START;
    const isVeryClose = cameraZ < ZOOM_IN_TRIGGER + 0.15;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none select-none text-center">
            {!isClose && (
                <p className="text-slate-400 text-xs opacity-60">
                    Drag to rotate · Scroll to zoom · Double-click to explore
                </p>
            )}

            {isClose && !isVeryClose && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2"
                >
                    {/* Progress ring */}
                    <div className="relative w-12 h-12">
                        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="3" />
                            <circle
                                cx="22" cy="22" r="18"
                                fill="none"
                                stroke="rgba(139,92,246,0.8)"
                                strokeWidth="3"
                                strokeDasharray={`${113 * progress} 113`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-purple-300 text-xs font-bold">
                            {Math.round(progress * 100)}%
                        </span>
                    </div>
                    <p className="text-purple-300 text-xs font-semibold tracking-wide">
                        Keep scrolling to enter the map
                    </p>
                    <p className="text-slate-500 text-[10px]">
                        {stateRef.current.centerLat.toFixed(1)}°, {stateRef.current.centerLng.toFixed(1)}°
                    </p>
                </motion.div>
            )}

            {isVeryClose && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-1"
                >
                    <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="text-xl"
                    >🌍→🗺️</motion.div>
                    <p className="text-white text-xs font-bold tracking-wide">Entering map…</p>
                </motion.div>
            )}
        </div>
    );
};
