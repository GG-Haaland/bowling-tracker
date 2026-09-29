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
    scene.fog = new THREE.Fog(0x000000, 600, 4500);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      15000,
    );
    camera.position.set(0, 350, 1300);
    camera.lookAt(0, 50, -800);

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
      transparent: false,
      side: THREE.DoubleSide,
    });

    const laneMesh = new THREE.Mesh(geometry, material);
    scene.add(laneMesh);

    // Black floor underneath the lane so the backdrop doesn't show through
    const floorGeo = new THREE.PlaneGeometry(TOTAL_W * 1.5, TOTAL_D * 1.5);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -80;
    scene.add(floor);

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

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

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

    animate();

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
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
        backgroundImage: 'url(/lane-backdrop.png)',
        backgroundSize: '100% auto',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000000',
      }}
    />
  );
}
