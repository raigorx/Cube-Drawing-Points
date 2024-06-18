#include <assert.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>
#include <wchar.h>
#include <stdlib.h>

#define USE_COMBINED_ROTATION
#define PRINT_SCREEN_LINE
#define DEPTH

//  #define ORIGINAL_POSITION

enum {
  SCREENWIDTH = 140,
  SCREENHEIGHT = 44,
  SCREENSIZE = SCREENWIDTH * SCREENHEIGHT,
  HALF_SCREEN_X = SCREENWIDTH / 2,
  HALF_SCREEN_Y = SCREENHEIGHT / 2,
  GREEN = 32
};

double rotationX, rotationY, rotationZ;
wchar_t screenBuffer[SCREENSIZE];
double depthBuffer[SCREENSIZE];

/*
Applying the Rotation
---------------------
To rotate a vector (x, y, z), we multiply it by the combined rotation matrix.

The transformation can be applied in two ways:
1. (x, y, z) * R_combined
2. (x, y, z) * R_x(A) * R_y(B) * R_z(C)
Both methods will yield the same result.

Let:
A = rotationX
B = rotationY
C = rotationZ

R_x(A) = [ 1, 0,      0       ]
         [ 0, cos(A), -sin(A) ]
         [ 0, sin(A),  cos(A) ]

R_y(B) = [ cos(B),  0, sin(B) ]
         [ 0,       1, 0      ]
         [ -sin(B), 0, cos(B) ]


R_z(C) = [ cos(C), -sin(C), 0 ]
         [ sin(C),  cos(C), 0 ]
         [ 0,      0,       1 ]

R_combined = R_x(A) * R_y(B) * R_z(C)
[
[
[
  cos(B)cos(C)
  sin(A)sin(B)cos(C) + cos(A)sin(C)
  sin(A)sin(C) - cos(A)sin(B)cos(C)

  -cos(B)sin(C)
  cos(A)cos(C) - sin(A)sin(B)sin(C)
  cos(A)sin(B)sin(C) + sin(A)cos(C)

  sin(B)
  -sin(A)cos(B)
  cos(A)cos(B)
]
]
]

(x,y,z) * R_combined =
rotateX = [
  x*cos(B)*cos(C) +
  y*(sin(A)*sin(B)*cos(C) + cos(A)*sin(C)) +
  z*(sin(A)*sin(C) - cos(A)*sin(B)*cos(C))
]
rotateY = [
  -x*cos(B)*sin(C) +
  y*(cos(A)*cos(C) - sin(A)*sin(B)*sin(C)) +
  z*(cos(A)*sin(B)*sin(C) + sin(A)*cos(C))
]
rotateZ = [
  x*sin(B) - y*sin(A)*cos(B) +
  z*cos(A)*cos(B)
]

(x, y, z) * R_x(A) * R_y(B) * R_z(C) =
rotateX = [
cos(C)*(x*cos(B) - sin(B)*(z*cos(A) - y*sin(A))) + sin(C)*(y*cos(A) + z*sin(A))
]
rotateY = [
cos(C)*(y*cos(A) + z*sin(A)) - sin(C)*(x*cos(B) - sin(B)*(z*cos(A) - y*sin(A)))
]
rotateZ = [
x*sin(B) + cos(B)*(z*cos(A) - y*sin(A))
]
*/

#ifdef USE_COMBINED_ROTATION
double rotateX(double x, double y, double z) {
  return x * cos(rotationY) * cos(rotationZ) +
         y * (sin(rotationX) * sin(rotationY) * cos(rotationZ) + cos(rotationX) * sin(rotationZ)) +
         z * (sin(rotationX) * sin(rotationZ) - cos(rotationX) * sin(rotationY) * cos(rotationZ));
  ;
}

double rotateY(double x, double y, double z) {
  return -x * cos(rotationY) * sin(rotationZ) +
         y * (cos(rotationX) * cos(rotationZ) - sin(rotationX) * sin(rotationY) * sin(rotationZ)) +
         z * (cos(rotationX) * sin(rotationY) * sin(rotationZ) + sin(rotationX) * cos(rotationZ));
}

double rotateZ(double x, double y, double z) {
  return x * sin(rotationY) - y * sin(rotationX) * cos(rotationY) +
         z * cos(rotationX) * cos(rotationY);
}
#else
double rotateX(double x, double y, double z) {
  return cos(rotationZ) *
             (x * cos(rotationY) - sin(rotationY) * (z * cos(rotationX) - y * sin(rotationX))) +
         sin(rotationZ) * (y * cos(rotationX) + z * sin(rotationX));
}

