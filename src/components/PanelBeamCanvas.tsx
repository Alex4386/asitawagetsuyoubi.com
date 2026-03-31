'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Canvas, ThreeElements, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  ColorRepresentation,
  ConeGeometry,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';

import { PANEL_PAGE_GRADIENT_STOPS } from '@/components/panel.theme';

export interface PanelBeamCanvasHandle {
  setAccelerating(value: boolean): void;
}

interface BeamHandle {
  setAccelerating(value: boolean): void;
}

export type BeamProps = ThreeElements['mesh'] & {
  width: number;
  speed: number;
  color: ColorRepresentation;
  spawnStart?: number;
  spawnEnd?: number;
  resetAt?: number;
};

interface BeamSeed {
  width: number;
  speed: number;
  color: string;
  position: [number, number, number];
}

const BEAM_SPAWN_X_RANGE = 1.28;
const BEAM_SPAWN_Y_RANGE = 0.96;
const BEAM_WIDTH_MIN = 0.0032;
const BEAM_WIDTH_VARIANCE = 0.0048;
const BEAM_LENGTH = 2.35;
const BEAM_START_NEAR = -10;
const BEAM_START_FAR = -14;
const BEAM_RESET_AT = 10;
const BACKDROP_Z = -18;
const GLOW_Z = -17;

function randomCentered(range: number) {
  return (Math.random() * 2 - 1 + (Math.random() * 2 - 1)) * 0.5 * range;
}

function randomWhiteBeamColor() {
  const tint = Math.random();
  const red = 255;
  const green = Math.round(255 - 14 * tint);
  const blue = Math.round(255 - 22 * tint);

  return `rgb(${red} ${green} ${blue})`;
}

function createBeamSeeds(count: number) {
  return Array.from({ length: count }, () => ({
    width: Math.random() * BEAM_WIDTH_VARIANCE + BEAM_WIDTH_MIN,
    speed: Math.random() * 5 + 3,
    color: randomWhiteBeamColor(),
    position: [
      randomCentered(BEAM_SPAWN_X_RANGE),
      randomCentered(BEAM_SPAWN_Y_RANGE),
      BEAM_START_FAR + Math.random() * (BEAM_START_NEAR - BEAM_START_FAR),
    ] as [number, number, number],
  }));
}

function createBackdropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const rootStyles = getComputedStyle(document.documentElement);
  const baseGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  PANEL_PAGE_GRADIENT_STOPS.forEach(stop => {
    const color =
      rootStyles.getPropertyValue(stop.cssVariable).trim() || stop.color;
    baseGradient.addColorStop(stop.offset, color);
  });
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const warmWash = context.createLinearGradient(
    0,
    canvas.height * 0.18,
    canvas.width,
    canvas.height,
  );
  warmWash.addColorStop(0, 'rgba(255, 239, 131, 0.24)');
  warmWash.addColorStop(0.5, 'rgba(255, 212, 36, 0)');
  warmWash.addColorStop(1, 'rgba(214, 126, 0, 0.18)');
  context.fillStyle = warmWash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const centerGlow = context.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.58,
    48,
    canvas.width * 0.5,
    canvas.height * 0.58,
    360,
  );
  centerGlow.addColorStop(0, 'rgba(255, 255, 247, 0.99)');
  centerGlow.addColorStop(0.16, 'rgba(255, 249, 205, 0.92)');
  centerGlow.addColorStop(0.38, 'rgba(255, 236, 122, 0.42)');
  centerGlow.addColorStop(0.7, 'rgba(255, 205, 49, 0.1)');
  centerGlow.addColorStop(1, 'rgba(255, 214, 92, 0)');
  context.fillStyle = centerGlow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = context.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.6,
    canvas.width * 0.18,
    canvas.width * 0.5,
    canvas.height * 0.6,
    canvas.width * 0.78,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.75, 'rgba(138, 76, 0, 0.02)');
  vignette.addColorStop(1, 'rgba(104, 53, 0, 0.18)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  return texture;
}

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const glow = context.createRadialGradient(256, 286, 24, 256, 286, 220);
  glow.addColorStop(0, 'rgba(255, 255, 250, 1)');
  glow.addColorStop(0.12, 'rgba(255, 255, 238, 0.95)');
  glow.addColorStop(0.34, 'rgba(255, 247, 188, 0.54)');
  glow.addColorStop(0.62, 'rgba(255, 235, 148, 0.14)');
  glow.addColorStop(1, 'rgba(255, 235, 148, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  return texture;
}

