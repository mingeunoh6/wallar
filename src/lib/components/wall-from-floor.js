const wallFromFloorComponent = {
    schema: {
     placed: { type: 'boolean', default: false }
    },
    init() {
      this.raycaster = new THREE.Raycaster();
      this.camera = document.getElementById("camera");
      this.threeCamera = this.camera.getObject3D("camera");
      this.ground = document.getElementById("ground");
      this.bottomGuide = document.getElementById("bottomGuide");
      this.bottomGuideText = document.getElementById("bottomGuideText");
      this.topGuideText = document.getElementById("topGuideText");
      this.prompt = document.getElementById("prompt-text");
      this.arrowUp = document.getElementById("up-arrow");
  
      const scene = this.el.sceneEl;
  
      //상단 엣지 가이드 숨기기 
      this.topGuideText.object3D.visible = false;

      //벽 가이드 오브젝트 숨기기
      const buildingBlock = document.getElementById("building");
      buildingBlock.object3D.visible = false;
  
      //8thWall 준비 완료 이벤트 핸들러
      scene.addEventListener("realityready", () => {
        // Hide loading UI
        this.prompt.innerHTML = `
  스마트폰을 움직여 <br/>벽과 바닥이 만나는 지점에<br/>안내선을 평행하게 맞춘 후<br/>화면을 탭하세요.
  `;
      });
  

      //벽 배치 함수
      const placeWall = () => {
        console.log('벽 배치 함수 호출');
        this.el.setAttribute('wall-from-floor', 'placed', true);
  
        // prompt, 하단 엣지 가이드 완성 된 이후 상단 엣지 가이드 프롬프트 보이기
        this.prompt.innerHTML = `
  스마트폰을 기울여 <br/>벽면의 최상단에<br/>안내선을 평행하게 맞춘 후<br/>화면을 탭하세요.
  `;
  
        this.bottomGuideText.object3D.visible = false;
        this.arrowUp.object3D.visible = false;
        const wall = document.createElement("a-box");
        wall.id = "wall";
        wall.setAttribute("material", {
          color: "black",
          transparent: true,
          opacity: 0.4,
        });
        wall.object3D.scale.set(50, 2000, 0.25);
        wall.object3D.rotation.y = this.el.object3D.rotation.y;
        wall.setAttribute("position", {
          x: this.el.object3D.position.x,
          y: this.el.object3D.position.y + 1000,
          z: this.el.object3D.position.z + 0.5,
        });
        wall.setAttribute("scanner-shader", {
          width: 0.2,
          color: 0xffffff,
          spacing: 0.5,
          speed: 1,
          opacity: 0.4,
        });
  
        scene.appendChild(wall);
  
        // topguide

        const topGuide = document.createElement("a-box");
        topGuide.id = "topGuide";
        topGuide.setAttribute("width", this.el.getAttribute("width"));
        topGuide.setAttribute("depth", this.el.getAttribute("height"));
        topGuide.setAttribute("height", this.el.getAttribute("depth"));
        topGuide.setAttribute("color", "white");
        topGuide.setAttribute("position", {
          x: this.el.object3D.position.x,
          y: this.el.object3D.position.y + 0.3,
          z: this.el.object3D.position.z,
        });
  
        topGuide.setAttribute("set-wall-top", "");
        scene.appendChild(topGuide);
  
        scene.removeEventListener("click", placeWall);
  
        // click event handles the wall placement
      };
      scene.addEventListener("click", placeWall);
    },
  
    tick() {
      const placed = this.el.getAttribute('wall-from-floor')?.placed;
      if (!placed) {
        let pos = new THREE.Vector3(0, 0, 0);
        const a = new THREE.Vector2(0, -0.5);
  
        this.threeCamera = this.threeCamera || this.camera.getObject3D("camera");
  
        this.raycaster.setFromCamera(a, this.threeCamera);
        const intersects = this.raycaster.intersectObject(
          this.ground.object3D,
          true
        );
  
        if (intersects.length > 0) {
          pos = intersects[0].point;
        }
        this.bottomGuideText.object3D.position.lerp(
          new THREE.Vector3(pos.x, pos.y + 0.5, pos.z + 0.4),
          0.4
        );
        this.bottomGuideText.object3D.rotation.y =
          this.camera.object3D.rotation.y;
  
        this.arrowUp.object3D.position.lerp(
          new THREE.Vector3(pos.x, pos.y + 4.5, pos.z + 0.1),
          0.4
        );
        this.arrowUp.object3D.rotation.y = this.camera.object3D.rotation.y;
  
        this.el.object3D.position.lerp(pos, 0.4);
        this.el.object3D.rotation.y = this.camera.object3D.rotation.y;
      }
    },
  };
  
  const setWallTopComponent = {
    schema: {
      placed: { type: 'boolean', default: false },
      start: { type: 'boolean', default: false },
    },
    init() {
      let count = 0;
      let start = false;
      this.raycaster = new THREE.Raycaster();
      this.camera = document.getElementById("camera");
      this.threeCamera = this.camera.getObject3D("camera");
      this.wall = document.getElementById("wall");
      this.bottomGuide = document.getElementById("bottomGuide");
      this.topGuideText = document.getElementById("topGuideText");
      const ground = document.getElementById("ground");
      const scene = this.el.sceneEl;
      this.prompt = document.getElementById("prompt-text");
      this.arrowUp = document.getElementById("up-arrow");
      this.topGuideText.object3D.visible = true;
      this.arrowUp.object3D.visible = true;
      this.arrowUp.object3D.rotation.z = Math.PI;
  
      const createRoof = () => {
        this.el.setAttribute('set-wall-top', 'placed', true);
  
        // prompt
        this.prompt.innerHTML = `
  설정한 벽면을 탭해보세요!
  `;
        this.arrowUp.object3D.visible = false;
        this.topGuideText.object3D.visible = false;
        this.camera.setAttribute("cursor", { fuse: "false", rayOrigin: "mouse" });
  
        // caculate wall height
        const bottomPosY = this.bottomGuide.object3D.position.y;
        const topPosY = this.el.object3D.position.y;
        const wallHeight = topPosY - bottomPosY;
  
        const wallCurrentScale = this.wall.getAttribute("scale");
        const wallCurrentPos = this.wall.getAttribute("position").clone();
        this.wall.setAttribute(
          "scale",
          `${wallCurrentScale.x} ${wallHeight} ${wallCurrentScale.z}`
        );
        this.wall.setAttribute(
          "position",
          `${wallCurrentPos.x} ${wallHeight / 2} ${wallCurrentPos.z}`
        );
  
        const buildingBlock = document.getElementById("building");
        buildingBlock.object3D.visible = true;
        buildingBlock.object3D.scale.set(1000, wallHeight, 1000);
        buildingBlock.object3D.rotation.y = this.el.object3D.rotation.y;
        buildingBlock.setAttribute("position", {
          x: this.wall.object3D.position.x,
          y: wallHeight / 2,
          z: this.wall.object3D.position.z - 500,
        });
        buildingBlock.setAttribute("ammo-body", {
          type: "static",
          restitution: 0.9,
        });
        buildingBlock.setAttribute("ammo-shape", {
          type: "box",
          fit: "manual",
          halfExtents: `500 ${wallHeight / 2} 500`,
        });
        buildingBlock.setAttribute("ammo-restitution", "1.5");
  
        // add hider block
        const hiderBlock = document.createElement("a-box");
        hiderBlock.id = "hideBlock";
        hiderBlock.object3D.scale.set(1000, wallHeight, 1000);
        hiderBlock.object3D.rotation.y = this.el.object3D.rotation.y;
        hiderBlock.setAttribute("position", {
          x: this.wall.object3D.position.x,
          y: wallHeight / 2,
          z: this.wall.object3D.position.z - 500.5,
        });
        hiderBlock.setAttribute("xrextras-hider-material", "");
        scene.appendChild(hiderBlock);
  
        scene.removeEventListener("click", createRoof);
        scene.removeChild(this.el);
        scene.removeChild(this.bottomGuide);
  
        const hiderRoof = document.createElement("a-plane");
        hiderRoof.setAttribute("width", "1000");
        hiderRoof.setAttribute("height", "500");
        hiderRoof.setAttribute("rotation", "-90 0 0");
        hiderRoof.setAttribute("position", {
          x: this.wall.object3D.position.x,
          y: wallHeight + 0.2,
          z: this.wall.object3D.position.z - 250,
        });
  
        scene.appendChild(hiderRoof);
  
        const mainLight = document.getElementById("main-light");
        mainLight.setAttribute("light", {
          target: "#hideBlock",
          type: "directional",
          shadowBias: -0.0001,
          intensity: 0.8,
          castShadow: true,
          shadowMapHeight: 2048,
          shadowMapWidth: 2048,
          shadowCameraTop: 2000,
          shadowCameraBottom: -500,
          shadowCameraRight: 300,
          shadowCameraLeft: -300,
        });
  
        // make falling object
        const obj = document.createElement("a-entity");
        obj.setAttribute("gltf-model", "#soup_model");
        // obj.setAttribute('geometry', {primitive: 'sphere', radius: '5'})
        obj.setAttribute("shadow", { receive: false });
  
        obj.object3D.visible = false;
        obj.setAttribute("id", "original");
  
        obj.setAttribute("instanced-mesh", "capacity: 100; updateMode: auto;");
        // obj.setAttribute('material', {
        //   color: 0xffffff,
        //   metalness: '1.0',
        //   roughness: '0.1',
        // })
        obj.setAttribute("reflections", { type: "realtime" });
        scene.appendChild(obj);
  
        buildingBlock.addEventListener("click", (event) => {
          play(obj, wallCurrentPos, wallHeight);
        });
      };
  
      const play = (obj, wallCurrentPos, wallHeight) => {
        if (count === 0) {
          this.prompt.innerHTML = "";
  
          scene.removeChild(this.wall);
          count = 1;
        }
  
        obj.object3D.visible = true;
        const startPos = new THREE.Vector3(
          wallCurrentPos.x,
          wallHeight + 15,
          wallCurrentPos.z - 3
        );
  
        // fall object
        const fallObj = document.createElement("a-entity");
  
        fallObj.setAttribute("instanced-mesh-member", {
          mesh: "#original",
          memberMesh: "true",
        });
  
        fallObj.setAttribute("position", {
          x: startPos.x + (Math.random() * 2 - 1),
          y: startPos.y,
          z: startPos.z + Math.random() * 3,
        });
        fallObj.setAttribute("scale", {
          x: 10,
          y: 10,
          z: 10,
        });
        fallObj.setAttribute("ammo-body", {
          type: "dynamic",
          mass: "2",
          restitution: 2.0,
          angularDamping: 0.2,
          linearDamping: 0.5,
          gravity: "0 -99.8 0",
          emitCollisionEvents: true,
        });
  
        // fallObj.setAttribute('ammo-shape', {
        //   type: 'sphere',
        //   fit: 'manual',
        //   sphereRadius: '5',
  
        // })
        fallObj.setAttribute("ammo-shape", {
          type: "cylinder",
          fit: "manual",
          cylinderAxis: "y",
          halfExtents: "3.5 4.6 3.5",
        });
        fallObj.setAttribute("shadow", "");
  
        // add audio
        const hitSound = document.getElementById("audioPlayer");
        const hitSound2 = document.getElementById("audioPlayer2");
        const soundArray = [hitSound, hitSound2];
        const randomIndex = Math.floor(Math.random() * soundArray.length);
  
        function collideEvent() {
          if (hitSound && hitSound2) {
            soundArray[randomIndex].components.sound.playSound();
  
            setTimeout(() => {
              fallObj.removeEventListener("collidestart", collideEvent);
            }, 3000);
          }
        }
  
        fallObj.addEventListener("collidestart", collideEvent);
  
        const randomZstrength = Math.random() * (70 - 40) + 40;
        const randomXstrength = (Math.random() * 2 - 1) * 10;
        const randomYstrength = (Math.random() * 2 - 1) * 10;
  
        const randomZrot = (Math.random() * 2 - 1) * 10;
        const randomXrot = (Math.random() * 2 - 1) * 10;
  
        // const direction = new THREE.Vector3(randomXstrength, 0, randomZstrength)
        // direction.multiplyScalar(10)
        // fallObj.object3D.position.add(direction)
        let force;
        let rotForce;
  
        force = new Ammo.btVector3(
          randomXstrength,
          randomYstrength,
          randomZstrength
        );
        rotForce = new Ammo.btVector3(randomXrot, 0, randomZrot);
  
        fallObj.addEventListener("body-loaded", () => {
          fallObj.body.setLinearVelocity(force);
          fallObj.body.setAngularVelocity(rotForce);
        });
  
        Ammo.destroy(force);
        Ammo.destroy(rotForce);
  
        scene.appendChild(fallObj);
  
        this.data.count++;
      };
  
      scene.addEventListener("click", createRoof);
    },
  
    tick() {
      const placed = this.el.getAttribute('set-wall-top')?.placed;
      if (!placed) {
        let pos = new THREE.Vector3(0, 0, 0);
        const a = new THREE.Vector2(0, 0);
  
        this.threeCamera = this.threeCamera || this.camera.getObject3D("camera");
  
        this.raycaster.setFromCamera(a, this.threeCamera);
        const intersects = this.raycaster.intersectObject(
          this.wall.object3D,
          true
        );
  
        if (intersects.length > 0) {
          const i = 0;
          const intersect = intersects[i];
          pos = intersect.point;
        }
  
        const newPos = new THREE.Vector3(
          this.el.object3D.position.x,
          pos.y,
          this.el.object3D.position.z
        );
  
        this.topGuideText.object3D.position.lerp(
          new THREE.Vector3(newPos.x, newPos.y - 2.5, newPos.z + 0.5),
          0.4
        );
        this.topGuideText.object3D.rotation.y = this.wall.object3D.rotation.y;
  
        this.arrowUp.object3D.position.lerp(
          new THREE.Vector3(newPos.x, newPos.y + 1.8, newPos.z + 0.1),
          0.4
        );
        this.arrowUp.object3D.rotation.y = this.wall.object3D.rotation.y;
  
        this.el.object3D.position.lerp(newPos, 0.4);
        this.el.object3D.rotation.y = this.wall.object3D.rotation.y;
      }
    },
  };
  
  const placeOnWallComponent = {
    schema: {
      placed: { type: 'boolean', default: false },
    },
    init() {
      this.raycaster = new THREE.Raycaster();
      this.camera = document.getElementById("camera");
      this.threeCamera = this.camera.getObject3D("camera");
      this.wall = document.getElementById("wall");
      const scene = this.el.sceneEl;
  
      const placeOnWall = () => {
        this.el.setAttribute('place-on-wall', 'placed', true);
        scene.removeEventListener("click", placeOnWall);
      };
  
      scene.addEventListener("click", placeOnWall);
    },
  
    tick() {
      const placed = this.el.getAttribute('place-on-wall')?.placed;
      if (!placed) {
        let pos = new THREE.Vector3(0, 0, 0);
        const a = new THREE.Vector2(0, 0);
  
        this.threeCamera = this.threeCamera || this.camera.getObject3D("camera");
  
        this.raycaster.setFromCamera(a, this.threeCamera);
        const intersects = this.raycaster.intersectObject(
          this.wall.object3D,
          true
        );
  
        if (intersects.length > 0) {
          const i = 0;
          const intersect = intersects[i];
          pos = intersect.point;
        }
  
        this.el.object3D.position.lerp(pos, 0.4);
        this.el.object3D.rotation.y = this.wall.object3D.rotation.y;
      }
    },
  };
  
  export { setWallTopComponent, placeOnWallComponent, wallFromFloorComponent };