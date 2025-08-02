<script>
    import { onMount } from "svelte";
    import { reflectionsComponent } from "$lib/components/reflections.js";
  import {
    xrLightComponent,
    xrLightSystem,
  } from "$lib/components/xrlight.js";

  import { tapPlaceComponent } from "$lib/components/tap-place.js";

  import {
    setWallTopComponent,
    placeOnWallComponent,
    wallFromFloorComponent,
  } from "$lib/components/wall-from-floor.js";

  import {
    initMaterial,
    updateProp,
    getScannerMaterial,
    initializeMaterials,
  } from "$lib/components/holographicModule.js";

  import  { wallPortalComponent } from "$lib/components/wall-portal.js";
  

  let wallType = $state('portal')

  let xrReady = $state(false)

  // Load A-Frame && 8thWall API from CDN
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  


async function initAframe8thWall() {
    console.log("DemoAR parent mounted");

    try {
    //   Load scripts in sequence
      await loadScript("//cdn.8thwall.com/web/aframe/8frame-1.5.0.min.js");
      await loadScript(
        "//cdn.8thwall.com/web/aframe/aframe-extras-7.2.0.min.js"
      );
      await loadScript("//cdn.8thwall.com/web/aframe/ammo.wasm.js");
      await loadScript(
        `//apps.8thwall.com/xrweb?appKey=${import.meta.env.VITE_8THWALL_API_KEY}`
      );
      await loadScript(
        "//cdn.8thwall.com/web/aframe/aframe-physics-system-4.2.2.min.js"
      );
      await loadScript("//cdn.8thwall.com/web/xrextras/xrextras.js");
      await loadScript(
        "https://cdn.8thwall.com/web/landing-page/landing-page.js"
      );

      await loadScript(
        "https://cdn.8thwall.com/web/coaching-overlay/coaching-overlay.js"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/gh/diarmidmackenzie/instanced-mesh@v0.6.0/src/instanced-mesh.min.js"
      );





      // Initialize AFRAME components after scripts are loaded
      function initializeAFRAME() {
        if (typeof AFRAME === "undefined") {
          console.error("AFRAME is not loaded yet. Retrying...");
          setTimeout(initializeAFRAME, 100); // Check every 100ms
        } else {
            AFRAME.registerComponent("wall-portal", wallPortalComponent);
            AFRAME.registerComponent("place-on-wall", placeOnWallComponent);
          AFRAME.registerComponent("wall-from-floor", wallFromFloorComponent);
          AFRAME.registerComponent("set-wall-top", setWallTopComponent);
          AFRAME.registerComponent("ammo-restitution", {
            schema: { default: 0.5 },
            init() {
              const { el } = this;
              const restitution = this.data;
              el.addEventListener("body-loaded", () => {
                el.body.setRestitution(restitution);
              });
            },
          });
          AFRAME.registerComponent("scanner-shader", {
            schema: {
              width: { default: 1 },
              color: { default: 0xffffff },
              spacing: { default: 0.5 },
              speed: { default: 0.5 },
              opacity: { default: 1 },
            },
            init: function init() {
              const material = getScannerMaterial();
              initMaterial(this.el, material);
              updateProp(material, "width", this.data.width);
              updateProp(material, "color", new THREE.Color(this.data.color));
              updateProp(material, "spacing", this.data.spacing);
              updateProp(material, "speed", this.data.speed);
              updateProp(material, "opacity", this.data.opacity);
            },
          });
          AFRAME.registerComponent("reflections", reflectionsComponent);
          AFRAME.registerComponent("xr-light", xrLightComponent);
          AFRAME.registerSystem("xr-light", xrLightSystem);
          console.log("AFRAME components registered successfully.");
   
          xrReady = true;
        }
      }

      initializeAFRAME();
    } catch (error) {
      console.error("Error loading scripts:", error);
    }
  }

  onMount(async () => {
    console.log("DemoAR parent mounted");
    // Ensuring AFRAME is defined

    await initAframe8thWall();
  });

</script>

<svelte:head>
  <title>OOMG-AR DEMO</title>

  <meta
    name="description"
    content="웹기반 증강현실, WebAR 전문 크리에이터 OOMG"
  />
  <meta
    name="keywords"
    content="3D 웹 제작, 증강현실 개발, 증강현실, WebAR, WebXR, XR제작, 증강현실 제작, AR 제작, Argumented Reality, 메타, 퀘스트 프로, 퀘스트3, 비전프로"
  />

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.min.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  
</svelte:head>

