import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Points, PointMaterial, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetParameters } from '../types';
import { 
  planetVertexShader, 
  planetFragmentShader, 
  cloudVertexShader, 
  cloudFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader
} from './PlanetShader';
import * as random from 'maath/random/dist/maath-random.esm';

interface SceneProps {
  params: PlanetParameters;
  onPlanetClick: (uv: THREE.Vector2) => void;
  isProbeLanding: boolean;
}

// ------------------------------------------------------------------
// SATELLITE RING
// ------------------------------------------------------------------
const SATELLITE_CONFIG = {
  particleCount: 3000,
  radius: 3.5,
  speedXDivisor: 10,
  speedYDivisor: 15,
  tiltAngle: Math.PI / 4,
  color: "#ffa0e0",
  size: 0.02,
};

const SatelliteRing = () => {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(SATELLITE_CONFIG.particleCount), { radius: SATELLITE_CONFIG.radius }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / SATELLITE_CONFIG.speedXDivisor;
      ref.current.rotation.y -= delta / SATELLITE_CONFIG.speedYDivisor;
    }
  });

  return (
    <group rotation={[0, 0, SATELLITE_CONFIG.tiltAngle]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={SATELLITE_CONFIG.color} size={SATELLITE_CONFIG.size} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

const SUN_COLORS = {
  red: new THREE.Vector3(1.0, 0.4, 0.3),
  blue: new THREE.Vector3(0.6, 0.8, 1.0),
  default: new THREE.Vector3(1.0, 0.95, 0.9),
};

// Helper to map SunType to Color
const getSunColor = (type: string) => {
  switch(type) {
    case 'red': return SUN_COLORS.red;
    case 'blue': return SUN_COLORS.blue;
    default: return SUN_COLORS.default;
  }
};

const SUN_DIR = new THREE.Vector3(1, 0.5, 1).normalize();

export const PlanetMesh: React.FC<{ params: PlanetParameters, onClick: (uv: THREE.Vector2) => void }> = ({ params, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Default textures
  const DEFAULT_DAY = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
  const DEFAULT_SPEC = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';
  const DEFAULT_NORM = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg';
  const DEFAULT_CLOUD = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png';

  // State for textures to handle dynamic swapping
  const textureConfig = useMemo(() => ({
    day: params.textureMapUrl || DEFAULT_DAY,
    spec: DEFAULT_SPEC,
    norm: DEFAULT_NORM,
    cloud: params.cloudMapUrl || DEFAULT_CLOUD
  }), [params.textureMapUrl, params.cloudMapUrl]);

  const textures = useTexture(textureConfig);

  const sunColorVec = getSunColor(params.sunType);

  // Map DataLayer string to int
  const getModeInt = (mode: string) => {
    switch(mode) {
      case 'thermal': return 1;
      case 'population': return 2;
      case 'vegetation': return 3;
      default: return 0;
    }
  };

  // Generate a seamless noise texture for city lights
  const cityNoiseTexture = useMemo(() => {
      const size = 64;
      const data = new Uint8Array(size * size * 4);

      // Generate low-res base noise (16x16) for coherence
      const baseSize = 16;
      const baseData = new Float32Array(baseSize * baseSize);
      for(let i=0; i<baseData.length; i++) baseData[i] = Math.random();

      // Upscale to size x size with bilinear interpolation and wrapping
      for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
              // Normalized coords in base grid
              const u = (x / size) * baseSize;
              const v = (y / size) * baseSize;

              const x0 = Math.floor(u);
              const y0 = Math.floor(v);
              const x1 = (x0 + 1) % baseSize;
              const y1 = (y0 + 1) % baseSize; // Wrap for seamlessness

              const fracX = u - x0;
              const fracY = v - y0;

              // Bilinear interp
              const v00 = baseData[y0 * baseSize + x0];
              const v10 = baseData[y0 * baseSize + x1];
              const v01 = baseData[y1 * baseSize + x0];
              const v11 = baseData[y1 * baseSize + x1];

              const i1 = v00 * (1 - fracX) + v10 * fracX;
              const i2 = v01 * (1 - fracX) + v11 * fracX;
              const val = i1 * (1 - fracY) + i2 * fracY;

              const byteVal = Math.floor(val * 255);
              const idx = (y * size + x) * 4;
              data[idx] = byteVal;
              data[idx+1] = byteVal;
              data[idx+2] = byteVal;
              data[idx+3] = 255;
          }
      }

      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
  }, []);

  const planetMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDayTexture: { value: textures.day },
        uSpecularTexture: { value: textures.spec },
        uNormalMap: { value: textures.norm },
        uCityNoiseTexture: { value: cityNoiseTexture },
        uSunDirection: { value: SUN_DIR },
        uMode: { value: 0 },
        uSunColor: { value: sunColorVec },
        uSnowLevel: { value: 0 },
        uWaterMurkiness: { value: 0 },
        uCityColor: { value: new THREE.Color(params.cityLightColor) },
        uCityIntensity: { value: params.cityLightIntensity }
      }
    });
  }, [cityNoiseTexture]); // Note: textures not in dep array to avoid full material rebuild, we update uniform directly

  // Effect to update material uniforms when textures/params change without rebuilding material
  useEffect(() => {
    if (meshRef.current) {
        const mat = meshRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uDayTexture.value = textures.day;
        mat.uniforms.uSpecularTexture.value = textures.spec;
        mat.uniforms.uNormalMap.value = textures.norm;
        mat.uniforms.uCityColor.value.set(params.cityLightColor);
        mat.uniforms.uCityIntensity.value = params.cityLightIntensity;
        mat.uniforms.uMode.value = getModeInt(params.dataLayer);
        mat.uniforms.uSunColor.value = sunColorVec;
        mat.uniforms.uSnowLevel.value = params.snowLevel;
        mat.uniforms.uWaterMurkiness.value = params.waterMurkiness;

        // Also update rotation that isn't dependent on delta (though usually better in useFrame for consistency, but tilt is static)
        meshRef.current.rotation.z = params.tilt;

        mat.needsUpdate = true;
    }
    if (cloudRef.current) {
        const mat = cloudRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uCloudTexture.value = textures.cloud;
        mat.uniforms.uSunColor.value = sunColorVec;
        mat.uniforms.uCloudDensity.value = params.cloudDensity;

        cloudRef.current.rotation.z = params.tilt;

        mat.needsUpdate = true;
    }
  }, [
    textures,
    params.cityLightColor,
    params.cityLightIntensity,
    params.dataLayer,
    sunColorVec,
    params.snowLevel,
    params.waterMurkiness,
    params.tilt,
    params.cloudDensity
  ]);


  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uCloudTexture: { value: textures.cloud },
        uSunDirection: { value: SUN_DIR },
        uSunColor: { value: sunColorVec },
        uCloudDensity: { value: 0.5 }
      }
    });
  }, []);

  const atmosMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(params.atmosphereColor) },
        uSunColor: { value: sunColorVec }
      }
    });
  }, []);

  // Effect to update atmosphere uniforms
  useEffect(() => {
      if (atmosMaterial) {
         atmosMaterial.uniforms.uAtmosphereColor.value.set(params.atmosphereColor);
         atmosMaterial.uniforms.uSunColor.value = sunColorVec;
      }
  }, [atmosMaterial, params.atmosphereColor, sunColorVec]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    if (meshRef.current) {
      meshRef.current.rotation.y += params.rotationSpeed * delta * 0.1; 
      
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = time;
    }
    
    if (cloudRef.current) {
      cloudRef.current.rotation.y += params.rotationSpeed * delta * 0.12; 
      
      const mat = cloudRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = time;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.uv) {
      onClick(e.uv);
    }
  };

  return (
    <group rotation={[0, 0, params.tilt]}>
      {/* Earth Surface */}
      <mesh ref={meshRef} material={planetMaterial} onPointerDown={handleClick}>
        <sphereGeometry args={[2, 128, 128]} />
      </mesh>
      
      {/* Clouds */}
      <mesh ref={cloudRef} material={cloudMaterial} onPointerDown={(e) => e.stopPropagation()}>
        <sphereGeometry args={[2.03, 128, 128]} />
      </mesh>

       {/* Atmosphere */}
       <mesh material={atmosMaterial} scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>

      {/* Satellites */}
      {params.showSatellites && <SatelliteRing />}
    </group>
  );
};

