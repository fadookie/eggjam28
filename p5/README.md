# BECOME A FIRST-RATE ARTIST IN JUST 30 SECONDS

Online Version is at https://eliot-l.itch.io/become-a-first-rate-artist-in-just-30-seconds - this is the readme for the offline version.

## How to run
This application is a JavaScript web app. Unfortunately due to browser security policies and the dependencies it has, double clicking it to open up the index.html in a browser won't work. It must be served up by a webserver, so drop this directory in any web server and navigate to the web server address.

I've included a Unix shell script [serve.sh](./serve.sh) to spin up a local webserver from this directory using Python 3 on port 8080, but any web server will work. To use this script, ensure Python 3 is installed and aliased to `python3` command and run:
```shell
sh serve.sh
```

If you don't have a Unix/macOS environment but do have Python, you can invoke Python directly like so from this directory:
```shell
python3 -m http.server 8080
```

Once this succeeds, navigate to http://localhost:8080 or http://127.0.0.1:8080 in your browser. on macOS you may need to allow Python to accept incoming network connections when prompted.

Explaining every possible way to spin up a webserver is unfortunately outside the scope of this document. You may also use the [online version](https://eliot-l.itch.io/become-a-first-rate-artist-in-just-30-seconds) to avoid this complexity.

## How to play

This art program is an homage to Michael Brough and Andi McClure's [BECOME A GREAT ARTIST IN JUST 10 SECONDS](https://dryad.technology/artist/) which I made for Eggjam 28. I played GREAT ARTIST when it came out circa 2014, but after an overwhelmingly decisive poll on the in the eggjam discord channel, I decided not to revisit it before making this homage. The original (IIRC) only had keyboard controls. Whereas in addition to having glitch art tools, I wanted mine to be more of a hybrid paint program with a mouse paintbrush, though with some unconventional controls and no UI outside of the canvas itself.

I'll go ahead and tell you the most important controls:  
Move the mouse to move the paintbrush.

w = Save Canvas to Image  
x = Reset Canvas  
u = Undo (The undo buffer stores 100 operations)  
r = Redo  
p = Toggle pixel snapping for brush  
g = Toggle between smooth and sharp drawing mode. This will reset the canvas.  

In the spirit of the original, I'll leave you to figure out the rest. If you want a hint, the paint controls are based on my previous art program [Rainbow Paint](https://eliot-l.itch.io/rainbow-paint). If you want another hint because this game does not (yet) use the full keyboard like GREAT ARTIST, [the keymap is defined here](./sketch.ts) starting on line 470.

I've also included a copy of the controls for Rainbow Paint below for offline use:
<details>
  <summary>Rainbow Paint Controls</summary>
  Mouse to move, when not in "always paint mode" hold left mouse button to paint.

  Mouse wheel: Change brush color when not in color cycle mode

  Mouse wheel + Ctrl: Change brush size when not in size cycle mode

  c = Toggle color cycle  
  s = Toggle size cycle  
  o = Toggle brush outline  
  a = Toggle "always paint mode"  
  t = Toggle "trace mode" (brush does not leave a trail when not in trace mode. Toggle off and back on to clear canvas.)  
</details>
<br/>

Source Code: [https://github.com/fadookie/eggjam28](https://github.com/fadookie/eggjam28)  
Made with [p5.js](https://p5js.org/).