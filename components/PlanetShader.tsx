
// Common noise functions for clouds and city generation
export const commonShaderPart = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`;

// ----------------------------------------------------------------------------
// EARTH SURFACE SHADER (TEXTURE BASED + DATA LAYERS)
// ----------------------------------------------------------------------------

export const planetVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const planetFragmentShader = `
  uniform float uTime;
  uniform sampler2D uDayTexture;
  uniform sampler2D uSpecularTexture;
  uniform sampler2D uNormalMap;
  uniform vec3 uSunDirection;
  
  // New Uniforms
  uniform int uMode; // 0: Visual, 1: Thermal, 2: Pop, 3: Bio
  uniform vec3 uSunColor;
  uniform float uSnowLevel; // 0 to 1
  uniform float uWaterMurkiness; // 0 to 1
  
  // City Lights
  uniform vec3 uCityColor;
  uniform float uCityIntensity;
  uniform sampler2D uCityNoiseTexture;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${commonShaderPart}

  // Visualization Helpers
  vec3 heatmap(float v) {
    float value = clamp(v, 0.0, 1.0);
    return vec3(value, 1.0 - abs(value - 0.5) * 2.0, 1.0 - value); // R-G-B gradient
  }

  void main() {
    // 1. Base Texture Color
    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    
    // 2. Land/Water Mask
    float waterMask = texture2D(uSpecularTexture, vUv).r;
    bool isLand = waterMask < 0.1;

    // Apply "Greenhouse" murkiness to water
    if (!isLand) {
       dayColor = mix(dayColor, vec3(0.15, 0.12, 0.05), uWaterMurkiness * 0.8);
    }

    // 3. Seasonal Logic (Snow)
    float season = sin(uTime * 0.2); 
    float distFromEquator = abs(vUv.y - 0.5) * 2.0; 
    float hemisphereSign = sign(vUv.y - 0.5);
    
    // Base snow threshold + Terraforming Modifier (uSnowLevel)
    // When uSnowLevel is 1.0, threshold drops to 0.0 (Earth freezes)
    float baseThreshold = 0.85 - (uSnowLevel * 0.85); 
    
    float snowThreshold = baseThreshold;
    if (hemisphereSign > 0.0) { snowThreshold += season * 0.1; } 
    else { snowThreshold -= season * 0.1; }
    
    bool hasSnow = false;
    if (distFromEquator > snowThreshold) {
       float snowFactor = smoothstep(snowThreshold, snowThreshold + 0.05, distFromEquator);
       dayColor = mix(dayColor, vec3(0.95, 0.98, 1.0), snowFactor);
       hasSnow = true;
    }
    
    // 4. Lighting
    vec3 normalColor = texture2D(uNormalMap, vUv).rgb;
    vec3 bumpedNormal = normalize(vNormal + (normalColor - 0.5) * 0.5); 
    float lightIntensity = max(0.0, dot(bumpedNormal, uSunDirection));

    // Specular Highlight
    float specular = 0.0;
    if (waterMask > 0.5 && !hasSnow) {
      vec3 viewDirViewSpace = vec3(0.0, 0.0, 1.0);
      vec3 halfVector = normalize(uSunDirection + viewDirViewSpace);
      float NdotH = max(0.0, dot(bumpedNormal, halfVector));
      specular = pow(NdotH, 20.0) * waterMask * 0.5 * (1.0 - uWaterMurkiness); // Murky water reflects less
    }

    // 5. City Lights
    vec3 nightColor = vec3(0.0);
    float nightMask = smoothstep(0.2, -0.2, dot(vNormal, uSunDirection)); 
    
    if (isLand && nightMask > 0.0 && !hasSnow) {
       float cityNoise = texture2D(uCityNoiseTexture, vUv * 20.0).r;
       float cityDensity = smoothstep(0.6, 0.9, cityNoise);
       if (distFromEquator < 0.8) {
         vec3 cityLights = uCityColor * cityDensity * 2.0 * uCityIntensity;
         nightColor = cityLights * nightMask;
       }
    }

    // --------------------------------
    // MODE SWITCHING
    // --------------------------------
    vec3 finalRGB = vec3(0.0);

    if (uMode == 0) {
      // VISUAL MODE (Realistic)
      finalRGB = dayColor * (lightIntensity * uSunColor + 0.05) + (specular * uSunColor) + nightColor;
    
    } else if (uMode == 1) {
      // THERMAL MODE
      // Temperature based on latitude + day/night
      float tempBase = 1.0 - distFromEquator; // Hot equator
      tempBase += (lightIntensity * 0.2); // Sun warms side
      if (hasSnow) tempBase -= 0.3;
      finalRGB = heatmap(tempBase);
      // Grid overlay
      float grid = step(0.98, fract(vUv.y * 20.0)) + step(0.98, fract(vUv.x * 40.0));
      finalRGB += vec3(grid * 0.2);

    } else if (uMode == 2) {
      // POPULATION MODE
      // Exaggerate city lights, dim terrain
      float cityNoise = texture2D(uCityNoiseTexture, vUv * 20.0).r;
      float cityDensity = smoothstep(0.6, 0.9, cityNoise);
      if (!isLand || hasSnow) cityDensity = 0.0;
      
      vec3 popColor = mix(vec3(0.0, 0.0, 0.1), uCityColor, cityDensity * uCityIntensity);
      finalRGB = popColor;

    } else if (uMode == 3) {
      // VEGETATION MODE (Biomass)
      // Estimate biomass by looking for green in the day texture on land
      float bio = 0.0;
      if (isLand && !hasSnow) {
         // Simple vegetation estimator: Green > Red and Blue
         float g = dayColor.g;
         float r = dayColor.r;
         float b = dayColor.b;
         if (g > r && g > b) {
            bio = (g - max(r, b)) * 5.0; // Boost contrast
         }
      }
      finalRGB = mix(vec3(0.1), vec3(0.0, 1.0, 0.2), clamp(bio, 0.0, 1.0));
    }

    gl_FragColor = vec4(finalRGB, 1.0);
  }
