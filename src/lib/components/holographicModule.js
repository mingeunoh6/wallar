
const getTime = function getTime() {
  return new Date().getTime() / 1000;
};

function updateProp(obj, prop, val) {
  obj.uniforms[prop].value = val;
  obj.uniforms[prop].needsUpdate = true;
}

const staticVertex = `precision mediump float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec4 vPosition;
void main() {
    vUv = uv;
    vUv.y = 1.-vUv.y;
    vPosition = modelMatrix * vec4(position, 1.0);
    vNormal =  normalize(modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}`;

const scannerShaders = {
  vertex: staticVertex,
  fragment: `precision mediump float;
uniform float elapsedTime;
uniform float spacing;
uniform float width;
uniform float speed;
uniform vec3 color;
uniform float opacity;
varying vec4 vPosition;
varying vec2 vUv;
void main() {
    float dist = distance( vec3(0), vPosition.xyz);
    float line = sin( dist*50.*spacing - elapsedTime * 3.14158 * 2.0) * .5 + .5;
    vec4 base = vec4( color.rgb, smoothstep(1.-width, 1.-width+.1, line));
    base.a *= opacity;
    gl_FragColor = base;
}`,
};

// 지연 초기화를 위한 변수들
let scannerMaterial;
let wavesMaterial;
let isInitialized = false;

// THREE가 로드되었는지 확인하고 재료를 초기화하는 함수
function initializeMaterials() {
  if (isInitialized) return;
  
  const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
  if (!THREE) {
    console.warn('THREE.js not loaded yet, retrying...');
    return;
  }
  
  scannerMaterial = new THREE.ShaderMaterial({
    vertexShader: scannerShaders.vertex,
    fragmentShader: scannerShaders.fragment,
    uniforms: {
      elapsedTime: { value: getTime() },
      color: { value: new THREE.Color("#00FFFF") },
      opacity: { value: 0.4 },
      speed: { value: 1 },
      width: { value: 0.5 },
      spacing: { value: 0.5 },
    },
  });

  scannerMaterial.transparent = true;
  scannerMaterial.side = THREE.DoubleSide;

  const wavesShaders = {
    vertex: staticVertex,
    fragment: `
precision mediump float;
uniform float elapsedTime;
uniform float spacing;
uniform float width;
uniform vec3 color;
uniform float opacity;
uniform float speed;
varying vec4 vPosition;
varying vec2 vUv;
vec3 random3(vec3 c) {
float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
vec3 r;
r.z = fract(512.0*j);
j *= .125;
r.x = fract(512.0*j);
j *= .125;
r.y = fract(512.0*j);
return r-0.5;
}
const float F3 =  0.3333333;
const float G3 =  0.1666667;
float simplex3d(vec3 p) {
  vec3 s = floor(p + dot(p, vec3(F3)));
  vec3 x = p - s + dot(s, vec3(G3));
  vec3 e = step(vec3(0.0), x - x.yzx);
  vec3 i1 = e*(1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy*(1.0 - e);
  vec3 x1 = x - i1 + G3;
  vec3 x2 = x - i2 + 2.0*G3;
  vec3 x3 = x - 1.0 + 3.0*G3;
  vec4 w, d;
  w.x = dot(x, x);
  w.y = dot(x1, x1);
  w.z = dot(x2, x2);
  w.w = dot(x3, x3);
  w = max(0.6 - w, 0.0);
  d.x = dot(random3(s), x);
  d.y = dot(random3(s + i1), x1);
  d.z = dot(random3(s + i2), x2);
  d.w = dot(random3(s + 1.0), x3);
  w *= w;
  w *= w;
  d *= w;
  return dot(d, vec4(52.0));
}
void main(){
  float dist = distance(vec3(0), vPosition.xyz);
  float noise = simplex3d(vPosition.xyz * spacing);
  float line = sin((noise + elapsedTime) * 3.14158 * 2.0) * .5 + .5;
  vec4 base = vec4(vec3(1) * color, smoothstep(1.0 - width, 1.0 - width + noise * .1 + .1, line));
  base.a *= opacity;
  gl_FragColor = base;
}`,
  };
  
  wavesMaterial = new THREE.ShaderMaterial({
    vertexShader: wavesShaders.vertex,
    fragmentShader: wavesShaders.fragment,
    uniforms: {
      elapsedTime: { value: getTime() },
      color: { value: new THREE.Color("#FFFFFF") },
      opacity: { value: 1 },
      speed: { value: 1 },
      width: { value: 0.5 },
      spacing: { value: 0.5 },
    },
  });
  wavesMaterial.transparent = true;
  wavesMaterial.side = THREE.DoubleSide;
  
  isInitialized = true;
  
  // 초기화 완료 후 업데이트 시작
  startUpdating();
}