{#if xrReady}
<!-- 안내 문구 UI -->
  <div id="prompt">
    <p id="prompt-text"></p>
  </div>

  <a-scene
    physics="driver: ammo; debug: false; restitution: 1.5; friction: 0.1; gravity:-100"
    renderer="
    colorManagement:true;
    alpha: true;
    antialias: true;
    stencil: true;

    "
    shadow="type: pcfsoft"
    landing-page
    xrextras-loading
    xrextras-runtime-error
    xrweb="
    allowedDevices: any;
    defaultEnvironmentFogIntensity: 0.5; 
    defaultEnvironmentFloorColor: #FFF;
    defaultEnvironmentSkyBottomColor: #B4C4CC; 
    defaultEnvironmentSkyTopColor: #5ac8fa;
    defaultEnvironmentSkyGradientStrength: 0.5;"
  >
    <!-- The raycaster will emit mouse events on scene objects specified with the cantap class -->
    <a-camera id="camera" position="0 8 8" raycaster="objects: .cantap"
    ></a-camera>

    <a-assets>
        <img id="img-arrow" src="/arrow.png" />
        <a-asset-item id="soup_model" src="/Soup.glb"></a-asset-item>
        <audio id="collisionSound" src="/canHit1.mp3"></audio>
        <audio id="collisionSound2" src="/canHit2.mp3"></audio>
      </a-assets>

      <!-- <a-image id="up-arrow" src="#img-arrow" scale="4 4 4"></a-image> -->

    <a-entity wall-portal>

 


    </a-entity>


        <a-box id="topHider" xrextras-hider-material></a-box>
        <a-box id="bottomHider" xrextras-hider-material></a-box>
        <a-box id="leftHider" xrextras-hider-material></a-box>
        <a-box id="rightHider" xrextras-hider-material></a-box>

    


    {#if wallType === 'dropObject'}
    <!-- 바닥 엣지 가이드 -->
    <a-box
      id="bottomGuide"
      wall-from-floor
      color="white"
      width="100"
      depth="0.25"
      height="0.05"
    >
    </a-box>


      <!-- 바닥 엣지 가이드 텍스트 -->
    <a-text
      id="bottomGuideText"
      color="white"
      value="Wall bottom edge"
      width="60"
      align="center"
      anchor="center"
      z-offset="0.0"
      baseline="bottom"
    ></a-text>
 <!-- 상단 엣지 가이드 텍스트 -->
    <a-text
      id="topGuideText"
      color="white"
      value="Wall top edge"
      width="60"
      align="center"
      anchor="center"
      z-offset="0.0"
      baseline="bottom"
    ></a-text>

    <a-entity
      id="main-light"
      light="
      type: directional;
      shadowBias:-0.0001;
      intensity: 0.8;
      castShadow: true;
      shadowMapHeight:2048;
      shadowMapWidth:2048;
      shadowCameraTop: 2000;
      shadowCameraBottom: -500;
      shadowCameraRight: 300;
      shadowCameraLeft: -300;
      target: #ground"
      xrextras-attach="target: camera; offset: 0 500 15"
      position="0 3 5"
    >
    </a-entity>


    <!-- 가상 벽 모델 -->
    <a-box
      id="building"
      class="cantap"
      material="shader: shadow; transparent: true; opacity: 0.4"
      shadow="cast: false; receive: true"
    >
    </a-box>

           <!-- 충돌 사운드 -->
           <a-entity
           id="audioPlayer"
           sound="src: #collisionSound; loop:false; poolSize:20;"
           ></a-entity>
           <a-entity
           id="audioPlayer2"
           sound="src: #collisionSound2; loop:false; poolSize:20;"
           ></a-entity>
{/if}
    <a-light type="ambient" intensity="1"></a-light>

    <!-- 바닥 모델 -->
    <a-entity
      id="ground"
      class="cantap"
      geometry="primitive: box"
      material="shader: shadow; transparent: true; opacity: 0.4"
      scale="3000 2 3000"
      ammo-body="type: static; restitution:0.5; emitCollisionEvents: true;"
      ammo-shape="type: box; fit:all"
      position="0 -1 0"
      ammo-restitution="1"
      shadow="receive:true; cast:false"
    >
    </a-entity>

 
  </a-scene>
{/if}

<style>
  /* Style for "Tap To Place Model" text overlay */
  #prompt {
    font-family: "pretendard", sans-serif !important;
    font-weight: 500 !important;
    font-style: normal !important;
    width: 100%;
    position: fixed;
    z-index: 999;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    text-shadow: 0px 1px 1px black;
    font-size: 1.8em;
    pointer-events: none;
  }

  #requestingCameraPermissions {
    display: none;
  }

  #requestingCameraIcon {
    display: none;
  }

  #loadBackground {
    background: black;
  }

  .foreground-image.poweredby-img {
    display: none !important;
  }

  .prompt-box-8w {
    font-family: "Outfit", sans-serif !important;
    font-weight: 300 !important;
    font-style: normal !important;
    border: 2px solid #000 !important;
    color: white !important;
    background: black !important;
    border-radius: 10px !important;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  }

  .prompt-button-8w {
    font-family: "Outfit", sans-serif !important;
    font-weight: 300 !important;
    font-style: normal !important;
    border: 2px solid #000 !important;
    border-radius: 10px !important;
    background: rgba(254, 254, 254, 0.61) !important;
    color: black !important;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  }

  .button-primary-8w {
    font-family: "Outfit", sans-serif !important;
    font-weight: 300 !important;
    font-style: normal !important;
    color: black !important;
    border-radius: 10px !important;
    border: 2px solid #000 !important;
    background-color: #ef5a14 !important;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  }
</style>