// MarchingCubes는 동적으로 로드
let MarchingCubes;

const wallPortalComponent = {
    schema: {
     placed: { type: 'boolean', default: false }
    },
    init() {
    
        this.placed = false;
        this.wallStep = 0;
        this.spawnCount = 30; // 줄여서 성능 향상
        this.portalSize = 2;
        
        // Sphere tracking arrays
        this.sphereEntities = []; // A-Frame entities
        
        // Marching cubes setup
        this.marchingCubesEffect = null;
        this.time = 0;
        this.firstUpdate = true; // 디버그를 위한 플래그

       
      this.raycaster = new THREE.Raycaster();
      this.camera = document.getElementById("camera");
      this.threeCamera = this.camera.getObject3D("camera");
      this.ground = document.getElementById("ground");

      this.topHider = document.getElementById("topHider");
      this.bottomHider = document.getElementById("bottomHider");
      this.leftHider = document.getElementById("leftHider");
      this.rightHider = document.getElementById("rightHider");
 
      this.prompt = document.getElementById("prompt-text");
      console.log(this.prompt)

    this.sceneEl = this.el.sceneEl;
      this.scene = this.sceneEl.object3D
      console.log(this.scene)

      //portalHelper
      const portalHelperObj = new THREE.PlaneGeometry(this.portalSize, this.portalSize);
      const portalHelperMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
      this.portalHelper = new THREE.Mesh(portalHelperObj, portalHelperMaterial);
      this.scene.add(this.portalHelper);
      
      

      //startHelperLine: 가장 바닥면을 설정하는 라인 가이드
      const startHelperLineWidth = 100;
      const helperLineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff
    });
    
    const startHelperPoints = [];
    startHelperPoints.push( new THREE.Vector3( -startHelperLineWidth/2, 0, 0 ) );
    startHelperPoints.push( new THREE.Vector3( 0, 0, 0 ) );
    startHelperPoints.push( new THREE.Vector3( startHelperLineWidth/2, 0, 0 ) );
    const startHelperGeometry = new THREE.BufferGeometry().setFromPoints( startHelperPoints );
    this.startHelperLine = new THREE.Line( startHelperGeometry, helperLineMaterial );
    this.scene.add(this.startHelperLine);
  

  
      //8thWall 준비 완료 이벤트 핸들러
      this.sceneEl.addEventListener("realityready", () => {
        // Hide loading UI
        this.prompt.innerHTML = `
  스마트폰을 움직여 <br/>벽과 바닥이 만나는 지점에<br/>안내선을 평행하게 맞춘 후<br/>화면을 탭하세요.
  `;
      });
  

      //벽 배치 함수
      // bind를 사용하여 this 컨텍스트를 유지
      this.placePortal = this.placePortal.bind(this);
      this.settingPortal = this.settingPortal.bind(this);
      this.sceneEl.addEventListener("click", this.placePortal);
    },

    placePortal(){
     
            console.log('벽 배치 함수 호출');
            this.placed = true;
            this.wallStep = 1;

            // prompt, 하단 엣지 가이드 완성 된 이후 포탈 위치 설정 프롬프트 보이기
            this.prompt.innerHTML = `
      벽면에서 포탈을 설치할<br/>위치를 선택하고<br/>화면을 탭하세요.
      `;

      //현재 startLine 위치 가져오기
      const startLinePos = this.startHelperLine.position.clone();

      //가상 벽 만들기
            const wall = document.createElement("a-box");
            wall.id = "wall";
            wall.setAttribute("material", {
              color: "black",
              transparent: true,
              opacity: 0.4,
            });
            wall.object3D.scale.set(50, 2000, 0.25);
            wall.object3D.rotation.y = this.startHelperLine.rotation.y;
            wall.setAttribute("position", {
              x: startLinePos.x,
              y: startLinePos.y + 1000,
              z: startLinePos.z + 0.25/2,
            });
            wall.setAttribute("scanner-shader", {
              width: 0.2,
              color: 0xffffff,
              spacing: 0.5,
              speed: 1,
              opacity: 0.4,
            });

            this.wall = wall;


            this.sceneEl.appendChild(wall);
      
            //portal 배치 가이드 오브젝트 추가
          
            this.portalHelper.position.set(startLinePos.x, startLinePos.y + this.portalSize/2, startLinePos.z );
            this.portalHelper.rotation.y = this.startHelperLine.rotation.y;
    

      
            this.sceneEl.removeEventListener("click", this.placePortal);
            this.sceneEl.addEventListener("click", this.settingPortal);
      
 
          
    },

    settingPortal(){
        console.log('settingportal')
        this.wallStep = 2;
        let portalPos = this.portalHelper.position.clone();
        this.portalHelper.visible = false;

        //가상 벽 없앰
        this.wall.object3D.visible = false;


        this.prompt.innerHTML = `
        
        `;


        //portal 공간 생성 
        const portalBoxTop = document.createElement("a-box");
        portalBoxTop.id = "portalBoxTop";
        portalBoxTop.setAttribute("width", this.portalSize);
        portalBoxTop.setAttribute("height", this.portalSize);
        portalBoxTop.setAttribute("depth", 0.05);
        portalBoxTop.setAttribute("position", {
            x: portalPos.x,
            y: portalPos.y+this.portalSize/2,
            z: portalPos.z-this.portalSize/2
        });
    portalBoxTop.setAttribute('rotation',{
        x: -90,
        y: 0,
        z: 0
    })
   
        portalBoxTop.setAttribute("material", {color: "blue"});
        this.sceneEl.appendChild(portalBoxTop);

        const portalBoxBottom = portalBoxTop.cloneNode(true);
        portalBoxBottom.setAttribute('position',{
            x: portalPos.x,
            y: portalPos.y-this.portalSize/2,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxBottom.setAttribute('rotation',{
            x: 90,
            y: 0,
            z:0
        })
        portalBoxBottom.setAttribute('material', {color: "blue"});
        this.sceneEl.appendChild(portalBoxBottom);

        const portalBoxLeft = portalBoxTop.cloneNode(true);
        portalBoxLeft.setAttribute('position',{
            x: portalPos.x-this.portalSize/2,
            y: portalPos.y,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxLeft.setAttribute('rotation',{
            x: 0,
            y: 90,
            z:0
        })
        portalBoxLeft.setAttribute('material', {color: "blue"});
        this.sceneEl.appendChild(portalBoxLeft);

        const portalBoxRight = portalBoxTop.cloneNode(true);
        portalBoxRight.setAttribute('position',{
            x: portalPos.x+this.portalSize/2,
            y: portalPos.y,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxRight.setAttribute('rotation',{
            x: 0,
            y: -90,
            z:0
        })
        portalBoxRight.setAttribute('material', {color: "blue"});
        this.sceneEl.appendChild(portalBoxRight);
        
        const portalBoxBack = portalBoxTop.cloneNode(true);
        portalBoxBack.setAttribute('position',{
            x: portalPos.x,
            y: portalPos.y,
            z: portalPos.z-this.portalSize
        })
        portalBoxBack.setAttribute('rotation',{
            x: 0,
            y: 0,
            z: 0
        })
        portalBoxBack.setAttribute('material', {color: "red"});
        this.sceneEl.appendChild(portalBoxBack);

        //Physics setting
        portalBoxTop.setAttribute("ammo-body", {
            type: "static",
            restitution: 0.9,
        });
        portalBoxTop.setAttribute("ammo-shape", {
            type: "box",
            fit: "manual",
            halfExtents: `${this.portalSize/2} ${this.portalSize/2} 0.05`,
        });
        portalBoxTop.setAttribute("ammo-restitution", "1.5");
        portalBoxBottom.setAttribute("ammo-body", {
            type: "static",
            restitution: 0.9,
        });
        portalBoxBottom.setAttribute("ammo-shape", {
            type: "box",
            fit: "manual",
            halfExtents: `${this.portalSize/2} ${this.portalSize/2} 0.05`,
        });
        portalBoxBottom.setAttribute("ammo-restitution", "1.5");
        portalBoxLeft.setAttribute("ammo-body", {
            type: "static",
            restitution: 0.9,
        });
        portalBoxLeft.setAttribute("ammo-shape", {
            type: "box",
            fit: "manual",
            halfExtents: `${this.portalSize/2} ${this.portalSize/2} 0.05`,
        });
        portalBoxLeft.setAttribute("ammo-restitution", "1.5");
        portalBoxRight.setAttribute("ammo-body", {
            type: "static",
            restitution: 0.9,
        });
        portalBoxRight.setAttribute("ammo-shape", {
            type: "box",
            fit: "manual",
            halfExtents: `${this.portalSize/2} ${this.portalSize/2} 0.05`,
        });
        portalBoxRight.setAttribute("ammo-restitution", "1.5");
        portalBoxBack.setAttribute("ammo-body", {
            type: "static",
            restitution: 0.9,
        });
        portalBoxBack.setAttribute("ammo-shape", {
            type: "box",
            fit: "manual",
            halfExtents: `${this.portalSize/2} ${this.portalSize/2} 0.05`,
        });
        portalBoxBack.setAttribute("ammo-restitution", "1.5");



        //portal 효과를 위한 stencil buffer 기반 마스킹
        
        // Stencil 기반 portal 구현
        const setupPortalStencil = () => {
            // 1. Portal window (stencil mask) - portal 내부만 stencil ref 1로 마킹
            const portalWindowGeometry = new THREE.PlaneGeometry(this.portalSize, this.portalSize);
            const portalWindowMaterial = new THREE.MeshBasicMaterial({
                colorWrite: false,
                depthWrite: false,
                stencilWrite: true,
                stencilFunc: THREE.AlwaysStencilFunc,
                stencilRef: 1,
                stencilFail: THREE.KeepStencilOp,
                stencilZFail: THREE.KeepStencilOp,
                stencilZPass: THREE.ReplaceStencilOp,
            });
            
            const portalWindow = new THREE.Mesh(portalWindowGeometry, portalWindowMaterial);
            portalWindow.position.copy(portalPos);
            portalWindow.position.z += 0.01; // 벽보다 약간 앞에
            portalWindow.rotation.y = this.portalHelper.rotation.y;
            portalWindow.renderOrder = -2;
            this.scene.add(portalWindow);
            
            // 2. Occluder planes - portal 외부를 가리는 4개의 plane
            const createOccluderPlane = (width, height, position, rotation) => {
                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({
                    colorWrite: false,
                    depthWrite: true,
                    stencilWrite: true,
                    stencilFunc: THREE.NotEqualStencilFunc,
                    stencilRef: 1,
                    stencilFail: THREE.KeepStencilOp,
                    stencilZFail: THREE.KeepStencilOp,
                    stencilZPass: THREE.KeepStencilOp,
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                if (rotation) {
                    mesh.rotation.x = rotation.x || 0;
                    mesh.rotation.y = rotation.y || 0;
                    mesh.rotation.z = rotation.z || 0;
                }
                mesh.renderOrder = -1;
                return mesh;
            };
            
            // Top occluder
            const topOccluder = createOccluderPlane(
                this.portalSize + 10, 
                100,
                new THREE.Vector3(portalPos.x, portalPos.y + this.portalSize/2 + 50, portalPos.z),
                { y: this.portalHelper.rotation.y }
            );
            this.scene.add(topOccluder);
            
            // Bottom occluder
            const bottomOccluder = createOccluderPlane(
                this.portalSize + 10, 
                100,
                new THREE.Vector3(portalPos.x, portalPos.y - this.portalSize/2 - 50, portalPos.z),
                { y: this.portalHelper.rotation.y }
            );
            this.scene.add(bottomOccluder);
            
            // Left occluder
            const leftOccluder = createOccluderPlane(
                100, 
                this.portalSize + 10,
                new THREE.Vector3(portalPos.x - this.portalSize/2 - 50, portalPos.y, portalPos.z),
                { y: this.portalHelper.rotation.y }
            );
            this.scene.add(leftOccluder);
            
            // Right occluder
            const rightOccluder = createOccluderPlane(
                100, 
                this.portalSize + 10,
                new THREE.Vector3(portalPos.x + this.portalSize/2 + 50, portalPos.y, portalPos.z),
                { y: this.portalHelper.rotation.y }
            );
            this.scene.add(rightOccluder);
            
            // Visual debug planes - occluder와 똑같은 크기와 위치
            const createDebugPlane = (width, height, position, rotation, color) => {
                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                if (rotation) {
                    mesh.rotation.x = rotation.x || 0;
                    mesh.rotation.y = rotation.y || 0;
                    mesh.rotation.z = rotation.z || 0;
                }
                return mesh;
            };
            
            // // Debug planes 생성 (occluder와 동일한 크기/위치)
            // const topDebug = createDebugPlane(
            //     this.portalSize + 10, 
            //     100,
            //     new THREE.Vector3(portalPos.x, portalPos.y + this.portalSize/2 + 50, portalPos.z),
            //     { y: this.portalHelper.rotation.y },
            //     0xff0000 // 빨간색
            // );
            // this.scene.add(topDebug);
            
            // const bottomDebug = createDebugPlane(
            //     this.portalSize + 10, 
            //     100,
            //     new THREE.Vector3(portalPos.x, portalPos.y - this.portalSize/2 - 50, portalPos.z),
            //     { y: this.portalHelper.rotation.y },
            //     0x00ff00 // 초록색
            // );
            // this.scene.add(bottomDebug);
            
            // const leftDebug = createDebugPlane(
            //     100, 
            //     this.portalSize + 10,
            //     new THREE.Vector3(portalPos.x - this.portalSize/2 - 50, portalPos.y, portalPos.z),
            //     { y: this.portalHelper.rotation.y },
            //     0x0000ff // 파란색
            // );
            // this.scene.add(leftDebug);
            
            // const rightDebug = createDebugPlane(
            //     100, 
            //     this.portalSize + 10,
            //     new THREE.Vector3(portalPos.x + this.portalSize/2 + 50, portalPos.y, portalPos.z),
            //     { y: this.portalHelper.rotation.y },
            //     0xffff00 // 노란색
            // );
            // this.scene.add(rightDebug);
            
            // 3. Content objects (spheres)는 stencil test를 통과하는 material 사용
            this.portalContentMaterial = new THREE.MeshPhongMaterial({
                stencilWrite: true,
                stencilFunc: THREE.EqualStencilFunc,
                stencilRef: 1,
                stencilFail: THREE.KeepStencilOp,
                stencilZFail: THREE.KeepStencilOp,
                stencilZPass: THREE.KeepStencilOp,
            });
            
            // 3. Content objects (spheres)는 stencil test를 통과하는 material 사용
            this.portalContentMaterial = new THREE.MeshPhongMaterial({
                stencilWrite: true,
                stencilFunc: THREE.EqualStencilFunc,
                stencilRef: 1,
                stencilFail: THREE.KeepStencilOp,
                stencilZFail: THREE.KeepStencilOp,
                stencilZPass: THREE.KeepStencilOp,
            });
        };
        
        setupPortalStencil();
        
        // Initialize marching cubes with a slight delay to ensure THREE is loaded
        setTimeout(() => {
            this.initMarchingCubes(portalPos);
        }, 100);
        
        this.spawnSpheres(portalPos);

        this.sceneEl.removeEventListener("click", this.settingPortal);



    },
    

    spawnSpheres(pos){
        // spawnCount 만큼 sphere 생성
        for(let i = 0; i < this.spawnCount; i++) {
            setTimeout(() => {
                // 랜덤한 색상
                const colors = ['#ffff00', '#ff0000', '#0000ff', '#00ff00', '#ff8800', '#8800ff'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                // 랜덤한 위치 오프셋 추가
                const offsetX = (Math.random() - 0.5) * this.portalSize * 0.8;
                const offsetY = (Math.random() - 0.5) * this.portalSize * 0.8;
                
                // A-Frame sphere entity 생성 (보이지 않게)
                const sphere = document.createElement("a-sphere");
                sphere.setAttribute("radius", 0.1);
                sphere.setAttribute("position", {
                    x: pos.x + offsetX,
                    y: pos.y + offsetY,
                    z: pos.z - this.portalSize/2
                });
                sphere.setAttribute("material", {
                    color: randomColor,
                    transparent: true,
                    opacity: 0 // 완전 투명
                });
                
                this.sceneEl.appendChild(sphere);
                this.sphereEntities.push(sphere);

                //physics dynamic body setting - 더 부드러운 움직임
                sphere.setAttribute("ammo-body", {
                    type: "dynamic",
                    mass: 1.0,  // 질량 증가
                    restitution: 0.3,  // 탄성 감소 (덜 튀김)
                    linearDamping: 0.5,  // 선형 감쇠 증가 (속도 감소)
                    angularDamping: 0.8,  // 회전 감쇠 증가
                });
                sphere.setAttribute("ammo-shape", {
                    type: "sphere",
                    fit: "manual",
                    sphereRadius: 0.1,
                });
                sphere.setAttribute("ammo-restitution", "0.3");  // 낮은 반발력
                
                // 초기 속도 추가 - 훨씬 느리게
                sphere.addEventListener('body-loaded', () => {
                    const force = new Ammo.btVector3(
                        (Math.random() - 0.5) * 2,  // 좌우 힘 감소 (5 -> 2)
                        (Math.random() - 0.5) * 2,  // 상하 힘 감소
                        Math.random() * 3 + 2  // 전방 힘 크게 감소 (10+5 -> 3+2)
                    );
                    sphere.body.setLinearVelocity(force);
                    Ammo.destroy(force);
                });
            }, i * 100); // 100ms 간격으로 생성
        }
    },

    initMarchingCubes(portalPos) {
        // Wait for THREE to be available
        const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
        if (!THREE) {
            console.warn('THREE.js not available for marching cubes');
            return;
        }
        
        // Marching cubes material - 물 같은 효과
        const marchingCubesMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488ff,  // 파란색 물
            transparent: true,
            opacity: 0.6,  // 약간 투명
            shininess: 200,  // 높은 광택
            specular: 0xffffff,  // 흰 반사광
            side: THREE.DoubleSide,
            depthWrite: true
        });
        
        // Dynamically load MarchingCubes
        import('$lib/components/marchingCubes.js').then((module) => {
            MarchingCubes = module.MarchingCubes;
            
            // Create marching cubes effect
            const resolution = 28; // Lower resolution for better performance
            this.marchingCubesEffect = new MarchingCubes(resolution, marchingCubesMaterial, false, false, 100000);
            
            // MarchingCubes 위치와 크기 설정 - sphere가 움직이는 전체 공간 커버
            const mcSize = this.portalSize * 3; // Portal보다 3배 크게
            this.marchingCubesEffect.position.set(portalPos.x, portalPos.y, portalPos.z - this.portalSize/2);
            this.marchingCubesEffect.scale.set(mcSize, mcSize, mcSize);
            this.marchingCubesEffect.isolation = 80; // 더 높은 isolation 값
            
            // Ensure geometry is properly initialized
            if (this.marchingCubesEffect.init) {
                this.marchingCubesEffect.init(resolution);
            }
            
            this.scene.add(this.marchingCubesEffect);
            console.log('MarchingCubes loaded successfully:', {
                position: this.marchingCubesEffect.position,
                scale: this.marchingCubesEffect.scale,
                isolation: this.marchingCubesEffect.isolation
            });
        }).catch((error) => {
            console.error('Failed to load MarchingCubes:', error);
        });
    },
    
    updateMarchingCubes() {
        if (!this.marchingCubesEffect || this.sphereEntities.length === 0) return;
        
        // Check if marching cubes is properly initialized
        if (!this.marchingCubesEffect.geometry || !this.marchingCubesEffect.field) {
            console.warn('Marching cubes not properly initialized');
            return;
        }
        
        // 첫 번째 업데이트에서만 로그
        if (this.firstUpdate) {
            console.log(`Updating marching cubes with ${this.sphereEntities.length} spheres`);
            this.firstUpdate = false;
        }
        
        try {
            this.marchingCubesEffect.reset();
            
            // Portal center for normalization 
            const portalCenter = this.marchingCubesEffect.position;
            const scale = this.marchingCubesEffect.scale.x;
            
            // Add metaballs based on sphere positions
            // 각 sphere마다 하나의 metaball 생성 (1:1 매칭)
            const subtract = 12;
            const strength = 0.25; // 강도 증가로 더 안정적인 metaball
            
            for (let i = 0; i < this.sphereEntities.length; i++) {
                const entity = this.sphereEntities[i];
                
                if (entity.object3D) {
                    const spherePos = entity.object3D.position;
                    
                    // Normalize position to marching cubes space (0-1)
                    const ballx = (spherePos.x - portalCenter.x) / scale + 0.5;
                    const bally = (spherePos.y - portalCenter.y) / scale + 0.5;
                    const ballz = (spherePos.z - portalCenter.z) / scale + 0.5;
                    
                    // 범위 확인 및 디버그
                    if (i < 3) { // 첫 3개 sphere 로그
                        console.log(`Sphere ${i}: world(${spherePos.x.toFixed(2)}, ${spherePos.y.toFixed(2)}, ${spherePos.z.toFixed(2)}) -> mc(${ballx.toFixed(2)}, ${bally.toFixed(2)}, ${ballz.toFixed(2)})`);
                        
                        // MarchingCubes 범위 밖으로 나가는지 확인
                        if (ballx < 0 || ballx > 1 || bally < 0 || bally > 1 || ballz < 0 || ballz > 1) {
                            console.warn(`Sphere ${i} is outside marching cubes bounds!`);
                        }
                    }
                    
                    // 모든 sphere에 대해 metaball 추가
                    this.marchingCubesEffect.addBall(ballx, bally, ballz, strength, subtract);
                }
            }
            
            this.marchingCubesEffect.update();
        } catch (error) {
            console.error('Error updating marching cubes:', error);
        }
    },



    calculateRayContactPoint(object, rayOffset = new THREE.Vector2(0, -0.5)) {
        let pos = new THREE.Vector3(0, 0, 0);
  
        // 카메라 오브젝트 가져오기
        this.threeCamera = this.threeCamera || this.camera.getObject3D("camera");
  
        //오브젝트와 접점을 계산하기 위한 레이캐스터 
        this.raycaster.setFromCamera(rayOffset, this.threeCamera);
        const intersects = this.raycaster.intersectObject(
            object,
          true
        );
  
        //오브젝트와의 접점 position 추출
        if (intersects.length > 0) {
          pos = intersects[0].point;
        }

        return pos;
    }
  ,


    tick() {
      
      if (!this.placed && this.startHelperLine) {
        let bottomPos = this.calculateRayContactPoint(this.ground.object3D);

        this.startHelperLine.position.lerp(bottomPos, 0.4);
        this.startHelperLine.rotation.y = this.camera.object3D.rotation.y;
  
      } else if (this.placed && this.wall && this.portalHelper && this.wallStep === 1) {
        // 화면 중앙으로 레이캐스트
        let portalPos = this.calculateRayContactPoint(this.wall.object3D, new THREE.Vector2(0, 0));

        this.portalHelper.position.lerp(portalPos, 0.4);
        this.portalHelper.rotation.y = this.wall.object3D.rotation.y;

    } else if(this.wallStep === 2){
        // MarchingCubes가 로드되었는지 확인
        if (this.marchingCubesEffect) {
            // Update marching cubes based on sphere positions
            this.updateMarchingCubes();
        } else {
            // 아직 로드 중이면 대기
            console.log('Waiting for marching cubes to load...');
        }
        
        // Update time for any animations
        this.time += 0.016; // ~60fps
    }
}
  };
  

  export {wallPortalComponent };