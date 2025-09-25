import type * as p5 from "p5";

let music: p5.SoundFile;
let hasStarted = false;

function preload() {
  soundFormats('ogg');
  music = loadSound('../tripleclickjam25/tripleClickTheme');
}

function setup() {
  createCanvas(400, 400);
  background(90);
  stroke('red');
  ellipse(0, 0, 50, 50);
}

// function draw() {
// }

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
