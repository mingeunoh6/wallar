// Component that places cacti where the ground is clicked

export const tapPlaceComponent = {
    schema: {
      min: { default: 6 },
      max: { default: 10 },
    },
    init() {
      let index = 0;
      const camera = document.getElementById("camera");
      const ground = document.getElementById("ground");
      this.prompt = document.getElementById("promptText");
  
      const obj = document.createElement("a-entity");
      obj.setAttribute("gltf-model", "#cushion");
      obj.setAttribute("shadow", { receive: false });
      obj.object3D.visible = false;
      obj.setAttribute("id", "original");
  
      obj.setAttribute("reflections", { type: "realtime" });
      obj.setAttribute("instanced-mesh", "capacity: 100; updateMode: auto;");
  
      this.el.sceneEl.appendChild(obj);
  
      ground.addEventListener("click", (event) => {
        if (index === 0) {
          obj.object3D.visible = true;
        }
        index++;
        this.prompt.style.display = "none";
        const newElement = document.createElement("a-entity");
        const touchPoint = event.detail.intersection.point;
  
        newElement.setAttribute("id", `object-${index}`);
        newElement.setAttribute("shadow", { receive: false });
        newElement.setAttribute(
          "instanced-mesh-member",
          "mesh: #original;  memberMesh: true;"
        );
        newElement.object3D.position.set(
          touchPoint.x,
          touchPoint.y + 4,
          touchPoint.z
        );
        newElement.object3D.rotation.set(
          (Math.random() * 2 - 1) * Math.PI * 2,
          (Math.random() * 2 - 1) * Math.PI * 2,
          (Math.random() * 2 - 1) * Math.PI * 2
        );
  
        newElement.setAttribute("animation", {
          property: "scale",
          from: "0 0 0",
          to: "5 5 5",
          easing: "easeOutElastic",
          dur: 800,
        });
        newElement.setAttribute("dynamic-body", {
          mass: "5",
          shape: "sphere",
          sphereRadius: 3.3,
          angularDamping: 0.2,
          linearDamping: 0.5,
        });
        this.el.sceneEl.appendChild(newElement);
      });
  
      // ground.addEventListener('click', (event) => {
      //   this.prompt.style.display = 'none'
      //   const newElement = document.createElement('a-entity')
      //   const touchPoint = event.detail.intersection.point
      //   newElement.setAttribute('position', `${touchPoint.x} ${touchPoint.y + 4} ${touchPoint.z}`)
  
      //   const randomYRotation = Math.random() * 360
      //   const randomZRotation = (Math.random() * 2 - 1) * 90
      //   newElement.setAttribute('rotation', `-90 ${randomYRotation} ${randomZRotation}`)
  
      //   newElement.setAttribute('visible', 'false')
      //   newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
      //   newElement.setAttribute('shadow', {receive: false})
      //   newElement.setAttribute('gltf-model', '#cushion')
      //   newElement.setAttribute('reflections', {type: 'realtime'})
      //   this.el.sceneEl.appendChild(newElement)
  
      //   newElement.addEventListener('model-loaded', () => {
      //     newElement.setAttribute('visible', 'true')
      //     newElement.setAttribute('animation', {
      //       property: 'scale',
      //       to: '5 5 5',
      //       easing: 'easeOutElastic',
      //       dur: 800,
      //     })
  
      //     newElement.setAttribute('dynamic-body', {
      //       mass: '5',
      //       shape: 'sphere',
      //       sphereRadius: 3.5,
      //       angularDamping: 0.2,
      //       linearDamping: 0.5,
      //     })
      //   })
      // })
    },
  };