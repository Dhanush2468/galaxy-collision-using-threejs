import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 16.07
parameters.branches = 3
parameters.spin = 1
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

// Second galaxy parameters
const parameters2 = { ...parameters }
parameters2.insideColor = '#30ff60'
parameters2.outsideColor = '#841b39'

let galaxy1 = null
let galaxy2 = null

const generateGalaxy = (xOffset = 0, galaxyParams = parameters) => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(galaxyParams.count * 3)
    const colors = new Float32Array(galaxyParams.count * 3)
    const colorInside = new THREE.Color(galaxyParams.insideColor)
    const colorOutside = new THREE.Color(galaxyParams.outsideColor)

    for (let i = 0; i < galaxyParams.count; i++) {
        const i3 = i * 3
        const radius = Math.random() * galaxyParams.radius
        const spinAngle = radius * galaxyParams.spin
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2
        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX + xOffset
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / galaxyParams.radius)
        colors[i3] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
        size: galaxyParams.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    return new THREE.Points(geometry, material)
}

const createGalaxies = () => {
    if (galaxy1 !== null) {
        galaxy1.geometry.dispose()
        galaxy1.material.dispose()
        scene.remove(galaxy1)
    }

    if (galaxy2 !== null) {
        galaxy2.geometry.dispose()
        galaxy2.material.dispose()
        scene.remove(galaxy2)
    }

    galaxy1 = generateGalaxy(-20, parameters) // Shift first galaxy to the left
    galaxy2 = generateGalaxy(20, parameters2)  // Shift second galaxy to the right

    // Rotate second galaxy to diagonal position
    galaxy2.rotation.x = Math.PI / 4
    galaxy2.rotation.y = Math.PI / 4
    galaxy2.rotation.z = Math.PI / 4

    scene.add(galaxy1)
    scene.add(galaxy2)
}

createGalaxies()

/**
 * Text Labels
 */
const createTextLabel = (text, fontSize = 40, widthFactor = 1.5) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const font = `${fontSize}px Arial`
    context.font = font
    const textWidth = context.measureText(text).width * widthFactor
    const canvasWidth = Math.ceil(textWidth)
    const canvasHeight = Math.ceil(fontSize * 1.4) // Approximate height of the text

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    context.font = font
    context.fillStyle = '#ffffff'
    context.fillText(text, canvasWidth / 2 - textWidth / 2, canvasHeight / 2 + fontSize / 4)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })

    const geometry = new THREE.PlaneGeometry(canvasWidth / 100, canvasHeight / 100)
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
}

const earthLabel = createTextLabel('Milky Way', 60, 2) // Font size: 60, Width factor: 2
earthLabel.position.set(-20, 3, 0) // Position the label near the left galaxy
scene.add(earthLabel)

const andromedaLabel = createTextLabel('Andromeda', 60, 2) // Font size: 60, Width factor: 2
andromedaLabel.position.set(20, 3, 0) // Position the label near the right galaxy
scene.add(andromedaLabel)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 3
camera.position.z = 30
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Calculate the distance between the two galaxies
    const distance = galaxy1.position.distanceTo(galaxy2.position)

    if (distance < 10) {
        // Rotate both galaxies towards each other
        const direction = new THREE.Vector3().subVectors(galaxy2.position, galaxy1.position).normalize()
        galaxy1.rotation.y += 0.005
        galaxy2.rotation.y -= 0.005
        
        // Move particles of both galaxies towards the center
        for (let i = 0; i < galaxy1.geometry.attributes.position.count; i++) {
            const particlePosition1 = new THREE.Vector3().fromBufferAttribute(galaxy1.geometry.attributes.position, i)
            const particlePosition2 = new THREE.Vector3().fromBufferAttribute(galaxy2.geometry.attributes.position, i)
            
            particlePosition1.lerp(new THREE.Vector3(0, 0, 0), 0.01)
            galaxy1.geometry.attributes.position.setXYZ(i, particlePosition1.x, particlePosition1.y, particlePosition1.z)

            // Move particle of galaxy2 towards the center
            particlePosition2.lerp(new THREE.Vector3(0, 0, 0), 0.01)
            galaxy2.geometry.attributes.position.setXYZ(i, particlePosition2.x, particlePosition2.y, particlePosition2.z)
        }

        // Add random dispersion for particles after collision
        for (let i = 0; i < galaxy1.geometry.attributes.position.count; i++) {
            const particlePosition1 = new THREE.Vector3().fromBufferAttribute(galaxy1.geometry.attributes.position, i)
            const particlePosition2 = new THREE.Vector3().fromBufferAttribute(galaxy2.geometry.attributes.position, i)

            // Randomly disperse particles around their original positions
            particlePosition1.add(new THREE.Vector3(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05))

            particlePosition2.add(new THREE.Vector3(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05))

            galaxy1.geometry.attributes.position.setXYZ(i, particlePosition1.x, particlePosition1.y, particlePosition1.z)
            galaxy2.geometry.attributes.position.setXYZ(i, particlePosition2.x, particlePosition2.y, particlePosition2.z)
        }

        galaxy1.geometry.attributes.position.needsUpdate = true
        galaxy2.geometry.attributes.position.needsUpdate = true
    } else {
        // Rotate galaxies independently
        galaxy1.rotation.y += 0.005
        galaxy2.rotation.y += 0.005
    }

    // Animate camera forward after collision
    if (distance < 10 && camera.position.z > 20) {
        const targetPosition = new THREE.Vector3(0, 3, 20) // Define target position
        camera.position.lerp(targetPosition, 0.01) // Smooth transition towards target position
    }

    controls.update()
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}


tick()