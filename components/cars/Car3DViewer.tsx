"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * A tasteful, lightweight low-poly car built from primitives — no external
 * model asset needed (keeps the bundle tiny and CSP-safe). Auto-rotates,
 * respects reduced-motion, and is orbit-controllable.
 */
function LowPolyCar({ color = "#2563eb" }: { color?: string }) {
  const group = useRef<Group>(null);
  const reduce = prefersReducedMotion();

  useFrame((_, delta) => {
    if (group.current && !reduce) {
      group.current.rotation.y += delta * 0.4;
    }
  });

  const wheelPositions: [number, number, number][] = [
    [-1.05, -0.35, 0.72],
    [1.05, -0.35, 0.72],
    [-1.05, -0.35, -0.72],
    [1.05, -0.35, -0.72],
  ];

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      {/* Lower body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[3.4, 0.7, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[-0.15, 0.55, 0]}>
        <boxGeometry args={[1.7, 0.7, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.15, 0.56, 0]}>
        <boxGeometry args={[1.72, 0.5, 1.42]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.1} />
      </mesh>
      {/* Headlights */}
      <mesh position={[1.72, 0.05, 0.5]}>
        <boxGeometry args={[0.08, 0.18, 0.28]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[1.72, 0.05, -0.5]}>
        <boxGeometry args={[0.08, 0.18, 0.28]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.6} />
      </mesh>
      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 20]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function Car3DViewer({ color }: { color?: string }) {
  return (
    <div className="glass h-72 w-full overflow-hidden rounded-2xl sm:h-80">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [4.5, 2.6, 5], fov: 40 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 6, 4]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Suspense fallback={null}>
          <LowPolyCar color={color} />
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.35}
            scale={10}
            blur={2.4}
            far={4}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={9}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}
