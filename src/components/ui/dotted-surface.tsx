import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Bowling lane wood colors — alternating plank tones
const PLANK_COLORS = [
  [0.87, 0.79, 0.63], // light maple
  [0.83, 0.73, 0.48], // honey
  [0.79, 0.66, 0.37], // golden
  [0.86, 0.77, 0.56], // pale
  [0.77, 0.64, 0.38], // amber
  [0.85, 0.75, 0.56], // wheat
  [0.80, 0.68, 0.42], // warm
  [0.88, 0.80, 0.60], // cream maple
  [0.82, 0.69, 0.44], // caramel
  [0.86, 0.77, 0.56], // sandy
  [0.84, 0.74, 0.50], // tawny
  [0.89, 0.81, 0.62], // birch
];

const ARROW_COLOR = 0x3a2815;

export function DottedSurface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    const container = containerRef.current;

    // Lane config — many narrow planks + lots of Z segments for smooth bending
    const PLANKS = 150;
    const SEGS_Z = 200;
    const PLANK_W = 45;
    const SEG_D = 55;
    const GAP = 1.5;
    const TOTAL_W = PLANKS * PLANK_W;
    const TOTAL_D = SEGS_Z * SEG_D;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 2500, 8500);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      15000,
    );
    camera.position.set(0, 380, 1300);
    camera.lookAt(0, -80, -800);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xfff5e0, 0.45);
    dir.position.set(300, 500, 400);
    scene.add(dir);

    // Build one large merged geometry for all planks (WAY better perf than 150 meshes)
    // Each plank is a strip of quads: 2 verts wide × (SEGS_Z+1) verts tall
    const vertsPerPlank = 2 * (SEGS_Z + 1);
    const totalVerts = PLANKS * vertsPerPlank;
    const trisPerPlank = 2 * SEGS_Z; // 2 triangles per quad segment
    const totalTris = PLANKS * trisPerPlank;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const origZ = new Float32Array(totalVerts); // store original Z for wave calc
    const indices = new Uint32Array(totalTris * 3);

    let vi = 0; // vertex index
    let ii = 0; // index index

    for (let px = 0; px < PLANKS; px++) {
      const xLeft = px * PLANK_W - TOTAL_W / 2 + GAP / 2;
      const xRight = xLeft + PLANK_W - GAP;
      const col = PLANK_COLORS[px % PLANK_COLORS.length];
      // Slight random variation per plank for realism
      const shade = 0.95 + Math.random() * 0.1;
      const r = col[0] * shade;
      const g = col[1] * shade;
      const b = col[2] * shade;

      const baseVert = vi;

      for (let sz = 0; sz <= SEGS_Z; sz++) {
        const z = sz * SEG_D - TOTAL_D / 2;
        const normZ = sz / SEGS_Z; // 0..1

        // Left vertex
        positions[vi * 3] = xLeft;
        positions[vi * 3 + 1] = 0;
        positions[vi * 3 + 2] = z;
        colors[vi * 3] = r;
        colors[vi * 3 + 1] = g;
        colors[vi * 3 + 2] = b;
        origZ[vi] = normZ;
        vi++;

        // Right vertex
        positions[vi * 3] = xRight;
        positions[vi * 3 + 1] = 0;
        positions[vi * 3 + 2] = z;
        colors[vi * 3] = r;
        colors[vi * 3 + 1] = g;
        colors[vi * 3 + 2] = b;
        origZ[vi] = normZ;
        vi++;
      }

      // Build triangle indices for this plank
      for (let sz = 0; sz < SEGS_Z; sz++) {
        const topLeft = baseVert + sz * 2;
        const topRight = topLeft + 1;
        const botLeft = topLeft + 2;
        const botRight = topLeft + 3;
        // Tri 1
        indices[ii++] = topLeft;
        indices[ii++] = botLeft;
        indices[ii++] = topRight;
        // Tri 2
        indices[ii++] = topRight;
        indices[ii++] = botLeft;
        indices[ii++] = botRight;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });

    const laneMesh = new THREE.Mesh(geometry, material);
    scene.add(laneMesh);

    // Arrow markers
    const arrowPositions = [
      { x: -3, z: 0.3 },
      { x: -1, z: 0.25 },
      { x: 1, z: 0.25 },
      { x: 3, z: 0.3 },
      { x: -2, z: 0.4 },
      { x: 0, z: 0.35 },
      { x: 2, z: 0.4 },
    ];

    const arrowMeshes: THREE.Mesh[] = [];
    const arrowGeo = new THREE.ConeGeometry(20, 60, 3);
    arrowGeo.rotateX(-Math.PI / 2);
    const arrowMat = new THREE.MeshLambertMaterial({
      color: ARROW_COLOR,
      transparent: true,
      opacity: 0.65,
    });

    for (let rep = 0; rep < 4; rep++) {
      const zOff = rep * TOTAL_D * 0.28 - TOTAL_D * 0.25;
      arrowPositions.forEach(ap => {
        const mesh = new THREE.Mesh(arrowGeo.clone(), arrowMat);
        mesh.position.set(
          ap.x * PLANK_W * 4,
          2,
          zOff + ap.z * TOTAL_D * 0.12,
        );
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
        arrowMeshes.push(mesh);
      });
    }

    // Store plank X centers for wave calculation
    const plankCenters: number[] = [];
    for (let px = 0; px < PLANKS; px++) {
      plankCenters.push(px * PLANK_W - TOTAL_W / 2 + PLANK_W / 2);
    }

    let count = 0;

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // ── Psychedelic wave backdrop (2D canvas behind the 3D lane) ──
    const bgCanvas = document.createElement('canvas');
    bgCanvas.style.position = 'absolute';
    bgCanvas.style.top = '0';
    bgCanvas.style.left = '0';
    bgCanvas.style.width = '100%';
    bgCanvas.style.height = '100%';
    bgCanvas.style.zIndex = '-1';
    container.insertBefore(bgCanvas, container.firstChild);

    const bgCtx = bgCanvas.getContext('2d')!;
    const DARK = '#1a1a2e';
    const CREAM = '#e8dcc8';

    // Pre-compute bowling pin positions (scattered)
    const pinPositions: { x: number; y: number; size: number }[] = [];
    for (let i = 0; i < 12; i++) {
      pinPositions.push({
        x: Math.random(),
        y: Math.random(),
        size: 12 + Math.random() * 10,
      });
    }

    function drawPin(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
      ctx.fillStyle = color;
      ctx.beginPath();
      // Body (bottom ellipse)
      ctx.ellipse(cx, cy + s * 0.3, s * 0.35, s * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 0.25, s * 0.15, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.55, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Stripe
      ctx.strokeStyle = color === CREAM ? '#cc3333' : '#882222';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.18, cy - s * 0.35);
      ctx.lineTo(cx + s * 0.18, cy - s * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.16, cy - s * 0.42);
      ctx.lineTo(cx + s * 0.16, cy - s * 0.42);
      ctx.stroke();
    }

    let bgCount = 0;

    function animateBg() {
      const w = bgCanvas.width;
      const h = bgCanvas.height;

      // Fill dark base
      bgCtx.fillStyle = DARK;
      bgCtx.fillRect(0, 0, w, h);

      // Draw animated wavy stripes
      const stripeCount = 30;
      const stripeWidth = h / stripeCount;

      for (let s = 0; s < stripeCount; s++) {
        if (s % 2 === 0) continue; // only draw cream stripes (dark is the base)
        bgCtx.beginPath();
        bgCtx.fillStyle = CREAM;

        const baseY = s * stripeWidth;

        bgCtx.moveTo(0, baseY);
        for (let x = 0; x <= w; x += 4) {
          const nx = x / w;
          const ns = s / stripeCount;
          const wave =
            Math.sin((nx * 6 + bgCount * 0.8 + ns * 4) * 1.0) * stripeWidth * 0.6 +
            Math.sin((nx * 3 - bgCount * 0.5 + ns * 2) * 1.5) * stripeWidth * 0.4 +
            Math.sin((ns * 8 + bgCount * 0.3) * 0.8) * stripeWidth * 0.3;
          bgCtx.lineTo(x, baseY + wave);
        }
        // Close bottom edge of stripe
        for (let x = w; x >= 0; x -= 4) {
          const nx = x / w;
          const ns = s / stripeCount;
          const wave =
            Math.sin((nx * 6 + bgCount * 0.8 + ns * 4) * 1.0) * stripeWidth * 0.6 +
            Math.sin((nx * 3 - bgCount * 0.5 + ns * 2) * 1.5) * stripeWidth * 0.4 +
            Math.sin((ns * 8 + bgCount * 0.3) * 0.8) * stripeWidth * 0.3;
          bgCtx.lineTo(x, baseY + stripeWidth + wave);
        }
        bgCtx.closePath();
        bgCtx.fill();
      }

      // Draw bowling pins
      pinPositions.forEach(pin => {
        const px = pin.x * w;
        const baseY = pin.y * h;
        const wave = Math.sin((pin.x * 6 + bgCount * 0.8 + pin.y * 4)) * 20 +
                     Math.sin((pin.x * 3 - bgCount * 0.5 + pin.y * 2) * 1.5) * 15;
        const py = baseY + wave;
        // Determine if pin is on dark or cream stripe
        const stripeIdx = Math.floor((baseY / h) * stripeCount);
        const pinColor = stripeIdx % 2 === 0 ? CREAM : DARK;
        drawPin(bgCtx, px, py, pin.size, pinColor);
      });

      bgCount += 0.012;
    }

    function resizeBgCanvas() {
      bgCanvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
      bgCanvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
      bgCtx.scale(
        Math.min(window.devicePixelRatio, 2),
        Math.min(window.devicePixelRatio, 2)
      );
    }
    resizeBgCanvas();

    // Combine both animations
    function combinedAnimate() {
      requestAnimationFrame(combinedAnimate);
      animateBg();
      // Run the 3D lane animation inline
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < totalVerts; i++) {
        const px = Math.floor(i / vertsPerPlank);
        const nz = origZ[i];
        const waveY =
          Math.sin((px * 0.15 + count) * 0.4) * 35 +
          Math.sin((nz * 10 + count) * 0.5) * 30;
        pos[i * 3 + 1] = waveY;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      arrowMeshes.forEach(arrow => {
        const normX = (arrow.position.x + TOTAL_W / 2) / TOTAL_W;
        const apx = normX * PLANKS;
        const normAZ = (arrow.position.z + TOTAL_D / 2) / TOTAL_D;
        arrow.position.y =
          Math.sin((apx * 0.15 + count) * 0.4) * 35 +
          Math.sin((normAZ * 10 + count) * 0.5) * 30 + 4;
      });
      renderer.render(scene, camera);
      count += 0.06;
    }

    combinedAnimate();

    const combinedResize = () => {
      onResize();
      resizeBgCanvas();
    };
    window.addEventListener('resize', combinedResize);

    return () => {
      window.removeEventListener('resize', combinedResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
