import type * as p5 from "p5";

const backgroundColor = '#18A5B1';
const darkBlueColor = '#28306A';
const creamColor = '#FBF2B2';
const redColor = '#D13938';
const defaultStrokeWeight = 15;
// const musicTrack = 'clickTrack110BPM';
const musicTrack = 'tripleClickTheme';

const bpm = 110;
const beatsPerBar = 4;
const musicDebugCueTimeS = 0; //91; // TODO: remove later start time for debugging
const musicEvents = [
  /*
  // Click track test events
  1.091,
  2.182,
  2.727,
  3.273,
  3.818,
  4.364,
  4.909,
  5.455,
  6.000,
  */

  /* Triple click events
  */
  1.090,
  1.298,
  1.532,

  97.608,
  97.817,
  98.050,
  /*
  */
] as const;

type MusicEventIndex = keyof typeof musicEvents;

type MusicEventRuntimeData = {
  musicEventIndex: keyof typeof musicEvents,
  musicEventTimeS: typeof musicEvents[number],
  wasPressed: boolean,
};

let musicEventRuntimeData: MusicEventRuntimeData[];

let lastBeat = -1;
let musicEventIdx = 0;

let music: p5.SoundFile;
let amplitude: p5.Amplitude;
let fft: p5.FFT;

let bPSControllerImage: p5.Image;
let ulXBOXControllerImage: p5.Image;
let urSNESControllerImage: p5.Image;

let hasStarted = false;
let mouseWasPressedLastFrame = false;

function preload() {
  soundFormats('ogg');
  music = loadSound(`assets/${musicTrack}`);
  bPSControllerImage = loadImage('assets/B-PS.png');
}

function setup() {
  createCanvas(800, 800);

  //@ts-expect-error
  amplitude = new p5.Amplitude();
  amplitude.smooth(1);

  //@ts-expect-error
  fft = new p5.FFT();

  resetSketch();
}

function resetSketch() {
  hasStarted = false;

  // Make music event runtime data
  musicEventRuntimeData = musicEvents.map((musicEventTimeS, musicEventIndex) => ({
    musicEventTimeS,
    musicEventIndex,
    wasPressed: false,
  }));

  rectMode(CENTER);
  ellipseMode(RADIUS);
  textAlign(CENTER);
  stroke(creamColor);
  fill(darkBlueColor);

  // Draw splash screen
  background(backgroundColor);
  strokeWeight(3);
  text('Click to begin', width / 2, height / 2);

  strokeWeight(defaultStrokeWeight);

  music.stop();
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
  const largeCircleSize = (volumeLevel * 100) + (defaultStrokeWeight * 2);

  noFill();
  stroke(creamColor);
  circle(width / 2, height / 2, largeCircleSize);
  stroke(redColor);
  circle(width / 2, height / 2, mediumCircleSize);
  stroke(darkBlueColor);
  circle(width / 2, height / 2, smallCircleSize);
  // console.log('amp:', volumeLevel);
  pop();

  // Draw controller images if displayed
  push();
  const urAngleRad = radians(30);
  const ulAngleRad = radians(150);
  const bAngleRad = radians(270);
  image(bPSControllerImage, width / 2, height / 2, 100, 100);
  pop();

  handleMusicTrack();
}

function mapOptional<T, U>(x: T | undefined, f: (arg0: T) => U): U | undefined {
  if (x === undefined) return undefined;
  return f(x);
}

