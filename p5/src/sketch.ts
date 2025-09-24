import 'p5';

let music;

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
