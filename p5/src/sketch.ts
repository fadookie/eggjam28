import type * as p5 from "p5";

const canvasSize = 800;
const defaultStrokeWeight = 15;

function preload() {
}

function setup() {
  createCanvas(canvasSize, canvasSize);

  resetSketch();
}

function resetSketch() {
  colorMode(RGB, 1);
  imageMode(CENTER);
  rectMode(CENTER);
  ellipseMode(RADIUS);
  textAlign(CENTER);

  strokeWeight(defaultStrokeWeight);
}

function draw() {
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
  }
}
