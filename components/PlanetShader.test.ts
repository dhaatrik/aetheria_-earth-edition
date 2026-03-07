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
    });

    it('should discard transparent fragments', () => {
      expect(cloudFragmentShader).toContain('discard;');
    });
  });

  describe('atmosphereFragmentShader', () => {
    it('should define required uniforms', () => {
      expect(atmosphereFragmentShader).toContain('uniform vec3 uAtmosphereColor;');
      expect(atmosphereFragmentShader).toContain('uniform vec3 uSunColor;');
    });

    it('should implement atmosphere glow effect', () => {
      expect(atmosphereFragmentShader).toContain('pow(');
      expect(atmosphereFragmentShader).toContain('dot(vNormal, vec3(0, 0, 1.0))');
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
