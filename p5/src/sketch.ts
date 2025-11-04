import type * as p5 from "p5";

const canvasSize = 800;
const graphicsScaleFactor = 0.1;
const graphicsSize = canvasSize * graphicsScaleFactor;
// const defaultStrokeWeight = 1;
const debugLogEnabled = true;

let g: p5.Graphics;
let gSmooth: p5.Graphics;
let gPixelPerfect: p5.Graphics;

const brushes = ['CIRCLE', 'SPRAYCAN'] as const;
// type Brush = typeof brushes[number];

const defaultBrushIndex = 0;
let smoothGraphics = false;
let brushIndex = defaultBrushIndex;
let snapToPixel = true;
let traceMode = true;
let alwaysDraw = false;
let colorCycle = true;
let sizeCycle = true;
let drawOutline = false;
let backgroundColor: p5.Color;
let brushSize = 1;
let currentHue = 0;

// type UndoFrame {
//   image: p5.Image,
//   smoothGraphics: boolean
// }
const maxUndoBufferLength = 10; // TODO: increase
const undoBuffer: p5.Image[] = [];
const redoBuffer: p5.Image[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preload() {
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setup() {
  createCanvas(canvasSize, canvasSize);

  gSmooth = makePixelGraphics();
  gSmooth.smooth();
  gPixelPerfect = makePixelGraphics();
  gPixelPerfect.noSmooth();
  g = gPixelPerfect;

  resetSketch();
}

function makePixelGraphics(): p5.Graphics {
  // g?.remove();
  const gfx = createGraphics(graphicsSize, graphicsSize, WEBGL);
  gfx.pixelDensity(1);
  gfx.ortho();
  // g.scale(1, -1);
  gfx.translate(-graphicsSize / 2, -graphicsSize / 2);
  return gfx;
}

function resetSketch() {
  brushIndex = defaultBrushIndex;
  colorMode(HSB, 1);
  backgroundColor = color(0.75, 1);

  // Ensure pixels are crisp when rendering graphics g to main canvas
  noSmooth();

  updateSmoothGraphics();

  g.colorMode(HSB, 1);
  g.imageMode(CORNER);
  g.rectMode(CORNER);
  g.ellipseMode(RADIUS);
  g.textAlign(CENTER);

  // graphics.strokeWeight(defaultStrokeWeight);
  g.noStroke();

  // Even in trace mode, blank the background once
  gSmooth.background(backgroundColor);
  gPixelPerfect.background(backgroundColor);

  /* debug pixel testing
  g.stroke('red')
  g.strokeWeight(0);
  for (let i = 0; i < 4; ++i) {
    // g.square(math.floor(g.width / 2), math.floor(g.height / 2), 1);
    g.point(Math.floor(g.width / 2) + i, Math.floor(g.height / 2) + i);
  }
  */

  saveUndoPoint();
}

/**
 * Switch between smooth (anitialiased) and sharp pixel drawing mode. This will blank the canvas for now due to a bug in p5.js which does not allow the mode updte to take effect in webgl mode.
 */
function updateSmoothGraphics() {
  // const prevGraphics = g;
  // const img = prevGraphics.get();
  // g.save(`debug_graphics_${+Date.now()}.png`);
  // makePixelGraphics();

  // g.noSmooth();
  // g.image(img, 0, 0, graphicsSize, graphicsSize);
  // img.save(`debug_restoreImg_${+Date.now()}`, 'png');
  // debugLog(`updateSmoothGraphics smoothGraphics:${smoothGraphics}`);
  if (smoothGraphics) {
    g = gSmooth;
  } else {
    g = gPixelPerfect;
  }

  g.background(backgroundColor);

  // prevGraphics.remove();
}

function scaleToGraphicsSize(value: number): number {
  const scaledValue = value * graphicsScaleFactor;
  const ret = snapToPixel ? Math.round(scaledValue) : scaledValue;
  return ret;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function draw() {
  g.colorMode(HSB, 1);
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
  if (sizeCycle) {
     brushSize = (sin(millis() / 1000) * 4) + 5; 
  }
  if (alwaysDraw || mouseIsPressed) {
    // Draw brush
    const brush = brushes[brushIndex];
    if (brush === undefined) throw new Error(`Unexpected brush index ${brushIndex}`);
    switch (brush) {
      case 'CIRCLE': {
        g.fill(currentHue, 1, 1);
        g.circle(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY), brushSize);
        // g.point(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY));
        break;
      }
      case 'SPRAYCAN': {
        g.push();
        g.strokeWeight(0);
        g.stroke(currentHue, 1, 1);
        const sprayCanArea = brushSize * 8;
        const numPoints = 1;
        for (let i = 0; i < numPoints; ++i) {
          const x = random(mouseX - sprayCanArea, mouseX + sprayCanArea); 
          const y = random(mouseY - sprayCanArea, mouseY + sprayCanArea); 
          const xScaled = scaleToGraphicsSize(x);
          const yScaled = scaleToGraphicsSize(y);
          // debugLog(`spraycan point mouseX:${mouseX} mouseY:${mouseY} brushSize:${brushSize} hbs:${sprayCanArea} numPoints:${numPoints} x:${x} y:${y} xScaled:${xScaled} yScaled:${yScaled}`);
          g.point(xScaled, yScaled);
        }
        g.pop();
        break;
      }
      default:
        brush satisfies never;
    }
  }

  // Test brush
  // graphics.rect(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY), 2, 1);

  // Draw graphics to main canvas, scaled up
  background('red');
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

// eslint-disable-next-line no-var
if (debugLogEnabled) var debugLog = console.log.bind(window.console)
// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
else var debugLog = function(...data: any[]){}

/**
 * Tool: Glitchy mosiac blend effect I made by accident
 */
function mosaicShift() {
  debugLog('mosaicShift');
  g.loadPixels();
  g.push();
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
  g.pop();
  g.updatePixels();
}

const bands = [3, 5, 6, 7, 8, 9] as const;
let currentBandIndex = 0;
/**
 * Tool: Glitchy band/checkerboard blend effect I made partially by accident
 */
function glitchBands() {
  debugLog('glitchBands');
  g.loadPixels();
  const currentBand = bands[currentBandIndex];
  if (currentBand === undefined) throw new Error(`Undefined band at index:${currentBandIndex}`);
  debugLog(`glitchBands currentBandIndex:${currentBandIndex} currentBand:${currentBand}`);
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
function hueShift(forward: boolean, hsbGlitch: boolean) {
  debugLog('hueShift');
  g.loadPixels();
  g.push();
  for (let i = 0; i < g.pixels.length; i += 4) {
    const rd = g.pixels[i];
    const gr = g.pixels[i + 1];
    const bl = g.pixels[i + 2];
    const al = g.pixels[i + 3];
    if (rd === undefined || gr === undefined || bl === undefined || al === undefined) continue;

    g.colorMode(RGB, 255);
    const c = g.color(rd, gr, bl, al);

    if (hsbGlitch) {
      g.colorMode(HSB, 255);
    } else {
      g.colorMode(HSL, 255);
    }
    let h = g.hue(c);
    const s = g.saturation(c);
    const b = g.brightness(c);
    const l = g.lightness(c);
    const a = g.alpha(c);
    const delta = forward ? 5 : -5;
    h = wrap(255, h + delta);
    const c2 = hsbGlitch
      ? g.color(h, 255, b, a)
      : g.color(h, s, l, a);

    g.colorMode(RGB, 255);
    const nr = g.red(c2);
    const ng = g.green(c2);
    const nb = g.blue(c2);
    const na = g.alpha(c2);

    g.pixels[i] = nr;
    g.pixels[i + 1] = ng;
    g.pixels[i + 2] = nb;
    g.pixels[i + 3] = na;
    
    // if (i === 0) debugLog(`first pixel hue shift: rd:${rd}, gr:${gr}, bl:${bl}, al:${al}, h[init]:${g.hue(c)} h:${h}, s:${s}, b:${b} l:${l}, a:${a}, nr:${nr}, ng:${ng}, nb:${nb}, na:${na}`);
  }
  g.pop();
  g.updatePixels();
}

/**
 * Tool: slice pixels horizontally
 */
function pixelSliceH(forward: boolean) {
  debugLog('pixelSliceH forward:', forward);
  g.loadPixels();
  // Pixels array is sequential sets of 4 integers for RGBA respectively. Split into 2D array of chunks.
  const gDensity = g.pixelDensity();
  const gWidthPerPixelChunk = g.width * gDensity;
  const pixelsChunked = chunkArray(g.pixels, 4);
  const pixelRows = chunkArray(pixelsChunked, gWidthPerPixelChunk);
  pixelRows.forEach((pixelRow, i) => {
    const isEven = i % 2 === 0;
    if (forward && isEven || !forward && !isEven) {
      const rightmostPixelChunk = pixelRow.pop();
      if (rightmostPixelChunk === undefined) return;
      pixelRow.unshift(rightmostPixelChunk);
    } else {
      const leftmostPixelChunk = pixelRow.shift();
      if (leftmostPixelChunk === undefined) return;
      pixelRow.push(leftmostPixelChunk);
    }
  });
  const resultPixels = pixelRows.flat(2);
  (g.pixels as unknown as Uint8ClampedArray).set(new Uint8ClampedArray(resultPixels));
  g.updatePixels();
}

/**
 * Tool: slice pixels vertically
 */
function pixelSliceV(forward: boolean) {
  console.warn('pixelSliceV forward:', forward);
  g.loadPixels();
  // Pixels array is sequential sets of 4 integers for RGBA respectively. Split into 2D array of chunks.
  const gDensity = g.pixelDensity();
  const gWidthPerPixelChunk = g.width * gDensity;
  const pixelsChunked = chunkArray(g.pixels, 4);
  const resultPixelsChunked: number[][] = [];
  for (let i = 0; i < pixelsChunked.length; ++i) {
    const column = i % gWidthPerPixelChunk;
    const evenColumn = column % 2 === 0;
    const newIndex = ((forward && evenColumn) || (!forward && !evenColumn)
        ? i - gWidthPerPixelChunk
        : i + gWidthPerPixelChunk)
      % pixelsChunked.length;
    resultPixelsChunked[newIndex] = pixelsChunked[i]!;
  }
  const resultPixels = resultPixelsChunked.flat();
  (g.pixels as unknown as Uint8ClampedArray).set(new Uint8ClampedArray(resultPixels));
  g.updatePixels();
}

/**
 * Tool: sort pixels by brightness
 */
function pixelSort() {
  debugLog('pixelSort');
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
  debugLog('reversePixels');
  g.loadPixels();
  g.pixels.reverse();
  g.updatePixels();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mouseClicked() {
}

function drawRestoreImage(img: p5.Image) {
  const prevSmoothGraphics = smoothGraphics;
  if (prevSmoothGraphics === true) {
    smoothGraphics = false;
    updateSmoothGraphics();
  }
  g.image(img, 0, 0, graphicsSize, graphicsSize);
  if (prevSmoothGraphics === true) {
    smoothGraphics = true;
    updateSmoothGraphics();
  }
}

function undo() {
  // If the redo buffer is empty and last state change was from user interaction and not an undo/redo operation, the current state of the canvas should match the top undo frame, so pop twice

  const isFirstUndoPoint = undoBuffer.length === 1;
  debugLog(`undo 1. Num undo points = ${undoBuffer.length} Num redo points = ${redoBuffer.length} isFirstUndoPoint:${isFirstUndoPoint}`);

  function drawLastUndoImage() {
    const lastUndoPointImage = undoBuffer[undoBuffer.length - 1];
    if (lastUndoPointImage === undefined) throw new Error('last undo point was undefined');
    drawRestoreImage(lastUndoPointImage);
  }

  if (isFirstUndoPoint) {
    // Don't pop this one as we need to always be able to get back to it
    // debugLog('first undo point');
    drawLastUndoImage();
  } else {
    // debugLog('do normal undo');
    const restoreImage = undoBuffer.pop();
    if (restoreImage === undefined) return;
    redoBuffer.push(restoreImage);
    drawLastUndoImage();
  }
  // debugLog(`undo END. Num undo points = ${undoBuffer.length} Num redo points = ${redoBuffer.length}`);
}

function redo() {
  if (redoBuffer.length < 1) return;
  debugLog(`redo 1. Num undo points = ${undoBuffer.length} Num redo points = ${redoBuffer.length}`);
  const restoreImage = redoBuffer.pop();
  if (restoreImage === undefined) return;
  undoBuffer.push(restoreImage);
  drawRestoreImage(restoreImage);
  // debugLog(`redo END. Num undo points = ${undoBuffer.length} Num redo points = ${redoBuffer.length}`);
}

function saveUndoPoint() {
  // debugLog(`save undo point. Num undo points = ${undoBuffer.length} Num redo points = ${redoBuffer.length}`);
  const undoImage = g.get();
  undoBuffer.push(undoImage);

  // Clear redo buffer if there are any redo frames
  redoBuffer.length = 0;

  // Garbage collect oldest undo frame if needed
  if (undoBuffer.length > maxUndoBufferLength) {
    // debugLog('Garbage collect oldest undo frame');
    undoBuffer.shift();
  }
}

enum KeyConf {
  SaveCanvas = 'w',
  ResetSketch = 'x', // used to be r
  Undo = 'u',
  Redo = 'r',
  PrevBrush = '[',
  NextBrush = ']',
  ToggleSmoothGraphics = 'g',
  SnapToPixel = 'p',
  ColorCycle = 'c',
  SizeCycle = 's',
  DrawOutline = 'o',
  AlwaysDraw = 'a',
  TraceMode = 't',
  HueShiftF = 'h',
  HueShiftB = 'H',
  HueShiftHSBGlitchF = 'j',
  HueShiftHSBGlitchB = 'J',
  PixelSliceHF = 'l',
  PixelSliceHB = 'L',
  PixelSliceVF = 'k',
  PixelSliceVB = 'K',
  PixelSort = 'z',
  ReversePixels = 'v',
  MoasicShift = 'm',
  GlitchBands = 'b',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mouseReleased() {
  saveUndoPoint();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function keyPressed() {
  const keyConf = key as KeyConf;
  console.log(`keyPressed: ${key}`);

  // For now, bail on unknown keybinds
  if (!Object.values(KeyConf).includes(keyConf)) return;

  switch(keyConf) {
    case KeyConf.SaveCanvas: {
      saveCanvas(`worse-artist_${Date.now()}.png`);
      break;
    }
    case KeyConf.ResetSketch: {
      // saveUndoPoint();
      debugLog('reset sketch');
      resetSketch();
      break;
    }
    case KeyConf.PrevBrush: {
      brushIndex = wrap(brushes.length, brushIndex - 1);
      debugLog(`Select prev brush, index:${brushIndex} brush:${brushes[brushIndex]}`);
      break;
    }
    case KeyConf.NextBrush: {
      brushIndex = wrap(brushes.length, brushIndex + 1);
      debugLog(`Select next brush, index:${brushIndex} brush:${brushes[brushIndex]}`);
      break;
    }
    case KeyConf.Undo: {
      undo();
      break;
    }
    case KeyConf.Redo: {
      redo();
      break;
    }
    case KeyConf.ToggleSmoothGraphics: {
      smoothGraphics = !smoothGraphics;
      updateSmoothGraphics();
      break;
    }
    case KeyConf.SnapToPixel: {
      snapToPixel = !snapToPixel;
      debugLog(`snapToPixel: ${snapToPixel}`);
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
    case KeyConf.HueShiftF: {
      hueShift(true, false);
      saveUndoPoint();
      break;
    }
    case KeyConf.HueShiftB: {
      hueShift(false, false);
      saveUndoPoint();
      break;
    }
    case KeyConf.HueShiftHSBGlitchF: {
      hueShift(true, true);
      saveUndoPoint();
      break;
    }
    case KeyConf.HueShiftHSBGlitchB: {
      hueShift(false, true);
      saveUndoPoint();
      break;
    }
    case KeyConf.PixelSliceHF: {
      pixelSliceH(true);
      saveUndoPoint();
      break;
    }
    case KeyConf.PixelSliceHB: {
      pixelSliceH(false);
      saveUndoPoint();
      break;
    }
    case KeyConf.PixelSliceVF: {
      pixelSliceV(true);
      saveUndoPoint();
      break;
    }
    case KeyConf.PixelSliceVB: {
      pixelSliceV(false);
      saveUndoPoint();
      break;
    }
    case KeyConf.PixelSort: {
      pixelSort();
      saveUndoPoint();
      break;
    }
    case KeyConf.ReversePixels: {
      reversePixels();
      saveUndoPoint();
      break;
    }
    case KeyConf.MoasicShift: {
      mosaicShift();
      saveUndoPoint();
      break;
    }
    case KeyConf.GlitchBands: {
      glitchBands();
      saveUndoPoint();
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
    // debugLog(`size change event.delta:${event.delta} scaled:${event.delta * 0.1} brushSize:${brushSize}`);
  } else {
    // Change hue
    const sizeDelta = event.delta * 0.001; // event.delta >=0 ? 0.01 : -0.01;
    const newHue = wrap(1, currentHue + sizeDelta);
    // debugLog(`hue change event.delta:${event.delta} sizeDelta:${sizeDelta} hue:${hue} newHue:${newHue}`);
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
