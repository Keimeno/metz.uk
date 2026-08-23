// Draws one frame: dust, the fan, the thread and the pen's sparks into a float target with
// additive light, an optional dual-Kawase bloom on strong GPUs, and a composite onto the page's
// ink background with a touch of lens.

import type { ZenariosData } from "./data/zenarios";
import { Program, Target, dataTexture, sections, type GLCaps } from "./gl/gl";
import fanVert from "./gl/shaders/fan.vert?raw";
import linesVert from "./gl/shaders/lines.vert?raw";
import lineFrag from "./gl/shaders/line.frag?raw";
import pointsSrc from "./gl/shaders/points.glsl?raw";
import postSrc from "./gl/shaders/post.glsl?raw";
import ribbon from "./gl/shaders/ribbon.glsl?raw";
import threadVert from "./gl/shaders/thread.vert?raw";
import type { Quality } from "./quality";
import type { Scene } from "./scene";
import type { Sparks } from "./sparks";
import { LINE_POINTS } from "./stations/kit";
import { FAN_SPREAD } from "./stations/zenarios";

export interface FrameState {
  viewProj: Float32Array;
  projScale: number;
  /** Device px per CSS px, times render scale. */
  px: number;
  /** Pointer in render px (y up), pull strength, radius in px. */
  cursor: [number, number, number, number];
  reveal: number;
  collapse: number;
  /** Brightness of the path ahead of the pen. */
  ghost: number;
  /** How much the trail far behind the pen dims (0 = not at all). */
  trailDim: number;
  /** Distance where far lines start sinking into the dark. */
  fogStart: number;
  /** 0…1, the whole picture (used to cross-fade over jumps). */
  fade: number;
  /** Seconds, for living motion (pulses, dust). 0 when frozen. */
  time: number;
  /** Point index of the glint sweeping along the line. */
  glint: number;
  /** Where the pen is, for lighting the dust. */
  pen: [number, number, number];
  /** How present the dust is (quiet behind the name, fuller in flight). */
  dust: number;
  /** Glow size relative to a large desktop screen (smaller screens get tighter glow). */
  lineScale: number;
  /** The pen's nib: colour and brightness. */
  nib: [number, number, number, number];
  frame: number;
}

