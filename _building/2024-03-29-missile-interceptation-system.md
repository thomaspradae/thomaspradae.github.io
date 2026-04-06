---
layout: post
path: /_building/
share: true
title: Building an automated missile interception algorithm (ongoing)
description: Learning RL from scratch by building an iron dome-like system — simulation, rewards, and a lot of debugging.
summary: 
tags:
  - ml
  - projectile physics
  - reinforcement learning
excerpt: The code is pretty straight forward, we start off our simulation once a new point is generated, and we keep some track of time, I'm not sure how to fucking do this lol, as, I think we could maybe try and have discrete values, but the question might be how discrete, meaning, with each pass of time, and also, wondering, how time will pass, u see, when looking at the slider, this is basically what we need, but the thing is that how I see it, is that this is some sort of loop, and you keep it moving.
last_modified_at: 2026-04-03
---

This post is intentionally **dense**: lists, blockquotes, math, tables, images with captions, and footnotes that link out (and even sneak in a line of code). If the layout survives this, it survives anything.[^1]

[^1]: Meta-footnote: this paragraph exists to stress-test [footnotes-to-gutter.js](/assets/js/footnotes-to-gutter.js), sidenotes, and long footnote bodies. Inline check: `python -m pip install -e .`

## Overview

The project is a 3D-ish intercept simulation: incoming threats move along ballistic-ish arcs; a defender learns *when* to launch and *how* to steer mid-course corrections so the interceptor meets the threat. Think less “production missile defense” and more “gym environment where I can iterate on reward shaping without filing export paperwork.”[^2]

