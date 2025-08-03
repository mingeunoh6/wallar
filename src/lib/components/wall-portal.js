
import gsap from 'gsap';

// MarchingCubes는 동적으로 로드
let MarchingCubes;


const wallPortalComponent = {
    schema: {
     placed: { type: 'boolean', default: false }
    },
    init() {
    
        this.placed = false;
        this.wallStep = 0;
        this.spawnCount = 150; // 줄여서 성능 향상
        this.portalSize = 0.5;
        
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

      this.topHider.setAttribute('visible',false)
      this.bottomHider.setAttribute('visible',false)
      this.leftHider.setAttribute('visible',false)
      this.rightHider.setAttribute('visible',false)
 
      this.prompt = document.getElementById("prompt-text");
      console.log(this.prompt)

    this.sceneEl = this.el.sceneEl;
      this.scene = this.sceneEl.object3D
      console.log(this.scene)

      //portalHelper
      const portalHelperObj = new THREE.CircleGeometry(this.portalSize, 32);
      const portalHelperMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
      this.portalHelper = new THREE.Mesh(portalHelperObj, portalHelperMaterial);
      this.scene.add(this.portalHelper);
      this.portalHelper.visible = false;
      
      

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

            this.portalHelper.visible = true;

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
            wall.object3D.scale.set(50, 2000, 0.5);
            wall.object3D.rotation.y = this.startHelperLine.rotation.y;
            wall.setAttribute("position", {
              x: startLinePos.x,
              y: startLinePos.y + 1000,
              z: startLinePos.z - 0.25,
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
          
            this.portalHelper.position.set(startLinePos.x, startLinePos.y + this.portalSize/2, startLinePos.z+0.26 );
            this.portalHelper.rotation.y = this.startHelperLine.rotation.y;
    

      
            this.sceneEl.removeEventListener("click", this.placePortal);
            this.sceneEl.addEventListener("click", this.settingPortal);
      
 
          
    },

    settingPortal(){
        console.log('settingportal')
        this.wallStep = 2;
        this.topHider.setAttribute('visible',true)
        this.bottomHider.setAttribute('visible',true)
        this.leftHider.setAttribute('visible',true)
        this.rightHider.setAttribute('visible',true)

        let portalPos = this.portalHelper.position.clone();
        let portalRot = this.portalHelper.rotation.clone();
        this.portalHelper.visible = false;

        //가상 벽 없앰
        this.wall.object3D.visible = false;


        this.prompt.innerHTML = `
        
        
        `;



        //portal 등장 효과 - Ripple Shader
        const portalGraphicGeometry = new THREE.PlaneGeometry(this.portalSize*5,this.portalSize*5,100,100)
        
        // Ripple shader material
        const rippleVertexShader = `
            uniform float time;
            varying vec2 vUv;
            varying float vWaveHeight;
            
            void main() {
                vUv = uv;
                
                // 중심점에서의 거리 계산
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(uv, center);
                
                // 물결 파라미터
                float rippleSpeed = 0.5;
                float rippleFrequency = 30.0;
                float waveAmplitude = 0.05; // 물결 높이
                
                // 원형 물결 생성
                float wave = sin((dist - time * rippleSpeed) * rippleFrequency);
                
                // 거리에 따른 감쇠 (중심에서 멀어질수록 약해짐)
                float decay = 1.0 - smoothstep(0.0, 0.5, dist);
                
                // Z축 변위 계산
                float displacement = wave * waveAmplitude * decay;
                
                // 변위된 position 계산
                vec3 newPosition = position;
                newPosition.z += displacement;
                
                // fragment shader로 파도 높이 전달
                vWaveHeight = displacement;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
        
        const rippleFragmentShader = `
            uniform float time;
            uniform vec2 resolution;
            uniform float fadeOpacity;
            varying vec2 vUv;
            varying float vWaveHeight;
            
            void main() {
                // 중심점에서의 거리 계산 (0~1 범위)
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(vUv, center);
                
                // 시간에 따라 확장되는 ripple
                float rippleSpeed = 0.5;
                float rippleFrequency = 30.0; // 스트라이프 빈도
                float rippleWidth = 0.005; // 각 링의 두께
                
                // 원형 파동 패턴 생성
                float wave = sin((dist - time * rippleSpeed) * rippleFrequency);
                
                // 스트라이프 패턴을 더 선명하게
                wave = smoothstep(-0.2, 0.2, wave);
                
                // 중심부는 더 밝게
                float centerGlow = 1.0 - smoothstep(0.0, 0.1, dist);
                
                // 원형 마스킹 - 더 넓은 feather 범위
                float circleMask = 1.0 - smoothstep(0.3, 0.5, dist);
                
                // 가장자리 페더링 - 더 부드럽고 넓은 페이드아웃
                float softEdge = 1.0 - smoothstep(0.1, 0.5, dist);
                
                // 시간에 따른 전체적인 페이드 인
                float timeFade = smoothstep(0.0, 1.0, time * 0.5);
                
                // 파도 높이에 따른 추가 밝기
                float waveHighlight = abs(vWaveHeight) * 20.0; // 파도가 높을수록 밝게
                
                // 최종 밝기 계산
                float brightness = wave * softEdge * timeFade + centerGlow * 0.5 + waveHighlight;
                
                // 흑백 색상 (파도 효과로 약간의 블루 톤 추가)
                vec3 color = vec3(brightness) + vec3(0.0, 0.1, 0.2) * waveHighlight;
                
                // 알파값 계산 - 원형 마스크와 소프트 엣지 적용
                float alpha = circleMask * timeFade * fadeOpacity;
                
                // 원 바깥쪽은 완전히 투명하게
                if (dist > 0.5) {
                    alpha = 0.0;
                }
                
                gl_FragColor = vec4(color, alpha );
            }
        `;
        
        const portalGraphicMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2(100, 100) },
                fadeOpacity: { value: 1.0 }
            },
            vertexShader: rippleVertexShader,
            fragmentShader: rippleFragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const portalGraphic = new THREE.Mesh(portalGraphicGeometry, portalGraphicMaterial)
        portalGraphic.position.set(portalPos.x,portalPos.y,portalPos.z+0.05)
        this.scene.add(portalGraphic)
        portalGraphic.rotation.y = portalRot.y
        
        // 애니메이션을 위한 참조 저장
        this.portalGraphic = portalGraphic;
        this.portalStartTime = this.time;






        let portalBoxMat = {
            color: "black",
          
            side: THREE.DoubleSide,
            metalness: 0.9,
            roughness: 0.1,
     
        }


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
        x: portalRot.x -90,
        y: portalRot.y,
        z: portalRot.z
    })
   
        portalBoxTop.setAttribute("material", portalBoxMat);
        portalBoxTop.setAttribute('reflections',{type: 'realtime'})
        this.sceneEl.appendChild(portalBoxTop);
        
        // portalBox들 참조 저장
        this.portalBoxes = [portalBoxTop];

        const portalBoxBottom = portalBoxTop.cloneNode(true);
        portalBoxBottom.setAttribute('position',{
            x: portalPos.x,
            y: portalPos.y-this.portalSize/2,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxBottom.setAttribute('rotation',{
            x: portalRot.x + 110,
            y: portalRot.y,
            z: portalRot.z
        })
        portalBoxBottom.setAttribute('material', portalBoxMat);
        portalBoxBottom.setAttribute('reflections',{type: 'realtime'})
        this.sceneEl.appendChild(portalBoxBottom);
        this.portalBoxes.push(portalBoxBottom);

        const portalBoxLeft = portalBoxTop.cloneNode(true);
        portalBoxLeft.setAttribute('position',{
            x: portalPos.x-this.portalSize/2,
            y: portalPos.y,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxLeft.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y + 90,
            z: portalRot.z
        })
        portalBoxLeft.setAttribute('material', portalBoxMat);
        portalBoxLeft.setAttribute('reflections',{type: 'realtime'})
        this.sceneEl.appendChild(portalBoxLeft);
        this.portalBoxes.push(portalBoxLeft);

        const portalBoxRight = portalBoxTop.cloneNode(true);
        portalBoxRight.setAttribute('position',{
            x: portalPos.x+this.portalSize/2,
            y: portalPos.y,
            z: portalPos.z-this.portalSize/2
        })
        portalBoxRight.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y - 90,
            z: portalRot.z
        })
        portalBoxRight.setAttribute('material', portalBoxMat);
        portalBoxRight.setAttribute('reflections',{type: 'realtime'})
        this.sceneEl.appendChild(portalBoxRight);
        this.portalBoxes.push(portalBoxRight);
        
        const portalBoxBack = portalBoxTop.cloneNode(true);
        portalBoxBack.setAttribute('position',{
            x: portalPos.x,
            y: portalPos.y,
            z: portalPos.z-this.portalSize
        })
        portalBoxBack.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y,
            z: portalRot.z
        })
        portalBoxBack.setAttribute('material', portalBoxMat);
        portalBoxBack.setAttribute('reflections',{type: 'realtime'})
        this.sceneEl.appendChild(portalBoxBack);
        this.portalBoxes.push(portalBoxBack);

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


        let hiderSize = 100
        let hiderDepth = 10
        this.topHider.setAttribute('width', hiderSize);
        this.topHider.setAttribute('height', hiderSize);
        this.topHider.setAttribute('depth', hiderDepth);
        this.topHider.setAttribute("position", {
            x: portalPos.x,
            y: portalPos.y + this.portalSize/2 + hiderSize/2,
            z: portalPos.z - hiderDepth/2
        })
        this.topHider.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y,
            z: portalRot.z
        })
       
        this.bottomHider.setAttribute('width', hiderSize)
        this.bottomHider.setAttribute('height', hiderSize)
        this.bottomHider.setAttribute('depth', hiderDepth)
        this.bottomHider.setAttribute("position", {
            x: portalPos.x,
            y: portalPos.y - this.portalSize/2 - hiderSize/2,
            z: portalPos.z - hiderDepth/2
        })
        this.bottomHider.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y,
            z: portalRot.z
        })
        this.leftHider.setAttribute('width', hiderSize)
        this.leftHider.setAttribute('height', hiderSize)
        this.leftHider.setAttribute('depth', hiderDepth)
        this.leftHider.setAttribute("position", {
            x: portalPos.x - this.portalSize/2 - hiderSize/2,
            y: portalPos.y,
            z: portalPos.z - hiderDepth/2
        })
        this.leftHider.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y,
            z: portalRot.z
        })
        this.rightHider.setAttribute('width', hiderSize)
        this.rightHider.setAttribute('height', hiderSize)
        this.rightHider.setAttribute('depth', hiderDepth)
        this.rightHider.setAttribute("position", {
            x: portalPos.x + this.portalSize/2 + hiderSize/2,
            y: portalPos.y,
            z: portalPos.z - hiderDepth/2
        })
        this.rightHider.setAttribute('rotation',{
            x: portalRot.x,
            y: portalRot.y,
            z: portalRot.z
        })
  


   
        
     
        
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
            setTimeout((index) => {
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
                
                // 마지막 sphere가 생성되면 GSAP로 fade out
                if (index === this.spawnCount - 1) {
                    console.log('last sphere!!!!!!!')
                    setTimeout(() => {
                        if (this.portalGraphic && this.portalGraphic.material.uniforms) {
                            // GSAP을 사용해 portalGraphic uniform fadeOpacity 애니메이션
                            gsap.to(this.portalGraphic.material.uniforms.fadeOpacity, {
                                value: 0,
                                duration: 3.0,
                                ease: "power2.out",
                                onComplete: () => {
                                    if (this.portalGraphic && this.portalGraphic.parent) {
                                        this.scene.remove(this.portalGraphic);
                                        this.portalGraphic = null;
                                    }
                                }
                            });
                            
                            // portalBox들도 함께 fadeout
                            if (this.portalBoxes) {
                                this.portalBoxes.forEach((box, index) => {
                                    if (box && box.object3D) {
                                        console.log(`Fading portalBox ${index}`, box.object3D);
                                        
                                        // object3D mesh에서 material 접근
                                        box.object3D.traverse((child) => {
                                            if (child.isMesh && child.material) {
                                                console.log(`Found mesh material for box ${index}`, child.material);
                                                
                                                // material을 transparent로 설정
                                                child.material.transparent = true;
                                                
                                                // GSAP으로 opacity 애니메이션
                                                gsap.to(child.material, {
                                                    opacity: 0,
                                                    duration: 1.0,
                                                    ease: "power2.out",
                                                    onUpdate: () => {
                                                        child.material.needsUpdate = true;
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }, 1000); // 1초 딜레이 후 페이드 시작
                }
            }, i * 100, i); // 100ms 간격으로 생성, i를 파라미터로 전달
        }
    },

    initMarchingCubes(portalPos) {
        // Wait for THREE to be available
        const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
        if (!THREE) {
            console.warn('THREE.js not available for marching cubes');
            return;
        }
        
        // 8thWall 카메라 텍스처를 위한 설정
        const camTexture_ = new THREE.Texture();
        const refMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0xffffff,
            map: camTexture_,
        });
        
        // Realtime envMap을 위한 CubeRenderTarget
        const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding,
        });
        
        // Cubemap scene 생성
        const cubeMapScene = new THREE.Scene();
        const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget);
        const sphere = new THREE.SphereGeometry(100, 15, 15);
        const sphereMesh = new THREE.Mesh(sphere, refMat);
        sphereMesh.scale.set(-1, 1, 1);
        sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0);
        cubeMapScene.add(sphereMesh);
        
        this.cubeCamera = cubeCamera;
        this.cubeMapScene = cubeMapScene;
        this.camTexture = camTexture_;
        
        // Marching cubes material - 실시간 반사 효과
        const marchingCubesMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,  // 밝은 파란색
            metalness: 0.9,  // 높은 금속성으로 반사 강화
            roughness: 0.1,  // 낮은 거칠기로 매끈한 표면
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: true,
            envMap: cubeCamera.renderTarget.texture,  // 실시간 환경맵
            envMapIntensity: 1.0
        });
        
        // 8thWall cameraPipelineModule 설정
        const pipelineId = `marchingCubes-${Math.floor(Math.random() * 1000)}`;
        
        const onxrloaded = () => {
            window.XR8.XrController.configure({ enableLighting: true });
            window.XR8.addCameraPipelineModule({
                name: pipelineId,
                onUpdate: () => {
                    // CubeCamera 업데이트는 tick에서 처리
                },
                onProcessCpu: ({ frameStartResult }) => {
                    const { cameraTexture } = frameStartResult;
                    // 카메라 텍스처를 강제로 초기화
                    const texProps = this.sceneEl.renderer.properties.get(camTexture_);
                    texProps.__webglTexture = cameraTexture;
                },
            });
        };
        
        window.XR8 ? onxrloaded() : window.addEventListener("xrloaded", onxrloaded);


        // Dynamically load MarchingCubes
        import('$lib/components/marchingCubes.js').then((module) => {
            MarchingCubes = module.MarchingCubes;


//calculate marchingCubesEffect pos and scale.
//#1 calculate midpoint betweee portalHelper pos and startHelperLine pos
const midOfPortalToStartLinePos = new THREE.Vector3(
    (this.portalHelper.position.x + this.startHelperLine.position.x) / 2,
    (this.portalHelper.position.y + this.startHelperLine.position.y) / 2,
    (this.portalHelper.position.z + this.startHelperLine.position.z) / 2
)
//#2 calculate distance between PortalHelper pos and startHelperLine pos
const distance = midOfPortalToStartLinePos.distanceTo(this.portalHelper.position)

//#3 calculate vertical distance from portalHelper pos to startHelperLine
const shortDistance = this.portalHelper.position.y - this.startHelperLine.position.y
//#4 calculate minimum height of the marchingCubeEffect
const minHeight = shortDistance + this.portalSize/2
const marchingCubeEffectPos = new THREE.Vector3(
    this.portalHelper.position.x,
    this.portalHelper.position.y,
   this.portalHelper.position.z-this.portalSize/2
)

let initialScaleValue = 1
let portalGraphicScaleValue = initialScaleValue + 0.5 * Math.log(minHeight*0.1 + 1); 


//marchingCube Scale 에 맞게 portalGraphic scale 조정
this.portalGraphic.scale.set(portalGraphicScaleValue,portalGraphicScaleValue,portalGraphicScaleValue)



            
            // Create marching cubes effect
            const resolution = 128; // Lower resolution for better performance
            this.marchingCubesEffect = new MarchingCubes(resolution, marchingCubesMaterial, false, false, 100000);
            
            // MarchingCubes 위치와 크기 설정 - 균일한 scale 사용
            const mcSize = minHeight; // 균일한 크기
            // Y 위치를 아래로 조정하여 떨어지는 범위 확대
          this.marchingCubesEffect.position.set(marchingCubeEffectPos.x,marchingCubeEffectPos.y,marchingCubeEffectPos.z)
          this.marchingCubesEffect.rotation.y = this.portalHelper.rotation.y
          this.marchingCubesEffect.scale.set(mcSize, mcSize, mcSize);
            this.marchingCubesEffect.isolation = 100; // 더 높은 isolation 값
            
            // 그림자 설정
            this.marchingCubesEffect.castShadow = true; // 그림자 생성
            this.marchingCubesEffect.receiveShadow = false; // 그림자 받지 않음
            
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
            const initialStrength = 0.05
            const k = 0.02
            // Add metaballs based on sphere positions
            // 각 sphere마다 하나의 metaball 생성 (1:1 매칭)
            const subtract = 12;
            let strength = initialStrength + k * Math.log(scale/10 + 1); ; // ball 크기 조정
         if(strength > 30){
            strength = 30} else if(strength < 0.1){
                strength = 0.1
            }
            
            console.log(strength,scale)
            for (let i = 0; i < this.sphereEntities.length; i++) {
                const entity = this.sphereEntities[i];
                
                if (entity.object3D) {
                    const spherePos = entity.object3D.position;
                    
                    // Normalize position to marching cubes space (0-1)
                    const ballx = (spherePos.x - portalCenter.x) / scale + 0.5
                    const bally = (spherePos.y - portalCenter.y) / scale + 0.5
                    const ballz = (spherePos.z - portalCenter.z) / scale + 0.5
          
                    
                    
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
        this.portalHelper.position.z = portalPos.z+0.26
        this.portalHelper.rotation.y = this.wall.object3D.rotation.y;

    } else if(this.wallStep === 2){
        // MarchingCubes가 로드되었는지 확인
        if (this.marchingCubesEffect) {
            // 8thWall 카메라 텍스처를 사용한 CubeCamera 업데이트
            if (this.cubeCamera && this.cubeMapScene) {
                // CubeCamera 위치를 MarchingCubes 중심으로 업데이트
                this.cubeCamera.position.copy(this.marchingCubesEffect.position);
                
                // MarchingCubes를 잠시 숨기고 환경맵 렌더링
                this.marchingCubesEffect.visible = false;
                
                // 8thWall 카메라 텍스처가 적용된 sphere를 사용하여 CubeCamera 업데이트
                this.cubeCamera.update(this.sceneEl.renderer, this.cubeMapScene);
                
                this.marchingCubesEffect.visible = true;
            }
            
            // Update marching cubes based on sphere positions
            this.updateMarchingCubes();
        } else {
            // 아직 로드 중이면 대기
            console.log('Waiting for marching cubes to load...');
        }
        
        // Update time for any animations
        this.time += 0.016; // ~60fps
        
        // Portal ripple animation update (시간 업데이트만)
        if (this.portalGraphic && this.portalGraphic.material.uniforms) {
            const elapsedTime = this.time - this.portalStartTime;
            this.portalGraphic.material.uniforms.time.value = elapsedTime;
        }
    }
}
  };
  

  export {wallPortalComponent };