const fs = require('fs');
const path = require('path');

const shaderFile = path.join(__dirname, '../components/PlanetShader.tsx');
const content = fs.readFileSync(shaderFile, 'utf8');

function assertContains(source, target, description) {
    if (source.includes(target)) {
        console.log(`✅ PASS: ${description}`);
    } else {
        console.error(`❌ FAIL: ${description}`);
        console.error(`Expected to find: ${target}`);
        process.exit(1);
    }
}

console.log('Validating PlanetShader.tsx contents...');

// Basic existence of exported constants
assertContains(content, 'export const commonShaderPart', 'commonShaderPart exported');
assertContains(content, 'export const planetVertexShader', 'planetVertexShader exported');
assertContains(content, 'export const planetFragmentShader', 'planetFragmentShader exported');
assertContains(content, 'export const cloudVertexShader', 'cloudVertexShader exported');
assertContains(content, 'export const cloudFragmentShader', 'cloudFragmentShader exported');
assertContains(content, 'export const atmosphereVertexShader', 'atmosphereVertexShader exported');
assertContains(content, 'export const atmosphereFragmentShader', 'atmosphereFragmentShader exported');

// planetFragmentShader details
assertContains(content, 'uniform float uTime;', 'uTime uniform');
assertContains(content, 'uniform int uMode;', 'uMode uniform');
assertContains(content, 'uniform float uSnowLevel;', 'uSnowLevel uniform');
assertContains(content, 'uniform float uWaterMurkiness;', 'uWaterMurkiness uniform');
assertContains(content, 'varying vec2 vUv;', 'vUv varying in fragment');

// Mode logic
assertContains(content, 'if (uMode == 0)', 'Visual mode logic');
assertContains(content, 'else if (uMode == 1)', 'Thermal mode logic');
assertContains(content, 'else if (uMode == 2)', 'Pop mode logic');
assertContains(content, 'else if (uMode == 3)', 'Bio mode logic');

// commonShaderPart details
assertContains(content, 'float snoise(vec3 v)', 'snoise function');

console.log('\nAll shader validations passed successfully!');