double rotateY(double x, double y, double z) {
  return cos(rotationZ) * (y * cos(rotationX) + z * sin(rotationX)) -
         sin(rotationZ) *
             (x * cos(rotationY) - sin(rotationY) * (z * cos(rotationX) - y * sin(rotationX)));
}

double rotateZ(double x, double y, double z) {
  return x * sin(rotationY) + cos(rotationY) * (z * cos(rotationX) - y * sin(rotationX));
}
#endif

void transformAndProjectPoint(int cubeX, int cubeY, int cubeZ, wchar_t ch) {
  /*
    cameraDistance is in the magnitude of the cube's coordinate system, which
    ranges from [-20, 20]. Its purpose is to make Z larger. By doing so, it
    enhances the depth effect, making objects appear farther away from
    the camera when the inverse depth calculation is applied.
  */
  static const int cameraDistance = 100;

  /*
  https://en.wikipedia.org//wiki/Rotation_matrix
  Since matrix multiplication has no effect on the zero vector (the coordinates
  of the origin) rotation matrices describe rotations about the origin.

  If you want to rotate a point around a center (cx,cy,cz) that is not the
  origin directly applying the rotation matrix will yield incorrect results
  because the rotation matrix does not account for the shift in the center.

  Being (cx,cy,cz) the center for example a center in (1,1,1)
  To correctly rotate a point around a center (cx,cy,cz), you need to:

  Translate the point (x,y,z) to the new coordinates
  relative to the center (cx,cy,cz):
  (x',y',z') = (x-1,y-1,z-1)

  Rotate the translated point (x',y',z') using the rotation matrix:
  (x'',y'',z'') = (x-1,y-1,z-1) * Rotation matrix

  The result is that the cube is no longer centered at (1,1,1) but instead at (0,0,0),
  which effectively shifts the cube to the top-left corner.

  */
  const double transformedX = rotateX(cubeX, cubeY, cubeZ);
  const double transformedY = rotateY(cubeX, cubeY, cubeZ);
  const double transformedZ = rotateZ(cubeX, cubeY, cubeZ) + cameraDistance;

  //  Due to the line height of the font, the cube will appear taller than its
  //  width. To make it look more proportionate, we increase the width.
  //  Typically, terminal characters are about twice as tall as they are wide
  static const double aspectRatioAdjust = 2.0;

  /*
  By taking the reciprocal of the Z axis, objects that are farther away
  have smaller inverseDepth values, and objects that are closer have larger
  inverseDepth values.
  */
  const double inverseDepth = 1 / transformedZ;

  /*
  These three forms represent the same value:
  Fraction: 1/2
  Percentage: 50%
  Decimal: 0.5

  When you multiply a number by a decimal, you are taking a fraction of that number.
  Multiplying by a decimal is equivalent to dividing by the reciprocal of that decimal.
  10 * 0.5 = 5
  10/2 = 5
  Both operations give the same result.
  Thus, multiplying by a decimal is the same as dividing
  When you multiply by a decimal, you are scaling down the number.
  In this case, it means that the point's coordinates are reduced,
  making the cube appear smaller in size.

  Points further from the camera (smaller inverseDepth)
  are scaled down, creating the illusion of depth.
  This projection step converts the 3D coordinates into 2D coordinates
  making them ready to be mapped onto the screen.
  Due to terminal visual limitations, the depth effect is not visible.
  */
#ifdef DEPTH
  static const double scale = 40.0;
  const double projectedX = inverseDepth * scale * transformedX * aspectRatioAdjust;
  const double projectedY = inverseDepth * scale * transformedY;
#else
  static const double scale = 0.5;
  const double projectedX = scale * transformedX * aspectRatioAdjust;
  const double projectedY = scale * transformedY;
#endif

#ifdef ORIGINAL_POSITION
  //  remember the cube starts in the range [-20, 20]
  //  top left screen is (0,0) so that will be its center
  //  half of the cube will be (10,10) and the other half will be (-10,-10)
  const int screenX = (int)((projectedX));
  const int screenY = (int)((projectedY));
#else
  //  Shift the cube to the center. Note that the cube's coordinates start in the range [-20, 20].
  //  Adding to these coordinates will shift them to approximately [50, 42], which is not exactly
  //  the center but close enough for practical purposes.
  const int screenX = (int)((projectedX + HALF_SCREEN_X));
  const int screenY = (int)((projectedY + HALF_SCREEN_Y));
#endif

  const bool isOutScreen =
      screenX < 0 || screenX >= SCREENWIDTH || screenY < 0 || screenY >= SCREENHEIGHT;
  if (isOutScreen) return;  //  Skip points outside the screen

  /*
    convert the 2D screen coordinates (screenX, screenY) to a 1D array index
  */
  const int bufferIndex = screenX + (screenY * SCREENWIDTH);
  //  screenBuffer[bufferIndex] = ch;

  /*
    Without the depth buffer:
    the render order of the face affect how will looks
    Hidden surfaces may incorrectly overwrite visible ones.

    Larger inverseDepth means the point is closer to the camera
    Smaller inverseDepth means the point is further from the camera

    another effect is that avoid to draw the same point twice that means
    a perfomance improvement
  */
  const bool isCloserToCamera = inverseDepth > depthBuffer[bufferIndex];
  if (isCloserToCamera) {
    depthBuffer[bufferIndex] = inverseDepth;
    screenBuffer[bufferIndex] = ch;
  }
}

