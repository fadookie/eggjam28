import type * as p5 from "p5";

const backgroundColor = 90;
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
  stroke('red');
  fill('blue');
  ellipse(0, 0, 50, 50);
  text('Click to begin', width / 2, height / 2);

  amplitude = new p5.Amplitude();
}

function draw() {
  if (!hasStarted) return;
  background(backgroundColor);
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
