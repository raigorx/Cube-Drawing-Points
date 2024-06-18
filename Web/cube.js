export class Cube {
  constructor (startCube, faces, size, alterStyle, depth) {
    this.#startCube = startCube
    this.#faces = faces
    this.#cubeSize = size
    this.#alterStyle = alterStyle
    this.#depth = depth
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

  #depth = true
  #alterStyle
  #cubeSize
  #startCube
  #faces
  #rotationX = 0
  #rotationY = 0
  #rotationZ = 0
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

  #rotateX (x, y, z) {
    return (
      x * Math.cos(this.#rotationY) * Math.cos(this.#rotationZ) +
      y *
        (Math.sin(this.#rotationX) *
          Math.sin(this.#rotationY) *
          Math.cos(this.#rotationZ) +
          Math.cos(this.#rotationX) * Math.sin(this.#rotationZ)) +
      z *
        (Math.sin(this.#rotationX) * Math.sin(this.#rotationZ) -
          Math.cos(this.#rotationX) *
            Math.sin(this.#rotationY) *
            Math.cos(this.#rotationZ))
    )
  }

  #rotateY (x, y, z) {
    return (
      -x * Math.cos(this.#rotationY) * Math.sin(this.#rotationZ) +
      y *
        (Math.cos(this.#rotationX) * Math.cos(this.#rotationZ) -
          Math.sin(this.#rotationX) *
            Math.sin(this.#rotationY) *
            Math.sin(this.#rotationZ)) +
      z *
        (Math.cos(this.#rotationX) *
          Math.sin(this.#rotationY) *
          Math.sin(this.#rotationZ) +
          Math.sin(this.#rotationX) * Math.cos(this.#rotationZ))
    )
  }

  #rotateZ (x, y, z) {
    return (
      x * Math.sin(this.#rotationY) -
      y * Math.sin(this.#rotationX) * Math.cos(this.#rotationY) +
      z * Math.cos(this.#rotationX) * Math.cos(this.#rotationY)
    )
  }

  async #transformAndProjectPoint (cubeX, cubeY, cubeZ, ch, counter) {
    counter.value++
    // Draw only on every fifth iteration
    // This creates a gap between points, making each point easier to see
    if (counter.value % 5 !== 0) return

    const transformedX = this.#rotateX(cubeX, cubeY, cubeZ)
    const transformedY = this.#rotateY(cubeX, cubeY, cubeZ)
    const transformedZ =
      this.#rotateZ(cubeX, cubeY, cubeZ) + { cameraDistance: 50 }.cameraDistance

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

    ctx.font = '12px Arial'
    // Choose color based on counter
    // We can't use the same formula as above because it would always match the same index
    const colorIndex = Math.floor(counter.value / 6) % 2
    ctx.fillStyle = Cube.#colors[ch][colorIndex]

    if (this.#alterStyle) {
      const pointSize = 20
      ctx.fillRect(screenX, screenY, pointSize, pointSize)
    } else {
      ctx.fillText(ch, screenX, screenY)
    }

    // Avoid drawing points that are behind the cube. However, since there are gaps,
    // this depth check may result in an undesirable visual effect.
    // const bufferIndex = screenX + screenY * SCREENWIDTH
    // const isCloserToCamera = inverseDepth > this.#depthBuffer[bufferIndex]
    // if (isCloserToCamera) {
    //   this.#depthBuffer[bufferIndex] = inverseDepth
    //   if (this.#alterStyle) {
    //     const pointSize = 30
    //     ctx.fillRect(screenX, screenY, pointSize, pointSize)
    //   } else {
    //     ctx.fillText(ch, screenX, screenY)
    //   }
    // }

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
    for (let cubeX = this.#startCube; cubeX <= this.#cubeSize; cubeX++) {
      for (let cubeY = this.#startCube; cubeY <= this.#cubeSize; cubeY++) {
        if (iterate3D) {
          await this.#threeDimension()(cubeX, cubeY)
        } else {
          await this.#twoDimension()(cubeX, cubeY)
        }
      }
    }
    this.#rotationX += 0.01
    this.#rotationY += 0.01
    this.#rotationZ += 0.001
    // avoid blind effect because of the last state
    this.#counterAtSymbol.value = 0
    this.#counterDollarSymbol.value = 0
    this.#counterTildeSymbol.value = 0
    this.#counterHashSymbol.value = 0
    this.#counterSemicolonSymbol.value = 0
    this.#counterPlusSymbol.value = 0
  }
}