void drawCharacter(int x, int y, wchar_t character, int color) {
  //  ANSI escape code to set the cursor position
  wprintf(L"\033[%d;%dH", y + 1, x + 1);  //  ANSI coordinates are 1-based
  //  ANSI escape code to set text color
  wprintf(L"\033[%dm", color);
  putwchar(character);
  //  Reset the text attributes
  wprintf(L"\033[0m");
}

static inline bool isNotEndOfRow(int k) { return k % SCREENWIDTH; }

void print_screen_char() {
  for (int k = 0; k < SCREENSIZE; k++) {
    const int x = k % SCREENWIDTH;
    const int y = k / SCREENWIDTH;
    drawCharacter(x, y, isNotEndOfRow(k) ? screenBuffer[k] : '\n', GREEN);
  }
  rotationX += 0.05;
  rotationY += 0.05;
  rotationZ += 0.01;
}

void print_screen_line() {
  //  ANSI escape code move the cursor to the top-left corner
  wprintf(L"\033[H");
  for (int i = 0; i < SCREENHEIGHT; ++i) {
    //  Calculate the starting index of the current line
    int start_index = i * SCREENWIDTH;
    wprintf(L"%.*s", SCREENWIDTH, &screenBuffer[start_index]);
    //  Move cursor to the beginning of the next line
    wprintf(L"\033[E");
  }
  rotationX += 0.0015;
  rotationY += 0.0015;
  rotationZ += 0.0001;
}

int main() {
  static const wchar_t backgroundCharacter = ' ';
  static const int cubeSize = 20;
  while (true) {
    //  clear both buffer that mean clear screen
    wmemset(screenBuffer, backgroundCharacter, SCREENSIZE);
    memset(depthBuffer, 0, SCREENSIZE * sizeof(depthBuffer[0]));

    /*
    Outer Loop (cubeX): Iterates over the range of x-coordinates from
    -cubeSize to cubeSize.

    Inner Loop (cubeY): Iterates over the range of
    y-coordinates from -cubeSize to cubeSize.

    if you use cube < instead of cube <= you will miss one row of the cube.
    each face of a cube is a square, and a nested loop like this creates an NxN grid,
    which is exactlya square.
    */

    for (int cubeX = -cubeSize; cubeX <= cubeSize; cubeX++) {
      for (int cubeY = -cubeSize; cubeY <= cubeSize; cubeY++) {
        transformAndProjectPoint(cubeX, cubeY, -cubeSize, L'@');
        transformAndProjectPoint(cubeSize, cubeY, cubeX, L'$');
        transformAndProjectPoint(-cubeSize, cubeY, -cubeX, L'~');
        transformAndProjectPoint(-cubeX, cubeY, cubeSize, L'#');
        transformAndProjectPoint(cubeX, -cubeSize, -cubeY, L';');
        transformAndProjectPoint(cubeX, cubeSize, cubeY, L'+');
      }
    }

//  Draw the cube
#ifdef PRINT_SCREEN_LINE
    print_screen_line();
#else
    print_screen_char();
#endif
  }
  return EXIT_SUCCESS;
}
