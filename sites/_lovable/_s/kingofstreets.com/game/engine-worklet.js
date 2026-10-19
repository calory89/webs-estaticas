/* King of Streets — motores sintetizados muestra a muestra (v6).
   Cada coche tiene su motor: 4 cilindros, 4 turbo, 3 cilindros, diésel, V6, V8 cruzado y eléctrico.
   Cada cilindro explota en su punto del ciclo de 720°; cada explosión es un pulso de presión con su
   ruido de combustión, distinto en cada ciclo, y sale por su bancada: colector corto + tubo largo
   resonantes, izquierda y derecha en estéreo. En el V8 cada bancada recibe las explosiones a
   intervalos desiguales y de ahí sale el "borboteo". El eléctrico es un silbido de inversor y motor. */
const PROFILES = {
  // fire: fracción del ciclo de 720°, bank: 0 izquierda / 1 derecha
  i4:  { fire: [0, 0.25, 0.5, 0.75], bank: [0, 0, 1, 1], pipe: [0.0088, 0.0094], hdr: 0.00125, bright: 1, nz: 1, turbo: 0, diesel: 0, gain: 1 },
  i4t: { fire: [0, 0.25, 0.5, 0.75], bank: [0, 0, 1, 1], pipe: [0.0081, 0.0086], hdr: 0.0011, bright: 0.85, nz: 0.8, turbo: 1, diesel: 0, gain: 1.05 },
  i3:  { fire: [0, 1/3, 2/3], bank: [0, 1, 0], pipe: [0.0092, 0.0097], hdr: 0.0013, bright: 1.1, nz: 1.1, turbo: 0.5, diesel: 0, gain: 1 },
  dsl: { fire: [0, 0.25, 0.5, 0.75], bank: [0, 0, 1, 1], pipe: [0.0102, 0.0108], hdr: 0.0015, bright: 0.6, nz: 1.8, turbo: 0.7, diesel: 1, gain: 1.05 },
  v6:  { fire: [0, 1/6, 2/6, 3/6, 4/6, 5/6], bank: [0, 1, 0, 1, 0, 1], pipe: [0.0079, 0.0083], hdr: 0.00105, bright: 1.05, nz: 0.9, turbo: 0, diesel: 0, gain: 0.95 },
  // V8 cigüeñal cruzado, orden 1-8-4-3-6-5-7-2: impares a la izquierda, pares a la derecha
  v8:  { fire: [0, 1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8], bank: [0, 1, 1, 0, 1, 0, 0, 1], pipe: [0.0072, 0.0076], hdr: 0.0009, bright: 0.9, nz: 0.85, turbo: 0, diesel: 0, gain: 0.9 },
  v8r: { fire: [0, 1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8], bank: [0, 1, 1, 0, 1, 0, 0, 1], pipe: [0.0058, 0.0061], hdr: 0.0008, bright: 1.35, nz: 1.1, turbo: 0, diesel: 0, gain: 0.95 },
  ev:  { ev: 1, gain: 0.6 }
};
class SkEngine extends AudioWorkletProcessor {
  static get parameterDescriptors(){
    return [
      { name: 'rpm', defaultValue: 900, minValue: 200, maxValue: 12000, automationRate: 'k-rate' },
      { name: 'load', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'vol', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
      { name: 'crackle', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }
  constructor(options){
    super();
    this.sr = sampleRate;
    this.th = 0; this.rpm = 900; this.load = 0; this.vol = 0; this.wob = 0; this.boost = 0;
    this.P = 16; this.amp = new Float32Array(this.P); this.age = new Float32Array(this.P); this.tau = new Float32Array(this.P);
    this.nz = new Float32Array(this.P); this.bk = new Uint8Array(this.P); this.pi = 0;
    for (let i = 0; i < this.P; i++) this.age[i] = 1e9;
    this.bank = [0, 1].map(() => ({ pipe: new Float32Array(8192), hdr: new Float32Array(1024), side: new Float32Array(2048), l: 0, m1: 0, m2: 0, hp: 0, hpx: 0 }));
    this.w = 0; this.in1 = 0; this.in2 = 0; this.env = 0; this.mech = 0; this.evp = [0, 0, 0]; this.tph = 0;
    this.seed = 12345;
    this.setProfile((options && options.processorOptions && options.processorOptions.profile) || 'i4');
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (d.pop) this.popReq = (this.popReq || 0) + d.pop;
      if (d.profile) this.setProfile(d.profile);
    };
  }
  setProfile(name){
    const p = PROFILES[name] || PROFILES.i4, sr = this.sr;
    this.pf = p; this.name = name;
    if (p.ev) return;
    const n = p.fire.length;
    // cada cilindro un pelín distinto: ni el encendido ni la fuerza son perfectos
    this.fire = p.fire.map((v, i) => (v + [0, 0.005, -0.004, 0.003, -0.002, 0.004, -0.003, 0.002][i % 8] / (n / 4) + 1) % 1);
    const spread = p.fire.length === 8 ? [1.0, 0.84, 1.12, 0.9, 1.08, 0.88, 1.05, 0.86] : [1.0, 0.93, 1.06, 0.97, 1.03, 0.95, 1.01, 0.98];
    this.cg = p.fire.map((v, i) => spread[i % 8]);
    this.D1 = [Math.round(sr * p.pipe[0]), Math.round(sr * p.pipe[1])];
    this.D2 = Math.round(sr * p.hdr); this.D3 = Math.round(sr * 0.0031);
  }
  rnd(){ this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  gauss(){ return (this.rnd() + this.rnd() + this.rnd() - 1.5) * 1.15; }
  ignite(k){
    const p = this.pf, load = this.load, rpm = this.rpm;
    let a = this.cg[k] * (0.16 + 0.84 * load) * (1 + 0.11 * this.gauss());
    let tau = (0.00042 + 0.0011 * (1 - 0.6 * load)) * Math.pow(1800 / Math.max(rpm, 900), 0.35) * (p.diesel ? 0.7 : 1);
    let nz = (0.3 + 0.25 * load) * p.nz;
    if (load < 0.1 && rpm > 2600 && !p.diesel){
      a *= 0.42;                                                       // retención: combustión pobre, borboteo
      const pc = 0.006 + this.crackle * 0.07 + (this.popReq > 0 ? 0.25 : 0);
      if (this.rnd() < pc){ a = 1.1 + this.rnd() * 1.1; tau = 0.0005; nz = 1.1; if (this.popReq > 0) this.popReq -= 0.34; }   // petardeo
    }
    if (p.diesel) a *= 0.8 + 0.35 * this.rnd();                        // traqueteo del diésel
    if (load > 0.05 && this.rnd() < 0.004) a *= 0.4;                   // algún ciclo flojo
    const i = this.pi++ % this.P;
    this.amp[i] = a; this.age[i] = 0; this.tau[i] = tau; this.nz[i] = nz; this.bk[i] = p.bank[k];
  }
  evSample(rpm, load){
    // motor eléctrico: fundamental y armónicos del motor, silbido del inversor, rodadura
    const sr = this.sr, f = rpm / 60 * 3.2;
    this.evp[0] += f / sr; this.evp[1] += f * 2.02 / sr; this.evp[2] += (2400 + rpm * 0.55) / sr;
    for (let i = 0; i < 3; i++) if (this.evp[i] > 1) this.evp[i] -= 1;
    const s1 = Math.sin(this.evp[0] * 6.2832), s2 = Math.sin(this.evp[1] * 6.2832), s3 = Math.sin(this.evp[2] * 6.2832);
    const nz = this.rnd() * 2 - 1; this.in1 += (nz - this.in1) * 0.05;
    return (s1 * 0.22 + s2 * 0.14 * (0.3 + load) + s3 * 0.05 * (0.2 + load)) * (0.25 + 0.75 * Math.min(1, rpm / 3000)) + this.in1 * 0.12 * load;
  }
  process(inputs, outputs, params){
    const L = outputs[0][0]; if (!L) return true;
    const R = outputs[0][1] || null;
    const N = L.length, sr = this.sr, p = this.pf;
    const rpmT = params.rpm[0], loadT = params.load[0], volT = params.vol[0];
    this.crackle = params.crackle[0];
    for (let n = 0; n < N; n++){
      this.rpm += (rpmT - this.rpm) * 0.0016;
      this.load += (loadT - this.load) * 0.0025;
      this.vol += (volT - this.vol) * 0.002;
      if (p.ev){
        const v = Math.tanh(this.evSample(this.rpm, this.load) * 1.2) * this.vol * p.gain;
        L[n] = v; if (R) R[n] = v; continue;
      }
      this.wob += (this.gauss() * 0.02 - this.wob * 0.0004);                // ralentí que nunca es perfecto
      const rpm = this.rpm * (1 + this.wob * 0.004 * (this.rpm < 1600 ? 1 : 0.2));
      const prev = this.th;
      this.th += rpm / 60 / 2 / sr;
      const wrapped = this.th >= 1; if (wrapped) this.th -= 1;
      for (let k = 0; k < this.fire.length; k++){
        const f = this.fire[k];
        if ((!wrapped && prev < f && this.th >= f) || (wrapped && (prev < f || this.th >= f))) this.ignite(k);
      }
      // pulsos de presión en cada bancada
      let x0 = 0, x1 = 0, e = 0;
      for (let i = 0; i < this.P; i++){
        const ag = this.age[i]; if (ag > 1e8) continue;
        const t = ag / sr, tau = this.tau[i], u = t / tau;
        if (u > 14){ this.age[i] = 1e9; continue; }
        const shape = u * Math.exp(1 - u);
        const burst = (this.rnd() * 2 - 1) * Math.exp(-u * 0.9) * this.nz[i];
        const v = this.amp[i] * (shape * 0.95 + burst * 0.35);
        if (this.bk[i]) x1 += v; else x0 += v;
        e += this.amp[i] * shape;
        this.age[i] = ag + 1;
      }
      const w = this.w, fc = (700 + 3800 * this.load * Math.min(1, rpm / 6500) + rpm * 0.18) * p.bright;
      const a1 = 1 - Math.exp(-2 * Math.PI * fc / sr);
      const outB = [0, 0];
      for (let b = 0; b < 2; b++){
        const B = this.bank[b], x = b ? x1 : x0;
        const h = x + 0.38 * B.hdr[(w - this.D2 + 1024) & 1023]; B.hdr[w & 1023] = h;
        const back = B.pipe[(w - this.D1[b] + 8192) & 8191];
        B.l += (back - B.l) * 0.42;
        const y = h - 0.58 * B.l; B.pipe[w & 8191] = y;
        const side = B.side[(w - this.D3 + 2048) & 2047];
        const y2 = y + 0.22 * side; B.side[w & 2047] = y * 0.6;
        B.m1 += (y2 - B.m1) * a1; B.m2 += (B.m1 - B.m2) * a1;
        outB[b] = B.m2;
      }
      this.w = w + 1;
      // admisión y turbo
      this.env += (e - this.env) * 0.02;
      const nz = this.rnd() * 2 - 1;
      this.in1 += (nz - this.in1) * 0.09; this.in2 += (this.in1 - this.in2) * 0.09;
      const intake = (this.in1 - this.in2) * this.env * (0.25 + this.load * 0.9) * Math.min(1, rpm / 4000) * (p.turbo ? 0.6 : 1);
      this.boost += ((p.turbo ? this.load * Math.min(1, Math.max(0, (rpm - 2200) / 3000)) : 0) - this.boost) * 0.00008;
      this.tph += (3500 + this.boost * 9000 + rpm * 0.4) / sr; if (this.tph > 1) this.tph -= 1;
      const turbo = Math.sin(this.tph * 6.2832) * this.boost * 0.035 * p.turbo;
      // mecánica: válvulas (y el traqueteo del diésel)
      this.mech = this.mech * 0.9 + (this.rnd() * 2 - 1) * 0.1;
      const mech = this.mech * (p.diesel ? 0.06 * this.env : 0.012) * (rpm / 3000);
      const common = intake * 0.9 + mech + turbo;
      for (let b = 0; b < 2; b++){
        const B = this.bank[b], s = outB[b] * 0.85 * p.gain + common;
        const hpo = s - B.hpx + 0.995 * B.hp; B.hpx = s; B.hp = hpo; outB[b] = Math.tanh(hpo * 0.9) * this.vol;
      }
      // estéreo suave: cada bancada un poco hacia su lado
      const l = outB[0] * 0.75 + outB[1] * 0.25, r = outB[1] * 0.75 + outB[0] * 0.25;
      if (R){ L[n] = l; R[n] = r; } else L[n] = (l + r) * 0.5;
    }
    return true;
  }
}
registerProcessor('sk-engine', SkEngine);