`;

export const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cloudFragmentShader = `
  uniform float uTime;
  uniform sampler2D uCloudTexture;
  uniform vec3 uSunDirection;
  
  uniform vec3 uSunColor;
  uniform float uCloudDensity; // 0 to 1

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${commonShaderPart}

  void main() {
    vec2 texUv = vUv;
    texUv.x -= uTime * 0.0015; 
    float baseDensity = texture2D(uCloudTexture, texUv).r;

    vec3 pos = vPosition;
    float noise1 = snoise(pos * 3.0 + vec3(uTime * 0.05, 0.0, 0.0));
    float noise2 = snoise(pos * 12.0 - vec3(0.0, uTime * 0.1, 0.0));
    float noiseFBM = (noise1 * 0.6 + noise2 * 0.3); 
    
    float finalDensity = baseDensity + noiseFBM * 0.15;
    finalDensity = smoothstep(0.3, 0.7, finalDensity);
    
    // Apply Cloud Density Multiplier
    finalDensity *= uCloudDensity;

    float NdotL = dot(vNormal, uSunDirection);
    float lightIntensity = max(0.0, NdotL);
    
    vec3 sunColor = vec3(1.0, 0.98, 0.95) * uSunColor;
    vec3 shadowColor = vec3(0.3, 0.35, 0.45) * uSunColor; 
    
    vec3 cloudColor = mix(shadowColor, sunColor, lightIntensity * 0.8 + 0.2);
    
    float viewDot = dot(normalize(vNormal), vec3(0, 0, 1));
    float rimPower = 1.0 - max(0.0, viewDot);
    rimPower = pow(rimPower, 3.0);
    float rim = rimPower * lightIntensity;
    cloudColor += vec3(0.4) * rim * uSunColor;

    if (finalDensity < 0.05) discard;

    gl_FragColor = vec4(cloudColor, finalDensity * 0.92);
  }
`;

export const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const atmosphereFragmentShader = `
varying vec3 vNormal;
uniform vec3 uAtmosphereColor;
uniform vec3 uSunColor;

void main() {
  float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
  gl_FragColor = vec4(uAtmosphereColor * uSunColor, 1.0) * intensity * 1.5;
}
`;
