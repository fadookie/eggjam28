import type * as p5 from "p5";

const canvasSize = 800;
const graphicsScaleFactor = 0.1;
// const defaultStrokeWeight = 1;

let g: p5.Graphics;

let snapToPixel = true;
let traceMode = true;
let alwaysDraw = false;
let colorCycle = true;
let sizeCycle = true;
let drawOutline = false;
let backgroundColor: p5.Color;
let brushSize = 1;
let currentHue = 0;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preload() {
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
     currentHue = (millis() * 0.0001 ) % 1; 
  }
  // background(hue, 1,1);
  g.fill(currentHue, 1, 1);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Tool: Glitchy mosiac blend effect I made by accident
 */
function mosaicShift() {
  g.loadPixels();
  push();
  for (let i = 0; i < g.pixels.length; i += 4) {
    const rd = g.pixels[i];
    const gr = g.pixels[i + 1];
    const bl = g.pixels[i + 2];
    const al = g.pixels[i + 3];
    if (rd === undefined || gr === undefined || bl === undefined || al === undefined) continue;

    colorMode(RGB, 255);
    const c = color(rd, gr, bl, al);

    colorMode(HSB, 1);
    let h = hue(c);
    const s = saturation(c);
    const b = brightness(c);
    const a = alpha(c);
    h = wrap(1, h + 0.1);
    const c2 = color(h, s, b, a);

    g.pixels[i] = red(c2);
    g.pixels[i + 1] = green(c2);
    g.pixels[i + 2] = blue(c2);
    g.pixels[i + 3] = alpha(c2);
  }
  pop();
  g.updatePixels();
}

const bands = [3, 5, 6, 7, 8, 9] as const;
let currentBandIndex = 0;
/**
 * Tool: Glitchy band/checkerboard blend effect I made partially by accident
 */
function glitchBands() {
  g.loadPixels();
  const currentBand = bands[currentBandIndex];
  if (currentBand === undefined) throw new Error(`Undefined band at index:${currentBandIndex}`);
  console.log(`glitchBands currentBandIndex:${currentBandIndex} currentBand:${currentBand}`);
  for (let i = 0; i < g.pixels.length; i += currentBand) {
    // if (i % 3 === 0) continue; // testing, trying to skip alpha channel
    g.pixels[i]! = 128;
  }
  g.updatePixels();
  currentBandIndex = (currentBandIndex + 1) % bands.length;
}


/**
 * Tool: Shift hue of all pixels
 * TODO: Fix this
 */
function hueShift() {
  g.loadPixels();
  push();
  for (let i = 0; i < g.pixels.length; i += 4) {
    const rd = g.pixels[i];
    const gr = g.pixels[i + 1];
    const bl = g.pixels[i + 2];
    const al = g.pixels[i + 3];
    if (rd === undefined || gr === undefined || bl === undefined || al === undefined) continue;

    colorMode(RGB, 255);
    const c = color(rd, gr, bl, al);

    colorMode(HSB, 1);
    let h = hue(c);
    const s = saturation(c);
    const b = brightness(c);
    const a = alpha(c);
    h = wrap(1, h + 0.1);
    const c2 = color(h, s, b, a);

    g.pixels[i] = red(c2);
    g.pixels[i + 1] = green(c2);
    g.pixels[i + 2] = blue(c2);
    g.pixels[i + 3] = alpha(c2);
  }
  pop();
  g.updatePixels();
}

/**
 * Tool: sort pixels by brightness
 */
function pixelSort() {
  g.loadPixels();
  // Pixels array is sequential sets of 4 integers for RGBA respectively. Split into 2D array of chunks.
  const pixelsChunked = chunkArray(g.pixels, 4);
  // Sort pixels by brightness
  pixelsChunked.sort((pixelA, pixelB) => brightness(pixelA) - brightness(pixelB));
  // pixelsChunked.reverse();
  (g.pixels as unknown as Uint8ClampedArray).set(new Uint8ClampedArray(pixelsChunked.flat()));
  g.updatePixels();
}

/**
 * Tool: reverse pixel positions and RGBA channels
 */
function reversePixels() {
  g.loadPixels();
  g.pixels.reverse();
  g.updatePixels();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mouseClicked() {
}

enum KeyConf {
  SaveCanvas = 'w',
  ResetSketch = 'r',
  SnapToPixel = 'p',
  ColorCycle = 'c',
  SizeCycle = 's',
  DrawOutline = 'o',
  AlwaysDraw = 'a',
  TraceMode = 't',
  HueShift = 'h',
  PixelSort = 'z',
  ReversePixels = 'v',
  MoasicShift = 'm',
  GlitchBands = 'b',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function keyPressed() {
  const keyConf = key as KeyConf;

  // For now, bail on unknown keybinds
  if (!Object.values(KeyConf).includes(keyConf)) return;

  switch(keyConf) {
    case KeyConf.SaveCanvas: {
      saveCanvas(`worse-artist_${Date.now()}.png`);
      break;
    }
    case KeyConf.ResetSketch: {
      console.log('reset sketch');
      resetSketch();
      break;
    }
    case KeyConf.SnapToPixel: {
      snapToPixel = !snapToPixel;
      break;
    }
    case KeyConf.ColorCycle: {
      colorCycle = !colorCycle;
      break;
    }
    case KeyConf.SizeCycle: {
      sizeCycle = !sizeCycle;
      break;
    }
    case KeyConf.DrawOutline: {
      drawOutline = !drawOutline;
      break;
    }
    case KeyConf.AlwaysDraw: {
      alwaysDraw = !alwaysDraw;
      break;
    }
    case KeyConf.TraceMode: {
      traceMode = !traceMode;
      break;
    }
    case KeyConf.HueShift: {
      hueShift();
      break;
    }
    case KeyConf.PixelSort: {
      pixelSort();
      break;
    }
    case KeyConf.ReversePixels: {
      reversePixels();
      break;
    }
    case KeyConf.MoasicShift: {
      mosaicShift();
      break;
    }
    case KeyConf.GlitchBands: {
      glitchBands();
      break;
    }
    default:
      throw keyConf satisfies never;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const newHue = wrap(1, currentHue + sizeDelta);
    // console.log(`hue change event.delta:${event.delta} sizeDelta:${sizeDelta} hue:${hue} newHue:${newHue}`);
    currentHue = newHue;
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
