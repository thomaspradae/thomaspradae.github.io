---
layout: post
path: /_building/
share: true
title: Handwritten digit classifier from first principles
description: Building a neural network without frameworks. Just NumPy, calculus, and regret.
summary: 
tags:
  - ml
  - neural networks
  - python
excerpt: 
---

## Premise

Every ML tutorial starts with MNIST. This one does too, but with a constraint: no PyTorch, no TensorFlow, no autograd. Just NumPy. The goal isn't to achieve state-of-the-art accuracy — it's to understand what the frameworks are doing by implementing it manually.

## Network architecture

A simple feedforward network:

- Input: 784 neurons (28×28 pixel image, flattened)
- Hidden layer 1: 128 neurons, ReLU activation
- Hidden layer 2: 64 neurons, ReLU activation
- Output: 10 neurons, softmax activation

Total parameters: 784×128 + 128 + 128×64 + 64 + 64×10 + 10 = **109,386**.

## Forward pass

Straightforward matrix multiplication + bias + activation, layer by layer:

```python
z1 = X @ W1 + b1
a1 = np.maximum(0, z1)        # ReLU
z2 = a1 @ W2 + b2
a2 = np.maximum(0, z2)        # ReLU
z3 = a2 @ W3 + b3
a3 = softmax(z3)               # output probabilities
```

## Backpropagation

This is where it gets real. The chain rule applied layer by layer, working backward from the loss. The loss is cross-entropy:

\\[ L = -\frac{1}{N}\sum_{i}\sum_{c} y_{ic} \log(\hat{y}_{ic}) \\]

The gradient of cross-entropy with respect to the softmax input is pleasantly simple: \\( \hat{y} - y \\). From there, each layer's gradient depends on the downstream gradient, the local Jacobian, and the cached activations from the forward pass.

The hardest part was getting the shapes right. When your gradient has shape `(64, 128)` but it should be `(128, 64)`, you stare at your chain rule derivation for twenty minutes before realizing you forgot a transpose. This happened four times.

## Training

- Batch size: 64
- Learning rate: 0.01 with decay
- Epochs: 30

After 30 epochs: **97.2% accuracy** on the test set. Not bad for 300 lines of NumPy.

For comparison, a two-layer CNN with PyTorch hits ~99.2% with less code. The point isn't to compete — it's to earn the right to use the framework by understanding what it abstracts away.

## What broke along the way

1. **Vanishing gradients with sigmoid.** My first version used sigmoid activations. Training stalled around 85% accuracy. Switching to ReLU fixed it immediately. I now viscerally understand why ReLU matters.
2. **Numerical instability in softmax.** Exponentiating large numbers produces `inf`. The fix is subtracting the max value before exponentiating: `exp(z - max(z))`. Every framework does this automatically. I learned it the hard way.
3. **Learning rate too high.** Loss went to NaN on epoch 2. Classic.

## Takeaway

Everyone should build a neural network from scratch once. Not because it's practical — it's not — but because it transforms deep learning from a black box into a (very complicated) function optimization problem. After this, reading PyTorch source code feels less like reading a foreign language and more like reading shorthand for something you already know.
