import type * as p5 from "p5";

const backgroundColor = '#4DA2AF';
const darkBlueColor = '#28306A';
const creamColor = '#FBF2B2';
const redColor = '#D13938';

let music: p5.SoundFile;
let amplitude: p5.Amplitude;
let fft: p5.FFT;
let hasStarted = false;

function preload() {
  soundFormats('ogg');
  music = loadSound('../tripleclickjam25/tripleClickTheme');
}

function setup() {
  createCanvas(400, 400);
  background(backgroundColor);
  rectMode(CENTER);
  textAlign(CENTER);
  stroke(creamColor);
  strokeWeight(3);
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

  // draw amplitude ellipse
  const volumeLevel = amplitude.getLevel();
  const ellipseSize = volumeLevel * 100;
  ellipse(width / 2, height / 2, ellipseSize, ellipseSize);
  console.log('amp:', volumeLevel);

  // draw fft
  push();
  const fftGraphHeight = height / 2;
  const spectrum = fft.analyze();
  const linAverages = fft.linAverages(16);
  translate(0, fftGraphHeight);
  rectMode(CORNER);
  noStroke();
  fill(creamColor);
  for (let i = 0; i< linAverages.length; i++){
    let x = map(i, 0, linAverages.length, 0, width);
    let h = -fftGraphHeight + map(linAverages[i], 0, 255, fftGraphHeight, 0);
    rect(x, fftGraphHeight, width / linAverages.length, h );
  }
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
