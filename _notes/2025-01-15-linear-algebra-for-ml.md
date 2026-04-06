---
layout: post
path: /_notes/
share: true
title: Linear algebra for ML - the parts that actually matter
description: Vectors, matrices, eigenvalues, SVD. The linear algebra you need for machine learning, without the proofs you don't.
summary: 
tags:
  - math
  - ml
  - notes
excerpt: 
---

## Why this exists

Linear algebra courses teach everything. ML needs specific things. This is an attempt to distill the overlap: the concepts and operations that come up again and again in machine learning, with just enough theory to understand *why* they work, and not so much that you forget what you came for.

## Vectors and dot products

A vector is a list of numbers. In ML, it usually represents a data point (a feature vector), a set of weights, or a gradient.

The dot product of two vectors \\\(\mathbf{a} \cdot \mathbf{b} = \sum_i a_i b_i\\\) is the most important single operation. It measures similarity (cosine similarity is a normalized dot product). Every linear layer in a neural network is a collection of dot products. Attention mechanisms are dot products. SVMs find hyperplanes defined by dot products.

Geometric interpretation: \\\(\mathbf{a} \cdot \mathbf{b} = \&#124;\mathbf{a}\&#124; \&#124;\mathbf{b}\&#124; \cos\theta\\\). When the dot product is large and positive, the vectors point in similar directions. When it's zero, they're orthogonal (independent). When it's negative, they point in opposing directions.

## Matrix multiplication

A matrix is a collection of vectors. Multiplying a matrix by a vector \\\(\mathbf{y} = A\mathbf{x}\\\) applies a linear transformation: rotation, scaling, projection, or some combination.

In ML, the weight matrix of a linear layer *is* the transformation. When you train a neural network, you're learning what transformation to apply at each layer. The entire forward pass is a sequence of matrix multiplications interleaved with nonlinear activations.

Key property: matrix multiplication is associative but NOT commutative. \\\(AB \neq BA\\\) in general. This matters when you're implementing backpropagation and the order of your transposes determines whether you get the correct gradient or garbage.

## Eigenvalues and eigenvectors

An eigenvector of matrix \\\(A\\\) is a vector that, when \\\(A\\\) is applied to it, only gets scaled (not rotated):

\\\[A\mathbf{v} = \lambda\mathbf{v}\\\]

The scalar \\\(\lambda\\\) is the eigenvalue.

Where this shows up:
- **PCA:** The principal components are the eigenvectors of the covariance matrix, ordered by eigenvalue magnitude. The eigenvalue tells you how much variance each component explains.
- **Graph algorithms:** PageRank is the dominant eigenvector of the web's link matrix.
- **Stability analysis:** The eigenvalues of the Jacobian of a dynamical system tell you whether equilibria are stable.

## Singular Value Decomposition (SVD)

Any matrix \\\(A\\\) can be decomposed as \\\(A = U\Sigma V^T\\\), where \\\(U\\\) and \\\(V\\\) are orthogonal matrices and \\\(\Sigma\\\) is diagonal with non-negative entries (the singular values).

SVD is the Swiss Army knife of linear algebra:
- **Low-rank approximation:** Keep only the top-\\\(k\\\) singular values. This is how image compression works (conceptually), how recommendation systems work (matrix factorization), and how LoRA adapts large language models.
- **Pseudoinverse:** When \\\(A\\\) isn't square or isn't invertible, the SVD gives you the best least-squares solution.
- **Noise reduction:** Small singular values often correspond to noise. Truncating them denoises the data.

## The gradient is a vector

This sounds obvious but it's worth stating: the gradient \\\(\nabla f\\\) is a vector that points in the direction of steepest ascent. Gradient descent moves in the opposite direction. Every optimization algorithm in ML is, at its core, deciding how to use the gradient vector to update the parameter vector.

The gradient of a scalar loss with respect to a matrix of weights is itself a matrix of the same shape. This is why backpropagation works: shapes propagate backward through the network, and at each layer, the gradient has the same shape as the weights, so you can subtract it.
