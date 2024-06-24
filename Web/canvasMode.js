export class CanvasMode {
  static #svgNS = 'http://www.w3.org/2000/svg'
  static #svgAsCanvasEl = document.getElementById('svgAsCanvas')
  static #screenCanvas
  static #svgAsCanvas
  static #canvasMode
  static #useCanvas
  static #useSvgCanvas
  static #svgCube

  static initialize (screenCanvas, svgAsCanvas) {
    CanvasMode.#screenCanvas = screenCanvas << 0
    CanvasMode.#svgAsCanvas = svgAsCanvas << 1

    CanvasMode.#canvasMode = this.#screenCanvas | this.#svgAsCanvas
    CanvasMode.#useCanvas = this.#canvasMode & this.#screenCanvas
    CanvasMode.#useSvgCanvas = this.#canvasMode & this.#svgAsCanvas

    if (CanvasMode.#useSvgCanvas)
      CanvasMode.#svgAsCanvasEl.style.display = 'block'
    if (CanvasMode.#useCanvas) canvas.style.display = 'block'
  }

  static clearCanvas () {
    if (CanvasMode.#useCanvas) ctx.clearRect(0, 0, SCREENWIDTH, SCREENHEIGHT)

    if (CanvasMode.#useSvgCanvas)
      document.getElementById('svgAsCanvas').innerHTML = ''
  }

  static createCubeSvg () {
    if (!CanvasMode.#useSvgCanvas) return
    CanvasMode.#svgCube = document.createElementNS(CanvasMode.#svgNS, 'g')
  }

  static appendCubeSvg () {
    if (!CanvasMode.#useSvgCanvas) return
    CanvasMode.#svgAsCanvasEl.appendChild(CanvasMode.#svgCube)
  }

  static drawSvgPoint (screenX, screenY) {
    if (!CanvasMode.#useSvgCanvas) return

    let svgNS = 'http://www.w3.org/2000/svg'
    let circle = document.createElementNS(svgNS, 'circle')

    circle.setAttribute('cx', screenX)
    circle.setAttribute('cy', screenY)
    circle.setAttribute('r', '2')
    circle.setAttribute('style', 'fill:#FFF;stroke:none;')

    // Append the circle to the new SVG element
    CanvasMode.#svgCube.appendChild(circle)
  }

  static drawCanvasPoint (screenX, screenY, counter, colors, ch, alterStyle) {
    if (!CanvasMode.#useCanvas) return

    ctx.font = '12px Arial'
    // Choose color based on counter
    // We can't use the same formula as above because it would always match the same index
    const colorIndex = Math.floor(counter.value / 6) % 2
    ctx.fillStyle = colors[ch][colorIndex]

    if (alterStyle) {
      const pointSize = 20
      ctx.fillRect(screenX, screenY, pointSize, pointSize)
    } else ctx.fillText(ch, screenX, screenY)
  }
}
