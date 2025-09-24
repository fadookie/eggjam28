let click1;
let click2;
let click3Music;

let numClicks = 0;
let timeFirstClickStarted = 0;
let timeLastClickStarted = 0;

function preload() {
  soundFormats('ogg');
  click1 = loadSound('click1');
  click2 = loadSound('click2');
  click3Music = loadSound('click3Music');
}

function setup() {
 // put setup code here
 createCanvas(400, 400);
}

function draw() {
  // put drawing code here
}

function mouseClicked() {
  click1.play();
  ++numClicks;
  timeFirstClickStarted = millis();
  timeLastClickStarted = millis();
}
