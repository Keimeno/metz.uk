// Sparks that fall off the pen's tip while it moves: a small ring buffer of particles with a
// little drag and gravity, emitted in proportion to how fast the pen travels.

import { prng, type Vec3 } from "./math";

export class Sparks {
  readonly max: number;
  /** xyz + seed, as the point shader reads them. */
  readonly pos: Float32Array;
  /** rgb + brightness. */
  readonly col: Float32Array;
  alive = 0;

  private vel: Float32Array;
  private age: Float32Array;
  private life: Float32Array;
  private next = 0;
  private debt = 0;
  private last: Vec3 | null = null;
  private rand = prng(11);

  constructor(max = 160) {
    this.max = max;
    this.pos = new Float32Array(max * 4);
    this.col = new Float32Array(max * 4);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max).fill(1);
    this.life = new Float32Array(max).fill(1);
  }

  /** Moves the emitter to the pen's position and steps every spark by `dt` seconds. */
  update(pen: Vec3, tint: Vec3, dt: number, enabled: boolean) {
    const r = this.rand;
    if (this.last && enabled && dt > 0) {
      const v: Vec3 = [(pen[0] - this.last[0]) / dt, (pen[1] - this.last[1]) / dt, (pen[2] - this.last[2]) / dt];
      const speed = Math.hypot(v[0], v[1], v[2]);
      // Only a moving pen throws sparks; a fast one throws more.
      this.debt += Math.min(speed * 2.2, 90) * dt;
      while (this.debt >= 1) {
        this.debt -= 1;
        const i = this.next;
        this.next = (this.next + 1) % this.max;
        const back = 0.08 + r() * 0.12;
        this.pos.set([pen[0] - v[0] * dt * r(), pen[1] - v[1] * dt * r(), pen[2] - v[2] * dt * r(), r()], i * 4);
        this.vel.set(
          [
            -v[0] * back + (r() - 0.5) * 1.6,
            -v[1] * back + (r() - 0.5) * 1.6 + 0.4,
            -v[2] * back + (r() - 0.5) * 1.6,
          ],
          i * 3
        );
        this.age[i] = 0;
        this.life[i] = 0.45 + r() * 0.8;
      }
    } else {
      this.debt = 0;
    }
    this.last = pen;

    let alive = 0;
    const drag = Math.exp(-dt * 2.2);
    for (let i = 0; i < this.max; i++) {
      if (this.age[i] >= this.life[i]) {
        this.col[i * 4 + 3] = 0;
        continue;
      }
      alive++;
      this.age[i] += dt;
      const o = i * 3;
      this.vel[o] *= drag;
      this.vel[o + 1] = this.vel[o + 1] * drag - 0.9 * dt;
      this.vel[o + 2] *= drag;
      this.pos[i * 4] += this.vel[o] * dt;
      this.pos[i * 4 + 1] += this.vel[o + 1] * dt;
      this.pos[i * 4 + 2] += this.vel[o + 2] * dt;
      const k = 1 - this.age[i] / this.life[i];
      const hot = k * k;
      this.col.set([tint[0] * 0.6 + 0.4, tint[1] * 0.6 + 0.4, tint[2] * 0.6 + 0.4, 0.9 * hot], i * 4);
    }
    this.alive = alive;
  }
}
