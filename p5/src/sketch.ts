import type * as p5 from "p5";

const backgroundColor = '#18A5B1';
const darkBlueColor = '#28306A';
const creamColor = '#FBF2B2';
const redColor = '#D13938';
const defaultStrokeWeight = 15;
// const musicTrack = 'clickTrack110BPM';
const musicTrack = 'tripleClickTheme';
const canvasSize = 800;

type MusicEventType = 'CLICK' | 'B_ON' | 'UR_ON' | 'UL_ON' | 'B_OFF' | 'UR_OFF' | 'UL_OFF';

type MusicEvent = {
  timeS: number,
  types: MusicEventType[]
};

const bpm = 110;
const beatsPerBar = 4;
const musicDebugCueTimeS = 0; //91; // TODO: remove later start time for debugging

const thresholdLabels = ['PERFECT', 'GREAT', 'GOOD', 'OK', 'MISS'] as const; 
type ThresholdLabel = typeof thresholdLabels[number];
const thresholdsS = [0.015 /*perfect*/, 0.03 /*great*/, 0.05 /*good*/, 0.25/*OK*/, Number.POSITIVE_INFINITY /*Miss*/] as const;
const thresholdMessages = ['Perfect!', 'Great!', 'Good!', 'OK', 'Miss'] as const;
// thresholdMessageColors are defined after sketch loads as they rely on the color constructor
const goodIndex = 3;
const missIndex = 4; // Index of miss label/message - must be a constant expression for type inference below

const musicEvents: MusicEvent[] = [
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
  { timeS: 1.090, types: ['CLICK', 'UR_ON'] },
  { timeS: 1.298, types: ['CLICK', 'B_ON'] },
  { timeS: 1.532, types: ['CLICK', 'UL_ON'] },

  { timeS: 2.182, types: ['B_OFF', 'UR_OFF', 'UL_OFF'] },

  { timeS: 97.608, types: ['CLICK', 'UL_ON'] },
  { timeS: 97.817, types: ['CLICK', 'B_ON'] },
  { timeS: 98.050, types: ['CLICK', 'UR_ON'] },
  /*
  */
] as const;

type MusicEventIndex = keyof typeof musicEvents;

type DistanceResult = {
  distance: number,
  thresholdLabel: ThresholdLabel,
  threshold: keyof typeof thresholdsS,
  thresholdMessage: typeof thresholdMessages[number],
  thresholdMessageColor: p5.Color,
  nearestEventIdx: MusicEventIndex,
}

type MusicEventRuntimeData = {
  musicEventIndex: keyof typeof musicEvents,
  musicEvent: typeof musicEvents[number],
  pressTimeS: number | undefined,
  distanceResult: DistanceResult | undefined,
};

let musicEventRuntimeData: MusicEventRuntimeData[];

let lastBeat = -1;
let musicEventIdx = 0;

let bingSfx: p5.SoundFile;
let music: p5.SoundFile;
let amplitude: p5.Amplitude;
let fft: p5.FFT;

let bPSControllerImage: p5.Image;
let urSNESControllerImage: p5.Image;
let ulXBOXControllerImage: p5.Image;

let bPSControllerVisible: boolean = false;
let urSNESControllerVisible: boolean = false;
let ulXBOXControllerVisible: boolean = false;

let hasStarted = false;
let mouseWasPressedLastFrame = false;

function isClickEvent(musicEvent: MusicEvent): boolean {
  return musicEvent.types.includes('CLICK');
}

function preload() {
  soundFormats('ogg');
  bingSfx = loadSound('assets/bing');
  music = loadSound(`assets/${musicTrack}`);
  bPSControllerImage = loadImage('assets/B-PS.png');
  urSNESControllerImage = loadImage('assets/UR-SNES.png');
  ulXBOXControllerImage = loadImage('assets/UL-XBOX.png');
}

