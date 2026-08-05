---
layout: post
path: /_notes/
share: true
title: Continuous-Discrete Reinforcement Learning for Hybrid Control in Robotics (paper) [NOTES]
description: tryna found out how to handle hybrid action spaces
summary:
editorial_collection: paper replications
tags:
  - ml
  - reinforcement learning
  - paper
excerpt:
---

# Continuous–Discrete Reinforcement Learning for Hybrid Control in Robotics

## Meta
### Why these notes exist
#### Why this paper exists
##### Why hybrid action spaces are annoying
###### Why robots refuse to be simple
####### Why I am doing this to Markdown

---

## 0. Abstract (Rewritten in My Own Words)

### 0.1 The problem, roughly
Hybrid control problems are those where the **action space contains both discrete decisions** (e.g. mode switches, on/off, grasp/not grasp) and **continuous controls** (e.g. torques, velocities).

### 0.2 Why standard RL breaks
Most RL algorithms assume:
- either fully discrete actions (DQN-style)
- or fully continuous actions (policy gradients, actor–critic)

Hybrid ≠ either.

### 0.3 What this paper proposes
A framework to:
- explicitly model discrete + continuous actions
- avoid exponential blowups
- keep training stable
- work on real robotic tasks

---

## 1. Background
### 1.1 Reinforcement Learning recap
#### 1.1.1 Markov Decision Processes (MDPs)
An MDP is defined as:

\\[(\mathcal{S}, \mathcal{A}, P, R, \gamma)\\]

Where:
- \\(\mathcal{S}\\): state space
- \\(\mathcal{A}\\): action space
- \\(P\\): transition dynamics
- \\(R\\): reward function
- \\(\gamma\\): discount factor

##### 1.1.1.1 Important note
This already quietly assumes a **single action space**.

---

### 1.2 Continuous control
#### 1.2.1 Policy gradients
A policy \\(\pi_\theta(a \mid s)\\) outputs parameters of a continuous distribution.

#### 1.2.2 Common algorithms
- DDPG
- TD3
- SAC

All assume:
\\[a \in \mathbb{R}^n\\]

---

### 1.3 Discrete control
#### 1.3.1 Q-learning
Action selection via:
\\[a = \arg\max_a Q(s, a)\\]

#### 1.3.2 DQN and friends
- Works well for discrete action sets
- Breaks when actions are continuous

---

## 2. Hybrid Action Spaces
### 2.1 Definition
A hybrid action is:

\\[a = (a_d, a_c)\\]

Where:
- \\(a_d \in \mathcal{A}_d\\) (discrete)
- \\(a_c \in \mathcal{A}_c \subset \mathbb{R}^n\\)

---

### 2.2 Naive approaches (and why they suck)

#### 2.2.1 Discretize everything
- Curse of dimensionality
- Loses precision
- Not scalable

#### 2.2.2 Enumerate discrete, learn continuous per mode
- Separate policy per discrete action
- Sample inefficiency
- Switching instability

---

## 3. Core Idea of the Paper
### 3.1 Factorized policy
The policy is decomposed as:

\\[\pi(a_d, a_c \mid s) = \pi_d(a_d \mid s)\,\pi_c(a_c \mid s, a_d)\\]

This is the key move.

---

### 3.2 Interpretation
- First decide **what to do** (discrete)
- Then decide **how to do it** (continuous)

Very human.
Very robotic.
Very sane.

---

## 4. Architecture
### 4.1 Actor structure
#### 4.1.1 Discrete actor
Outputs categorical distribution over modes.

#### 4.1.2 Continuous actor
Conditioned on:
- state
- chosen discrete action

---

### 4.2 Critic structure
#### 4.2.1 Q-function
\\[Q(s, a_d, a_c)\\]

#### 4.2.2 Why this matters
The critic evaluates **joint actions**, preserving coupling.

---

## 5. Training
### 5.1 Objective
Maximize expected return:

\\[\mathbb{E}_{\pi_d, \pi_c}\left[\sum_t \gamma^t r_t\right]\\]

---

### 5.2 Gradient estimation
#### 5.2.1 Discrete gradients
- REINFORCE-style
- Or Gumbel-softmax tricks

#### 5.2.2 Continuous gradients
- Standard reparameterization
- Backprop through critic

---

### 5.3 Stability tricks
- Target networks
- Entropy regularization
- Careful learning rates

---

## 6. Experiments
### 6.1 Simulated tasks
#### 6.1.1 Pushing
#### 6.1.2 Grasping
#### 6.1.3 Mode switching

---

### 6.2 Real robot experiments
#### 6.2.1 Why this is impressive
Real robots:
- are noisy
- break easily
- hate unstable policies

---

## 7. Results
### 7.1 Performance
- Faster convergence
- Higher success rates
- Better sample efficiency

### 7.2 Comparison
Outperforms:
- naive discretization
- separate-policy baselines

---

## 8. Limitations
### 8.1 Scaling discrete actions
Large discrete sets still hard.

### 8.2 Credit assignment
Discrete decisions early → delayed effects.

---

## 9. My Thoughts
### 9.1 Why this matters
Hybrid action spaces are everywhere:
- robotics
- games
- systems control
- missile interception (yes, you)

---

### 9.2 Connection to my work
This maps **directly** to:
- mode switching
- guidance laws
- continuous accelerations

---

## 10. Questions I Still Have
### 10.1 Exploration
How do we explore discrete modes efficiently?

### 10.2 Hierarchy
Is this secretly hierarchical RL?

---

## 11. Random Scratchpad
### 11.1 TODO
- re-derive gradients
- implement toy version
- test on missile sim

### 11.2 Garbage thoughts
> Is a hybrid action space just a polite way of saying the world is messy?

Probably.

---

## Appendix A: Equations Dump
\\[\nabla_\theta J(\theta) =
\mathbb{E}\left[\nabla_\theta \log \pi_d(a_d \mid s)
+ \nabla_\theta \log \pi_c(a_c \mid s, a_d)\right]\\]

---

## Appendix B: Code Skeleton

```python
class HybridActor(nn.Module):
    def forward(self, state):
        discrete_logits = self.discrete_head(state)
        discrete_action = sample(discrete_logits)
        continuous_action = self.continuous_head(state, discrete_action)
        return discrete_action, continuous_action