// A thin WebGL2 layer: context creation with capability probing, programs with cached uniform
// locations, and render targets. Just enough for one line primitive and a short post chain.

export interface GLCaps {
  gl: WebGL2RenderingContext;
  /** Float render targets, so overlapping light adds up instead of clipping. */
  floatTarget: boolean;
  renderer: string;
}

export function createContext(canvas: HTMLCanvasElement): GLCaps | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  );
  const floatExt =
    !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
  const floatTarget = floatExt && probeTarget(gl, gl.RGBA16F, gl.HALF_FLOAT);
  return { gl, floatTarget, renderer };
}

function probeTarget(gl: WebGL2RenderingContext, internal: number, type: number) {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, gl.RGBA, type, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

const HEADER = "#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n";

/** Splits a multi-part shader file into its `// @name` sections. */
export function sections(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = src.split(/^\/\/ @(\w+)\s*$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1];
  return out;
}

export class Program {
  readonly program: WebGLProgram;
  private locs = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private gl: WebGL2RenderingContext,
    vertex: string[],
    fragment: string[],
    readonly name: string
  ) {
    const vs = this.compile(gl.VERTEX_SHADER, HEADER + vertex.join("\n"));
    const fs = this.compile(gl.FRAGMENT_SHADER, HEADER + fragment.join("\n"));
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(`${name}: link failed: ${gl.getProgramInfoLog(p)}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = p;
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      const numbered = src
        .split("\n")
        .map((l, i) => `${String(i + 1).padStart(4)} ${l}`)
        .join("\n");
      throw new Error(`${this.name}: compile failed: ${log}\n${numbered}`);
    }
    return s;
  }

  use() {
    this.gl.useProgram(this.program);
    return this;
  }

  loc(name: string) {
    if (!this.locs.has(name)) this.locs.set(name, this.gl.getUniformLocation(this.program, name));
    return this.locs.get(name)!;
  }

  attrib(name: string) {
    return this.gl.getAttribLocation(this.program, name);
  }

  f(name: string, ...v: number[]) {
    const l = this.loc(name);
    if (!l) return this;
    const gl = this.gl;
    if (v.length === 1) gl.uniform1f(l, v[0]);
    else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
    else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
    else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    return this;
  }

  i(name: string, v: number) {
    const l = this.loc(name);
    if (l) this.gl.uniform1i(l, v);
    return this;
  }

  m4(name: string, m: Float32Array) {
    const l = this.loc(name);
    if (l) this.gl.uniformMatrix4fv(l, false, m);
    return this;
  }
}

export class Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w = 0;
  h = 0;

  constructor(
    private gl: WebGL2RenderingContext,
    private internal: number,
    private type: number
  ) {
    this.tex = gl.createTexture()!;
    this.fbo = gl.createFramebuffer()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  resize(w: number, h: number) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (w === this.w && h === this.h) return;
    const gl = this.gl;
    this.w = w;
    this.h = h;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.internal, w, h, 0, gl.RGBA, this.type, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.w, this.h);
  }

  dispose() {
    this.gl.deleteTexture(this.tex);
    this.gl.deleteFramebuffer(this.fbo);
  }
}

/** A float data texture read with texelFetch (no filtering needed). */
export function dataTexture(
  gl: WebGL2RenderingContext,
  internal: number,
  format: number,
  w: number,
  h: number,
  data: Float32Array | null
) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.FLOAT, data);
  return tex;
}
