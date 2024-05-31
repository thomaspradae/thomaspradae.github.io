---
layout: post
path: /_building/
share: true
title: Identifying illegal mining using computer vision
description: Using satellite imagery to identify illegal mining activities in the Amazon rainforest. Built using Python and OpenCV. Built dashboard to visualize deforestation in real-time.
summary: Another Full Note attempt
tags: [ml, defense tech, physics, projectile physics, reinforcement learning]
excerpt: The code is pretty straight forward, we start off our simulation once a new point is generated, and we keep some track of time, I'm not sure how to fucking do this lol, as, I think we could maybe try and have discrete values, but the question might be how discrete, meaning, with each pass of time, and also, wondering, how time will pass, u see, when looking at the slider, this is basically what we need, but the thing is that how I see it, is that this is some sort of loop, and you keep it moving.
---



(THIS IS JUST A TRIAL NOTE TO TEST OUT THE WEBSITE)

## (TRIAL NOTE)

**Objective**
Intercept the missile that's fired from the "Attack" coordinates before it reaches the "Target" coordinates.

**Actions**
Adjust the firing angle, controls when the missile is fired.

**Rewards**
- If the missile is intercepted, the agent receives a reward.
- If the missile reaches the target, the agent receives a penalty.
- Missiles that are not intercepted or have not reached the target within 100 steps are terminated. (Probably something like this would help the agent learn faster, so I'll look into it)
- Interceptions that are further from the target are preferred, meaning: the agent receives a penalty for every step it takes. (This is to encourage the agent to intercept the missile as soon as possible)
- Interception misses (that miss) that are closer to the enemy missile are preferred, meaning the agent will be encouraged to aim towards the enemy missile.

**Environment**
- We start off with a plane.
- Each coordinate is represented by a 2D point. Different coordinates have different possible x and y values. They are the following.

_Target Coordinates_
```python

x = random.uniform(-3.0, 3.0)

y = random.uniform(2.0, 6.0)

self.coordinates = np.array([x, y])

```

  

_Defense Coordinates_
```python

x = random.uniform(target.coordinates[0] - 1.5, target.coordinates[0] + 1.5)

y = random.uniform(target.coordinates[1] - 1.5, target.coordinates[1]-0.1)

self.coordinates = np.array([x, y])

```

  

_Attack Coordinates_
```python

x_side1 = random.uniform(-9.0, target.coordinates[0] - 2)

x_side2 = random.uniform(target.coordinates[0] + 2, 9.0)

y_deep = random.uniform(-9.0, target.coordinates[1] - 0.1)

x_below = random.uniform(target.coordinates[0] - 2, target.coordinates[0] + 2)

y_below = random.uniform(-9.0, target.coordinates[1] - 2)

  

coord_side1 = np.array([x_side1, y_deep])

coord_side2 = np.array([x_side2, y_deep])

coord_below = np.array([x_below, y_below])

  

self.coordinates = random.choice([coord_side1, coord_side2, coord_below])

```


The code is pretty straight forward, we start off our simulation once a new point is generated, and we keep some track of time, I'm not sure how to fucking do this lol, as, I think we could maybe try and have discrete values, but the question might be how discrete, meaning, with each pass of time, and also, wondering, how time will pass, u see, when looking at the slider, this is basically what we need, but the thing is that how I see it, is that this is some sort of loop, and you keep it moving.