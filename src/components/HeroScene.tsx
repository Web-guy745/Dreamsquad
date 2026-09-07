import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Generates a soft radial-gradient sprite texture on a canvas.
 * Used behind the crystal core to fake a bloom/glow without a
 * postprocessing dependency.
 */
function useGlowTexture(color: string): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, `${color}CC`);
      gradient.addColorStop(0.4, `${color}55`);
      gradient.addColorStop(1, `${color}00`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [color]);
}

interface GlowSpriteProps {
  color: string;
  scale: number;
  position?: [number, number, number];
}

function GlowSprite({ color, scale, position = [0, 0, 0] }: GlowSpriteProps): JSX.Element {
  const texture = useGlowTexture(color);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/** The glowing crystal at the top of the trophy — the "DreamSquad core". */
function TrophyCrystal(): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((_, delta) => {
    if (meshRef.current) {
      const speed = reducedMotion ? 0.05 : 0.3;
      meshRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group position={[0, 0.75, 0]}>
      <GlowSprite color="#8b5cf6" scale={4.2} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#8b5cf6"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.65}
          wireframe
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshStandardMaterial
          color="#12081f"
          emissive="#7c3aed"
          emissiveIntensity={0.55}
          roughness={0.25}
          metalness={0.85}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

/** A ring of small spikes fanning up from the crystal, evoking a crown. */
function TrophyCrown(): JSX.Element {
  const spikeCount = 6;
  const spikes = useMemo(() => {
    return Array.from({ length: spikeCount }, (_, i) => {
      const angle = (i / spikeCount) * Math.PI * 2;
      const radius = 0.42;
      return {
        position: [Math.cos(angle) * radius, 1.18, Math.sin(angle) * radius] as [number, number, number],
        rotationY: -angle,
      };
    });
  }, []);

  return (
    <group>
      {spikes.map((spike, i) => (
        <mesh key={i} position={spike.position} rotation={[0.28, spike.rotationY, 0]}>
          <coneGeometry args={[0.055, 0.34, 4]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={0.9}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Two symmetrical wing-like blades flaring from the trophy's neck. */
function TrophyWings(): JSX.Element {
  const wingMaterial = (
    <meshStandardMaterial
      color="#6d5ef5"
      emissive="#7c3aed"
      emissiveIntensity={0.6}
      roughness={0.35}
      metalness={0.6}
      transparent
      opacity={0.82}
    />
  );

  return (
    <group position={[0, 0.15, 0]}>
      <mesh position={[-0.62, 0, 0]} rotation={[0, 0, Math.PI / 2.3]} scale={[1, 0.22, 0.5]}>
        <coneGeometry args={[0.42, 1.15, 4]} />
        {wingMaterial}
      </mesh>
      <mesh position={[0.62, 0, 0]} rotation={[0, 0, -Math.PI / 2.3]} scale={[1, 0.22, 0.5]}>
        <coneGeometry args={[0.42, 1.15, 4]} />
        {wingMaterial}
      </mesh>
    </group>
  );
}

/** The narrow stem connecting the crystal/wings to the base. */
function TrophyNeck(): JSX.Element {
  return (
    <mesh position={[0, -0.25, 0]}>
      <cylinderGeometry args={[0.05, 0.1, 0.9, 12]} />
      <meshStandardMaterial color="#12081f" emissive="#6d5ef5" emissiveIntensity={0.3} roughness={0.4} metalness={0.8} />
    </mesh>
  );
}

/** The trophy's base, with a subtle emissive accent ring. */
function TrophyBase(): JSX.Element {
  return (
    <group position={[0, -0.82, 0]}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.62, 0.12, 32]} />
        <meshStandardMaterial color="#0d0b1a" emissive="#7c3aed" emissiveIntensity={0.25} roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.012, 8, 48]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1} roughness={0.2} metalness={0.6} />
      </mesh>
    </group>
  );
}

/** Slow vertical float + rotation wrapper for the whole trophy assembly. */
function FloatingTrophy(): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const motionScale = reducedMotion ? 0.2 : 1;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.14 * motionScale;
    groupRef.current.rotation.y += delta * 0.12 * motionScale;
  });

  return (
    <group ref={groupRef}>
      <TrophyCrystal />
      <TrophyCrown />
      <TrophyWings />
      <TrophyNeck />
      <TrophyBase />
    </group>
  );
}

interface OrbitalRingProps {
  radius: number;
  tube: number;
  rotationSpeed: number;
  tilt: [number, number, number];
  color: string;
}

function OrbitalRing({ radius, tube, rotationSpeed, tilt, color }: OrbitalRingProps): JSX.Element {
  const ringRef = useRef<THREE.Mesh>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * rotationSpeed * (reducedMotion ? 0.2 : 1);
    }
  });

  return (
    <mesh ref={ringRef} rotation={tilt}>
      <torusGeometry args={[radius, tube, 12, 80]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.85}
        roughness={0.35}
        metalness={0.7}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function MouseParallaxGroup({ children }: { children: ReactNode }): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state, delta) => {
    if (reducedMotion) return;
    target.current.x = state.pointer.x * 0.22;
    target.current.y = state.pointer.y * 0.12;

    if (groupRef.current) {
      groupRef.current.rotation.y += (target.current.x - groupRef.current.rotation.y * 0.05) * delta * 0.6;
      groupRef.current.rotation.x += (target.current.y - groupRef.current.rotation.x) * delta * 0.6;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function SceneLighting(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight position={[3.5, 3, 3.5]} color="#8b5cf6" intensity={20} distance={18} />
      <pointLight position={[-3.5, -1.5, -2.5]} color="#7c3aed" intensity={14} distance={18} />
      <spotLight position={[0, 4.5, 2]} color="#a855f7" intensity={10} angle={0.5} penumbra={0.6} distance={14} />
    </>
  );
}

function Scene(): JSX.Element {
  return (
    <>
      <SceneLighting />
      <MouseParallaxGroup>
        <FloatingTrophy />
        <OrbitalRing radius={1.9} tube={0.016} rotationSpeed={0.16} tilt={[Math.PI / 2.3, 0, 0]} color="#8b5cf6" />
        <OrbitalRing radius={2.35} tube={0.012} rotationSpeed={-0.11} tilt={[Math.PI / 3, Math.PI / 6, 0]} color="#a855f7" />
        <Sparkles count={30} scale={6} size={2} speed={0.2} opacity={0.6} color="#c084fc" />
      </MouseParallaxGroup>
    </>
  );
}

function HeroScene(): JSX.Element {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0.1, 6.2], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
    </Canvas>
  );
}

export default HeroScene;