[^2]: Not a weapons system. Toy research code. If you need real intercept math, start with [proportional navigation](https://en.wikipedia.org/wiki/Proportional_navigation) and a proper aerospace textbook — e.g. Zarchan, *Tactical and Strategic Missile Guidance*.

Unordered laundry list of what actually exists in the repo today:

- **Simulation core:** discrete time steps, configurable gravity, drag hacks[^3], noisy sensors.
- **Policy:** started with a hand-tuned PD-ish baseline, moving toward PPO/SAC-style updates (see log).
- **Visualization:** WebGL preview + offline GIF exports for debugging angles and bone rig stupidity.

[^3]: Drag is not “real” yet — it is a scalar fudge you tune until trajectories *look* plausible: `drag_coeff * velocity ** 2` with clamps.

### What “done” means (for now)

1. Reproducible training runs with a fixed seed.
2. Intercept rate above random on a held-out threat distribution.
3. A single command to record a rollout GIF for the README.
4. Stop lying to myself in the README about how finished any of this is.

> **Note:** The hardest part hasn’t been neural networks. It’s *time*. When your simulation step isn’t aligned with how you log events, you get “ghost” intercepts that never happened — only your instrumentation thinks they did.

Nested blockquote, because why not:

> Early prototype mantra:
>
> > Make it run. Make it right. Make it fast.  
> > (I’m still somewhere between one and two.)

## Log and Notes

A longer, messier stream of thoughts + experiments lives in the dedicated notes page: [missile interception — log + notes](/notes/missile-interception-system-log-and-notes). Below is the “executive summary” version with **figures**.

<div class="figures-counted" markdown="1">

![Still from the intercept visualization — threats, defender, and debug vectors](/assets/images/posts/missiles.png)
*Prototype view: intercept geometry + debug vectors (colors are meaningless; joy is real).*

![RL training GIF — policy fiddling with bone / angle targets](/assets/images/posts/episode_13_v8_dqn_bone_angle.gif)
*Episode clip: angle / “bone” targets moving as the policy figures out it should not yeet the interceptor into the floor.*

![Earlier episode capture](/assets/images/posts/episode_11.gif)
*Older rollout export — kept around as a reminder that “bad but moving” beats “perfect but never run.”*

</div>

### Vocabulary (definition list)

Kramdown-style definitions — handy for glossaries:

RL loop
: Agent observes state \\(s_t\\), emits action \\(a_t\\), environment returns \\(s_{t+1}\\) and reward \\(r_t\\). Rinse[^4].

Interceptor
: The controllable object trying to meet the threat; not assumed to have unlimited lateral acceleration.

Threat
: Anything you want to not reach the protected volume — modeled as a point mass first, fancier later.

[^4]: If you want the formalism: [MDP](https://en.wikipedia.org/wiki/Markov_decision_process). Implementation detail: my state is *not* Markov yet — there’s hidden history in the integrator unless I augment the observation.

## Simulation sketch (code)

### Python — environment step (toy)

```python
@dataclass
class Vec3:
    x: float
    y: float
    z: float

    def __add__(self, o: "Vec3") -> "Vec3":
        return Vec3(self.x + o.x, self.y + o.y, self.z + o.z)

    def scale(self, s: float) -> "Vec3":
        return Vec3(self.x * s, self.y * s, self.z * s)

def step(pos: Vec3, vel: Vec3, acc: Vec3, dt: float) -> tuple[Vec3, Vec3]:
    """Semi-implicit Euler — good enough until energy blows up."""
    vel_next = vel + acc.scale(dt)
    pos_next = pos + vel_next.scale(dt)
    return pos_next, vel_next
```

### Bash — one-liner to grep my own chaos

```bash
rg -n "TODO|FIXME|WTF" src/ notes/ --glob '!_site/**'
```

### JavaScript — time slider mental model (what broke my brain)

```javascript
// Discrete ticks; "continuous" feel is just small dt + good interpolation.
function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

export function advanceTime(t, dt, tMax) {
  return clamp(t + dt, 0, tMax);
}
```

### GLSL — fake “heat” in the debug view (fragment idea)

```glsl
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uThreatPos;
uniform vec2 uInterceptPos;

void main() {
  float dThreat = distance(vUv, uThreatPos);
  float dIntercept = distance(vUv, uInterceptPos);
  float heat = exp(-12.0 * dThreat) + 0.6 * exp(-10.0 * dIntercept);
  vec3 col = mix(vec3(0.05, 0.07, 0.12), vec3(1.0, 0.35, 0.1), heat);
  gl_FragColor = vec4(col, 1.0);
}
```

### JSON — config fragment

```json
{
  "simulation": {
    "dt": 0.02,
    "max_episode_seconds": 45,
    "integrator": "semi_implicit_euler"
  },
  "rewards": {
    "intercept_bonus": 100.0,
    "distance_shaping": true
  }
}
```

## Reward hacking (ordered list of failure modes)

1. Agent learns to stall just inside the success radius without intercepting — *looks* good in logs, *is* cowardice.
2. Huge terminal reward causes value explosions; advantage estimates go brrr.
3. Shaped distance rewards fight terminal sparse rewards unless you schedule curriculum.
4. You “fix” (3) by adding more terms until the reward is a Christmas tree and nobody knows what’s being optimized.

Table: **what I thought vs what the metrics said**

| Phase | What I believed | What eval showed |
| --- | --- | --- |
| Week 1 | “Distance shaping will help exploration” | Learned to orbit |
| Week 2 | “Bigger intercept bonus fixes orbit” | Learned to slam into terrain |
| Week 3 | “Penalize crash” | Learned to do nothing |
| Week 4 | “Tune penalties” | Finally something like intercept |

## Links, footnotes, and cross-refs

- Internal: [writing index](/writing/) · [this site’s notes](/notes/)
- External resources I keep reopening: [Spinning Up in Deep RL](https://spinningup.openai.com/en/latest/) · [Stable-Baselines3 docs](https://stable-baselines3.readthedocs.io/)

Reward shaping sketch (don’t copy-paste blindly):[^5]

[^5]: \\(r_t = -\alpha \&#124;p_{\text{int}} - p_{\text{threat}}\&#124;_2 + \beta \mathbb{1}_{\text{hit}}\\). In code: `reward = -alpha * dist + beta * float(hit)`. Compare with [Hugging Face RL notes](/notes/hugging-face-rl-course) for the bigger picture.

## Table stress tests (long cells, code, TeX, dollars)

| Symptom | Likely cause | Quick check |
| --- | --- | --- |
| Loss goes `nan` after ~2k steps | Bad learning rate or `log(0)` in policy | `torch.isfinite(loss).all()`; clamp `logits` |
| Interceptor orbits forever | Distance-only shaping with no terminal intercept term | Inspect \\(\mathbb{E}[r_T]\\) vs shaped \\(\sum \gamma^k r_k\\) |
| Policy ignores threat | Observation normalization off or wrong frame | Print `obs.min()`, `obs.max()` each eval |

*Footer: three-column layout with inline code and inline math \\(\mathbb{E}[\cdot]\\).*

| Budget line item | Amount | Notes |
| --- | --- | --- |
| GPU hours | \$12/hr spot × 40h | Escaped dollars for spreadsheet brain |
| Coffee | \$4.50 × 2/day × 30 | Same — `\$` not math |
| Emotional damage | Priceless | Long text cell: this row exists to see whether a joking label plus a medium-length explanation still wraps cleanly when the table is full-width and the type is Crimson Pro at ~1.1rem. If anything clips or the baseline looks wrong, that’s a signal to tweak `td` padding or `vertical-align`. |

*Footer: currency + a deliberately verbose third column.*

<div class="figures-counted" markdown="1">

| Integrator | Update | Stability |
| --- | --- | --- |
| Euler | `v += a*dt; x += v*dt` | Meh |
| Semi-implicit | `v += a*dt; x += v*dt` (order swap) | Better energy |
| RK4 | four `k` stages | Overkill for this prototype |

*Counted block: first table should get “Table 1 —” if your CSS counter is active.*

| Constraint | Expression | Code |
| --- | --- | --- |
| Speed cap | \\(\&#124;v\&#124; \leq v_{\max}\\) | `v = v * min(1.0, v_max / (torch.norm(v)+1e-8))` |
| No-fly | altitude \\(h \geq h_{\min}\\) | `penalty = torch.relu(h_min - h) ** 2` |

*Second table in same block — should read “Table 2 —”.*

</div>

## Extreme table torture

Pure layout stress: horizontal scroll, vertical scroll, dense grids, mixed modalities. If anything looks off, tweak `.page-content table` in `fugg2.css` — not your prose.

### Absurdly wide grid (12 columns × 17 data rows)

| **C0** | **C1** | **C2** | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `row_00` | \(x_{0,1}\) | `np.float32` | v0_3 | v0_4 | `pow(2,0)` | v0_6 | v0_7 | v0_8 | v0_9 | v0_10 | v0_11 |
| `row_01` | \(x_{1,1}\) | `torch.Tensor` | v1_3 | v1_4 | v1_5 | v1_6 | v1_7 | v1_8 | v1_9 | v1_10 | v1_11 |
| `row_02` | \(x_{2,1}\) | `torch.Tensor` | v2_3 | v2_4 | v2_5 | v2_6 | v2_7 | v2_8 | v2_9 | v2_10 | v2_11 |
| `row_03` | \(x_{3,1}\) | `np.float32` | v3_3 | v3_4 | v3_5 | v3_6 | v3_7 | v3_8 | v3_9 | v3_10 | v3_11 |
| `row_04` | \(x_{4,1}\) | `torch.Tensor` | v4_3 | v4_4 | `pow(2,4)` | v4_6 | v4_7 | v4_8 | v4_9 | v4_10 | v4_11 |
| `row_05` | \(x_{5,1}\) | `torch.Tensor` | v5_3 | v5_4 | v5_5 | v5_6 | v5_7 | v5_8 | v5_9 | v5_10 | v5_11 |
| `row_06` | \(x_{6,1}\) | `np.float32` | v6_3 | v6_4 | v6_5 | v6_6 | v6_7 | v6_8 | v6_9 | v6_10 | v6_11 |
| `row_07` | \(x_{7,1}\) | `torch.Tensor` | v7_3 | v7_4 | v7_5 | v7_6 | v7_7 | v7_8 | v7_9 | v7_10 | Mega-cell: word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word … |
| `row_08` | \(x_{8,1}\) | `torch.Tensor` | v8_3 | v8_4 | `pow(2,0)` | v8_6 | v8_7 | v8_8 | v8_9 | v8_10 | v8_11 |
| `row_09` | \(x_{9,1}\) | `np.float32` | v9_3 | v9_4 | v9_5 | v9_6 | v9_7 | v9_8 | v9_9 | v9_10 | v9_11 |
| `row_10` | \(x_{10,1}\) | `torch.Tensor` | v10_3 | v10_4 | v10_5 | v10_6 | v10_7 | v10_8 | v10_9 | v10_10 | v10_11 |
| `row_11` | \(x_{11,1}\) | `torch.Tensor` | v11_3 | v11_4 | v11_5 | v11_6 | v11_7 | v11_8 | v11_9 | v11_10 | v11_11 |
| `row_12` | \(x_{12,1}\) | `np.float32` | v12_3 | v12_4 | `pow(2,4)` | v12_6 | v12_7 | v12_8 | v12_9 | v12_10 | v12_11 |
| `row_13` | \(x_{13,1}\) | `torch.Tensor` | v13_3 | v13_4 | v13_5 | v13_6 | v13_7 | v13_8 | v13_9 | v13_10 | v13_11 |
| `row_14` | \(x_{14,1}\) | `torch.Tensor` | v14_3 | v14_4 | v14_5 | v14_6 | v14_7 | v14_8 | v14_9 | v14_10 | v14_11 |
| `row_15` | \(x_{15,1}\) | `np.float32` | v15_3 | v15_4 | v15_5 | v15_6 | v15_7 | v15_8 | v15_9 | v15_10 | v15_11 |
| `row_16` | \(x_{16,1}\) | `torch.Tensor` | v16_3 | v16_4 | `pow(2,0)` | v16_6 | v16_7 | v16_8 | v16_9 | v16_10 | v16_11 |

*Wide grid footer — check overflow-x, cell padding, and last-column long text.*

### Absurdly tall runbook (4 columns × 54 data rows)

| # | Status | Command / token | Note |
| --- | --- | --- | --- |
| 0 | `OK` | `torchrun --nproc_per_node=2 train.py --seed 0` | \( \sum_{k=1}^{n} k = n(n+1)/2 \) for sanity check 0 |
| 1 | `WARN` | `pytest -q tests/test_001.py` | tick 1 |
| 2 | `FAIL` | `pytest -q tests/test_002.py` | tick 2 |
| 3 | `SKIP` | `pytest -q tests/test_003.py` | tick 3 |
| 4 | `OK` | `pytest -q tests/test_004.py` | tick 4 |
| 5 | `WARN` | `torchrun --nproc_per_node=2 train.py --seed 5` | tick 5 |
| 6 | `FAIL` | `pytest -q tests/test_006.py` | tick 6 |
| 7 | `SKIP` | `pytest -q tests/test_007.py` | tick 7 |
| 8 | `OK` | `pytest -q tests/test_008.py` | tick 8 |
| 9 | `WARN` | `pytest -q tests/test_009.py` | tick 9 |
| 10 | `FAIL` | `torchrun --nproc_per_node=2 train.py --seed 10` | tick 10 |
| 11 | `SKIP` | `pytest -q tests/test_011.py` | \( \sum_{k=1}^{n} k = n(n+1)/2 \) for sanity check 11 |
| 12 | `OK` | `pytest -q tests/test_012.py` | tick 12 |
| 13 | `WARN` | `pytest -q tests/test_013.py` | tick 13 |
| 14 | `FAIL` | `pytest -q tests/test_014.py` | tick 14 |
| 15 | `SKIP` | `torchrun --nproc_per_node=2 train.py --seed 15` | tick 15 |
| 16 | `OK` | `pytest -q tests/test_016.py` | tick 16 |
| 17 | `WARN` | `pytest -q tests/test_017.py` | tick 17 |
| 18 | `FAIL` | `pytest -q tests/test_018.py` | tick 18 |
| 19 | `SKIP` | `pytest -q tests/test_019.py` | tick 19 |
| 20 | `OK` | `torchrun --nproc_per_node=2 train.py --seed 20` | tick 20 |
| 21 | `WARN` | `pytest -q tests/test_021.py` | tick 21 |
| 22 | `FAIL` | `pytest -q tests/test_022.py` | \( \sum_{k=1}^{n} k = n(n+1)/2 \) for sanity check 22 |
| 23 | `SKIP` | `pytest -q tests/test_023.py` | Long note: lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, lorem ipsum dolor sit amet, end. |
| 24 | `OK` | `pytest -q tests/test_024.py` | tick 24 |
| 25 | `WARN` | `torchrun --nproc_per_node=2 train.py --seed 25` | tick 25 |
| 26 | `FAIL` | `pytest -q tests/test_026.py` | tick 26 |
| 27 | `SKIP` | `pytest -q tests/test_027.py` | tick 27 |
| 28 | `OK` | `pytest -q tests/test_028.py` | tick 28 |
| 29 | `WARN` | `pytest -q tests/test_029.py` | tick 29 |
| 30 | `FAIL` | `torchrun --nproc_per_node=2 train.py --seed 30` | tick 30 |
| 31 | `SKIP` | `pytest -q tests/test_031.py` | tick 31 |
| 32 | `OK` | `pytest -q tests/test_032.py` | tick 32 |
| 33 | `WARN` | `pytest -q tests/test_033.py` | \( \sum_{k=1}^{n} k = n(n+1)/2 \) for sanity check 33 |
| 34 | `FAIL` | `pytest -q tests/test_034.py` | tick 34 |
| 35 | `SKIP` | `torchrun --nproc_per_node=2 train.py --seed 35` | tick 35 |
| 36 | `OK` | `pytest -q tests/test_036.py` | tick 36 |
| 37 | `WARN` | `pytest -q tests/test_037.py` | tick 37 |
| 38 | `FAIL` | `pytest -q tests/test_038.py` | tick 38 |
| 39 | `SKIP` | `pytest -q tests/test_039.py` | tick 39 |
| 40 | `OK` | `torchrun --nproc_per_node=2 train.py --seed 40` | tick 40 |
| 41 | `WARN` | `pytest -q tests/test_041.py` | tick 41 |
| 42 | `FAIL` | `pytest -q tests/test_042.py` | tick 42 |
| 43 | `SKIP` | `pytest -q tests/test_043.py` | tick 43 |
| 44 | `OK` | `pytest -q tests/test_044.py` | \( \sum_{k=1}^{n} k = n(n+1)/2 \) for sanity check 44 |
| 45 | `WARN` | `torchrun --nproc_per_node=2 train.py --seed 45` | tick 45 |
| 46 | `FAIL` | `pytest -q tests/test_046.py` | tick 46 |
| 47 | `SKIP` | `pytest -q tests/test_047.py` | tick 47 |
| 48 | `OK` | `pytest -q tests/test_048.py` | tick 48 |
| 49 | `WARN` | `pytest -q tests/test_049.py` | tick 49 |
| 50 | `FAIL` | `torchrun --nproc_per_node=2 train.py --seed 50` | tick 50 |
| 51 | `SKIP` | `pytest -q tests/test_051.py` | tick 51 |
| 52 | `OK` | `pytest -q tests/test_052.py` | tick 52 |
| 53 | `WARN` | `pytest -q tests/test_053.py` | tick 53 |

*Tall runbook footer — row hover, alternating statuses, one obese note row.*

### Dense numeric matrix (16 × 16, every cell filled)

|  | **0** | **1** | **2** | **3** | **4** | **5** | **6** | **7** | **8** | **9** | **10** | **11** | **12** | **13** | **14** | **15** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **0** | 0 | 17 | 34 | 51 | 68 | 85 | 102 | 119 | 136 | 153 | 170 | 187 | 204 | 221 | 238 | 255 |
| **1** | 31 | 48 | 65 | 82 | 99 | 116 | 133 | 150 | 167 | 184 | 201 | 218 | 235 | 252 | 269 | 286 |
| **2** | 62 | 79 | 96 | 113 | 130 | 147 | 164 | 181 | 198 | 215 | 232 | 249 | 266 | 283 | 300 | 317 |
| **3** | 93 | 110 | 127 | 144 | 161 | 178 | 195 | 212 | 229 | 246 | 263 | 280 | 297 | 314 | 331 | 348 |
| **4** | 124 | 141 | 158 | 175 | 192 | 209 | 226 | 243 | 260 | 277 | 294 | 311 | 328 | 345 | 362 | 379 |
| **5** | 155 | 172 | 189 | 206 | 223 | 240 | 257 | 274 | 291 | 308 | 325 | 342 | 359 | 376 | 393 | 410 |
| **6** | 186 | 203 | 220 | 237 | 254 | 271 | 288 | 305 | 322 | 339 | 356 | 373 | 390 | 407 | 424 | 441 |
| **7** | 217 | 234 | 251 | 268 | 285 | 302 | 319 | 336 | 353 | 370 | 387 | 404 | 421 | 438 | 455 | 472 |
| **8** | 248 | 265 | 282 | 299 | 316 | 333 | 350 | 367 | 384 | 401 | 418 | 435 | 452 | 469 | 486 | 503 |
| **9** | 279 | 296 | 313 | 330 | 347 | 364 | 381 | 398 | 415 | 432 | 449 | 466 | 483 | 500 | 517 | 534 |
| **10** | 310 | 327 | 344 | 361 | 378 | 395 | 412 | 429 | 446 | 463 | 480 | 497 | 514 | 531 | 548 | 565 |
| **11** | 341 | 358 | 375 | 392 | 409 | 426 | 443 | 460 | 477 | 494 | 511 | 528 | 545 | 562 | 579 | 596 |
| **12** | 372 | 389 | 406 | 423 | 440 | 457 | 474 | 491 | 508 | 525 | 542 | 559 | 576 | 593 | 610 | 627 |
| **13** | 403 | 420 | 437 | 454 | 471 | 488 | 505 | 522 | 539 | 556 | 573 | 590 | 607 | 624 | 641 | 658 |
| **14** | 434 | 451 | 468 | 485 | 502 | 519 | 536 | 553 | 570 | 587 | 604 | 621 | 638 | 655 | 672 | 689 |
| **15** | 465 | 482 | 499 | 516 | 533 | 550 | 567 | 584 | 601 | 618 | 635 | 652 | 669 | 686 | 703 | 720 |

*Dense matrix footer — typography at small sizes, column alignment, thead vs tbody.*

### Mixed chaos (empty cells, long strings — pipes only as delimiters)

| A | B | C |
| --- | --- | --- |
|  | `single-space` | (empty first column) |
| `pipe-in-code-ok` | `grep a\\|b file` | or-op in regex |
| U+1F680 | Not an emoji font test | just characters |
| xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | short | `mid` |
| short | yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy | `tail` |

*Chaos footer — empty cells, code with pipe characters inside backticks, ultra-long strings.*

## Screenshot archaeology

Sometimes the most “real” artifact is a random screengrab from a late night:

![Debug screenshot — UI spaghetti era](/assets/images/posts/Screenshot%202024-03-23%20005515.png)
*Exported screenshot from an older debug UI — buttons everywhere, soul nowhere.*

---

**Status:** ongoing. If you’re reading this in the future and the project is still “ongoing,” then: same.
