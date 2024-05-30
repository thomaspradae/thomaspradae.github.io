---
layout: post
path: /_notes/
share: true
title: Deep Reinforcement Learning Course Notes (Hugging Face)
description: Notes from Hugging Face's Deep Reinforcement Learning Course
summary: 
tags:
  - reinforcement learning
  - deep reinforcement learning
  - ml
excerpt: 
---


## 0.0.0 - THE BIG PICTURE AND RL LEARNING FRAMEWORK

The big idea behind reinforcement learning is that an agent will be able to learn from an environment by *interacting with it*, which will lead to rewards (which can be either negative (punishment) or positive) which serve as *feedback* after performing actions. 

The example given in the course is the following: imagine you have a little brother, and you set him in front of a video game he's never seen or played. He'll probably start off by figuring his way around the controls. Maybe he somehow manages to collect some prize like a coin, he then realizes that doing so will increase his score. Now say he manages to run into an enemy, in touching the enemy he learns that doing so reduces his score. Through interaction, he learns about the environment. 

### 0.0.1 - RL PROCESS
The process described above can be modeled as follows: 
![RL_process](../assets/images/posts/RL_process.jpg)
*Source: Hugging Face Deep RL Course - Unit 1 - "RL Framework"*

We encounter a loop: An agent interacts with a given state (say, the world a specific moment in time / with a specific organization (set of information)), which is related to (or involves / or comes with) a reward[^1]. The agent then takes a decision based on these, thereby changing the environment through it's action, resulting in a new state and a new reward. This in turn ends up being a loop involving an agent, states ($S_t$, $S_{t+1}$, $\dots$, $S_n$ ), actions ($A_t$, $A_{t+1}$, $\dots$, $A_n$ ) and rewards ($R_t$, $R_{t+1}$, $\dots$, $R_n$ ).

Reinforcement learning is based on the *reward hypothesis*: 

>"All of what we mean by goals and purposes can be well thought of as maximization of the expected value of the cumulative sum of a received scalar signal (reward)"
>
>*(Sutton, 2004; Sutton & Barto, 2018; Littman, 2017).*





[^1]: In the case where it's the first interaction, the state $S_0$ would also have a reward $R_0$ which tends to be 0. 