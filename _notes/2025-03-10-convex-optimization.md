---
layout: post
path: /_notes/
share: true
title: Convex optimization crash course
description: When the loss landscape is nice. Gradient descent, duality, and why convexity is the best guarantee you'll ever get.
summary: 
tags:
  - math
  - optimization
  - notes
excerpt: 
---

## What is convexity?

A function \\( f \\) is convex if the line segment between any two points on its graph lies above (or on) the graph:

\\[ f(\lambda x + (1-\lambda) y) \leq \lambda f(x) + (1-\lambda) f(y) \quad \forall \lambda \in [0,1] \\]

Visually: the function is bowl-shaped. No local minima that aren't global minima. This is the property that makes optimization tractable. If your loss function is convex, gradient descent will find the global minimum. If it's not (as in deep learning), you're in the wilderness — gradient descent will find *a* minimum, but there are no guarantees it's the best one.

## Gradient descent on convex functions

For a convex, differentiable function \\( f \\), gradient descent with step size \\( \alpha \\):

\\[ x_{t+1} = x_t - \alpha \nabla f(x_t) \\]

converges to the global minimum at a rate of \\( O(1/t) \\) for general convex functions, and \\( O(e^{-ct}) \\) (exponentially fast) for *strongly* convex functions (where the Hessian is bounded below by some positive constant).

The step size matters: too large and you overshoot; too small and convergence is glacial. For strongly convex functions with Lipschitz-continuous gradients, the optimal step size is \\( \alpha = 1/L \\) where \\( L \\) is the Lipschitz constant of the gradient.

## Examples in ML

Several ML problems are convex (or can be made convex):

- **Linear regression** with MSE loss: \\( \|Ax - b\|^2 \\) is convex in \\( x \\). Closed-form solution exists (normal equations), but gradient descent works too.
- **Logistic regression:** The cross-entropy loss for logistic regression is convex. No local minima — SGD will converge.
- **SVMs:** The hinge loss + L2 regularizer is convex. The dual problem is a quadratic program.
- **Lasso:** L1-regularized regression. Convex but not differentiable at zero (requires proximal gradient methods or coordinate descent).

Deep learning is *not* convex. The loss landscape of a neural network has saddle points, plateaus, and many local minima. The fact that SGD works anyway is one of the great empirical mysteries of modern ML.

## Lagrangian duality

Every constrained optimization problem has a dual problem. For a convex problem with constraints \\( g_i(x) \leq 0 \\):

**Primal:** minimize \\( f(x) \\) subject to \\( g_i(x) \leq 0 \\)  
**Lagrangian:** \\( L(x, \lambda) = f(x) + \sum_i \lambda_i g_i(x) \\)  
**Dual:** maximize \\( \inf_x L(x, \lambda) \\) subject to \\( \lambda_i \geq 0 \\)

For convex problems, **strong duality** holds: the primal and dual optima are equal. This is used extensively in SVMs (the dual formulation is where kernel tricks happen) and in constrained reinforcement learning.

## Key takeaway

Convexity is the line between problems we can solve reliably and problems we can only approximately solve. If you can formulate your problem as convex, do it — you get global optimality guarantees, well-understood convergence rates, and robust algorithms. If you can't (deep learning, most interesting problems), know that you're giving up those guarantees and plan accordingly.
