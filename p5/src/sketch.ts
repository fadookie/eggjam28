import type * as p5 from "p5";

let music: p5.SoundFile;

function preload() {
  soundFormats('ogg');
  music = loadSound('tripleClickTheme');
}

function setup() {
 // put setup code here
 createCanvas(400, 400);
 music.play();
}

function draw() {
  // put drawing code here
}

function mouseClicked() {
}