function handleMusicTrack() {
  if (musicEventIdx > musicEvents.length) return;

  push();
  // calculate current time and beats
  const currentTimeS = music.currentTime();
  const currentTimeM = currentTimeS / 60;
  const beat = Math.floor(currentTimeM * bpm);
  const measure = Math.floor(beat / beatsPerBar);
  const beatInBar = (beat % beatsPerBar) + 1;

  // Check if the beat has changed
  if (lastBeat != beat) {
    // console.log({ measure, beatInBar, beat, currentTimeS });
    lastBeat = beat;
  }

  // Check if the next musicEvent has fired
  const nextEventTimeS = musicEvents[musicEventIdx];
  if (nextEventTimeS && currentTimeS >= nextEventTimeS) {
    // console.log('NEXT EVENT FIRE', { currentTimeS, nextEventTimeS });
    ++musicEventIdx;
  }

  // process input
  if (mouseIsPressed && !mouseWasPressedLastFrame) {
    // console.log("mouse press detected");
    // find nearest previous and next events
    const prevEventIdx = musicEventRuntimeData.findIndex(evt => evt.musicEventTimeS < currentTimeS);
    const nextEventIdx = musicEventRuntimeData.findIndex(evt => evt.musicEventTimeS >= currentTimeS);
    const prevEvent = musicEventRuntimeData[prevEventIdx];
    const nextEvent = musicEventRuntimeData[nextEventIdx];
    const getDistance = (evt: MusicEventRuntimeData): number => currentTimeS - evt.musicEventTimeS;
    const prevEventDistance = mapOptional(prevEvent, getDistance);
    const nextEventDistance = mapOptional(nextEvent, getDistance);

    const thresholdLabels = ['PERFECT', 'GREAT', 'GOOD', 'OK', 'MISS'] as const; 
    type ThresholdLabel = typeof thresholdLabels[number];
    const thresholdsS = [0.015 /*perfect*/, 0.03 /*great*/, 0.05 /*good*/, 0.01/*OK*/, Number.POSITIVE_INFINITY /*Miss*/] as const;
    const thresholdMessages = ['Perfect!', 'Great!', 'Good!', 'OK', 'Miss'] as const;
    const goodIndex = 3;
    const missIndex = 4; // Index of miss label/message - must be a constant expression for type inference below

    const getThreshold = (distanceS: number): [ThresholdLabel, typeof thresholdsS[number], typeof thresholdMessages[number]] => {
      for(let i = 0; i < thresholdsS.length; ++i) {
        const thresholdLabel = thresholdLabels[i];
        const threshold = thresholdsS[i];
        const thresholdMessage = thresholdMessages[i]; 
        if (thresholdLabel !== undefined && threshold !== undefined &&  thresholdMessage !== undefined && distanceS < threshold) {
          return [thresholdLabel, threshold, thresholdMessage];
        }
      }

      // No best threshold found, it's a miss
      return [thresholdLabels[missIndex], thresholdsS[missIndex], thresholdMessages[missIndex]];
    };

    type DistanceResult = [number, ThresholdLabel, keyof typeof thresholdsS, typeof thresholdMessages[number], MusicEventIndex]
    try {
      const [distance, thresholdLabel, threshold, thresholdMessage, nearestEventIdx] = ((): DistanceResult  => {
        const getResult = (distance: number, musicEventIndex: MusicEventIndex): DistanceResult => {
          return [distance, ...getThreshold(distance), musicEventIndex];
        };
        if (prevEvent !== undefined
          && !prevEvent.wasPressed
          && prevEventDistance !== undefined
          && nextEvent !== undefined
          && !nextEvent.wasPressed
          && nextEventDistance !== undefined) {
          // Both previous and next events are candidates, use whichever is closer
          if (Math.abs(prevEventDistance) < Math.abs(nextEventDistance)) {
            console.log('1');
            const result = getResult(prevEventDistance, prevEventIdx);
            if (result[1] !== 'MISS') {
              prevEvent.wasPressed = true;
            }
            return result;
          } else {
            console.log('2');
            const result = getResult(nextEventDistance, nextEventIdx);
            if (result[1] !== 'MISS') {
              nextEvent.wasPressed = true;
            }
            return result;
          }
        } else if (prevEvent !== undefined && !prevEvent.wasPressed && prevEventDistance !== undefined) {
          console.log('3');
          const result = getResult(prevEventDistance, prevEventIdx);
          if (result[1] !== 'MISS') {
            prevEvent.wasPressed = true;
          }
          return result;
        } else if (nextEvent !== undefined && !nextEvent.wasPressed && nextEventDistance !== undefined) {
          console.log('4');
          const result = getResult(nextEventDistance, nextEventIdx);
          if (result[1] !== 'MISS') {
            nextEvent.wasPressed = true;
          }
          return result;
        } 
        throw new Error('No threshold found');
      })();
      console.log({ thresholdLabel, thresholdMessage, distance, threshold, nearestEventIdx });
    } catch {
    }
  }
  mouseWasPressedLastFrame = mouseIsPressed;

  // draw music track
  noStroke();

  // Draw measure/beat/time counter HUD
  push();
  textSize(20);
  fill(creamColor);
  const timeRemainingS = Math.floor(music.duration() - currentTimeS);
  const hud = `${measure}.${beatInBar} T-${timeRemainingS}s`;
  text(hud, width / 2, height / 2);
  pop();

  translate(50, 50);

  const circleY = 0;

  // cursor
  fill('blue');
  circle(0, 0, 25);

  fill('red');
  const musicTrackXTimeScale = 500;
  const currentSeekPosX = currentTimeS * musicTrackXTimeScale;
  for(let i = 0; i < musicEvents.length; ++i) {
    const musicEventTimeS = musicEvents[i] || 0;

    if (musicEventTimeS < currentTimeS) continue;

    const x = (musicEventTimeS * musicTrackXTimeScale) - currentSeekPosX;
    circle(x, circleY, 25);

    // debug label
    push();
    fill('black');
    text(i, x, circleY);
    pop();
  }
  pop();
}

function mouseClicked() {
  // First click enables audio context
  if (!hasStarted) {
    hasStarted = true;
    userStartAudio();
    music.play(undefined, undefined, undefined, musicDebugCueTimeS);
    console.log('first click');
    return;
  }
  // handle subsequent click here if needed. game clicks are handled in handleMusicTrack function
}

function keyPressed() {
  if (key === 'r') {
    // reset sketch
    console.log('reset sketch');
    resetSketch();
  } else if (key == 'p') {
    if (music.isPaused()) {
      music.play(undefined, undefined, undefined, musicDebugCueTimeS);
    } else {
      music.pause();
    }
  }
}
