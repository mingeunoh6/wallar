
const ensureMaterialArray = (material) => {
  if (!material) {
    return [];
  }
  if (Array.isArray(material)) {
    return material;
  }
  if (material.materials) {
    return material.materials;
  }
  return [material];
};

const toUrl = (urlOrId) => {
  const img = document.querySelector(urlOrId);
  return img ? img.src : urlOrId;
};

const applyRealtimeEnvMap = (mesh, envMap) => {
  if (!mesh) return;
  mesh.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    const meshMaterials = ensureMaterialArray(node.material);
    meshMaterials.forEach((material) => {
      if (material && !("envMap" in material)) return;
      material.envMap = envMap;
      material.needsUpdate = true;
    });
  });
};

const applyStaticEnvMap = (mesh, materialNames, envMap, reflectivity) => {
  if (!mesh) return;
  materialNames = materialNames || [];
  mesh.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    const meshMaterials = ensureMaterialArray(node.material);
    meshMaterials.forEach((material) => {
      if (material && !("envMap" in material)) return;
      if (materialNames.length && materialNames.indexOf(material.name) === -1)
        return;
      material.envMap = envMap;
      material.reflectivity = reflectivity;
      material.needsUpdate = true;
    });
  });
};

const generatedSeeds = []; // array to store previously generated seed numbers

const generateRandomSeed = () => {
  let randSeed = Math.floor(Math.random() * 1000) + 1;

  // check if randSeed has already been generated
  while (generatedSeeds.includes(randSeed)) {
    // generate new randSeed if it has been previously generated
    randSeed = Math.floor(Math.random() * 1000) + 1;
  }

  generatedSeeds.push(randSeed); // add new seed number to array
  return randSeed.toString();
};

