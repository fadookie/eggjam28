import type * as p5 from "p5";

const canvasSize = 800;
const graphicsScaleFactor = 0.1;
const defaultStrokeWeight = 1;

let g: p5.Graphics;

let snapToPixel = true;
let traceMode = true;
let alwaysDraw = false;
let colorCycle = true;
let sizeCycle = true;
var drawOutline = false;
let backgroundColor: p5.Color;
let brushSize = 1;
let hue = 0;

function preload() {
}

function setup() {
  createCanvas(canvasSize, canvasSize);

  const graphicsSize = canvasSize * graphicsScaleFactor;
  g = createGraphics(graphicsSize, graphicsSize);

  resetSketch();
}

function resetSketch() {
  noSmooth();

  colorMode(HSB, 1);
  backgroundColor = color(0.75, 1);

  g.colorMode(HSB, 1);
  g.imageMode(CENTER);
  g.rectMode(CORNER);
  g.ellipseMode(RADIUS);
  g.textAlign(CENTER);
  g.noSmooth();

  // graphics.strokeWeight(defaultStrokeWeight);
  g.noStroke();

  // Even in trace mode, blank the background once
  g.background(backgroundColor);
}

function scaleToGraphicsSize(value: number): number {
  const scaledValue = value * graphicsScaleFactor;
  const ret = snapToPixel ? Math.round(scaledValue) : scaledValue;
  return ret;
}

function draw() {
  if (!traceMode) {
    g.background(backgroundColor);
  }

  if (drawOutline) {
    g.stroke('black');
  } else {
    g.noStroke();
  }
  if (colorCycle) {
     hue = (millis() * 0.0001 ) % 1; 
  }
  // background(hue, 1,1);
  g.fill(hue, 1, 1);
  if (sizeCycle) {
     brushSize = (sin(millis() / 1000) * 4) + 5; 
  }
  if (alwaysDraw || mouseIsPressed) {
    // Draw brush
    g.ellipse(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY), brushSize, brushSize);
  }

  // Test brush
  // graphics.rect(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY), 2, 1);

  // Draw graphics to main canvas, scaled up
  image(g, 0, 0, canvasSize, canvasSize);
}

function mapOptional<T, Result>(f: (arg0: T) => Result, x: T | undefined): Result | undefined;

function mapOptional<T, U, Result>(f: (arg0: T, arg1: U) => Result, x: T | undefined, y: U | undefined): Result | undefined;

function mapOptional(f: (...a: unknown[]) => unknown, ...args: unknown[]): unknown {
  if (args.some(x => x === undefined)) return undefined;
  return f(...args);
}

function chunkArray<T>(inputArray: T[], perChunk: number): T[][] {
  const result = inputArray.reduce((resultArray: T[][], item, index) => { 
    const chunkIndex = Math.floor(index / perChunk);

    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])
  return result;
}

function pixelSort() {
  console.log('pixelSort 1');
  g.loadPixels();
  // Pixels array is sequential sets of 4 integers for RGBA respectively. Split into 2D array of chunks.
  const pixelsChunked = chunkArray(g.pixels, 4);
  // Sort pixels by brightness
  pixelsChunked.sort((pixelA, pixelB) => brightness(pixelA) - brightness(pixelB));
  // pixelsChunked.reverse();
  // g.pixels.length = 0;
  // pixels is actually an Uint8ClampedArray but is typed incorrectly as number[] here
  (g.pixels as unknown as Uint8ClampedArray).set(new Uint8ClampedArray(pixelsChunked.flat()));
  //(g.pixels as unknown as ArrayBuffer).set(pixelsChunked.flat());
  // g.pixels.reverse();
  g.updatePixels();
  console.log('pixelSort END');
}

function mouseClicked() {
}

function keyPressed() {
  if (key === 'r') {
    // reset sketch
    console.log('reset sketch');
    resetSketch();
  } else if (key === 'p') {
    snapToPixel = !snapToPixel;
  } else if (key === 'c') {
    colorCycle = !colorCycle;
  } else if (key === 's') {
    sizeCycle = !sizeCycle;
  } else if (key === 'o') {
    drawOutline = !drawOutline;
  } else if (key === 'a') {
    alwaysDraw = !alwaysDraw;
  } else if (key === 't') {
    traceMode = !traceMode;
  } else if (key === 'w') {
    saveCanvas(`worse-artist_${Date.now()}.png`);
  } else if (key === 'z') {
    pixelSort();
  }
}

function mouseWheel(event: { delta: number }): boolean {
  // print(event.delta);
  if (keyIsDown(CONTROL)) {
    // Change brush size
    brushSize += event.delta * 0.01;
    brushSize = min(brushSize, 1);
    // console.log(`size change event.delta:${event.delta} scaled:${event.delta * 0.1} brushSize:${brushSize}`);
  } else {
    // Change hue
    const sizeDelta = event.delta * 0.001; // event.delta >=0 ? 0.01 : -0.01;
    const newHue = wrap(1, hue + sizeDelta);
    // console.log(`hue change event.delta:${event.delta} sizeDelta:${sizeDelta} hue:${hue} newHue:${newHue}`);
    hue = newHue;
  }
  //uncomment to block page scrolling
  return false;
}

// Wrap function which handles negative numbers correctly
function wrap(m: number, n: number): number {
  /*
  MIT License

Copyright (c) 2017 Brandon Semilla

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  */
  return n >= 0 ? n % m : (n % m + m) % m
}
