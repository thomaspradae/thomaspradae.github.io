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
: Agent observes state \(s_t\), emits action \(a_t\), environment returns \(s_{t+1}\) and reward \(r_t\). Rinse[^4].

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

[^5]: \(r_t = -\alpha \|p_{\text{int}} - p_{\text{threat}}\|_2 + \beta \mathbb{1}_{\text{hit}}\). In code: `reward = -alpha * dist + beta * float(hit)`. Compare with [Hugging Face RL notes](/notes/hugging-face-rl-course) for the bigger picture.

## Table stress tests (long cells, code, TeX, dollars)

| Symptom | Likely cause | Quick check |
| --- | --- | --- |
| Loss goes `nan` after ~2k steps | Bad learning rate or `log(0)` in policy | `torch.isfinite(loss).all()`; clamp `logits` |
| Interceptor orbits forever | Distance-only shaping with no terminal intercept term | Inspect \(\mathbb{E}[r_T]\) vs shaped \(\sum \gamma^k r_k\) |
| Policy ignores threat | Observation normalization off or wrong frame | Print `obs.min()`, `obs.max()` each eval |

*Footer: three-column layout with inline code and inline math \( \mathbb{E}[\cdot] \).*

| Budget line item | Amount | Notes |
| --- | --- | --- |
| GPU hours | \$\(12\)/hr spot × 40h | Escaped dollars for spreadsheet brain |
| Coffee | \$\(4.50\) × 2/day × 30 | Same — `\$` not math |
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
| Speed cap | \(\|v\| \leq v_{\max}\) | `v = v * min(1.0, v_max / (torch.norm(v)+1e-8))` |
| No-fly | altitude \(h \geq h_{\min}\) | `penalty = torch.relu(h_min - h) ** 2` |

*Second table in same block — should read “Table 2 —”.*

</div>

## Screenshot archaeology

Sometimes the most “real” artifact is a random screengrab from a late night:

![Debug screenshot — UI spaghetti era](/assets/images/posts/Screenshot%202024-03-23%20005515.png)
*Exported screenshot from an older debug UI — buttons everywhere, soul nowhere.*

---

**Status:** ongoing. If you’re reading this in the future and the project is still “ongoing,” then: same.
