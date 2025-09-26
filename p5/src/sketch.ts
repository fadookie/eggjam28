import type * as p5 from "p5";

const backgroundColor = '#4DA2AF';
const darkBlueColor = '#28306A';
const creamColor = '#FBF2B2';
const redColor = '#D13938';

let music: p5.SoundFile;
let amplitude: p5.Amplitude;
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

  amplitude = new p5.Amplitude();
  amplitude.smooth(1);
}

function draw() {
  if (!hasStarted) return;
  background(backgroundColor);
  const volumeLevel = amplitude.getLevel();
  const ellipseSize = volumeLevel * 100;
  ellipse(width / 2, height / 2, ellipseSize, ellipseSize);
  console.log('amp:', volumeLevel);
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
