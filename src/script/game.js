let g = null,
  c = null,
  ctx = null,
  lt = 0;
const ca = { h: new Image(), s: new Image(), l: false };
function ig() {
  c = document.getElementById("cv");
  ctx = c.getContext("2d");
  sc();
  la();
  g = new GE();
  g.sg();
  requestAnimationFrame(gl);
}
function sc() {
  const mw = Math.min(window.innerWidth, 400),
    mh = window.innerHeight,
    p = 20;
  let w = mw,
    h = mh - p * 2;
  if (w > 400) w = 400;
  c.width = w;
  c.height = h;
  c.style.width = w + "px";
  c.style.height = h + "px";
  c.style.display = "block";
  c.style.margin = `${p}px auto 0`;
  ctx.imageSmoothingEnabled = false;
}
function gsf(s, w = "normal") {
  const ss = Math.round(s * C.FONT_SCALE);
  return w === "bold" ? `bold ${ss}px Arial` : `${ss}px Arial`;
}
function la() {
  let l = 0,
    t = 2;
  function cl() {
    l++;
    if (l === t) {
      ca.l = true;
    }
  }
  ca.h.onload = cl;
  ca.s.onload = cl;
  ca.h.src = "src/assets/catHappy.png";
  ca.s.src = "src/assets/catHappy.png";
}

const C = window.ClickerPawryConstants;
class P {
  constructor() {
    this.hp = C.PLAYER_BASE_STATS.MAX_HP;
    this.mh = C.PLAYER_BASE_STATS.MAX_HP;
    this.st = C.PLAYER_BASE_STATS.MAX_STAMINA;
    this.ms = C.PLAYER_BASE_STATS.MAX_STAMINA;
    this.sr = C.PLAYER_BASE_STATS.BASE_STAMINA_REGEN;
    this.bd = C.PLAYER_BASE_STATS.BASE_DAMAGE;
    this.g = 0;
    this.hf = 0;
    this.mu = { MAX_STAMINA: 0, STAMINA_REGEN: 0, ATTACK_POWER: 0 };
    this.cf = 1;
    this.sk = [];
    this.pp = 0;
    this.ru = 0;
    this.lsu = Date.now();
    this.set = 0;
    this.lfls();
  }
  snr() {
    this.ms = this.gms();
    this.sr = this.gsr();
    this.bd = this.gbd();
    this.hp = this.mh;
    this.st = this.ms;
    this.cf = 1;
    this.sk = [];
    this.pp = 0;
    this.ru = 0;
    this.lsu = Date.now();
    this.set = 0;
    this.srs();
  }
  amu() {
    this.ms = this.gms();
    this.sr = this.gsr();
    this.bd = this.gbd();
    if (this.st > this.ms) this.st = this.ms;
  }
  u(dt) {
    const ct = Date.now(),
      td = ct - this.lsu;
    this.lsu = ct;
    if (this.st <= 0 && this.set === 0) this.set = ct;
    if (this.st < this.ms) {
      const ep = 750;
      if (this.set === 0 || ct - this.set > ep) {
        const ra = (this.sr * td) / 1000;
        this.st = Math.min(this.ms, this.st + ra);
        if (this.set > 0) this.set = 0;
      }
    }
  }
  ca() {
    return this.st >= 1;
  }
  a() {
    if (this.ca()) {
      this.st = Math.max(0, this.st - 1);
      return this.bd;
    }
    return 0;
  }
  td(a, ge = null) {
    this.hp = Math.max(0, this.hp - a);
    if (ge && a > 0) ge.tde();
    return this.hp <= 0;
  }
  h(a) {
    this.hp = Math.min(this.mh, this.hp + a);
  }
  ag(a) {
    this.g += a;
    this.stls();
  }
  gms() {
    return (
      C.PLAYER_BASE_STATS.MAX_STAMINA +
      C.META_UPGRADES.MAX_STAMINA.effect(this.mu.MAX_STAMINA)
    );
  }
  gsr() {
    return (
      C.PLAYER_BASE_STATS.BASE_STAMINA_REGEN +
      C.META_UPGRADES.STAMINA_REGEN.effect(this.mu.STAMINA_REGEN)
    );
  }
  gbd() {
    return (
      C.PLAYER_BASE_STATS.BASE_DAMAGE +
      C.META_UPGRADES.ATTACK_POWER.effect(this.mu.ATTACK_POWER)
    );
  }
  cau(uk) {
    const u = C.META_UPGRADES[uk],
      cl = this.mu[uk];
    if (cl >= u.maxLevel) return false;
    const cost = u.costs[cl];
    return this.g >= cost;
  }
  bu(uk) {
    if (!this.cau(uk)) return false;
    const u = C.META_UPGRADES[uk],
      cl = this.mu[uk],
      cost = u.costs[cl];
    this.g -= cost;
    this.mu[uk]++;
    this.ms = this.gms();
    this.sr = this.gsr();
    this.bd = this.gbd();
    this.stls();
    return true;
  }
  stls() {
    try {
      const pd = {
        gold: this.g,
        metaUpgrades: this.mu,
        highestFloor: this.hf || 0,
      };
      localStorage.setItem(C.SAVE_KEYS.PERSISTENT_DATA, JSON.stringify(pd));
    } catch (e) {}
  }
  srs() {
    try {
      const rd = {
        currentFloor: this.cf,
        hp: this.hp,
        stamina: this.st,
        skills: this.sk,
        perfectParries: this.pp,
        rerollsUsed: this.ru,
      };
      localStorage.setItem(C.SAVE_KEYS.RUN_DATA, JSON.stringify(rd));
    } catch (e) {}
  }
  lfls() {
    try {
      const pd = localStorage.getItem(C.SAVE_KEYS.PERSISTENT_DATA);
      if (pd) {
        const d = JSON.parse(pd);
        this.g = d.gold || 0;
        this.hf = d.highestFloor || 0;
        this.mu = { ...this.mu, ...d.metaUpgrades };
        this.amu();
        return true;
      }
    } catch (e) {}
    return false;
  }
  lrs() {
    try {
      const rd = localStorage.getItem(C.SAVE_KEYS.RUN_DATA);
      if (rd) {
        const d = JSON.parse(rd);
        this.cf = d.currentFloor || 1;
        this.hp = d.hp || this.mh;
        this.st = d.stamina || this.ms;
        this.sk = d.skills || [];
        this.pp = d.perfectParries || 0;
        this.ru = d.rerollsUsed || 0;
        return true;
      }
    } catch (e) {}
    return false;
  }
}