const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[2, 32, 32]} />
    <meshBasicMaterial wireframe color="#333" />
  </mesh>
);

const CameraController: React.FC<{ isProbeLanding: boolean }> = ({ isProbeLanding }) => {
  const controlsRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (controlsRef.current) {
      const targetDist = isProbeLanding ? 2.2 : 6; 
      const currentDist = controlsRef.current.object.position.length();
      
      if (Math.abs(currentDist - targetDist) > 0.01) {
        const newDist = THREE.MathUtils.lerp(currentDist, targetDist, delta * 2);

        controlsRef.current.object.position.setLength(newDist);
        controlsRef.current.update();
      }
    }
  });

  return <OrbitControls ref={controlsRef} enablePan={false} minDistance={2.1} maxDistance={12} />;
};

export const PlanetScene: React.FC<SceneProps> = ({ params, onPlanetClick, isProbeLanding }) => {
  const lightColor = params.sunType === 'red' ? '#ff4400' : params.sunType === 'blue' ? '#88ccff' : '#ffffff';

  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <pointLight position={[15, 10, 15]} intensity={1.5} color={lightColor} /> 
        
        <Suspense fallback={<LoadingFallback />}>
          <PlanetMesh params={params} onClick={onPlanetClick} />
        </Suspense>
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <CameraController isProbeLanding={isProbeLanding} />
      </Canvas>
    </div>
  );
};