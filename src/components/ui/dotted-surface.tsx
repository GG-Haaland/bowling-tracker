import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Bowling lane wood colors — alternating plank tones
const PLANK_COLORS = [
  0xdec9a0, // light maple
  0xd4b97a, // honey
  0xc9a85e, // golden
  0xdcc48e, // pale
  0xc4a460, // amber
  0xd8c090, // wheat
  0xcbad6a, // warm
  0xe0cb98, // cream maple
  0xd0b070, // caramel
  0xdbc590, // sandy
];

// Arrow colors (dark lane markers)
const ARROW_COLOR = 0x4a3520;

export function DottedSurface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    const container = containerRef.current;

    // Lane grid config
    const PLANKS = 50;        // number of planks (x axis)
    const SEGMENTS_Z = 80;    // segments along the lane (z axis)
    const PLANK_WIDTH = 120;
    const SEGMENT_DEPTH = 120;
    const TOTAL_WIDTH = PLANKS * PLANK_WIDTH;
    const TOTAL_DEPTH = SEGMENTS_Z * SEGMENT_DEPTH;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      15000,
    );
    camera.position.set(0, 400, 1400);
    camera.lookAt(0, -100, -1000);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Soft ambient + directional light for depth
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xfff5e0, 0.5);
    dirLight.position.set(200, 600, 400);
    scene.add(dirLight);

    // Build planks as a single merged geometry for performance
    const plankGeometries: THREE.BufferGeometry[] = [];
    const plankMeshes: THREE.Mesh[] = [];

    for (let px = 0; px < PLANKS; px++) {
      const geo = new THREE.PlaneGeometry(
        PLANK_WIDTH - 2, // slight gap between planks
        TOTAL_DEPTH,
        1,
        SEGMENTS_Z,
      );
      geo.rotateX(-Math.PI / 2); // lay flat

      // Position each plank
      const xPos = px * PLANK_WIDTH - TOTAL_WIDTH / 2 + PLANK_WIDTH / 2;
      geo.translate(xPos, 0, -TOTAL_DEPTH / 2 + TOTAL_DEPTH / 2);

      const colorIdx = px % PLANK_COLORS.length;
      const color = new THREE.Color(PLANK_COLORS[colorIdx]);

      const mat = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      plankMeshes.push(mesh);
      plankGeometries.push(geo);
    }

    // Arrow markers — triangular shapes embedded in the lane
    // Pattern: 7 arrows in a V formation (like real bowling lane arrows)
    const arrowPositions = [
      // Row 1 (closest) — 4 arrows
      { x: -3, z: 0.3 },
      { x: -1, z: 0.25 },
      { x: 1, z: 0.25 },
      { x: 3, z: 0.3 },
      // Row 2 — 3 arrows (inner)
      { x: -2, z: 0.4 },
      { x: 0, z: 0.35 },
      { x: 2, z: 0.4 },
    ];

    const arrowMeshes: THREE.Mesh[] = [];
    const arrowGeo = new THREE.ConeGeometry(35, 90, 3);
    arrowGeo.rotateX(-Math.PI / 2);
    const arrowMat = new THREE.MeshLambertMaterial({
      color: ARROW_COLOR,
      transparent: true,
      opacity: 0.7,
    });

    // Repeat arrows along the lane length
    for (let rep = 0; rep < 3; rep++) {
      const zOffset = rep * TOTAL_DEPTH * 0.35 - TOTAL_DEPTH * 0.2;
      arrowPositions.forEach(ap => {
        const mesh = new THREE.Mesh(arrowGeo.clone(), arrowMat);
        mesh.position.set(
          ap.x * PLANK_WIDTH * 1.8,
          2,
          zOffset + ap.z * TOTAL_DEPTH * 0.15,
        );
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
        arrowMeshes.push(mesh);
      });
    }

    // Fog for depth fade
    scene.fog = new THREE.Fog(0x1a1a2e, 3000, 9000);

    let count = 0;

    function animate() {
      requestAnimationFrame(animate);

      // Wave animation on plank vertices
      plankGeometries.forEach((geo, px) => {
        const pos = geo.attributes.position.array as Float32Array;
        const vertCount = pos.length / 3;

        for (let v = 0; v < vertCount; v++) {
          // Get original z position for the wave calculation
          const origZ = (v % (SEGMENTS_Z + 2)) / (SEGMENTS_Z + 1);
          const waveY =
            Math.sin((px * 0.4 + count) * 0.3) * 40 +
            Math.sin((origZ * 8 + count) * 0.5) * 35;
          pos[v * 3 + 1] = waveY;
        }
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
      });

      // Animate arrows to follow the wave
      arrowMeshes.forEach(arrow => {
        const ax = arrow.position.x / PLANK_WIDTH;
        const az = (arrow.position.z + TOTAL_DEPTH / 2) / TOTAL_DEPTH;
        arrow.position.y =
          Math.sin((ax * 0.4 + count) * 0.3) * 40 +
          Math.sin((az * 8 + count) * 0.5) * 35 + 3;
      });

      renderer.render(scene, camera);
      count += 0.07;
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
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
      }}
    />
  );
}