class PE {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.l = 400;
    this.ml = 400;
    this.s = 0;
    this.ms = 2.0;
  }
  u(dt) {
    this.l -= dt;
    const p = 1 - this.l / this.ml;
    if (p < 0.3) this.s = (p / 0.3) * this.ms;
    else {
      const sp = (p - 0.3) / 0.7;
      this.s = this.ms * (1 - sp);
    }
    return this.l > 0;
  }
  d(ctx) {
    if (this.s <= 0) return;
    const a = Math.max(0, this.l / this.ml);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(this.x, this.y);
    ctx.scale(this.s, this.s);
    this.dp(ctx);
    ctx.restore();
  }
  dp(ctx) {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const tp = [
      { x: -8, y: -10 },
      { x: -3, y: -12 },
      { x: 3, y: -12 },
      { x: 8, y: -10 },
    ];
    tp.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

class PT {
  constructor(x, y, c, v, s, l) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.v = v;
    this.s = s;
    this.l = l;
    this.ml = l;
    this.g = 0.1;
  }
  u(dt) {
    this.x += (this.v.x * dt) / 16;
    this.y += (this.v.y * dt) / 16;
    this.v.y += this.g;
    this.l -= dt;
    const a = this.l / this.ml;
    return a > 0;
  }
  d(ctx) {
    const a = Math.max(0, this.l / this.ml);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.c;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class R {
  constructor(t, st, d, sr = 60, tr = 30) {
    this.t = t;
    this.st = st;
    this.d = d;
    this.sr = sr;
    this.tr = tr;
    this.ia = true;
    this.hi = false;
    this.x = 0;
    this.y = 0;
  }
  gp(ct) {
    return Math.min(1, (ct - this.st) / this.d);
  }
  gcr(ct) {
    const p = this.gp(ct);
    return this.sr - (this.sr - this.tr) * p;
  }
  hrt(ct) {
    return this.gp(ct) >= 1;
  }
  gpt(ct, wm = 1) {
    const tti = this.st + this.d - ct,
      at = Math.abs(tti),
      pw = C.PARRY_WINDOWS.PERFECT * wm,
      gw = C.PARRY_WINDOWS.GOOD * wm;
    if (at <= pw) return "perfect";
    if (at <= gw) return "good";
    return "miss";
  }
  ici(cx, cy, ct) {
    const cr = this.gcr(ct),
      d = Math.sqrt((cx - this.x) ** 2 + (cy - this.y) ** 2);
    return d <= cr;
  }
}

class GS {
  constructor() {
    this.cs = "lobby";
    this.p = null;
    this.ce = null;
    this.r = [];
    this.dc = [];
    this.lat = 0;
    this.nrt = 0;
    this.bm = false;
    this.bd = 0;
  }
  tt(ns) {
    this.cs = ns;
    if (ns === "draft") this.gdc();
    else if (ns === "fight") this.cef();
  }
  gdc() {
    this.dc = [];
    this.dc.push({ option: DRAFT_OPTIONS.HEAL, type: "heal" });
    this.dc.push({ option: DRAFT_OPTIONS.GOLD, type: "gold" });
  }
  sdc(i) {
    if (i >= 0 && i < this.dc.length) {
      const choice = this.dc[i];
      switch (choice.type) {
        case "heal":
          this.p.h(2);
          break;
        case "gold":
          this.p.ag(20);
          break;
      }
      if (this.eem) {
        this.cef();
        this.tt("endless");
      } else {
        this.tt("fight");
      }
    }
  }
  cef() {
    const f = this.p.cf;
    let bh = 20 * Math.pow(1.15, f - 1);
    const a = this.gaf(f);
    this.ce = {
      hp: Math.floor(bh),
      maxHp: Math.floor(bh),
      archetype: a,
      archetypeData: C.ENEMY_ARCHETYPES[a],
      damageFlashUntil: 0,
    };
    this.r = [];
    this.lat = 0;
    this.nrt = Date.now() + 1000;
  }
  gaf(f) {
    const a = Object.keys(C.ENEMY_ARCHETYPES);
    return a[Math.floor(Math.random() * a.length)];
  }
  hc(x, y, ct) {
    if (!this.ce || this.ce.hp <= 0) return null;
    const pr = this.ap(ct, x, y);
    if (pr) {
      let d = this.p.bd;
      if (pr.timing === "perfect") {
        this.p.pp++;
        d = this.p.bd * 2;
      }
      d = Math.ceil(d);
      this.ce.hp = Math.max(0, this.ce.hp - d);
      this.ce.damageFlashUntil = ct + 200;
      if (this.ce.hp <= 0) this.hv();
      return { parry: pr, damage: d };
    }
  }
  hv() {
    const gr = this.cgr();
    this.lgr = gr;
    this.p.ag(gr);
    if (this.p.cf > this.p.hf) {
      this.p.hf = this.p.cf;
      if (window.updateRecordDisplay) window.updateRecordDisplay();
    }
    this.p.cf++;
    this.p.srs();
    if (this.p.cf === 13) this.eem = true;
    this.tt("victory");
  }
  hd() {
    this.rf = this.p.cf;
    this.p.hp = this.p.mh;
    this.p.cf = 1;
    this.p.pp = 0;
    this.tt("defeat");
  }
  ap(ct, cx, cy) {
    let cr = [];
    for (const r of this.r) {
      if (!r.ia || r.hi) continue;
      if (r.ici(cx, cy, ct)) {
        const tti = r.st + r.d - ct,
          at = Math.abs(tti);
        cr.push({ ring: r, absTime: at, spawnTime: r.st });
      }
    }
    if (cr.length === 0) return null;
    cr.sort((a, b) => {
      if (Math.abs(a.absTime - b.absTime) < 100)
        return a.spawnTime - b.spawnTime;
      return a.absTime - b.absTime;
    });
    const nr = cr[0].ring;
    const t = nr.gpt(ct, 1);
    nr.ia = false;
    nr.hi = true;
    if (this.ge) this.ge.crp(nr.x, nr.y, nr.t, t !== "miss");
    if (t !== "miss") return { ring: nr, timing: t };
    return null;
  }
  cbp(ct) {
    return false;
  }
  cgr() {
    const br = Math.floor(10 + this.p.cf * 2 + Math.random() * 5);
    const pb = Math.min(5, this.p.pp);
    let r = br + pb;
    if (this.p.cf > 13) {
      const el = this.p.cf - 13;
      r = Math.floor(r * (1 + 0.1 * el));
    }
    return r;
  }
  u(dt) {
    if (this.p) this.p.u(dt);
    if (
      (this.cs === "fight" || this.cs === "endless") &&
      this.ce &&
      this.ce.hp > 0
    )
      this.uc();
  }
  uc() {
    const ct = Date.now();
    this.ubm();
    this.ur(ct);
    this.gr(ct);
  }
  ubm() {
    if (this.bm) {
      const dr = 100 / 2000,
        da = dr * 16;
      this.p.st = Math.max(0, this.p.st - da);
      if (this.p.st <= 0) this.bm = false;
    }
  }
  cub() {
    return !this.bm && this.p.st >= this.p.ms;
  }
  ab() {
    if (this.cub()) {
      this.bm = true;
      return true;
    }
    return false;
  }
  ur(ct) {
    for (let i = this.r.length - 1; i >= 0; i--) {
      const r = this.r[i];
      if (!r.ia) {
        this.r.splice(i, 1);
        continue;
      }
      if (r.hrt(ct) && !r.hi) {
        r.hi = true;
        this.hri(r);
      }
      if (ct - r.st > r.d + 1000) this.r.splice(i, 1);
    }
  }
  hri(r) {
    if (this.ge) this.ge.crp(r.x, r.y, r.t, false);
    if (this.bm) return;
    let d = C.RING_DAMAGE.MAJOR[r.t];
    const id = this.p.td(d, this.ge);
    if (id) this.hd();
  }
  gsp(nr) {
    const m = 40,
      md = 80,
      ma = 50;
    const cw = typeof c !== "undefined" && c ? c.width : 400,
      ch = typeof c !== "undefined" && c ? c.height : 600;
    const th = 90,
      bh = 80;
    for (let a = 0; a < ma; a++) {
      const x = m + Math.random() * (cw - 2 * m),
        y = th + m + Math.random() * (ch - th - bh - 2 * m);
      let tc = false;
      for (const r of this.r) {
        if (!r.ia) continue;
        const d = Math.sqrt((x - r.x) ** 2 + (y - r.y) ** 2);
        if (d < md) {
          tc = true;
          break;
        }
      }
      if (!tc) {
        nr.x = x;
        nr.y = y;
        return;
      }
    }
    nr.x = m + Math.random() * (cw - 2 * m);
    nr.y = th + m + Math.random() * (ch - th - bh - 2 * m);
  }
  gr(ct) {
    if (ct < this.nrt) return;
    const a = this.ce.archetypeData;
    switch (this.ce.archetype) {
      case "A":
      case "C":
        this.gcr(ct, a);
        break;
    }
  }
  gcr(ct, a) {
    const rt = this.srt(a.patterns),
      d = this.grd(rt, a);
    const nr = new R(rt, ct, d);
    this.gsp(nr);
    this.r.push(nr);
    let i = a.interval;
    const fim = Math.max(0.5, 1 - (this.p.cf - 1) * 0.05);
    i *= fim;
    this.nrt = ct + i;
  }
  srt(p) {
    const r = Math.random();
    if (r < p.white) return C.RING_TYPES.WHITE;
    return C.RING_TYPES.RED;
  }
  grd(rt, a) {
    const bd = a.ringDurations[rt.toLowerCase()];
    let d = bd || 1300;
    const fsm = Math.max(0.6, 1 - (this.p.cf - 1) * 0.04);
    d *= fsm;
    return d;
  }
}

class GE {
  constructor() {
    this.p = new P();
    this.gs = new GS();
    this.gs.p = this.p;
    this.gs.ge = this;
    this.fm = [];
    this.ss = { x: 0, y: 0, d: 0 };
    this.rf = { a: 0, d: 0 };
    this.cdt = 0;
    this.pt = [];
    this.pe = [];
    this.ei = {};
    this.lei();
    this.sih();
    this.sr = {
      lobby: this.rl.bind(this),
      draft: this.rd.bind(this),
      fight: this.renderFight.bind(this),
      victory: this.rv.bind(this),
      defeat: this.rdf.bind(this),
      endless: this.renderFight.bind(this),
    };
  }
  lei() {
    const ifs = {
      A: "src/assets/miceEnemy.png",
      C: "src/assets/dogEnemy.png",
    };
    Object.entries(ifs).forEach(([a, p]) => {
      const i = new Image();
      i.onload = () => {
        this.ei[a] = i;
      };
      i.src = p;
    });
  }
  sg() {
    const hpd = this.p.lfls(),
      hrd = this.p.lrs();
    if (hpd || hrd) {
    } else {
      this.p.snr();
    }
    this.gs.tt("lobby");
  }
  sih() {
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      this.hi(x, y);
    });
    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      this.hmm(x, y);
    });
    window.addEventListener("keydown", (e) => {
      this.hki(e.key);
    });
  }
  hi(x, y) {
    const ct = Date.now();
    switch (this.gs.cs) {
      case "lobby":
        this.hli(x, y);
        break;
      case "draft":
        this.hdi(x, y);
        break;
      case "fight":
      case "endless":
        this.hfi(x, y, ct);
        break;
      case "victory":
        this.gs.tt("draft");
        break;
      case "defeat":
        this.gs.tt("lobby");
        break;
    }
  }
  hki(k) {
    switch (k) {
      case "Escape":
        if (this.gs.cs === "fight") this.gs.tt("lobby");
        break;
      case "1":
      case "2":
        if (this.gs.cs === "draft") {
          const choice = parseInt(k) - 1;
          this.gs.sdc(choice);
        }
        break;
    }
  }
  hmm(x, y) {}
  u(dt) {
    this.gs.u(dt);
    this.ufm(dt);
    this.ude(dt);
    this.hr();
  }
  afm(t, x, y) {
    this.fm.push({
      text: t,
      x: x,
      y: y,
      startTime: Date.now(),
      duration: 1000,
    });
  }
  tde() {
    this.ss = {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      duration: 200,
    };
    this.rf = { a: 0.15, d: 200 };
    this.cdt = 1000;
  }
  ufm(dt) {
    const ct = Date.now();
    this.fm = this.fm.filter((m) => ct - m.startTime < m.duration);
  }
  ude(dt) {
    if (this.ss.d > 0) {
      this.ss.d -= dt;
      if (this.ss.d <= 0) {
        this.ss.x = 0;
        this.ss.y = 0;
      }
    }
    if (this.rf.d > 0) {
      this.rf.d -= dt;
      this.rf.a = Math.max(0, (this.rf.d / 200) * 0.15);
    }
    if (this.cdt > 0) this.cdt -= dt;
    this.upt(dt);
    this.upe(dt);
  }
  upt(dt) {
    for (let i = this.pt.length - 1; i >= 0; i--) {
      const p = this.pt[i],
        a = p.u(dt);
      if (!a) this.pt.splice(i, 1);
    }
  }
  crp(x, y, rt, s) {
    const pc = s ? 12 : 8,
      bc = this.grc(rt),
      cs = s ? [`${bc}`, "#fff", "#ff0"] : ["#f00", "#f44", "#a00"];
    for (let i = 0; i < pc; i++) {
      const a = (Math.PI * 2 * i) / pc + Math.random() * 0.3,
        sp = s ? 3 + Math.random() * 2 : 2 + Math.random() * 1.5,
        v = { x: Math.cos(a) * sp, y: Math.sin(a) * sp - Math.random() * 2 },
        c = cs[Math.floor(Math.random() * cs.length)],
        sz = s ? 2 + Math.random() * 2 : 1.5 + Math.random() * 1.5,
        l = s ? 800 + Math.random() * 400 : 600 + Math.random() * 300;
      this.pt.push(new PT(x, y, c, v, sz, l));
    }
  }
  grc(rt) {
    switch (rt) {
      case C.RING_TYPES.WHITE:
        return "#fff";
      case C.RING_TYPES.RED:
        return "#e34a4a";
      default:
        return "#fff";
    }
  }
  upe(dt) {
    for (let i = this.pe.length - 1; i >= 0; i--) {
      const pe = this.pe[i],
        a = pe.u(dt);
      if (!a) this.pe.splice(i, 1);
    }
  }
  cpe(x, y) {
    this.pe.push(new PE(x, y));
  }
  hr() {
    if (!this.rt) {
      this.rt = setTimeout(() => {
        sc();
        this.rt = null;
      }, 100);
    }
  }
  r() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    if (this.ss.d > 0) ctx.translate(this.ss.x, this.ss.y);
    const renderer = this.sr[this.gs.cs];
    if (renderer) renderer();
    ctx.restore();
    if (this.rf.a > 0) {
      ctx.fillStyle = `rgba(255,0,0,${this.rf.a})`;
      ctx.fillRect(0, 0, c.width, c.height);
    }
  }
  rl() {
    this.dt("LOBBY");
    this.dps();
    this.dmu();
    this.dsb();
  }
  rd() {
    this.dt(`FLOOR ${this.p.cf}/12`);
    if (this.p.cf >= 13) {
      ctx.fillStyle = "#FFD700";
      ctx.font = gsf(18, "bold");
      ctx.textAlign = "center";
      ctx.fillText("🎉Congratz", c.width / 2, 70);
    }
    this.dps();
    this.dsc();
  }
  renderFight() {
    this.dph();
    this.de();
    this.dr();
    this.dpt();
    this.dpe();
    this.dbb();
    this.dcab();
    this.dfm();
  }
  rv() {
    this.dt("VICTORY!");
    this.dvs();
    this.dcp();
  }
  rdf() {
    this.dt("DEFEATED");
    this.dds();
    this.drtl();
  }
  dbg() {}
  dt(t) {
    ctx.fillStyle = "#fff";
    ctx.font = gsf(24, "bold");
    ctx.textAlign = "center";
    ctx.fillText(t, c.width / 2, 40);
  }
  dps() {
    const s = [
      `Gold: ${this.p.g}`,
      `Floor: ${this.p.cf}`,
      `HP: ${this.p.hp}/${this.p.mh}`,
    ];
    ctx.fillStyle = "#ccc";
    ctx.font = gsf(16);
    ctx.textAlign = "left";
    s.forEach((st, i) => ctx.fillText(st, 20, 80 + i * 25));
  }
  dph() {
    const hy = c.height - 60,
      m = 15;
    if (ca.l) {
      let ci = this.cdt > 0 ? ca.s : this.p.hp >= 5 ? ca.h : ca.s;
      ctx.drawImage(ci, m, hy, 60, 60);
    }
    const hs = 18,
      hsp = 22,
      hsx = m + 70,
      hsy = hy + 5;
    for (let i = 0; i < this.p.mh; i++) {
      const hx = hsx + i * hsp,
        f = i < this.p.hp;
      this.dh(hx, hsy, hs, f);
    }
    ctx.fillStyle = "#fff";
    ctx.font = gsf(12);
    ctx.textAlign = "left";
    ctx.fillText(`${this.p.hp}/${this.p.mh}`, hsx, hsy + 30);
    const sw = 180,
      sh = 12,
      sx = hsx,
      sy = hy + 45;
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(sx - 1, sy - 1, sw + 2, sh + 2);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(sx, sy, sw, sh);
    const fw = (this.p.st / this.p.ms) * sw;
    if (fw > 0) {
      const g = ctx.createLinearGradient(sx, sy, sx, sy + sh);
      g.addColorStop(0, "#ff8c42");
      g.addColorStop(1, "#ff6b1a");
      ctx.fillStyle = g;
      ctx.fillRect(sx, sy, fw, sh);
    }
    ctx.fillStyle = "#ff8c42";
    ctx.font = gsf(11, "bold");
    ctx.textAlign = "center";
    ctx.fillText(`${Math.floor(this.p.st)}/${this.p.ms}`, sx + sw / 2, sy - 5);
  }
  dh(x, y, s, f) {
    const hs = s / 2;
    ctx.save();
    ctx.translate(x + hs, y + hs);
    ctx.beginPath();
    ctx.moveTo(0, hs * 0.3);
    ctx.bezierCurveTo(-hs * 0.8, -hs * 0.3, -hs * 0.8, hs * 0.3, 0, hs * 0.8);
    ctx.bezierCurveTo(hs * 0.8, hs * 0.3, hs * 0.8, -hs * 0.3, 0, hs * 0.3);
    ctx.closePath();
    if (f) {
      ctx.fillStyle = "#ff5757";
      ctx.fill();
    }
    ctx.strokeStyle = f ? "#cc3333" : "#666";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (!f) {
      ctx.fillStyle = "#222";
      ctx.fill();
    }
    ctx.restore();
  }
  de() {
    if (!this.gs.ce) return;
    const e = this.gs.ce,
      cx = c.width / 2,
      cy = c.height * 0.4,
      r = 60;
    this.des(e.archetype, cx, cy, r);
    const hbw = c.width * 0.6,
      hbh = 8,
      hbx = (c.width - hbw) / 2,
      hby = 50;
    ctx.fillStyle = "#333";
    ctx.fillRect(hbx, hby, hbw, hbh);
    const hpr = e.hp / e.maxHp;
    ctx.fillStyle = "#ff5757";
    ctx.fillRect(hbx, hby, hbw * hpr, hbh);
    ctx.fillStyle = "#fff";
    ctx.font = gsf(12, "bold");
    ctx.textAlign = "center";
    ctx.fillText(
      `HP: ${Math.ceil(e.hp)}/${e.maxHp}`,
      c.width / 2,
      hby + hbh + 15
    );
    ctx.fillStyle = "#fff";
    ctx.font = gsf(18, "bold");
    ctx.textAlign = "center";
    const an = e.archetypeData?.name || "Unknown";
    ctx.fillText(an, c.width / 2, hby - 15);
  }
  des(a, cx, cy, r) {
    ctx.save();
    const bo = Math.sin(Date.now() * 0.003) * 3,
      by = cy + bo,
      ct = Date.now(),
      isFlashing = this.ce && ct < this.ce.damageFlashUntil;
    if (isFlashing) {
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(cx, by, r * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const er = r * 1.2;
    if (this.ei[a]) {
      const i = this.ei[a],
        is = er * 2;
      ctx.drawImage(i, cx - er, by - er, is, is);
    } else {
      ctx.fillStyle = "#2b2b2b";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, by, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  dr() {
    const ct = Date.now();
    this.gs.r.forEach((r) => {
      if (!r.ia) return;
      const cr = r.gcr(ct);
      if (cr < r.tr) return;
      let c, gc;
      switch (r.t) {
        case C.RING_TYPES.WHITE:
          c = "#fff";
          gc = "rgba(255,255,255,0.3)";
          break;
        case C.RING_TYPES.RED:
          c = "#e34a4a";
          gc = "rgba(227,74,74,0.4)";
          break;
        default:
          c = "#fff";
          gc = "rgba(255,255,255,0.3)";
      }
      ctx.strokeStyle = gc;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(r.x, r.y, cr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, cr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, cr - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.tr, 0, Math.PI * 2);
      ctx.stroke();
      const tti = r.st + r.d - ct;
      if (Math.abs(tti) <= C.PARRY_WINDOWS.GOOD) {
        const t = r.gpt(ct);
        let ic;
        switch (t) {
          case "perfect":
            ic = "#0f0";
            break;
          case "good":
            ic = "#ff0";
            break;
          default:
            ic = "#f00";
        }
        ctx.fillStyle = ic;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(r.x, r.y - cr - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }
  dfm() {
    const ct = Date.now();
    this.fm.forEach((m) => {
      const e = ct - m.startTime,
        p = e / m.duration,
        a = Math.max(0, 1 - p),
        oy = p * 30;
      ctx.save();
      ctx.globalAlpha = a;
      if (m.text.includes("PERFECT")) {
        ctx.fillStyle = "#0f0";
        ctx.font = gsf(18, "bold");
      } else if (m.text.includes("GOOD")) {
        ctx.fillStyle = "#ff0";
        ctx.font = gsf(16, "bold");
      } else if (m.text.includes("DMG")) {
        ctx.fillStyle = "#ff8800";
        ctx.font = gsf(14, "bold");
      } else {
        ctx.fillStyle = "#fff";
        ctx.font = gsf(14);
      }
      ctx.textAlign = "center";
      ctx.fillText(m.text, m.x, m.y - oy);
      ctx.restore();
    });
  }
  dpt() {
    this.pt.forEach((p) => p.d(ctx));
  }
  dpe() {
    this.pe.forEach((pe) => pe.d(ctx));
  }
  dmu() {
    ctx.fillStyle = "#fff";
    ctx.font = gsf(18);
    ctx.textAlign = "left";
    ctx.fillText("Meta Upgrades:", 20, 160);
    const sy = 190,
      uh = 45;
    let yo = 0;
    Object.entries(C.META_UPGRADES).forEach(([k, u]) => {
      const cl = this.p.mu[k],
        iml = cl >= u.maxLevel,
        ca = this.p.cau(k),
        cost = iml ? 0 : u.costs[cl],
        y = sy + yo;
      ctx.fillStyle =
        ca && !iml ? "rgba(57,168,255,0.1)" : "rgba(100,100,100,0.05)";
      ctx.fillRect(15, y - 15, c.width - 30, uh - 5);
      ctx.fillStyle = iml ? "#FFD700" : ca ? "#fff" : "#888";
      ctx.font = gsf(14, "bold");
      ctx.textAlign = "left";
      ctx.fillText(`${u.name} (${cl}/${u.maxLevel})`, 25, y);
      ctx.fillStyle = "#ccc";
      ctx.font = gsf(12);
      ctx.fillText(u.description, 25, y + 15);
      ctx.textAlign = "right";
      if (iml) {
        ctx.fillStyle = "#FFD700";
        ctx.font = gsf(12, "bold");
        ctx.fillText("MAX", c.width - 25, y + 8);
      } else {
        ctx.fillStyle = ca ? "#39a8ff" : "#888";
        ctx.font = gsf(14, "bold");
        ctx.fillText(`${cost}g`, c.width - 25, y + 8);
      }
      yo += uh;
    });
    ctx.textAlign = "left";
  }
  dsc() {
    if (this.gs.dc.length === 0) return;
    const ch = 85,
      cs = 100,
      sy = Math.max(120, (c.height - 2 * cs) / 2 + 40),
      m = 15;
    ctx.fillStyle = "#fff";
    ctx.font = gsf(20);
    ctx.textAlign = "center";
    ctx.fillText("Choose an Option:", c.width / 2, sy - 50);
    this.gs.dc.forEach((choice, i) => {
      const y = sy + i * cs,
        o = choice.option;
      ctx.fillStyle = "rgba(57,168,255,0.1)";
      ctx.fillRect(m - 3, y - 30, c.width - 2 * m + 6, ch);
      ctx.strokeStyle = "rgba(57,168,255,0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(m - 3, y - 30, c.width - 2 * m + 6, ch);
      ctx.fillStyle = "#fff";
      ctx.font = gsf(18, "bold");
      ctx.textAlign = "left";
      ctx.fillText(`${o.name}`, m + 10, y - 8);
      ctx.font = gsf(12);
      ctx.fillStyle = "#ccc";
      ctx.fillText(o.description, m + 10, y + 15);
      ctx.fillStyle = "#39a8ff";
      ctx.font = gsf(32, "bold");
      ctx.textAlign = "right";
      ctx.fillText((i + 1).toString(), c.width - m - 15, y + 10);
      ctx.fillStyle = "#888";
      ctx.font = gsf(10);
      ctx.textAlign = "right";
      ctx.fillText(`Press ${i + 1} or Click`, c.width - m - 15, y + 30);
    });
  }
  dsb() {
    const bw = 200,
      bh = 50,
      bx = (c.width - bw) / 2,
      by = c.height - 100;
    ctx.fillStyle = "#39a8ff";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Start Run", c.width / 2, by + 32);
  }
  dvs() {
    ctx.fillStyle = "#6ab8ff";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Floor Cleared!", c.width / 2, 120);
    const s = [`Perfect Parries: ${this.p.pp}`, `Total Gold: ${this.p.g}`];
    ctx.fillStyle = "#ccc";
    ctx.font = "14px Arial";
    s.forEach((st, i) => {
      ctx.fillText(st, c.width / 2, 160 + i * 25);
    });
  }
  dema() {
    ctx.fillStyle = "#FFD700";
    ctx.font = gsf(16, "bold");
    ctx.textAlign = "center";
    ctx.fillText("🎉 Congratulations! 🎉", c.width / 2, 120);
    ctx.fillStyle = "#fff";
    ctx.font = gsf(14);
    ctx.fillText("You have completed the main game!", c.width / 2, 150);
    ctx.fillText("Endless mode is now unlocked!", c.width / 2, 175);
    ctx.fillStyle = "#ff8800";
    ctx.font = gsf(12);
    ctx.fillText("The difficulty will now scale infinitely", c.width / 2, 200);
    ctx.fillText("How far can you go?", c.width / 2, 220);
    const s = [`Perfect Parries: ${this.p.pp}`, `Total Gold: ${this.p.g}`];
    ctx.fillStyle = "#ccc";
    ctx.font = gsf(12);
    s.forEach((st, i) => {
      ctx.fillText(st, c.width / 2, 250 + i * 20);
    });
  }
  dds() {
    ctx.fillStyle = "#e34a4a";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Reached Floor ${this.gs.rf || this.p.cf}`, c.width / 2, 120);
    ctx.fillStyle = "#ccc";
    ctx.font = "14px Arial";
    ctx.fillText(`Gold Earned: ${this.p.g}`, c.width / 2, 160);
    ctx.fillStyle = "#FFD700";
    ctx.font = "16px Arial";
    ctx.fillText(`Best Record: Floor ${this.p.hf}`, c.width / 2, 190);
  }
  dcp() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tap to continue...", c.width / 2, c.height - 50);
  }
  drtl() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tap to return to lobby...", c.width / 2, c.height - 50);
  }
  hli(x, y) {
    const sy = 190,
      uh = 45;
    let ui = 0;
    for (const [k, u] of Object.entries(C.META_UPGRADES)) {
      const uy = sy + ui * uh;
      if (y >= uy - 15 && y <= uy + uh - 20) {
        if (this.p.cau(k)) {
          this.p.bu(k);
        }
        return;
      }
      ui++;
    }
    const by = c.height - 100;
    if (y >= by && y <= by + 50) {
      this.p.snr();
      this.gs.tt("fight");
      return;
    }
  }
  hdi(x, y) {
    const ch = 85,
      cs = 100,
      sy = Math.max(120, (c.height - 2 * cs) / 2 + 40),
      m = 15;
    this.gs.dc.forEach((choice, i) => {
      const cy = sy + i * cs;
      if (y >= cy - 30 && y <= cy + 55) {
        this.gs.sdc(i);
      }
    });
  }
  hfi(x, y, ct) {
    const bs = 60,
      m = 20,
      bx = c.width - bs - m,
      by = c.height - bs - m;
    if (x >= bx && x <= bx + bs && y >= by && y <= by + bs) {
      this.gs.ab();
      return;
    }
    if (this.gs.bm) {
      const cx = c.width / 2,
        cy = c.height / 2,
        d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d <= 40) {
        const dmg = Math.ceil(this.gs.p.bd);
        this.gs.ce.hp = Math.max(0, this.gs.ce.hp - dmg);
        this.cpe(cx, cy);
        if (this.gs.ce.hp <= 0) {
          this.gs.bm = false;
          this.gs.hv();
        }
        return;
      }
    }
    this.cpe(x, y);
    const r = this.gs.hc(x, y, ct);
    if (r && r.parry) {
      const tt = r.parry.timing.toUpperCase() + "!",
        dt = r.damage ? `${r.damage} DMG` : "";
      this.afm(tt, x, y);
      if (dt) {
        this.afm(dt, x, y - 20);
      }
    }
  }
  dbb() {
    const bs = 60,
      m = 20,
      x = c.width - bs - m,
      y = c.height - bs - m,
      cu = this.gs.cub(),
      ia = this.gs.bm;
    ctx.fillStyle = ia
      ? "rgba(255,87,87,0.8)"
      : cu
      ? "rgba(57,168,255,0.7)"
      : "rgba(100,100,100,0.5)";
    ctx.fillRect(x, y, bs, bs);
    ctx.strokeStyle = ia ? "#ff5757" : cu ? "#39a8ff" : "#666";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, bs, bs);
    ctx.fillStyle = ia ? "#FFD700" : cu ? "#fff" : "#999";
    ctx.font = gsf(24, "bold");
    ctx.textAlign = "center";
    ctx.fillText("⚡", x + bs / 2, y + bs / 2 + 8);
    if (ia) {
      const sp = this.gs.p.st / this.gs.p.ms;
      ctx.fillStyle = "rgba(106,184,255,0.8)";
      ctx.fillRect(x + 5, y + bs - 8, (bs - 10) * sp, 3);
    }
  }
  dcab() {
    if (!this.gs.bm) return;
    const br = 40,
      cx = c.width / 2,
      cy = c.height / 2,
      t = Date.now(),
      p = 0.8 + 0.2 * Math.sin(t / 100),
      cr = br * p;
    ctx.fillStyle = "rgba(255,87,87,0.8)";
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff5757";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("!", cx, cy + 8);
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText("SPAM!", cx, cy + cr + 20);
  }
}

function gl(ct) {
  const dt = ct - lt;
  lt = ct;
  if (g) {
    g.u(dt);
    g.r();
  }
  requestAnimationFrame(gl);
}
window.addEventListener("resize", () => {
  if (g) g.hr();
});
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ig);
} else {
  ig();
}
