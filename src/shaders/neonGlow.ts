export const neonGlowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const neonGlowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float glowIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

    // Base color with glow
    vec3 glow = glowColor * intensity;
    vec3 edgeGlow = glowColor * fresnel * glowIntensity;

    vec3 finalColor = glow + edgeGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
