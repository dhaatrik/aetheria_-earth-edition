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

// Fix missing JSX types for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
    }
  }
}

interface SceneProps {
  params: PlanetParameters;
  onPlanetClick: (uv: THREE.Vector2) => void;
  isProbeLanding: boolean;
}

// ------------------------------------------------------------------
// SATELLITE RING
// ------------------------------------------------------------------
const SatelliteRing = () => {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(3000), { radius: 3.5 })); 

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#ffa0e0" size={0.02} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

export const PlanetMesh: React.FC<{ params: PlanetParameters, onClick: (uv: THREE.Vector2) => void }> = ({ params, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Default textures
  const DEFAULT_DAY = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
  const DEFAULT_SPEC = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';
  const DEFAULT_NORM = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg';
  const DEFAULT_CLOUD = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png';

  // State for textures to handle dynamic swapping
  const [textures, setTextures] = useState(() => ({
    day: new THREE.TextureLoader().load(DEFAULT_DAY),
    spec: new THREE.TextureLoader().load(DEFAULT_SPEC),
    norm: new THREE.TextureLoader().load(DEFAULT_NORM),
    cloud: new THREE.TextureLoader().load(DEFAULT_CLOUD)
  }));

  // Handle Dynamic Texture Updates
  useEffect(() => {
      const loader = new THREE.TextureLoader();

      if (params.textureMapUrl) {
          loader.load(params.textureMapUrl, (tex) => {
              setTextures(prev => ({ ...prev, day: tex }));
          });
      } else {
          // If no custom texture, revert to default (or keep current if we want persistence, but let's revert to earth for "reset")
          // Logic: If params.textureMapUrl is undefined, we assume default Earth mode unless specifically maintaining state
          if (!params.textureMapUrl) {
               setTextures(prev => ({ ...prev, day: new THREE.TextureLoader().load(DEFAULT_DAY) }));
          }
      }

      if (params.cloudMapUrl) {
          loader.load(params.cloudMapUrl, (tex) => {
              setTextures(prev => ({ ...prev, cloud: tex }));
          });
      }
  }, [params.textureMapUrl, params.cloudMapUrl]);

  // Helper to map SunType to Color
  const getSunColor = (type: string) => {
    switch(type) {
      case 'red': return new THREE.Vector3(1.0, 0.4, 0.3);
      case 'blue': return new THREE.Vector3(0.6, 0.8, 1.0);
      default: return new THREE.Vector3(1.0, 0.95, 0.9);
    }
  };

  const sunColorVec = useMemo(() => getSunColor(params.sunType), [params.sunType]);
  const sunDir = useMemo(() => new THREE.Vector3(1, 0.5, 1).normalize(), []);

  // Map DataLayer string to int
  const getModeInt = (mode: string) => {
    switch(mode) {
      case 'thermal': return 1;
      case 'population': return 2;
      case 'vegetation': return 3;
      default: return 0;
    }
  };

  const planetMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDayTexture: { value: textures.day },
        uSpecularTexture: { value: textures.spec },
        uNormalMap: { value: textures.norm },
        uSunDirection: { value: sunDir },
        uMode: { value: 0 },
        uSunColor: { value: sunColorVec },
        uSnowLevel: { value: 0 },
        uWaterMurkiness: { value: 0 },
        uCityColor: { value: new THREE.Color(params.cityLightColor) },
        uCityIntensity: { value: params.cityLightIntensity }
      }
    });
  }, [sunDir]); // Note: textures not in dep array to avoid full material rebuild, we update uniform directly

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
        uSunDirection: { value: sunDir },
        uSunColor: { value: sunColorVec },
        uCloudDensity: { value: 0.5 }
      }
    });
  }, [sunDir]);

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
      const newDist = THREE.MathUtils.lerp(currentDist, targetDist, delta * 2);
      
      controlsRef.current.object.position.setLength(newDist);
      controlsRef.current.update();
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