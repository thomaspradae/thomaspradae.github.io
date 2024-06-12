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

## TABLE OF CONTENTS

- [(0.0.0) - The big picture and RL Learning Framework](2024-05-30-hugging-face-rl-course.md#000-the-big-picture-and-rl-learning-framework)
	- [(0.0.1) - RL Process](2024-05-30-hugging-face-rl-course.md#000-the-big-picture-and-rl-learning-framework)
	- [(0.0.2) - Markov Property, Markov Decision Process](2024-05-30-hugging-face-rl-course.md#000-the-big-picture-and-rl-learning-framework)

## (0.0.0) - THE BIG PICTURE AND RL LEARNING FRAMEWORK

The big idea behind reinforcement learning is that an agent will be able to learn from an environment by *interacting with it*. Interaction leads to rewards (which can either be negative (punishment) or positive) that serve as *feedback*, informing future decisions. For example, imagine you have a little brother and you sit him in front of a videogame he's never seen nor played. He'll probably start off by figuring his way around the controls. Maybe he manages to collect a prize which increases his score, or, on the contrary, comes into contact with an enemy, thereby reducing his score. Through interaction, he learns about the environment. 

### (0.0.1) - RL PROCESS
The process described above can be modeled as follows: 
![RL_process](../assets/images/posts/RL_process.jpg)
*Source: Hugging Face Deep RL Course - Unit 1 - "RL Framework"*

We encounter a loop: An agent interacts with a given state (say, the world a specific moment in time / with a specific organization (set of information)), which is related to (or involves / or comes with) a reward[^1]. The agent then takes a decision based on these, thereby changing the environment through its action, resulting in a new state and a new reward. This ultimately ends up being a loop involving an agent, states ($S_t$, $S_{t+1}$, $\dots$, $S_n$ ), actions ($A_t$, $A_{t+1}$, $\dots$, $A_n$ ) and rewards ($R_t$, $R_{t+1}$, $\dots$, $R_n$ ).

Reinforcement learning is based on the *reward hypothesis*: 

>"All of what we mean by goals and purposes can be well thought of as maximization of the expected value of the cumulative sum of a received scalar signal (reward)"
>
>*(Sutton, 2004; Sutton & Barto, 2018; Littman, 2017).*

In other words, we can express the agent's goal as a maximization problem, the maximization of its reward. This entails that we'd have to make sure our environment is set up / expressed in such a way that it's able to capture this dynamic. For instance, consider we're trying to teach our agent how to score a goal[^2]. To do so, we'd have to make sure our agent has access to a set of actions that can allow it to satisfy such a goal (say, moving in a given direction, kicking, etc.), and that it receives information (a new state and a reward) based on the action it takes. Furthermore, this information is specified, such that, if the agent attempts to choose reward maximizing actions, it will lead closer to the completion of the goal (hopefully up to the full completion of the goal). Enough with the abstractions, back to our football example. In this case, since we want our agent to score a goal, we might reward it when the ball is closer to goal and punish it when it's further away. In this sense, as our agent is trying to maximize the reward, it might try strategies (such as kicking the ball when its facing the goal) that result in the ball being as close to goal as possible (until it's ultimately in goal). 


### (0.0.2) - MARKOV PROPERTY, MARKOV DECISION PROCESS
This RL process we've just discussed is called a [Markov Decision Process (MDP)](https://en.wikipedia.org/wiki/Markov_decision_process)[^3]. An MDP is a way of 


A MDP is a discrete time stochastic control process. Let's unpack that: 

- *Discrete-time*: instead of thinking of time as continuous (say, the way in which an hour can be divided into minutes, and seconds, and each second can be divided into even smaller divisions, meaning, that between any two points in time there are infinitely more points in time), think of there being 'separate points in time', for example $t = 1, 2, 3, \dots n$ where each value of $t$ is a point in time. Time "jumps" from one to the next. 

- *Stochastic:* stochasticity[^4] is often used interchangeably with 'randomness'. The wiki page for 'stochastic' defines it as the 'property of being well described by a random probability distribution'. Let's break that down as well: a probability distribution is a mathematical function that tells us the probability of occurrence for different outcomes of a given phenomenon / experiment / process (just as its name states: it tells us how *probabilities* of occurrence are *distributed* for a given p/e/p[^5]. When something is stochastic, it can be expressed as a probability distribution, in turn this gives us information about the nature of the phenomenon, without exactly knowing what outcome we'll get. For example, consider a fair dice with six sides. We can model our dice rolls with a probability distribution, but that doesn't mean we can predict what face we'll get for any given dice roll (but we can, thanks to our probability distribution, have some idea about the nature of the phenomenon (as seen below))

![1 -2COiWDRvuLtuu3G6aRwWg](../assets/images/posts/1%20-2COiWDRvuLtuu3G6aRwWg.gif)
*[Source](https://www.cantorsparadise.com/what-to-expect-when-throwing-dice-and-adding-them-up-5231f3831d7): Juan Luis Ruiz-Tagale - Cantor's Paradise on Medium*

- *Control*: in this context, we're referring to [control theory](https://en.wikipedia.org/wiki/Control_theory). Control theory seeks out to create a model / algorithm that will take a dynamical system (say a spacecraft or the economy) to a desired [state](https://en.wikipedia.org/wiki/Optimal_control) (say landing on the moon or maximizing employment). 

In other words, an MDP models decision making where: 
- Time is discrete
- Outcomes are stochastic 

This relates to [ggs](../_writing/2024-06-09-sickness-unto-death.md#)


Other shit like this entry [about](../_writing/2024-05-08-no-one-is-coming-to-save-you.md#)

and other shit like





[Hi](Pasted image 20240530180557.png)
There can be quite a bit of terminology to unpack 
I'll try and delve into this deeper myself 
The RL process
yes

$text$ 


$hi$
100
$100$

[stochastic](obsidian://open?vault=Origin%20OS&file=Screenshot%202024-05-30%20180322.png)

![Screenshot 2024-05-30 180322](../assets/images/posts/Screenshot%202024-05-30%20180322.png)

[^1]: In the case where it's the first interaction, the state $S_0$ would also have a reward, $R_0$, which tends to be 0. 
[^2]: [Football](https://www.youtube.com/watch?v=6TnKvlQ2h7s&ab_channel=Super6), or Soccer, for those from the states. 
[^3]: The course says it delves deeper into this later on, so we'll see, however, I wish to do so myself as well, so for now we'll have just a quick overview, and later on, depending on what the course covers, we'll see what needs to be specified further. 
[^4]: From the Greek (stokhos) which means to aim or guess
[^5]: I promise to dive deeper into this elsewhere, so there should probably be a link here, if there isn't, maybe I forgot to link it so it might be somewhere in `notes`
