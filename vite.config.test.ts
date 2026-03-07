import { describe, it, expect } from 'vitest';
import viteConfig from './vite.config';
import path from 'path';

describe('vite.config.ts', () => {
  it('should export a valid vite configuration', () => {
    // Check if the default export is a function as expected by defineConfig
    expect(typeof viteConfig).toBe('function');

    if (typeof viteConfig === 'function') {
      const config = viteConfig({ command: 'serve', mode: 'development' });

      // Test server configuration
      expect(config.server).toBeDefined();
      expect(config.server?.port).toBe(3000);
      expect(config.server?.host).toBe('0.0.0.0');

      // Test proxy configuration
      expect(config.server?.proxy).toBeDefined();
      expect(config.server?.proxy?.['/api']).toEqual({
        target: 'http://localhost:3001',
        changeOrigin: true,
      });

      // Test plugins configuration
      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
      expect(config.plugins?.length).toBeGreaterThan(0);

      // Test resolve alias configuration
      expect(config.resolve).toBeDefined();
      expect(config.resolve?.alias).toBeDefined();

      const alias = config.resolve?.alias as any;
      expect(alias['@']).toBe(path.resolve(__dirname, '.'));
    }
  });
});