function setup() {
  createCanvas(canvasSize, canvasSize);

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
  musicEventRuntimeData = musicEvents.map((musicEvent, musicEventIndex) => ({
    musicEvent: musicEvent,
    musicEventIndex,
    pressTimeS: undefined,
    distanceResult: undefined,
  }));

  colorMode(RGB, 1);
  imageMode(CENTER);
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

  bPSControllerVisible = false;
  urSNESControllerVisible = false;
  ulXBOXControllerVisible = false;

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
  const smallCircleRadius = volumeLevel * 100;
  const mediumCircleRadius = (volumeLevel * 100) + defaultStrokeWeight;
  const largeCircleRadius = (volumeLevel * 100) + (defaultStrokeWeight * 2);

  noFill();
  stroke(creamColor);
  circle(width / 2, height / 2, largeCircleRadius);
  stroke(redColor);
  circle(width / 2, height / 2, mediumCircleRadius);
  stroke(darkBlueColor);
  circle(width / 2, height / 2, smallCircleRadius);
  // console.log('amp:', volumeLevel);
  pop();

  // Draw controller images if displayed
  push();
  translate(width / 2, height / 2);
  const getXYFromAngle = (thetaRad: number): [number, number] => {
    // 𝑥=𝑟∗𝑠𝑖𝑛(θ),𝑦=𝑟∗𝑐𝑜𝑠(θ)
    const r = mediumCircleRadius;
    const x = r * sin(thetaRad);
    const y = r * cos(thetaRad);
    return [x, y];
  };
  const drawControllerImage = (angleDeg: number, controllerImage: p5.Image, strokeColor: string /* for debug only */) => {
    const origMediumCircleDiameter = 4044;
    const imageScaleRatio = ((mediumCircleRadius * 2) / origMediumCircleDiameter) + 0.01 /* fudge factor */;
    const angleRad = radians(angleDeg);
    const [x, y] = getXYFromAngle(angleRad);
    image(controllerImage, x, y, controllerImage.width * imageScaleRatio, controllerImage.height * imageScaleRatio);
    stroke(strokeColor);
    circle(x, y, 2);
  };
  if (bPSControllerVisible) drawControllerImage(0, bPSControllerImage, 'red');
  if (urSNESControllerVisible) drawControllerImage(120, urSNESControllerImage, 'green');
  if (ulXBOXControllerVisible) drawControllerImage(240, ulXBOXControllerImage, 'blue');
  pop();

  handleMusicTrack();
}

function mapOptional<T, Result>(f: (arg0: T) => Result, x: T | undefined): Result | undefined;

function mapOptional<T, U, Result>(f: (arg0: T, arg1: U) => Result, x: T | undefined, y: U | undefined): Result | undefined;

