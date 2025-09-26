import type * as p5 from "p5";

const backgroundColor = '#4DA2AF';
const darkBlueColor = '#28306A';
const creamColor = '#FBF2B2';
const redColor = '#D13938';
const defaultStrokeWeight = 15;

let music: p5.SoundFile;
let amplitude: p5.Amplitude;
let fft: p5.FFT;
let hasStarted = false;

function preload() {
  soundFormats('ogg');
  music = loadSound('../assets/tripleClickTheme');
}

function setup() {
  createCanvas(800, 800);
  background(backgroundColor);
  rectMode(CENTER);
  ellipseMode(RADIUS);
  textAlign(CENTER);
  stroke(creamColor);
  strokeWeight(defaultStrokeWeight);
  fill(darkBlueColor);
  text('Click to begin', width / 2, height / 2);

  //@ts-expect-error
  amplitude = new p5.Amplitude();
  amplitude.smooth(1);

  //@ts-expect-error
  fft = new p5.FFT();
}

function draw() {
  if (!hasStarted) return;
  background(backgroundColor);

  // draw fft
  push();
  const fftGraphHeight = height / 2;
  const spectrum = fft.analyze();
  const linAverages = fft.linAverages(16);
  translate(0, fftGraphHeight);
  rectMode(CORNER);
  noStroke();
  fill(redColor);
  for (let i = 0; i< linAverages.length; i++){
    let x = map(i, 0, linAverages.length, 0, width);
    let h = -fftGraphHeight + map(linAverages[i], 0, 255, fftGraphHeight, 0);
    rect(x, fftGraphHeight, width / linAverages.length, h );
  }
  pop();

  // draw amplitude circles
  push();
  const volumeLevel = amplitude.getLevel() + 2;
  // const volumeLevel = 0.75;
  const smallCircleSize = volumeLevel * 100;
  const mediumCircleSize = (volumeLevel * 100) + defaultStrokeWeight;
  const largeCircleSize = (volumeLevel * 100) + defaultStrokeWeight * 2;

  noFill();
  stroke(creamColor);
  circle(width / 2, height / 2, largeCircleSize);
  stroke(redColor);
  circle(width / 2, height / 2, mediumCircleSize);
  stroke(darkBlueColor);
  circle(width / 2, height / 2, smallCircleSize);
  // console.log('amp:', volumeLevel);
  pop();
}

function mouseClicked() {
  // First click enables audio context
  if (!hasStarted) {
    hasStarted = true;
    userStartAudio();
    music.play();
    console.log('first click');
    return;
  }
  console.log('subsequent click');
}
