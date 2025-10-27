import type * as p5 from "p5";

const canvasSize = 800;
const graphicsScaleFactor = 0.1;
const defaultStrokeWeight = 1;

let graphics: p5.Graphics;

let traceMode = true;
let snapToPixel = true;

let backgroundColor: p5.Color;

function preload() {
}

function setup() {
  createCanvas(canvasSize, canvasSize);

  const graphicsSize = canvasSize * graphicsScaleFactor;
  graphics = createGraphics(graphicsSize, graphicsSize);

  resetSketch();
}

function resetSketch() {
  noSmooth();

  colorMode(RGB, 1);
  backgroundColor = color(0.75, 1);

  graphics.colorMode(RGB, 1);
  graphics.imageMode(CENTER);
  graphics.rectMode(CORNER);
  graphics.ellipseMode(RADIUS);
  graphics.textAlign(CENTER);
  graphics.noSmooth();

  // graphics.strokeWeight(defaultStrokeWeight);
  graphics.noStroke();

  // Even in trace mode, blank the background once
  graphics.background(backgroundColor);
}

function scaleToGraphicsSize(value: number): number {
  const scaledValue = value * graphicsScaleFactor;
  const ret = snapToPixel ? Math.round(scaledValue) : scaledValue;
  return ret;
}

function draw() {
  if (!traceMode) {
    graphics.background(backgroundColor);
  }
  graphics.rect(scaleToGraphicsSize(mouseX), scaleToGraphicsSize(mouseY), 2, 1);
  image(graphics, 0, 0, canvasSize, canvasSize);
}

function mapOptional<T, Result>(f: (arg0: T) => Result, x: T | undefined): Result | undefined;

function mapOptional<T, U, Result>(f: (arg0: T, arg1: U) => Result, x: T | undefined, y: U | undefined): Result | undefined;

function mapOptional(f: (...a: unknown[]) => unknown, ...args: unknown[]): unknown {
  if (args.some(x => x === undefined)) return undefined;
  return f(...args);
}

function mouseClicked() {
}

function keyPressed() {
  if (key === 'r') {
    // reset sketch
    console.log('reset sketch');
    resetSketch();
  } else if (key === 's') {
    snapToPixel = !snapToPixel;
  } else if (key === 't') {
    traceMode = !traceMode;
  }
}