const BG: [number, number, number] = [11 / 255, 11 / 255, 12 / 255];
const FAN_LOW: [number, number, number] = [1.0, 0.42, 0.33];
const FAN_MID: [number, number, number] = [0.93, 0.9, 0.84];
const FAN_HIGH: [number, number, number] = [0.25, 0.9, 0.55];

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  width = 1;
  height = 1;

  private thread: Program;
  private fan: Program;
  private lines: Program;
  private points: Program;
  private down: Program;
  private up: Program;
  private composite: Program;

  private posTex: WebGLTexture;
  private linesTex: WebGLTexture;
  private colTex: WebGLTexture;
  private fanTex: WebGLTexture;
  private black: WebGLTexture;
  private emptyVao: WebGLVertexArrayObject;
  private fanVao: WebGLVertexArrayObject;
  private dustVao: WebGLVertexArrayObject;
  private sparkVao: WebGLVertexArrayObject;
  private sparkPos: WebGLBuffer;
  private sparkCol: WebGLBuffer;
  private nibVao: WebGLVertexArrayObject;
  private nibPos: WebGLBuffer;
  private nibCol: WebGLBuffer;
  private nibData = { pos: new Float32Array(4), col: new Float32Array(4) };

  private sceneTarget: Target;
  private mips: Target[] = [];
  /** `?skip=dust,fan,thread,sparks,nib` leaves layers out, for debugging. */
  private skip = new Set((new URLSearchParams(location.search).get("skip") ?? "").split(","));

  constructor(
    caps: GLCaps,
    private scene: Scene,
    private data: ZenariosData,
    private sparks: Sparks,
    public quality: Quality
  ) {
    const gl = (this.gl = caps.gl);
    const post = sections(postSrc);
    const pts = sections(pointsSrc);
    this.thread = new Program(gl, [ribbon, threadVert], [lineFrag], "thread");
    this.fan = new Program(gl, [ribbon, fanVert], [lineFrag], "fan");
    this.lines = new Program(gl, [ribbon, linesVert], [lineFrag], "lines");
    this.points = new Program(gl, [pts.vertex], [pts.fragment], "points");
    this.down = new Program(gl, [post.vertex], [post.down], "down");
    this.up = new Program(gl, [post.vertex], [post.up], "up");
    this.composite = new Program(gl, [post.vertex], [post.composite], "composite");

    this.posTex = dataTexture(gl, gl.RGBA32F, gl.RGBA, 1024, scene.rows, scene.positions);
    this.colTex = dataTexture(gl, gl.RGBA32F, gl.RGBA, 1024, scene.rows, scene.colors);
    this.linesTex = dataTexture(gl, gl.RGBA32F, gl.RGBA, LINE_POINTS + 2, Math.max(1, scene.lineCount), null);

    // Fan: one row per future, then the forecast and the median.
    const cols = data.years + 1;
    const fanRows = new Float32Array((data.trials + 2) * cols);
    fanRows.set(data.fan);
    fanRows.set(data.forecastYearly, data.trials * cols);
    fanRows.set(data.medianYearly, (data.trials + 1) * cols);
    this.fanTex = dataTexture(gl, gl.R32F, gl.RED, cols, data.trials + 2, fanRows);
    this.black = dataTexture(gl, gl.RGBA32F, gl.RGBA, 1, 1, new Float32Array(4));

    this.emptyVao = gl.createVertexArray()!;

    this.fanVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.fanVao);
    const inst = new Float32Array(data.trials * 2);
    for (let i = 0; i < data.trials; i++) {
      inst[i * 2] = data.percentile[i];
      inst[i * 2 + 1] = i / data.trials;
    }
    this.buffer(inst, gl.STATIC_DRAW);
    this.attrib(this.fan, "aPct", 1, 8, 0, 1);
    this.attrib(this.fan, "aOrder", 1, 8, 4, 1);

    this.dustVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.dustVao);
    this.buffer(scene.dust.pos, gl.STATIC_DRAW);
    this.attrib(this.points, "aPos", 4, 16, 0);
    this.buffer(scene.dust.col, gl.STATIC_DRAW);
    this.attrib(this.points, "aCol", 4, 16, 0);

    this.sparkVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.sparkVao);
    this.sparkPos = this.buffer(sparks.pos, gl.DYNAMIC_DRAW);
    this.attrib(this.points, "aPos", 4, 16, 0);
    this.sparkCol = this.buffer(sparks.col, gl.DYNAMIC_DRAW);
    this.attrib(this.points, "aCol", 4, 16, 0);

    this.nibVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.nibVao);
    this.nibPos = this.buffer(this.nibData.pos, gl.DYNAMIC_DRAW);
    this.attrib(this.points, "aPos", 4, 16, 0);
    this.nibCol = this.buffer(this.nibData.col, gl.DYNAMIC_DRAW);
    this.attrib(this.points, "aCol", 4, 16, 0);
    gl.bindVertexArray(null);

    const internal = caps.floatTarget ? gl.RGBA16F : gl.RGBA8;
    const type = caps.floatTarget ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    this.sceneTarget = new Target(gl, internal, type);
    for (let i = 0; i < 4; i++) this.mips.push(new Target(gl, internal, type));
  }

  private buffer(data: Float32Array, usage: number) {
    const gl = this.gl;
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return b;
  }

  private attrib(p: Program, name: string, size: number, stride: number, offset: number, divisor = 0) {
    const gl = this.gl;
    const loc = p.attrib(name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    gl.vertexAttribDivisor(loc, divisor);
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = this.width;
    canvas.height = this.height;
    this.sceneTarget.resize(this.width, this.height);
    let w = this.width;
    let h = this.height;
    for (const m of this.mips) {
      w = Math.max(1, w / 2);
      h = Math.max(1, h / 2);
      m.resize(w, h);
    }
  }

  render(s: FrameState) {
    const gl = this.gl;
    const scene = this.scene;

    gl.bindTexture(gl.TEXTURE_2D, this.posTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, scene.rows, gl.RGBA, gl.FLOAT, scene.positions, 0);

    this.sceneTarget.bind();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE);

    const ribbonUniforms = (p: Program) =>
      p
        .m4("uViewProj", s.viewProj)
        .f("uResolution", this.width, this.height)
        .f("uPx", s.px)
        .f("uProjScale", s.projScale)
        .f("uCursor", ...s.cursor)
        .f("uFog", s.fogStart, 0.03);

    // Dust, lit up where the pen passes.
    if (scene.dust.count > 0 && !this.skip.has("dust")) {
      const p = this.points.use();
      p.m4("uViewProj", s.viewProj)
        .f("uPx", s.px)
        .f("uSize", (0.05 * s.projScale) / s.px)
        .f("uTime", s.time)
        .f("uDrift", 1)
        .f("uPen", ...s.pen)
        .f("uPenLight", 0.5)
        .f("uFog", s.fogStart, 0.03)
        .f("uGain", s.fade * s.dust);
      gl.bindVertexArray(this.dustVao);
      gl.drawArrays(gl.POINTS, 0, scene.dust.count);
    }

    // The fan, under the thread.
    const fanCount = Math.min(this.quality.fan, this.data.trials);
    const zen = scene.zen?.fan;
    if (zen && s.reveal > 0.001 && s.collapse < 0.999 && fanCount > 0 && !this.skip.has("fan")) {
      const p = this.fan.use();
      ribbonUniforms(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fanTex);
      const alpha = 0.03 * Math.sqrt(1000 / fanCount);
      p.i("uFan", 0)
        .i("uYears", this.data.years + 1)
        .i("uForecastRow", this.data.trials)
        .i("uMedianRow", this.data.trials + 1)
        .i("uSegs", this.quality.fanSegs)
        .m4("uModel", zen.model)
        .f("uSize", zen.size.width, zen.size.height)
        .f("uReveal", s.reveal)
        .f("uCollapse", s.collapse)
        .f("uSpread", FAN_SPREAD)
        .f("uAlpha", alpha)
        .f("uWidth", 0.02)
        .f("uHalo", 1.3 * s.lineScale)
        .f("uCoreGain", 1.0)
        .f("uHaloGain", 0.16)
        .f("uLow", ...FAN_LOW)
        .f("uMid", ...FAN_MID)
        .f("uHigh", ...FAN_HIGH);
      gl.bindVertexArray(this.fanVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (this.quality.fanSegs + 1) * 2, fanCount);
    }

    // Secondary lines: edges, rings, ticks.
    if (scene.lineCount > 0 && !this.skip.has("lines")) {
      gl.bindTexture(gl.TEXTURE_2D, this.linesTex);
      if (scene.linesDirty) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LINE_POINTS + 2, scene.lineCount, gl.RGBA, gl.FLOAT, scene.lineData);
        scene.linesDirty = false;
      }
      gl.texSubImage2D(gl.TEXTURE_2D, 0, LINE_POINTS + 1, 0, 1, scene.lineCount, gl.RGBA, gl.FLOAT, scene.lineState);
      const p = this.lines.use();
      ribbonUniforms(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.linesTex);
      p.i("uLines", 0)
        .i("uK", LINE_POINTS)
        .f("uWidth", 0.03)
        .f("uHalo", 2.4 * s.lineScale)
        .f("uCoreGain", 1.0)
        .f("uHaloGain", 0.28);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, LINE_POINTS * 2, scene.lineCount);
    }

    // The thread, all of it: ahead of the pen as a faint guide.
    if (!this.skip.has("thread")) {
      const p = this.thread.use();
      ribbonUniforms(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.posTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.colTex);
      p.i("uPos", 0)
        .i("uCol", 1)
        .i("uFirst", 0)
        .i("uLast", scene.count - 1)
        .f("uHead", scene.head)
        .f("uGhost", s.ghost)
        .f("uTrail", 90, 420)
        .f("uTrailMin", 1 - s.trailDim * 0.82)
        .f("uTime", s.time)
        .f("uGlint", s.glint)
        .f("uWidth", 0.035)
        .f("uHalo", 4.0 * s.lineScale)
        .f("uGain", 1.0)
        .f("uCoreGain", 1.1)
        .f("uHaloGain", 0.22);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, scene.count * 2);
    }

    // Sparks off the pen.
    if (this.sparks.alive > 0 && !this.skip.has("sparks")) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sparkPos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sparks.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sparkCol);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sparks.col);
      const p = this.points.use();
      p.m4("uViewProj", s.viewProj)
        .f("uPx", s.px)
        .f("uSize", (0.05 * s.projScale) / s.px)
        .f("uTime", s.time)
        .f("uDrift", 0)
        .f("uPenLight", 0)
        .f("uFog", s.fogStart, 0.03)
        .f("uGain", s.fade * 1.6);
      gl.bindVertexArray(this.sparkVao);
      gl.drawArrays(gl.POINTS, 0, this.sparks.max);
    }

    // The nib: a soft point of light where the pen is.
    if (s.nib[3] > 0.001 && !this.skip.has("nib")) {
      this.nibData.pos.set([...s.pen, 0.5]);
      this.nibData.col.set(s.nib);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nibPos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.nibData.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nibCol);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.nibData.col);
      const p = this.points.use();
      p.m4("uViewProj", s.viewProj)
        .f("uPx", s.px)
        .f("uSize", (0.32 * s.projScale) / s.px)
        .f("uTime", s.time)
        .f("uDrift", 0)
        .f("uPenLight", 0)
        .f("uFog", s.fogStart, 0.03)
        .f("uGain", s.fade);
      gl.bindVertexArray(this.nibVao);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    // Bloom: blur down a mip chain, then add it back up.
    let bloomTex = this.black;
    if (this.quality.bloom) {
      gl.disable(gl.BLEND);
      gl.bindVertexArray(this.emptyVao);
      let src: Target = this.sceneTarget;
      const down = this.down.use();
      down.i("uTex", 0);
      for (const m of this.mips) {
        m.bind();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        down.f("uTexel", 1 / src.w, 1 / src.h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        src = m;
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      const up = this.up.use();
      up.i("uTex", 0);
      for (let i = this.mips.length - 1; i > 0; i--) {
        const from = this.mips[i];
        this.mips[i - 1].bind();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, from.tex);
        up.f("uTexel", 1 / from.w, 1 / from.h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      bloomTex = this.mips[0].tex;
    }

    // Composite onto the page background.
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.bindVertexArray(this.emptyVao);
    const c = this.composite.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTarget.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomTex);
    c.i("uScene", 0)
      .i("uBloom", 1)
      .f("uBloomGain", this.quality.bloom ? 0.32 : 0)
      .f("uExposure", 1.0)
      .f("uFade", s.fade)
      .f("uBg", ...BG)
      .f("uFrame", s.frame % 997)
      .f("uAberration", 0.006)
      .f("uVignette", 0.38)
      .f("uGrain", 0.014)
      .f("uAspect", this.width / this.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
