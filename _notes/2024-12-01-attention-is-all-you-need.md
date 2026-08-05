---
layout: post
path: /_notes/
share: true
title: "Attention Is All You Need - paper breakdown"
description: Notes on the 2017 transformer paper. Multi-head attention, positional encoding, and why this changed everything.
summary: 
editorial_collection: paper replications
tags:
  - ml
  - transformers
  - paper notes
excerpt: 
---

## Context

Vaswani et al., 2017. The paper that introduced the transformer architecture. Before this, sequence-to-sequence models used RNNs (usually LSTMs or GRUs) with attention as an add-on. The key contribution: throw out the recurrence entirely and use *only* attention. The result was faster to train (parallelizable) and better at capturing long-range dependencies.

## Self-attention

The core mechanism. Given a sequence of input vectors, self-attention lets each position attend to every other position. The computation:

1. Project each input into three vectors: **Query** (Q), **Key** (K), **Value** (V) using learned weight matrices
2. Compute attention scores: \\(\text{score}(i,j) = Q_i \cdot K_j\\)
3. Scale by \\(\sqrt{d_k}\\) (to prevent softmax saturation for large dimensions)
4. Apply softmax to get attention weights
5. Weighted sum of Value vectors gives the output for each position

In matrix form:

\\[\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V\\]

The key insight: this is *all learned*. The model learns what to attend to. For a translation task, it might learn that when generating the French word for "bank," it should attend heavily to the English word "river" (if present) to disambiguate financial bank vs. river bank.

## Multi-head attention

Instead of one attention function, use \\(h\\) parallel attention "heads," each with its own Q/K/V projections into a lower-dimensional space. Concatenate the outputs and project again.

Why? Each head can learn a different type of relationship. One head might attend to syntactic structure, another to semantic similarity, another to positional proximity. The paper uses 8 heads with \\(d_k = d_v = d_{\text{model}}/h = 64\\).

## Positional encoding

Without recurrence, the model has no notion of order. "The cat sat on the mat" and "mat the on sat cat the" would look identical. The solution: add positional information to the input embeddings.

The paper uses sinusoidal functions at different frequencies:

\\[PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)\\]
\\[PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)\\]

Each position gets a unique encoding. The sinusoidal choice lets the model learn relative positions: the dot product between two positional encodings depends only on their distance, not their absolute positions.

## Architecture summary

**Encoder:** 6 identical layers, each with multi-head self-attention + feedforward network, with residual connections and layer normalization.

**Decoder:** 6 identical layers, each with masked self-attention (can't look ahead) + encoder-decoder attention + feedforward network.

Total parameters for the base model: ~65 million. For reference, GPT-3 has 175 billion. Same architecture, scaled up ~2,700x.

## Why it matters

The transformer is the foundation of essentially all modern language models (BERT, GPT, T5, LLaMA, etc.), and it's being adapted for vision (ViT), audio (Whisper), protein folding (AlphaFold 2), and more. The "attention is all you need" claim turned out to be surprisingly literal — the architecture generalized far beyond NLP.

The paper itself is remarkably well-written. 11 pages, clear notation, good ablation studies. Worth reading in full.