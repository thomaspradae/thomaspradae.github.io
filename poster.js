// mit-poster.js
(function () {
    const canvas = document.getElementById("mit-plate");
    const ctx = canvas.getContext("2d");
  
    // fixed internal resolution so the pixels look consistent
    const WIDTH = 420;
    const HEIGHT = 560; // 3:4 aspect
    const PIXEL = 14;   // size of each big "pixel" in px
  
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  
    // Create an offscreen canvas where we paint a smooth gradient "blob"
    const off = document.createElement("canvas");
    off.width = WIDTH;
    off.height = HEIGHT;
    const offCtx = off.getContext("2d");
  
    function drawBaseGradient() {
      // background
      offCtx.fillStyle = "#02030a";
      offCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
      // We layer a few radial gradients and use "lighter" blending to get that
      // bright center and turquoise halo.
      offCtx.globalCompositeOperation = "lighter";
  
      // central yellowish glow
      let g1 = offCtx.createRadialGradient(
        WIDTH * 0.45, HEIGHT * 0.45, 0,
        WIDTH * 0.45, HEIGHT * 0.45, WIDTH * 0.25
      );
      g1.addColorStop(0.0, "#fffde6");
      g1.addColorStop(0.3, "#ffe89c");
      g1.addColorStop(1.0, "rgba(0,0,0,0)");
      offCtx.fillStyle = g1;
      offCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
      // cyan ring
      let g2 = offCtx.createRadialGradient(
        WIDTH * 0.5, HEIGHT * 0.55, 0,
        WIDTH * 0.5, HEIGHT * 0.55, WIDTH * 0.45
      );
      g2.addColorStop(0.0, "rgba(0,255,255,0.8)");
      g2.addColorStop(0.5, "rgba(0,140,255,0.7)");
      g2.addColorStop(1.0, "rgba(0,0,0,0)");
      offCtx.fillStyle = g2;
      offCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
      // some darker blue haze
      let g3 = offCtx.createRadialGradient(
        WIDTH * 0.3, HEIGHT * 0.3, 0,
        WIDTH * 0.3, HEIGHT * 0.3, WIDTH * 0.6
      );
      g3.addColorStop(0.0, "rgba(0,60,150,0.8)");
      g3.addColorStop(1.0, "rgba(0,0,0,0)");
      offCtx.fillStyle = g3;
      offCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
      offCtx.globalCompositeOperation = "source-over";
    }
  
    function drawPixelated() {
      drawBaseGradient();
  
      // Clear visible canvas
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
  
      for (let y = 0; y < HEIGHT; y += PIXEL) {
        for (let x = 0; x < WIDTH; x += PIXEL) {
          // sample one pixel from the smooth gradient
          const { data } = offCtx.getImageData(x, y, 1, 1);
          const [r, g, b, a] = data;
  
          // skip almost-black cells to get those irregular edges
          if (r < 8 && g < 8 && b < 10) continue;
  
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
          // draw a chunky block; we offset a bit to make it feel less rigid
          ctx.fillRect(
            x,
            y + (Math.random() * 2 - 1), // tiny jitter in y
            PIXEL,
            PIXEL
          );
        }
      }
    }
  
    drawPixelated();
  
    // Optional: re-generate sometimes to add subtle flicker / glitch
    // setInterval(drawPixelated, 4000);
  })();
  