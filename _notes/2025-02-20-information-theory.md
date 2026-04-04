---
layout: post
path: /_notes/
share: true
title: Information theory fundamentals
description: Entropy, mutual information, KL divergence. Shannon's framework and why it matters for ML.
summary: 
tags:
  - math
  - information theory
  - notes
excerpt: 
---

## (0.0.0) - Shannon entropy

Shannon's central question (1948): how do you quantify information? His answer: information is the *reduction of uncertainty*. If I tell you something you already knew, I've given you zero information. If I tell you something surprising, I've given you a lot.

Formally, the entropy of a random variable \\( X \\) with possible outcomes \\( x_1, \dots, x_n \\):

\\[ H(X) = -\sum_{i} p(x_i) \log_2 p(x_i) \\]

Entropy is maximized when all outcomes are equally likely (maximum uncertainty) and minimized (zero) when the outcome is deterministic. For a fair coin: \\( H = -2 \times 0.5 \log_2(0.5) = 1 \\) bit. For a biased coin (99% heads): \\( H \approx 0.08 \\) bits. The biased coin carries less information per flip because you already know what's probably going to happen.

## (1.0.0) - Cross-entropy

The cross-entropy between a true distribution \\( p \\) and a model distribution \\( q \\):

\\[ H(p, q) = -\sum_{i} p(x_i) \log q(x_i) \\]

This is the loss function used in virtually all classification tasks in ML. When \\( q = p \\), cross-entropy equals entropy (the minimum). When \\( q \\) diverges from \\( p \\), cross-entropy increases. Training minimizes cross-entropy, which pushes the model's predicted distribution toward the true distribution.

## (2.0.0) - KL divergence

The Kullback-Leibler divergence measures how different \\( q \\) is from \\( p \\):

\\[ D_{KL}(p \| q) = \sum_{i} p(x_i) \log \frac{p(x_i)}{q(x_i)} = H(p, q) - H(p) \\]

Since \\( H(p) \\) is constant with respect to \\( q \\), minimizing cross-entropy is equivalent to minimizing KL divergence. This is why cross-entropy is used as a loss: it's a proxy for "how wrong is the model."

Important: KL divergence is NOT symmetric. \\( D_{KL}(p \| q) \neq D_{KL}(q \| p) \\). This asymmetry has practical consequences:

- **Mode-covering** (\\( D_{KL}(p \| q) \\)): the model tries to cover all modes of \\( p \\), even at the cost of spreading probability mass to unlikely regions. This is what variational inference typically minimizes.
- **Mode-seeking** (\\( D_{KL}(q \| p) \\)): the model collapses to a single mode of \\( p \\), ignoring others. This is what GANs tend to do.

## (3.0.0) - Mutual information

The mutual information between two variables \\( X \\) and \\( Y \\):

\\[ I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) \\]

It measures how much knowing one variable reduces uncertainty about the other. If \\( X \\) and \\( Y \\) are independent, \\( I(X;Y) = 0 \\). If knowing \\( X \\) completely determines \\( Y \\), then \\( I(X;Y) = H(Y) \\).

This shows up in feature selection (which features carry the most information about the target), representation learning (InfoNCE loss), and decision trees (information gain is mutual information between a feature and the class label).

## (4.0.0) - Why this matters

Shannon's framework provides a rigorous language for talking about learning. Training a model is reducing entropy. Overfitting is memorizing noise instead of structure. Compression and prediction are the same problem viewed from different angles (a good predictor is a good compressor, and vice versa). Information theory doesn't tell you *how* to learn, but it tells you what learning *means*.