const reflectionsComponent = {
  schema: {
    type: { type: "string", default: "realtime" },
    posx: { type: "string" },
    posy: { type: "string" },
    posz: { type: "string" },
    negx: { type: "string" },
    negy: { type: "string" },
    negz: { type: "string" },
    extension: { default: "jpg", oneOf: ["jpg", "png"] },
    format: { default: "RGBAFormat", oneOf: ["RGBFormat", "RGBAFormat"] },
    enableBackground: { default: false },
    reflectivity: { default: 1, min: 0, max: 1 },
    materials: { default: [] },
  },
  setReflections() {
    if (this.data.type === "realtime") {
      const { data } = this;
      const scene = this.el.sceneEl;

      const pipelineId = generateRandomSeed();

      const camTexture_ = new THREE.Texture();
      const refMat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        color: 0xffffff,
        map: camTexture_,
      });

      const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding,
      });

      // cubemap scene
      const cubeMapScene = new THREE.Scene();
      const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget);
      const sphere = new THREE.SphereGeometry(100, 15, 15);
      const sphereMesh = new THREE.Mesh(sphere, refMat);
      sphereMesh.scale.set(-1, 1, 1);
      sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0);
      cubeMapScene.add(sphereMesh);

      const onxrloaded = () => {
        window.XR8.XrController.configure({ enableLighting: true });
        window.XR8.addCameraPipelineModule({
          name: pipelineId,
          onUpdate: () => {
            cubeCamera.update(scene.renderer, cubeMapScene);
          },

          onProcessCpu: ({ frameStartResult }) => {
            const { cameraTexture } = frameStartResult;
            // force initialization
            const texProps = scene.renderer.properties.get(camTexture_);
            texProps.__webglTexture = cameraTexture;
          },
        });
      };

      window.XR8
        ? onxrloaded()
        : window.addEventListener("xrloaded", onxrloaded);

      const mesh = this.el.getObject3D("mesh");
      mesh
        ? applyRealtimeEnvMap(mesh, cubeCamera.renderTarget.texture)
        : this.el.sceneEl.addEventListener("realityready", () => {
            applyRealtimeEnvMap(
              this.el.getObject3D("mesh"),
              cubeCamera.renderTarget.texture
            );
          });

      this.el.addEventListener("model-loaded", () => {
        applyRealtimeEnvMap(
          this.el.getObject3D("mesh"),
          cubeCamera.renderTarget.texture
        );
      });
    } else if (this.data.type === "static") {
      const { data } = this;

      const cubeSides = ["posx", "posy", "posz", "negx", "negy", "negz"];

      cubeSides.forEach((side) => {
        // check if cubemap image reference is a url or element ID
        if (data[side] && data[side].startsWith("https://")) {
          this[side] = data[side];
        } else if (data[side]) {
          this[side] = document.getElementById(data[side]).src;
        }
      });

      this.texture = new THREE.CubeTextureLoader().load([
        this.posx,
        this.negx,
        this.posy,
        this.negy,
        this.posz,
        this.negz,
      ]);

      this.texture.format = THREE[data.format];

      const mesh = this.el.getObject3D("mesh");
      mesh
        ? applyStaticEnvMap(
            mesh,
            data.materials,
            this.texture,
            data.reflectivity
          )
        : this.el.addEventListener("model-loaded", () => {
            applyStaticEnvMap(
              this.el.getObject3D("mesh"),
              data.materials,
              this.texture,
              data.reflectivity
            );
          });
    }
  },
  init() {
    this.posx = null;
    this.posy = null;
    this.posz = null;
    this.negx = null;
    this.negy = null;
    this.negz = null;

    this.setReflections();
  },
  update(oldData) {
    if (this.data.type === "static") {
      //   subscribe((config) => {
      //     this.posx = config["static-posx"];
      //     this.posy = config["static-posy"];
      //     this.posz = config["static-posz"];
      //     this.negx = config["static-negx"];
      //     this.negy = config["static-negy"];
      //     this.negz = config["static-negz"];
      //     this.setReflections();
      //   });

      //   const { data } = this;
      //   const mesh = this.el.getObject3D("mesh");
      //   let addedMaterialNames = [];
      //   let removedMaterialNames = [];
      //   if (data.materials.length) {
      //     if (oldData.materials) {
      //       addedMaterialNames = data.materials.filter(
      //         (name) => !oldData.materials.includes(name)
      //       );
      //       removedMaterialNames = oldData.materials.filter(
      //         (name) => !data.materials.includes(name)
      //       );
      //     } else {
      //       addedMaterialNames = data.materials;
      //     }
      //   }
      //   if (addedMaterialNames.length) {
      //     applyStaticEnvMap(
      //       mesh,
      //       addedMaterialNames,
      //       this.texture,
      //       data.reflectivity
      //     );
      //   }
      //   if (removedMaterialNames.length) {
      //     applyStaticEnvMap(mesh, removedMaterialNames, null, 1);
      //   }
      //   if (oldData.materials && data.reflectivity !== oldData.reflectivity) {
      //     const maintainedMaterialNames = data.materials.filter((name) =>
      //       oldData.materials.includes(name)
      //     );
      //     if (maintainedMaterialNames.length) {
      //       applyStaticEnvMap(
      //         mesh,
      //         maintainedMaterialNames,
      //         this.texture,
      //         data.reflectivity
      //       );
      //     }
      //   }
      //   if (this.data.enableBackground && !oldData.enableBackground) {
      //     this.setBackground(this.texture);
      //   } else if (!this.data.enableBackground && oldData.enableBackground) {
      //     this.setBackground(null);
      //   }
      return;
    }
    this.setReflections();
  },
  remove() {
    if (this.data.type === "static") {
      this.el.removeEventListener("object3dset", this.object3dsetHandler);
      const mesh = this.el.getObject3D("mesh");
      const { data } = this;
      applyStaticEnvMap(mesh, data.materials, null, 1);
      if (data.enableBackground) {
        this.setBackground(null);
      }
    }
  },
  setBackground(texture) {
    this.el.sceneEl.object3D.background = texture;
  },
};

export { reflectionsComponent };