// const noiseShaders = {
//   vertex: staticVertex,
//   fragment: `
// precision mediump float;
// uniform float elapsedTime;
// uniform float spacing;
// uniform float width;
// uniform vec3 color;
// uniform float opacity;
// uniform float speed;
// uniform sampler2D noiseTexture;
// varying vec4 vPosition;
// varying vec2 vUv;
// void main(){
//   float dist = distance( vec3(0), vPosition.xyz);
//   float noise = texture(noiseTexture,vPosition.xy * 0.4).r;
//   noise *= texture(noiseTexture,vPosition.xz * 0.3).g;
//   noise *= texture(noiseTexture,vPosition.zy * 0.6).b;
//   float line = sin( (noise + elapsedTime) * 3.14158 * 2.0) * .5 + .5;
//   vec4 base = vec4( vec3(1) * color, smoothstep( 1.0 - width, 1.0 - width + noise*.1+.1, line) );
//   base.a *= opacity;
//   gl_FragColor = base;
//   //gl_FragColor = texture(noiseTexture,vPosition.xy);
// }`,
// };
// const noiseTexture = new THREE.TextureLoader().load("/noiseTexture.png");
// noiseTexture.wrapS = THREE.RepeatWrapping;
// noiseTexture.wrapT = THREE.RepeatWrapping;

// const noiseMaterial = new THREE.ShaderMaterial({
//   vertexShader: noiseShaders.vertex,
//   fragmentShader: noiseShaders.fragment,
//   uniforms: {
//     elapsedTime: { value: getTime() },
//     color: { value: new THREE.Color("#FFFFFF") },
//     noiseTexture: { value: noiseTexture },
//     opacity: { value: 1 },
//     speed: { value: 1 },
//     width: { value: 0.5 },
//     spacing: { value: 0.5 },
//   },
// });
// noiseMaterial.transparent = true;
// noiseMaterial.side = THREE.DoubleSide;

// 업데이트 함수
let updateInterval;
function startUpdating() {
  if (updateInterval) return;
  
  updateInterval = setInterval(() => {
    if (scannerMaterial) {
      updateProp(
        scannerMaterial,
        "elapsedTime",
        (getTime() * scannerMaterial.uniforms.speed.value) % 1
      );
    }
    if (wavesMaterial) {
      updateProp(
        wavesMaterial,
        "elapsedTime",
        (getTime() * wavesMaterial.uniforms.speed.value) % 1
      );
    }
  }, 10);
}

// 초기화 시도
if (typeof window !== 'undefined') {
  // DOM이 준비되면 초기화 시도
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeMaterials, 100);
    });
  } else {
    setTimeout(initializeMaterials, 100);
  }
  
  // A-Frame이 로드되었을 때도 시도
  window.addEventListener('load', () => {
    setTimeout(initializeMaterials, 500);
  });
}

function applyMaterial(obj, mat) {
  obj.material = mat;
}

function initMaterial(element, material) {
  // 재료가 아직 초기화되지 않았으면 먼저 초기화
  if (!isInitialized) {
    initializeMaterials();
  }
  
  // 재료가 여전히 없으면 나중에 다시 시도
  if (!material) {
    setTimeout(() => initMaterial(element, material), 100);
    return;
  }
  
  if (
    element.object3D.children.length > 0 &&
    element.object3D.children[0].isMesh
  ) {
    applyMaterial(element.object3D.children[0], material);
  } else {
    element.addEventListener("model-loaded", (e) => {
      element.object3D.children[0].traverse((child) => {
        if (child.isMesh) applyMaterial(child, material);
      });
    });
  }
}

// if (!AFRAME) {
//   console.warn("This module requires AFRAME!");
// } else {
//   AFRAME.registerComponent("scanner-shader", {
//     schema: {
//       width: { default: 1 },
//       color: { default: 0xffffff },
//       spacing: { default: 0.5 },
//       speed: { default: 0.5 },
//       opacity: { default: 1 },
//     },
//     init: function init() {
//       initMaterial(this.el, scannerMaterial);
//       updateProp(scannerMaterial, "width", this.data.width);
//       updateProp(scannerMaterial, "color", new THREE.Color(this.data.color));
//       updateProp(scannerMaterial, "spacing", this.data.spacing);
//       updateProp(scannerMaterial, "speed", this.data.speed);
//       updateProp(scannerMaterial, "opacity", this.data.opacity);
//     },
//   });
//   AFRAME.registerComponent("noise-shader", {
//     init: function init() {
//       initMaterial(this.el, noiseMaterial);
//     },
//   });
//   AFRAME.registerComponent("wave-shader", {
//     init: function init() {
//       initMaterial(this.el, wavesMaterial);
//     },
//   });
// }

// scannerMaterial getter 함수
function getScannerMaterial() {
  if (!isInitialized) {
    initializeMaterials();
  }
  return scannerMaterial;
}

// wavesMaterial getter 함수
function getWavesMaterial() {
  if (!isInitialized) {
    initializeMaterials();
  }
  return wavesMaterial;
}

export {
  // export properties here
  initMaterial,
  updateProp,
  getScannerMaterial,
  getWavesMaterial,
  initializeMaterials,
};