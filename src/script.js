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
// scene.background

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
// renderer.setClearColor(0xe6e6e6, 1)

// camera
const size = 1
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
const textureLoader = new THREE.TextureLoader()
textureLoader.load("images/background.jpg", function (texture) {
  scene.background = texture
  texture.encoding = THREE.sRGBEncoding;
})

// Raycaster
let raycaster = new THREE.Raycaster()

// Clock
const clock = new THREE.Clock()

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
let model, cursor

// Game parameters
let number = 1 // tracing number
let step = 1 // Letter drawing order
let timeout = 0
let startObject, endObject
let isPaintAvailable = true
let isCorrectStart = false
let drawingPrompt = false
let mouse = new THREE.Vector2()
let meshes = new THREE.Group()

// Curves
let points = [
  [
    // 1
    [
      // 1-1
      new THREE.Vector3(0.401917, 0.2, -0.093821),
      new THREE.Vector3(0.490926, 0.2, -0.166327),
    ],
    [
      // 1-2
      new THREE.Vector3(0.558357, 0.2, -0.224718),
      new THREE.Vector3(0.558357, 0.2, 0.233189),
    ],
  ],
  [
    // 2
    [
      // 2-1
      new THREE.Vector3(0.394461, 0.2, -0.166777),
      new THREE.Vector3(0.458116, 0.2, -0.243912),
      new THREE.Vector3(0.562873, 0.2, -0.239221),
      new THREE.Vector3(0.61447, 0.2, -0.142282),
      new THREE.Vector3(0.564437, 0.2, -0.032834),
      new THREE.Vector3(0.483133, 0.2, 0.046906),
      new THREE.Vector3(0.427035, 0.2, 0.102933),
    ],
    [
      // 2-2
      new THREE.Vector3(0.361888, 0.2, 0.168732),
      new THREE.Vector3(0.642021, 0.2, 0.166777),
    ],
  ],
  [
    // 3
    [
      // 3-1
      new THREE.Vector3(0.391421, 0.2, -0.139343),
      new THREE.Vector3(0.458116, 0.2, -0.209514),
      new THREE.Vector3(0.567564, 0.2, -0.189188),
      new THREE.Vector3(0.591017, 0.2, -0.126647),
      new THREE.Vector3(0.539812, 0.2, -0.047051),
    ],
    [
      // 3-2
      new THREE.Vector3(0.525335, 0.2, -0.005429),
      new THREE.Vector3(0.609779, 0.2, 0.060977),
      new THREE.Vector3(0.597271, 0.2, 0.162607),
      new THREE.Vector3(0.514404, 0.2, 0.215767),
      new THREE.Vector3(0.428409, 0.2, 0.197005),
      new THREE.Vector3(0.385087, 0.2, 0.123056),
    ],
  ],
]

let curves = [
  [new THREE.CatmullRomCurve3(points[0][0]), new THREE.CatmullRomCurve3(points[0][1])],
  [new THREE.CatmullRomCurve3(points[1][0]), new THREE.CatmullRomCurve3(points[1][1])],
  [new THREE.CatmullRomCurve3(points[2][0]), new THREE.CatmullRomCurve3(points[2][1])],
]

const tp = new TexurePaint(meshes, raycaster, 512)
tp.mouse("LEFT", window)
tp.brush.changeColor("hsla(60, 100%, 44%, 1)") // #DFDF00
tp.brush.changeOpacity(0)
tp.changeBrush(100, 100)

gltfLoader.load("/models/cursor.glb", (gltf) => {
  cursor = gltf.scene.children[0]
  cursor.rotation.x = 2 * Math.PI
  cursor.scale.set(0.3, 0.3, 0.3)
  cursor.position.set(curves[0][0][0], curves[0][0][1], curves[0][0][2])
  cursor.material.depthTest = false
  cursor.material.depthWrite = false
  cursor.renderOrder = 1
  cursor.material.opacity = 1
  scene.add(cursor)
})

/**
 * Functioins
 */
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
            child.visible = true
          }
          scene.add(child.clone())
        }
      }
    })
    setTimeout(() => {
      showPrompt()
    }, 1000)
  })

  scene.add(meshes)
}
nextNum()

function showPrompt() {
  cursor.position.set(
    curves[number - 1][step - 1][0],
    curves[number - 1][step - 1][1],
    curves[number - 1][step - 1][2]
  )
  gsap.to(cursor.material, {
    opacity: 1,
    duration: 1,
    onComplete: () => {
      drawingPrompt = true
    },
  })
}
function hidePrompt() {
  drawingPrompt = false
  let tempNum = number
  let tempStep = step
  gsap.to(cursor.material, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      time = 0
      setTimeout(() => {
        if (step == tempStep && number == tempNum) {
          timeout++
          if (timeout == 4) {
            location.reload()
          } else {
            showPrompt()
          }
        }
      }, 5000)
    },
  })
}

function start_painting() {
  console.log(startObject)
  if (startObject.name === `trigger_${number}_${step}_start`) {
    isCorrectStart = true
    tp.brush.changeOpacity(1)
  }
}

function end_painting() {
  if (endObject.name === `trigger_${number}_${step}_end` && isCorrectStart) {
    confetti()
    hidePrompt()
    timeout = 0
    step++
    if (step == 3) {
      console.log("adfasdfasdf")
      scene.getObjectByName(`${number}_paint_${step - 1}`).material.color.set(0xdfdf00)
      scene.getObjectByName(`${number}_paint_${step - 1}`).visible = true
      step = 1
      number++
      if (number == 4) {
        setTimeout(() => {
          location.reload()
        }, 3000)
      }
      setTimeout(() => {
        tp.undo()
        tp.brush.changeOpacity(0)
        clearScene()
        nextNum()
      }, 1000)
    } else {
      tp.brush.changeOpacity(0)
      isPaintAvailable = false
      if (step == 2) {
        scene.getObjectByName(`${number}_paint_${step - 1}`).material.color.set(0xdfdf00)
      }
      scene.getObjectByName(`${number}_paint_${step - 1}`).visible = true
      tp.undo()
      scene.getObjectByName(`${number}_paint_${step}`).visible = false
      isPaintAvailable = true
      setTimeout(() => {
        showPrompt()
      }, 1000)
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

window.addEventListener("touchstart", (event) => {
  mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    startObject = intersects[0].object
    if (isPaintAvailable) start_painting()
  }
})

window.addEventListener("touchmove", (event) => {
  mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1

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

window.addEventListener("touchend", (event) => {
  isCorrectStart = false
  tp.undo()
  tp.brush.changeOpacity(0)
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
let time = 0
const animate = () => {
  let deltaTime = clock.getDelta()

  // orbitControl.update()
  // Render Scene
  renderer.render(scene, camera)

  raycaster.setFromCamera(mouse, camera)

  if (cursor && drawingPrompt) {
    if (time > 1) {
      hidePrompt()
    } else {
      time += deltaTime * 0.5
    }
    let point = curves[number - 1][step - 1].getPoint(time)
    cursor.position.copy(point)
  }

  tp.texture.needsUpdate = true
  tp.update()

  // Call animate again on the next frame
  window.requestAnimationFrame(animate)
}

animate()