function BackgroundField() {
  const backdropTexture = useMemo(createBackdropTexture, []);
  const glowTexture = useMemo(createGlowTexture, []);
  const { camera, viewport } = useThree();
  const backdropViewport = viewport.getCurrentViewport(
    camera,
    new Vector3(0, 0, BACKDROP_Z),
  );
  const glowViewport = viewport.getCurrentViewport(
    camera,
    new Vector3(0, -0.18, GLOW_Z),
  );
  const glowSize = Math.min(glowViewport.width, glowViewport.height) * 0.9;

  useEffect(() => {
    return () => {
      backdropTexture?.dispose();
      glowTexture?.dispose();
    };
  }, [backdropTexture, glowTexture]);

  if (!backdropTexture || !glowTexture) {
    return null;
  }

  return (
    <>
      <mesh
        position={[0, 0, BACKDROP_Z]}
        scale={[backdropViewport.width, backdropViewport.height, 1]}
        renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={backdropTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[0, -0.18, GLOW_Z]}
        scale={[glowSize, glowSize, 1]}
        renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          opacity={0.78}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

const Beam = forwardRef<BeamHandle, BeamProps>(function Beam(
  {
    width,
    speed,
    color,
    spawnStart = BEAM_START_NEAR,
    spawnEnd = BEAM_START_FAR,
    resetAt = BEAM_RESET_AT,
    ...props
  },
  thisRef,
) {
  const ref = useRef<Mesh>(null);
  const speedMultiplierRef = useRef(1);
  const acceleratingRef = useRef(false);
  const geometry = useMemo(() => {
    const cone = new ConeGeometry(width, BEAM_LENGTH, 24, 1, true);
    cone.rotateX(-Math.PI / 2);
    return cone;
  }, [width]);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.35,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
        roughness: 0.06,
        metalness: 0,
        toneMapped: false,
      }),
    [color],
  );

  useImperativeHandle(
    thisRef,
    () => ({
      setAccelerating(value: boolean) {
        acceleratingRef.current = value;
      },
    }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    if (acceleratingRef.current) {
      speedMultiplierRef.current = Math.min(
        5,
        speedMultiplierRef.current + delta * (1 / speedMultiplierRef.current),
      );
    } else {
      speedMultiplierRef.current = Math.max(
        1,
        speedMultiplierRef.current - delta,
      );
    }

    ref.current.position.z += delta * speed * speedMultiplierRef.current;

    if (ref.current.position.z > resetAt) {
      ref.current.position.z =
        spawnEnd + Math.random() * (spawnStart - spawnEnd);
      ref.current.position.x = randomCentered(BEAM_SPAWN_X_RANGE);
      ref.current.position.y = randomCentered(BEAM_SPAWN_Y_RANGE);
      material.opacity = 0;
      return;
    }

    const fadeIn = MathUtils.clamp(
      (ref.current.position.z - spawnEnd) / (spawnStart - spawnEnd),
      0,
      1,
    );
    const fadeOut = MathUtils.clamp(
      (resetAt - ref.current.position.z) / 4,
      0,
      1,
    );

    material.opacity = fadeIn * fadeOut;
  });

  return (
    <mesh
      {...props}
      ref={ref}
      geometry={geometry}
      material={material}
      scale={1}
    />
  );
});

const BeamField = forwardRef<PanelBeamCanvasHandle>(
  function BeamField(_props, thisRef) {
    const beamRefs = useRef<Array<BeamHandle | null>>([]);
    const beams = useMemo(() => createBeamSeeds(180), []);

    useImperativeHandle(
      thisRef,
      () => ({
        setAccelerating(value: boolean) {
          beamRefs.current.forEach(beam => {
            beam?.setAccelerating(value);
          });
        },
      }),
      [],
    );

    return (
      <>
        <BackgroundField />
        <ambientLight intensity={0.4} />
        <pointLight
          position={[0, -0.15, 3.6]}
          intensity={2.05}
          color="#fff9e2"
        />

        {beams.map((beam, index) => (
          <Beam
            key={`${beam.position.join('-')}-${index}`}
            ref={ref => {
              beamRefs.current[index] = ref;
            }}
            width={beam.width}
            speed={beam.speed}
            color={beam.color}
            position={beam.position}
          />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.42}
            luminanceSmoothing={0.16}
            intensity={0.72}
          />
        </EffectComposer>
      </>
    );
  },
);

export default forwardRef<PanelBeamCanvasHandle, { className?: string }>(
  function PanelBeamCanvas({ className }, thisRef) {
    const beamFieldRef = useRef<PanelBeamCanvasHandle>(null);
    const [canRender, setCanRender] = useState(false);

    useEffect(() => {
      const canvas = document.createElement('canvas');
      const context =
        canvas.getContext('webgl', { alpha: true, antialias: true }) ||
        canvas.getContext('experimental-webgl', {
          alpha: true,
          antialias: true,
        });

      setCanRender(Boolean(context));
    }, []);

    useImperativeHandle(
      thisRef,
      () => ({
        setAccelerating(value: boolean) {
          beamFieldRef.current?.setAccelerating(value);
        },
      }),
      [],
    );

    if (!canRender) {
      return null;
    }

    return (
      <div className={className} aria-hidden="true">
        <Canvas
          className="h-full w-full"
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}>
          <BeamField ref={beamFieldRef} />
        </Canvas>
      </div>
    );
  },
);
