// THE HERO GLOBE. A true sphere drawn by one small WebGL2 fragment shader, no library: the equirectangular sheet
// from scripts/build-globe.mjs is wrapped round it, lit softly from the upper left with a darker limb and a faint
// highlight, its edge antialiased. It turns on its own, one turn about every 60 s, axis tilted 12 degrees, the
// first frame centred near 65 E so Sri Lanka and the Gulf face the visitor. Device pixel ratio is capped at 2, it
// pauses off screen and in a hidden tab, and the sheet is fetched after first paint. No WebGL2: the CSS sphere
// slides the same sheet (hero.css). Reduced motion: one still frame.
const canvas = document.querySelector('[data-globe]');
const box = canvas?.closest('.hero-globe');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TURN = 60000, LON0 = 65, TILT = 12, PITCH = 14;     // ms a turn, centre longitude, axis tilt, centre latitude

const VS = `#version 300 es
in vec2 p; out vec2 v; void main(){ v = p; gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D T; uniform float lon, px; uniform mat3 R;
const float PI = 3.14159265;
void main(){
  float r = length(v);
  float a = 1. - smoothstep(1. - px * 1.6, 1., r);
  if (a <= 0.) { o = vec4(0.); return; }
  float z = sqrt(max(0., 1. - r * r));
  vec3 n = vec3(v, z);
  vec3 w = R * n;
  vec2 uv = vec2(atan(w.x, w.z) / (2. * PI) + lon, .5 - asin(clamp(w.y, -1., 1.)) / PI);
  vec2 ua = vec2(fract(uv.x), uv.y), ub = vec2(fract(uv.x + .5) - .5, uv.y);
  vec2 ax = dFdx(ua), ay = dFdy(ua), bx = dFdx(ub), by = dFdy(ub);
  bool b = abs(bx.x) + abs(by.x) < abs(ax.x) + abs(ay.x);
  vec3 c = textureGrad(T, ua, b ? bx : ax, b ? by : ay).rgb;
  vec3 L = normalize(vec3(-.55, .62, .78));
  float d = max(dot(n, L), 0.);
  float shade = .58 + .5 * d;
  float limb = mix(.62, 1., pow(z, .55));
  vec3 col = c * shade * limb;
  vec3 h = normalize(L + vec3(0., 0., 1.));
  float lum = dot(c, vec3(.299, .587, .114));
  col += vec3(1., .97, .9) * pow(max(dot(n, h), 0.), 46.) * .28 * lum;
  col = mix(col, vec3(.0, .1, .24), pow(1. - z, 3.) * .35);
  o = vec4(col * a, a);
}`;

const rot = () => {                         // view space to globe space: undo the axis tilt, then the pitch
  const t = -TILT * Math.PI / 180, q = PITCH * Math.PI / 180;   // pole leans right, centre sits north of the equator
  const ct = Math.cos(t), st = Math.sin(t), cq = Math.cos(q), sq = Math.sin(q);
  // Rz(t) then Rx(q), column major for WebGL
  const z = [ct, -st, 0, st, ct, 0, 0, 0, 1];
  const x = [1, 0, 0, 0, cq, -sq, 0, sq, cq];
  const m = new Array(9);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 3 + r] = x[r] * z[c * 3] + x[3 + r] * z[c * 3 + 1] + x[6 + r] * z[c * 3 + 2];
  return new Float32Array(m);
};

const fallback = () => box.classList.add('no-gl');

const start = () => {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return fallback();
  const sh = (k, s) => { const o = gl.createShader(k); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return fallback();
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fallback();
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const uLon = U('lon'), uPx = U('px');
  gl.uniformMatrix3fv(U('R'), false, rot());
  gl.uniform1i(U('T'), 0);

  const img = new Image();
  img.decoding = 'async';
  img.src = canvas.dataset.src;
  img.decode().then(() => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const an = gl.getExtension('EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

    let size = 0, spun = 0, last = 0, raf = 0, seen = true;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = Math.round(canvas.clientWidth * dpr);
      if (w && w !== size) { size = canvas.width = canvas.height = w; gl.viewport(0, 0, w, w); gl.uniform1f(uPx, 2 / w); }
    };
    const draw = () => {
      fit();
      gl.uniform1f(uLon, (LON0 + 180) / 360 - spun / TURN);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const tick = now => {
      raf = 0;
      if (last) spun += Math.min(now - last, 64);
      last = now; draw();
      if (run()) raf = requestAnimationFrame(tick);
    };
    const run = () => !still && seen && !document.hidden;
    const wake = () => { if (run() && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    new ResizeObserver(() => { if (!raf) draw(); }).observe(canvas);
    draw();
    box.classList.add('gl-on');
    wake();
  }).catch(fallback);
};

if (canvas && box) {
  // After first paint: the page's words and buttons come first, the sheet after.
  const go = () => (window.requestIdleCallback || (f => setTimeout(f, 200)))(start, { timeout: 1200 });
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}
