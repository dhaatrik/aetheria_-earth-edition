import { describe, it, expect } from 'vitest';
import {
  planetVertexShader,
  planetFragmentShader,
  cloudVertexShader,
  cloudFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
  commonShaderPart
} from './PlanetShader';

describe('Planet Shaders', () => {
  describe('planetVertexShader', () => {
    it('should define required varyings', () => {
      expect(planetVertexShader).toContain('varying vec2 vUv;');
      expect(planetVertexShader).toContain('varying vec3 vNormal;');
      expect(planetVertexShader).toContain('varying vec3 vPosition;');
      expect(planetVertexShader).toContain('varying vec3 vViewPosition;');
    });

    it('should have a main function', () => {
      expect(planetVertexShader).toContain('void main()');
      expect(planetVertexShader).toContain('gl_Position =');
    });
  });

  describe('planetFragmentShader', () => {
    it('should include commonShaderPart', () => {
      // In the source, it's ${commonShaderPart}
      // Since we are importing the exported string, it should contain the content of commonShaderPart
      // commonShaderPart contains snoise function
      expect(planetFragmentShader).toContain('float snoise(vec3 v)');
    });

    it('should define all required uniforms', () => {
      const requiredUniforms = [
        'uTime',
        'uDayTexture',
        'uSpecularTexture',
        'uNormalMap',
        'uSunDirection',
        'uMode',
        'uSunColor',
        'uSnowLevel',
        'uWaterMurkiness',
        'uCityColor',
        'uCityIntensity',
        'uCityNoiseTexture'
      ];
      requiredUniforms.forEach(uniform => {
        expect(planetFragmentShader).toContain(`uniform `);
        expect(planetFragmentShader).toContain(uniform);
      });
    });

    it('should define required varyings', () => {
      expect(planetFragmentShader).toContain('varying vec2 vUv;');
      expect(planetFragmentShader).toContain('varying vec3 vNormal;');
      expect(planetFragmentShader).toContain('varying vec3 vPosition;');
    });

    it('should implement all visualization modes', () => {
      expect(planetFragmentShader).toContain('if (uMode == 0)'); // Visual
      expect(planetFragmentShader).toContain('else if (uMode == 1)'); // Thermal
      expect(planetFragmentShader).toContain('else if (uMode == 2)'); // Pop
      expect(planetFragmentShader).toContain('else if (uMode == 3)'); // Bio
    });

    it('should apply terraforming modifiers correctly', () => {
      expect(planetFragmentShader).toContain('float baseThreshold = 0.85 - (uSnowLevel * 0.85);');
      expect(planetFragmentShader).toContain('float snowThreshold = baseThreshold;');
      expect(planetFragmentShader).toContain('mix(dayColor, vec3(0.15, 0.12, 0.05), uWaterMurkiness * 0.8);');
      expect(planetFragmentShader).toContain('pow(NdotH, 20.0) * waterMask * 0.5 * (1.0 - uWaterMurkiness);');
    });

    it('should define thermal map heatmap function', () => {
      expect(planetFragmentShader).toContain('vec3 heatmap(float v)');
      expect(planetFragmentShader).toContain('return vec3(value, 1.0 - abs(value - 0.5) * 2.0, 1.0 - value);');
    });

    it('should contain logic for vegetation estimator in biomass mode', () => {
      expect(planetFragmentShader).toContain('if (g > r && g > b)');
      expect(planetFragmentShader).toContain('bio = (g - max(r, b)) * 5.0;');
    });

    it('should have a main function that sets gl_FragColor', () => {
      expect(planetFragmentShader).toContain('void main()');
      expect(planetFragmentShader).toContain('gl_FragColor =');
    });
  });

  describe('cloudFragmentShader', () => {
    it('should define required uniforms', () => {
      expect(cloudFragmentShader).toContain('uniform float uTime;');
      expect(cloudFragmentShader).toContain('uniform sampler2D uCloudTexture;');
      expect(cloudFragmentShader).toContain('uniform vec3 uSunDirection;');
      expect(cloudFragmentShader).toContain('uniform vec3 uSunColor;');
      expect(cloudFragmentShader).toContain('uniform float uCloudDensity;');
    });

    it('should use snoise for cloud movement/variation', () => {
      expect(cloudFragmentShader).toContain('snoise(pos');
      expect(cloudFragmentShader).toContain('float noise1 = snoise(pos * 3.0 + vec3(uTime * 0.05, 0.0, 0.0));');
      expect(cloudFragmentShader).toContain('float noise2 = snoise(pos * 12.0 - vec3(0.0, uTime * 0.1, 0.0));');
      expect(cloudFragmentShader).toContain('float noiseFBM = (noise1 * 0.6 + noise2 * 0.3);');
    });

    it('should apply cloud density multiplier', () => {
      expect(cloudFragmentShader).toContain('finalDensity *= uCloudDensity;');
    });

    it('should calculate cloud color with shadow and sun light mixing', () => {
      expect(cloudFragmentShader).toContain('vec3 shadowColor = vec3(0.3, 0.35, 0.45) * uSunColor;');
      expect(cloudFragmentShader).toContain('vec3 cloudColor = mix(shadowColor, sunColor, lightIntensity * 0.8 + 0.2);');
    });

    it('should discard transparent fragments', () => {
      expect(cloudFragmentShader).toContain('if (finalDensity < 0.05) discard;');
    });
  });

  describe('atmosphereFragmentShader', () => {
    it('should define required uniforms', () => {
      expect(atmosphereFragmentShader).toContain('uniform vec3 uAtmosphereColor;');
      expect(atmosphereFragmentShader).toContain('uniform vec3 uSunColor;');
    });

    it('should implement atmosphere glow effect', () => {
      expect(atmosphereFragmentShader).toContain('float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);');
      expect(atmosphereFragmentShader).toContain('gl_FragColor = vec4(uAtmosphereColor * uSunColor, 1.0) * intensity * 1.5;');
    });
  });

  describe('commonShaderPart', () => {
    it('should define noise functions', () => {
      expect(commonShaderPart).toContain('vec3 mod289(vec3 x)');
      expect(commonShaderPart).toContain('vec4 permute(vec4 x)');
      expect(commonShaderPart).toContain('float snoise(vec3 v)');
    });
  });
});
