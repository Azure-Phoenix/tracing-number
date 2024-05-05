import * as THREE from "three"
import * as dat from "lil-gui"
import { gsap } from "gsap"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"

import JSConfetti from "js-confetti"
import { TexurePaint } from "./texturePaint"

/**
 ******************************
 ****** Three.js Initial ******
 ******************************
 */

/**
 * Init
 */
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.LinearEncoding = THREE.SRGBColorSpace
renderer.toneMapping = THREE.CineonToneMapping
renderer.toneMappingExposure = 1.75
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor("#211d20")
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// camera
const size = 2
const cameraWidth = (size * window.innerWidth) / window.innerHeight / 2
const cameraHeight = size / 2

const camera = new THREE.OrthographicCamera(
  -cameraWidth,
  cameraWidth,
  cameraHeight,
  -cameraHeight,
  1,
  1000
)
camera.position.set(0, 10, 0)
camera.lookAt(0, 0, 0)
scene.add(camera)

/**
 * Addition
 */

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 4)
scene.add(ambientLight)

// Controls
// const orbitControl = new OrbitControls(camera, renderer.domElement)
// orbitControl.enableDamping = true

// Axes
// const axes = new THREE.AxesHelper(10)
// scene.add(axes)

// Draco
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("/draco/")

// GLTF Loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Texture Loader
// const textureLoader = new THREE.TextureLoader()

// Raycaster
let raycaster = new THREE.Raycaster()

/**
 ******************************
 ************ Main ************
 ******************************
 */

/**
 * Definitions
 */

// Confetti
const jsConfetti = new JSConfetti()

// Texture Paint

// Main Model
let model,
  mask = []

// Game parameters
let number = 1 // tracing number
let step = 1 // Letter drawing order
let startObject, endObject
let isPaintAvailable = true
let isCorrectStart = false
let mouse = new THREE.Vector2()
let meshes = new THREE.Group()

const tp = new TexurePaint(meshes, raycaster, 512)

function clearScene() {
  meshes.traverse((child) => {
    meshes.remove(child)
    scene.remove(child)
  })
  scene.remove(scene.getObjectByName(`${number - 1}_border`))
  scene.remove(scene.getObjectByName(`${number - 1}_paint_1`))
  scene.remove(scene.getObjectByName(`${number - 1}_paint_2`))
  scene.remove(scene.getObjectByName(`trigger_${number - 1}_1_start`))
  scene.remove(scene.getObjectByName(`trigger_${number - 1}_2_start`))
  scene.remove(scene.getObjectByName(`trigger_${number - 1}_1_end`))
  scene.remove(scene.getObjectByName(`trigger_${number - 1}_2_end`))
  scene.remove(scene.getObjectByName(`${number - 1}_show_border`))
  scene.remove(scene.getObjectByName(`${number - 1}_show_fill`))
}

function nextNum() {
  console.log(scene)
  // Load main model
  gltfLoader.load(`/models/${number}.glb`, (gltf) => {
    model = gltf.scene
    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name.startsWith(`${number}_origin`)) {
          meshes.add(child.clone())
          meshes.children[0].material.map = tp.getTexture()
          meshes.children[0].material.transparent = true
          meshes.children[0].material.opacity = 1
          meshes.children[0].material.needsUpdate = true
        } else {
          child.visible = false
          if (child.name === `${number}_paint_2`) {
            child.material.color.set(0xe7e7e7)
            child.visible = true
          }
          if (child.name == `${number}_border`) {
            child.visible = true
          }
          if (child.name.startsWith(`${number}_show`)) {
            console.log("asdfasldf")
            child.visible = true
          }
          scene.add(child.clone())
        }
      }
    })
  })

  scene.add(meshes)
}
nextNum()

/**
 * Models
 */
// // Load main model
// gltfLoader.load(`/models/${number}.glb`, (gltf) => {
//   model = gltf.scene
//   model.traverse((child) => {
//     if (child.isMesh) {
//       if (child.name.startsWith(`${number}_origin`)) {
//         meshes.add(child.clone())
//         meshes.children[0].material.map = tp.getTexture()
//         meshes.children[0].material.transparent = true
//         meshes.children[0].material.opacity = 1
//         meshes.children[0].material.needsUpdate = true
//       } else {
//         child.visible = false
//         if (child.name === `${number}_paint_2`) {
//           child.material.color.set(0xe7e7e7)
//           child.visible = true
//         }
//         if (child.name == `${number}_border`) {
//           child.visible = true
//         }
//         scene.add(child.clone())
//       }
//     }
//   })
// })

// scene.add(meshes)
tp.mouse("LEFT", window)
tp.brush.changeColor("hsla(60, 100%, 44%, 1)") // #DFDF00
tp.brush.changeOpacity(0)
tp.changeBrush(100, 100)

/**
 * Action
 */
window.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    startObject = intersects[0].object
    if (isPaintAvailable) start_painting()
  }
})

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    endObject = intersects[0].object
    // console.log(endObject)
    if (isPaintAvailable) end_painting()
  } else {
    isCorrectStart = false
    tp.undo()
    tp.brush.changeOpacity(0)
  }
})

window.addEventListener("mouseup", (event) => {
  isCorrectStart = false
  tp.undo()
  tp.brush.changeOpacity(0)
})

// window.addEventListener("touchstart", (event) => {
//   mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1
//   mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1
// })

/**
 * Functioins
 */
function start_painting() {
  console.log("number", number, "step", step)
  if (startObject.name === `trigger_${number}_${step}_start`) {
    isCorrectStart = true
    tp.brush.changeOpacity(1)
  }
}

function end_painting() {
  if (endObject.name === `trigger_${number}_${step}_end` && isCorrectStart) {
    step++
    if (step == 3) {
      step = 1
      number++
      if (number == 4) {
        setTimeout(() => {
          location.reload()
        }, 2000)
      }
      tp.undo()
      tp.brush.changeOpacity(0)
      clearScene()
      nextNum()
    } else {
      tp.brush.changeOpacity(0)
      confetti()
      isPaintAvailable = false
      if (step == 2) {
        scene.getObjectByName(`${number}_paint_${step - 1}`).material.color.set(0xdfdf00)
      }
      scene.getObjectByName(`${number}_paint_${step - 1}`).visible = true
      tp.undo()
      scene.getObjectByName(`${number}_paint_${step}`).visible = false
      isPaintAvailable = true
    }
  }
}

function confetti() {
  jsConfetti.addConfetti({
    confettiRadius: 3,
    confettiNumber: 500,
  })

  jsConfetti.addConfetti({
    emojis: ["✰"],
    emojiSize: 15,
  })
}

/**
 * Events
 */

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener("touchmove", (e) => {
  mouse.x = (e.changedTouches[0].clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.changedTouches[0].clientY / window.innerHeight) * 2 + 1
})

// Auto Resize
window.addEventListener("resize", () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Animate
 */
const animate = () => {
  // orbitControl.update()
  // Render Scene
  renderer.render(scene, camera)

  raycaster.setFromCamera(mouse, camera)

  tp.texture.needsUpdate = true
  tp.update()

  // Call animate again on the next frame
  window.requestAnimationFrame(animate)
}

animate()
