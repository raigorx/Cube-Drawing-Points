import { Cube } from './cube.js'

window.ctx = canvas.getContext('2d')
window.SCREENWIDTH = canvas.width
window.SCREENHEIGHT = canvas.height
window.SCREENSIZE = SCREENWIDTH * SCREENHEIGHT
window.CENTERX = SCREENWIDTH / 2
window.CENTERY = SCREENHEIGHT / 2

async function drawCube () {
  ctx.clearRect(0, 0, SCREENWIDTH, SCREENHEIGHT)

  await normalCube.transformAndProjectCube(false)
  // await noZeroVector.transformAndProjectCube(false)
  // await shiftCoordinates.transformAndProjectCube(false)
  // await dissamble.transformAndProjectCube(false)
  // await noCenterPivot.transformAndProjectCube(false)
}

/*
Cube faces
                   (0, 20, 0)
                      +----------+
                     /         / |
                    /         /  |
                   /         /   |
        (-20, 0, 0)+--------+   +(20, 0, 0)
                  |         |  /
                  |         | /
                  |         |/
                  +---------+
               (0, -20, 0)
*/
/*
Face zero (Front face):  (0, 0, -20) towards the negative Z-axis.
Face one (Right face):   (20, 0, 0) towards the positive X-axis.
Face two (Left face):    (-20, 0, 0) towards the negative X-axis.
Face three (Back face):  (0, 0, 20) towards the positive Z-axis.
Face four (Bottom face): (0, -20, 0) towards the negative Y-axis.
Face five (Top face):    (0, 20, 0) towards the positive Y-axis.
*/
// cubeSize is always constant and determines the size of each face.
// Each face has one of its coordinates fixed. For example, the top face always
// has its y-coordinate unchanged.
// The cube spans 40 units in each dimension [-20, 20].
const normalCube = new Cube(
  -20,
  {
    back: (cubeX, cubeY, cubeSize) => ({ x: -cubeX, y: cubeY, z: cubeSize }),
    front: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeY, z: -cubeSize }),
    right: (cubeX, cubeY, cubeSize) => ({ x: cubeSize, y: cubeY, z: cubeX }),
    left: (cubeX, cubeY, cubeSize) => ({ x: -cubeSize, y: cubeY, z: -cubeX }),
    top: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeSize, z: cubeY }),
    bottom: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: -cubeSize, z: -cubeY })
  },
  20,
  false,
  true
)

// Because there is no zero vector in this coordinate system,
// the rotation calculations are incorrect. The lack of a zero vector
// means that rotations are not centered properly, leading to unexpected results.
const noZeroVector = (() => {
  const minRange = 10
  const maxRange = 50

  return new Cube(
    minRange,
    {
      back: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeY, z: cubeSize }),
      front: (cubeX, cubeY) => ({ x: cubeX, y: cubeY, z: minRange }),
      right: (cubeX, cubeY, cubeSize) => ({ x: cubeSize, y: cubeY, z: cubeX }),
      left: (cubeX, cubeY) => ({ x: minRange, y: cubeY, z: cubeX }),
      top: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeSize, z: cubeY }),
      bottom: (cubeX, cubeY) => ({ x: cubeX, y: minRange, z: cubeY })
    },
    maxRange,
    false,
    true
  )
})()

// Shift the faces away from the origin to make the cube look disassembled.
// Each face is moved along its respective axis by an offset.
const dissamble = new Cube(
  -20,
  {
    back: (cubeX, cubeY, cubeSize) => ({
      x: -cubeX,
      y: cubeY,
      z: cubeSize + 10
    }),
    front: (cubeX, cubeY, cubeSize) => ({
      x: cubeX,
      y: cubeY,
      z: -cubeSize - 10
    }),
    right: (cubeX, cubeY, cubeSize) => ({
      x: cubeSize + 10,
      y: cubeY,
      z: cubeX
    }),
    left: (cubeX, cubeY, cubeSize) => ({
      x: -cubeSize - 10,
      y: cubeY,
      z: -cubeX
    }),
    top: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeSize + 2, z: cubeY }),
    bottom: (cubeX, cubeY, cubeSize) => ({
      x: cubeX,
      y: -cubeSize - 10,
      z: -cubeY
    })
  },
  20,
  false,
  true
)

// The range [0, 20] represents 20 units, making this cube smaller than the normalCube,
// which spans 40 units in each dimension.
// This cube's origin (0, 0, 0) is at one of its vertices instead of the center.
// It will rotate using this vertex as the pivot, causing it to both translate and rotate.
const noCenterPivot = new Cube(
  0,
  {
    back: (cubeX, cubeY, cubeSize) => ({
      x: cubeSize - cubeX,
      y: cubeY,
      z: cubeSize
    }),
    front: (cubeX, cubeY) => ({ x: cubeX, y: cubeY, z: 0 }),
    right: (cubeX, cubeY, cubeSize) => ({ x: cubeSize, y: cubeY, z: cubeX }),
    left: (cubeX, cubeY, cubeSize) => ({ x: 0, y: cubeY, z: cubeSize - cubeX }),
    top: (cubeX, cubeY, cubeSize) => ({ x: cubeX, y: cubeSize, z: cubeY }),
    bottom: (cubeX, cubeY, cubeSize) => ({
      x: cubeX,
      y: 0,
      z: cubeSize - cubeY
    })
  },
  20,
  false,
  true
)

/*
  To re-center the cube around the origin, you need to adjust the coordinates
  by subtracting cubeSize / 2 from each coordinate.
  This, combined with a normal loop, creates a cube inside a cube because both have
  the origin (0,0,0) as the center, but one is larger than the other.
*/
const shiftCoordinates = new Cube(
  0,
  {
    back: (cubeX, cubeY, cubeSize) => ({
      x: -(cubeX - cubeSize / 2),
      y: cubeY - cubeSize / 2,
      z: cubeSize / 2
    }),
    front: (cubeX, cubeY, cubeSize) => ({
      x: cubeX - cubeSize / 2,
      y: cubeY - cubeSize / 2,
      z: -cubeSize / 2
    }),
    right: (cubeX, cubeY, cubeSize) => ({
      x: cubeSize / 2,
      y: cubeY - cubeSize / 2,
      z: cubeX - cubeSize / 2
    }),
    left: (cubeX, cubeY, cubeSize) => ({
      x: -cubeSize / 2,
      y: cubeY - cubeSize / 2,
      z: -(cubeX - cubeSize / 2)
    }),
    top: (cubeX, cubeY, cubeSize) => ({
      x: cubeX - cubeSize / 2,
      y: cubeSize / 2,
      z: cubeY - cubeSize / 2
    }),
    bottom: (cubeX, cubeY, cubeSize) => ({
      x: cubeX - cubeSize / 2,
      y: -cubeSize / 2,
      z: -(cubeY - cubeSize / 2)
    })
  },
  20,
  false,
  true
)

const fps = 30
const interval = 1000 / fps
let lastTime = 0
async function animate (timestamp) {
  const deltaTime = timestamp - lastTime
  if (deltaTime > interval) {
    await drawCube()
    lastTime = timestamp
  }
  requestAnimationFrame(animate)
  // await drawCube()
}

animate()
