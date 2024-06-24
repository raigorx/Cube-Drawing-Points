import { CanvasMode } from './canvasMode.js'

const rotationMethod = Object.freeze({
  COMBINED: 0,
  SINGLE: 1,
  ANOTHER: 2,
  TWO_DIMENSION: 3
})

export class Cube {
  constructor (startCube, faces, size, alterStyle, depth = true) {
    this.#startCube = startCube
    this.#faces = faces
    this.#cubeSize = size
    this.#alterStyle = alterStyle
    this.#depth = depth
    this.#randomizeRotationMethod()
  }

  static #colors = {
    '@': ['red', 'orange'],
    $: ['green', 'lime'],
    '~': ['blue', 'skyblue'],
    '#': ['yellow', 'gold'],
    ';': ['purple', 'magenta'],
    '+': ['cyan', 'teal'],
    '.': ['white', 'red']
  }

  #decision
  #depth
  #alterStyle
  #cubeSize
  #startCube
  #faces
  #rotAngleX = 0
  #rotAngleY = 0
  #rotAngleZ = 0
  #depthBuffer = new Array(SCREENSIZE)

  #counterAtSymbol = { value: 0 }
  #counterDollarSymbol = { value: 0 }
  #counterTildeSymbol = { value: 0 }
  #counterHashSymbol = { value: 0 }
  #counterSemicolonSymbol = { value: 0 }
  #counterPlusSymbol = { value: 0 }
  #abortController = new AbortController()

  #sleep (ms, context) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms)
      this.#abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout) // Clear the timeout to avoid memory leaks
        const error = new Error('Aborted')
        error.context = context
        reject(error)
      })
    })
  }

  degreesToRadians = degrees => degrees * (Math.PI / 180)

  #anotherRotX (x, y, z) {
    return (
      Math.cos(this.#rotAngleZ) *
        (x * Math.cos(this.#rotAngleY) -
          Math.sin(this.#rotAngleY) *
            (z * Math.cos(this.#rotAngleX) - y * Math.sin(this.#rotAngleX))) +
      Math.sin(this.#rotAngleZ) *
        (y * Math.cos(this.#rotAngleX) + z * Math.sin(this.#rotAngleX))
    )
  }

  #anotherRotY (x, y, z) {
    return (
      Math.cos(this.#rotAngleZ) *
        (y * Math.cos(this.#rotAngleX) + z * Math.sin(this.#rotAngleX)) -
      Math.sin(this.#rotAngleZ) *
        (x * Math.cos(this.#rotAngleY) -
          Math.sin(this.#rotAngleY) *
            (z * Math.cos(this.#rotAngleX) - y * Math.sin(this.#rotAngleX)))
    )
  }

  #anotherRotZ (x, y, z) {
    return (
      x * Math.sin(this.#rotAngleY) +
      Math.cos(this.#rotAngleY) *
        (z * Math.cos(this.#rotAngleX) - y * Math.sin(this.#rotAngleX))
    )
  }

  // single radian ve multiples rotations(radians)
  #rotateSingleX ({ cubeX, cubeY, cubeZ }) {
    return [
      cubeX,
      cubeY * Math.cos(this.#rotAngleX) + cubeZ * -Math.sin(this.#rotAngleX),
      cubeY * Math.sin(this.#rotAngleX) + cubeZ * Math.cos(this.#rotAngleX)
    ]
  }

  #rotateSingleY ({ cubeX, cubeY, cubeZ }) {
    return [
      cubeX * Math.cos(this.#rotAngleY) + cubeZ * Math.sin(this.#rotAngleY),
      cubeY,
      cubeX * -Math.sin(this.#rotAngleY) + cubeZ * Math.cos(this.#rotAngleY)
    ]
  }

  #rotateSingleZ ({ cubeX, cubeY, cubeZ }) {
    return [
      cubeX * Math.cos(this.#rotAngleZ) + cubeY * -Math.sin(this.#rotAngleZ),
      cubeX * Math.sin(this.#rotAngleZ) + cubeY * Math.cos(this.#rotAngleZ),
      cubeZ
    ]
  }

  #combinedRotateX (x, y, z) {
    return (
      x * Math.cos(this.#rotAngleY) * Math.cos(this.#rotAngleZ) +
      y *
        (Math.sin(this.#rotAngleX) *
          Math.sin(this.#rotAngleY) *
          Math.cos(this.#rotAngleZ) +
          Math.cos(this.#rotAngleX) * Math.sin(this.#rotAngleZ)) +
      z *
        (Math.sin(this.#rotAngleX) * Math.sin(this.#rotAngleZ) -
          Math.cos(this.#rotAngleX) *
            Math.sin(this.#rotAngleY) *
            Math.cos(this.#rotAngleZ))
    )
  }

  #combinedRotateY (x, y, z) {
    return (
      -x * Math.cos(this.#rotAngleY) * Math.sin(this.#rotAngleZ) +
      y *
        (Math.cos(this.#rotAngleX) * Math.cos(this.#rotAngleZ) -
          Math.sin(this.#rotAngleX) *
            Math.sin(this.#rotAngleY) *
            Math.sin(this.#rotAngleZ)) +
      z *
        (Math.cos(this.#rotAngleX) *
          Math.sin(this.#rotAngleY) *
          Math.sin(this.#rotAngleZ) +
          Math.sin(this.#rotAngleX) * Math.cos(this.#rotAngleZ))
    )
  }

  #combinedRotateZ (x, y, z) {
    return (
      x * Math.sin(this.#rotAngleY) -
      y * Math.sin(this.#rotAngleX) * Math.cos(this.#rotAngleY) +
      z * Math.cos(this.#rotAngleX) * Math.cos(this.#rotAngleY)
    )
  }

  #rotateVector2D (x, y, angle) {
    const cosTheta = Math.cos(angle)
    const sinTheta = Math.sin(angle)

    const xPrime = x * cosTheta - y * sinTheta
    const yPrime = x * sinTheta + y * cosTheta

    return [xPrime, yPrime]
  }

  #randomizeRotationMethod = () => {
    const RotationMethodLength = Object.entries(rotationMethod).length
    this.#decision = Math.floor(Math.random() * RotationMethodLength)
  }

  #rotateCube = (cubeX, cubeY, cubeZ) => {
    const cameraDistance = 50

    switch (this.#decision) {
      case rotationMethod.COMBINED:
        return [
          this.#combinedRotateX(cubeX, cubeY, cubeZ),
          this.#combinedRotateY(cubeX, cubeY, cubeZ),
          this.#combinedRotateZ(cubeX, cubeY, cubeZ) + cameraDistance
        ]
      case rotationMethod.SINGLE:
        ;[cubeX, cubeY, cubeZ] = this.#rotateSingleX({
          cubeX,
          cubeY,
          cubeZ
        })
        ;[cubeX, cubeY, cubeZ] = this.#rotateSingleY({
          cubeX,
          cubeY,
          cubeZ
        })
        ;[cubeX, cubeY, cubeZ] = this.#rotateSingleZ({
          cubeX,
          cubeY,
          cubeZ
        })

        return [cubeX, cubeY, cubeZ + cameraDistance]
      case rotationMethod.ANOTHER:
        return [
          this.#anotherRotX(cubeX, cubeY, cubeZ),
          this.#anotherRotY(cubeX, cubeY, cubeZ),
          this.#anotherRotZ(cubeX, cubeY, cubeZ) + cameraDistance
        ]
      case rotationMethod.TWO_DIMENSION:
        // Note: rotAngleX, rotAngleY, and rotAngleZ can be any real number.
        // If the rotation only needs to be done in the x and y axes,
        // it can be accomplished using a 2D rotation.
        return [
          ...this.#rotateVector2D(cubeX, cubeY, this.#rotAngleX),
          cubeZ + cameraDistance
        ]
      default:
        throw new Error('Invalid transformation method')
    }
  }

  async #transformAndProjectPoint (cubeX, cubeY, cubeZ, ch, counter) {
    counter.value++
    // Draw only on every fifth iteration
    // This creates a gap between points, making each point easier to see
    if (counter.value % 5 !== 0) return
    // this.#randomizeRotationMethod()

    const [transformedX, transformedY, transformedZ] = this.#rotateCube(
      cubeX,
      cubeY,
      cubeZ
    )

    // Choose between a 3D cube with perspective depth (using inverseDepth)
    // and a flat 2D projection (without using inverseDepth)
    const [scale, inverseDepth] = this.#depth
      ? [400.0, 1 / transformedZ]
      : [12, 1.0]

    const projectedX = inverseDepth * scale * transformedX
    const projectedY = inverseDepth * scale * transformedY

    // add a small offset to the projected
    // point to avoid drawing on the edge of the canvas
    const screenX = Math.floor(projectedX + CENTERX)
    const screenY = Math.floor(projectedY + CENTERY)

    CanvasMode.drawCanvasPoint(
      screenX,
      screenY,
      counter,
      Cube.#colors,
      ch,
      this.#alterStyle
    )

    CanvasMode.drawSvgPoint(screenX, screenY)

    // Avoid drawing points that are behind the cube. However, since there are gaps,
    // this depth check may result in an undesirable visual effect.
    const bufferIndex = screenX + screenY * SCREENWIDTH
    const isCloserToCamera = inverseDepth > this.#depthBuffer[bufferIndex]
    if (isCloserToCamera) {
      this.#depthBuffer[bufferIndex] = inverseDepth
      CanvasMode.drawCanvasPoint(
        screenX,
        screenY,
        counter,
        Cube.#colors,
        ch,
        this.#alterStyle
      )

      CanvasMode.drawSvgPoint(screenX, screenY)
    }

    // await this.#sleep(25)
  }

  // Iterate through the volume of the cube.
  // If the cube has solid faces, doing this is a waste
  // because the user will never see the inside of the cube.
  #threeDimension () {
    return async (cubeX, cubeY) => {
      for (let cubeZ = this.#startCube; cubeZ <= this.#cubeSize; cubeZ++) {
        await this.#transformAndProjectPoint(
          this.#faces.front(cubeX, cubeY, cubeZ).x,
          this.#faces.front(cubeX, cubeY, cubeZ).y,
          this.#faces.front(cubeX, cubeY, cubeZ).z,
          '.',
          this.#counterAtSymbol
        )
      }
    }
  }

  // Iterate over the six faces of the cube. Each face is a square,
  // so this involves an NxN loop for each face.
  // The NxN loop covers all points on each face of the cube.
  #twoDimension () {
    return async (cubeX, cubeY) => {
      await this.#transformAndProjectPoint(
        this.#faces.front(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.front(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.front(cubeX, cubeY, this.#cubeSize).z,
        '@',
        this.#counterAtSymbol
      )
      await this.#transformAndProjectPoint(
        this.#faces.right(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.right(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.right(cubeX, cubeY, this.#cubeSize).z,
        '$',
        this.#counterDollarSymbol
      )
      await this.#transformAndProjectPoint(
        this.#faces.left(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.left(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.left(cubeX, cubeY, this.#cubeSize).z,
        '~',
        this.#counterTildeSymbol
      )
      await this.#transformAndProjectPoint(
        this.#faces.back(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.back(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.back(cubeX, cubeY, this.#cubeSize).z,
        '#',
        this.#counterHashSymbol
      )
      await this.#transformAndProjectPoint(
        this.#faces.bottom(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.bottom(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.bottom(cubeX, cubeY, this.#cubeSize).z,
        ';',
        this.#counterSemicolonSymbol
      )
      await this.#transformAndProjectPoint(
        this.#faces.top(cubeX, cubeY, this.#cubeSize).x,
        this.#faces.top(cubeX, cubeY, this.#cubeSize).y,
        this.#faces.top(cubeX, cubeY, this.#cubeSize).z,
        '+',
        this.#counterPlusSymbol
      )
    }
  }

  async transformAndProjectCube (iterate3D) {
    this.#depthBuffer.fill(0)
    // this.#randomizeRotationMethod()

    CanvasMode.createCubeSvg()

    for (let cubeX = this.#startCube; cubeX <= this.#cubeSize; cubeX++) {
      for (let cubeY = this.#startCube; cubeY <= this.#cubeSize; cubeY++) {
        if (iterate3D) {
          await this.#threeDimension()(cubeX, cubeY)
        } else {
          await this.#twoDimension()(cubeX, cubeY)
        }
      }
    }

    CanvasMode.appendCubeSvg()

    /*
    The trigonometry functions in JavaScript, as in most programming languages,
    is designed to work with any real number because trigonometry functions are
    defined for all real numbers. (−∞,∞)

    In 3D rotations these angles determines how far around a specified axis (X,Y,Z)
    the point should be rotated.

    It represents the static measure of how much rotation is applied.
    */
    this.#rotAngleX += 0.05
    this.#rotAngleY += this.degreesToRadians(1.2)
    this.#rotAngleZ += 0.03

    // avoid blind effect because of the last state
    this.#counterAtSymbol.value = 0
    this.#counterDollarSymbol.value = 0
    this.#counterTildeSymbol.value = 0
    this.#counterHashSymbol.value = 0
    this.#counterSemicolonSymbol.value = 0
    this.#counterPlusSymbol.value = 0
  }
}