function mapOptional(f: (...a: unknown[]) => unknown, ...args: unknown[]): unknown {
  if (args.some(x => x === undefined)) return undefined;
  return f(...args);
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
  const nextEvent = musicEvents[musicEventIdx];
  if (nextEvent && currentTimeS >= nextEvent.timeS) {
    // console.log('NEXT EVENT FIRE', { currentTimeS, nextEvent });
    ++musicEventIdx;

    // Handle image visiblity changes
    nextEvent.types.forEach(type => {
      switch(type) {
        case 'B_ON':
          bPSControllerVisible = true;
          break;
        case 'B_OFF':
          bPSControllerVisible = false;
          break;
        case 'UR_ON':
          urSNESControllerVisible = true;
          break;
        case 'UR_OFF':
          urSNESControllerVisible = false;
          break;
        case 'UL_ON':
          ulXBOXControllerVisible = true;
          break;
        case 'UL_OFF':
          ulXBOXControllerVisible = false;
          break;
      }
    });
  }

  // process click inputs
  if (mouseIsPressed && !mouseWasPressedLastFrame) {
    // console.log("mouse press detected");
    // find nearest previous and next events
    const maxEventDistanceS = 0.5;

    const getDistance = (evt: MusicEventRuntimeData): number => currentTimeS - evt.musicEvent.timeS;

    const isValidEvent = (evt: MusicEventRuntimeData) => 
      isClickEvent(evt.musicEvent)
      && evt.pressTimeS === undefined
      && Math.abs(getDistance(evt)) <= maxEventDistanceS;

    const prevEventIdx = musicEventRuntimeData.findIndex(evt =>
      isValidEvent(evt)
      && evt.musicEvent.timeS < currentTimeS);
    const nextEventIdx = musicEventRuntimeData.findIndex(evt =>
      isValidEvent(evt)
      && evt.musicEvent.timeS >= currentTimeS);
    const prevEvent = musicEventRuntimeData[prevEventIdx];
    const nextEvent = musicEventRuntimeData[nextEventIdx];
    const prevEventDistance = mapOptional(getDistance, prevEvent);
    const nextEventDistance = mapOptional(getDistance, nextEvent);

    type ThresholdResult = Pick<DistanceResult, 'thresholdLabel' | 'threshold' | 'thresholdMessage' | 'thresholdMessageColor'>;

    const getThreshold = (distanceS: number): ThresholdResult => {
      const thresholdMessageColors = [color('#9FFA8E'), color('#CCFB8F'), color('#FFFD90'), color('#F5C288'), color('#EE8581')] as const;

      for(let i = 0; i < thresholdsS.length; ++i) {
        const thresholdLabel = thresholdLabels[i];
        const threshold = thresholdsS[i];
        const thresholdMessage = thresholdMessages[i]; 
        const thresholdMessageColor = thresholdMessageColors[i]; 
        if (thresholdLabel !== undefined && threshold !== undefined &&  thresholdMessage !== undefined && thresholdMessageColor !== undefined && distanceS < threshold) {
          return { thresholdLabel, threshold, thresholdMessage, thresholdMessageColor };
        }
      }

      // No best threshold found, it's a miss
      return {
        thresholdLabel: thresholdLabels[missIndex],
        threshold: thresholdsS[missIndex],
        thresholdMessage: thresholdMessages[missIndex],
        thresholdMessageColor: thresholdMessageColors[missIndex],
      };
    };

    try {
      const distanceResult = ((): DistanceResult  => {
        const getResult = (distance: number, musicEventIndex: MusicEventIndex): DistanceResult => {
          return { distance, ...getThreshold(Math.abs(distance)), nearestEventIdx: musicEventIndex };
        };

        const prevEventResult = mapOptional((prevEvt, prevDistance) => {
          return getResult(prevDistance, prevEventIdx);
        }, prevEvent, prevEventDistance);

        const nextEventResult = mapOptional((nextEvt, nextDistance) => {
          return getResult(nextDistance, nextEventIdx);
        }, nextEvent, nextEventDistance);

        if (prevEvent !== undefined && prevEventResult !== undefined) {
          // Prev event was not pressed yet - consider this the selected event
          prevEvent.pressTimeS = currentTimeS;
          prevEvent.distanceResult = prevEventResult;
          console.log('selected prevEvent:', prevEvent);
          return prevEventResult;
        } else if (nextEvent !== undefined && nextEventResult !== undefined) {
          // Prev event was not pressed yet - consider this the selected event
          nextEvent.pressTimeS = currentTimeS;
          nextEvent.distanceResult = nextEventResult;
          console.log('selected nextEvent:', nextEvent);
          return nextEventResult;
        }
        throw new Error('No threshold found'); // This is not really an error but more of a flow control hack
      })();
      const { distance, thresholdLabel, threshold, thresholdMessage, nearestEventIdx } = distanceResult;
      console.log({ thresholdLabel, thresholdMessage, distance, threshold, nearestEventIdx });
    } catch (e) {
      // console.error(e);
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

  const targetCircleY = 0;

  // cursor
  const cursorX = 0;
  const cursorY = targetCircleY;
  fill('blue');
  circle(cursorX, cursorY, 25);

  fill('red');
  const musicTrackXTimeScale = 500;
  const currentSeekPosX = currentTimeS * musicTrackXTimeScale;

  // draw target circles
  for(let i = 0; i < musicEvents.length; ++i) {
    const musicEvent = musicEvents[i];

    if (musicEvent == undefined || !isClickEvent(musicEvent)) continue;
    if (musicEvent.timeS < currentTimeS) continue;

    const x = (musicEvent.timeS * musicTrackXTimeScale) - currentSeekPosX;
    circle(x, targetCircleY, 25);

    // debug label
    push();
    fill('black');
    text(i, x, targetCircleY);
    pop();
  }

  // draw floating text for accuracy display
  for(let i = 0; i < musicEventRuntimeData.length; ++i) {
    const musicEvent = musicEventRuntimeData[i];

    if (musicEvent === undefined || musicEvent.pressTimeS === undefined || musicEvent.distanceResult === undefined) continue;

    const floatingTextTimeS = 0.5;
    const floatingTextTimeDeltaY = 30;

    const elapsedTimeSincePressS = currentTimeS - musicEvent.pressTimeS;
    const tweenPercentage = elapsedTimeSincePressS / floatingTextTimeS;
    const startY = cursorY;
    const targetY = startY - floatingTextTimeDeltaY;

    if (elapsedTimeSincePressS <= floatingTextTimeS) {
      // console.log(`elapsedTimeSincePressS: ${elapsedTimeSincePressS} currentTime:${currentTimeS} pressTimeS:${musicEvent.pressTimeS}`);
      const textString = musicEvent.distanceResult.thresholdMessage;
      const currentY = lerp(startY, targetY, tweenPercentage);
      const currentAlpha = 1;//1 - tweenPercentage;
      const baseTextColor = musicEvent.distanceResult.thresholdMessageColor;
      const textColor = color(red(baseTextColor), green(baseTextColor), blue(baseTextColor), currentAlpha);
      // console.log(`draw floating text:`, textString, currentY, currentAlpha);
      push();
      fill(textColor);
      text(textString, cursorX, currentY);
      pop();
    }
  }
  pop();
}

function mouseClicked() {
  // First click enables audio context
  if (!hasStarted) {
    hasStarted = true;
    userStartAudio();
    bingSfx.play();
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
