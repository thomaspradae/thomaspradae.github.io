---
layout: post
path: /_notes/
share: true
title: Bayesian thinking - a primer
description: Notes on Bayesian probability, priors, updating, and why it matters outside of statistics.
summary: 
tags:
  - math
  - probability
  - notes
excerpt: 
---

## The core idea

Bayesian thinking is about updating beliefs in light of evidence. You start with a prior belief (how likely you think something is before seeing data), observe evidence, and compute a posterior belief (how likely it is after seeing data). The mechanism is Bayes' theorem:

\\\[P(H&#124;E) = \frac{P(E&#124;H) \cdot P(H)}{P(E)}\\\]

Where:
- \\\(P(H&#124;E)\\\) — posterior: probability of hypothesis H given evidence E
- \\\(P(E&#124;H)\\\) — likelihood: probability of seeing this evidence if H is true
- \\\(P(H)\\\) — prior: probability of H before seeing evidence
- \\\(P(E)\\\) — marginal likelihood: probability of seeing this evidence under all hypotheses

## A concrete example

You take a medical test. The test is 99% accurate (both sensitivity and specificity). You test positive. What's the probability you actually have the disease?

Intuition says 99%. Bayes says: *it depends on the base rate.*

If the disease affects 1 in 10,000 people:
- \\\(P(H) = 0.0001\\\) (prior)
- \\\(P(E&#124;H) = 0.99\\\) (true positive rate)
- \\\(P(E&#124;\neg H) = 0.01\\\) (false positive rate)
- \\\(P(E) = P(E&#124;H)P(H) + P(E&#124;\neg H)P(\neg H) = 0.99 \times 0.0001 + 0.01 \times 0.9999 \approx 0.010098\\\)

\\\[P(H&#124;E) = \frac{0.99 \times 0.0001}{0.010098} \approx 0.0098\\\]

Less than 1%. A positive result on a 99% accurate test, and there's still only a ~1% chance you have the disease. The base rate dominates.

This single example has permanently changed how I think about test results, news headlines, and any claim that doesn't specify its base rate.

## Priors matter

The most philosophically interesting part: the prior. Frequentists object to Bayesian methods partly because the prior is "subjective." And it is. Two people with different priors will reach different posteriors from the same evidence.

But here's the thing: with enough evidence, the prior washes out. Two people with wildly different priors, given the same large dataset, will converge to very similar posteriors. The prior is a starting point, not a destination. And at least the Bayesian framework makes the starting point *explicit*, which is more honest than pretending you don't have one.

## Bayesian updating as a way of life

Outside of formal statistics, Bayesian thinking is a mental framework:

1. **State your belief explicitly**, including uncertainty ("I think there's a 30% chance this approach will work")
2. **Identify what evidence would change your mind** ("If the tests pass on the first run, I'd update to 70%")
3. **Actually update when you see evidence** (this is the hard part — we're naturally resistant to changing beliefs)
4. **Calibrate over time** ("Am I well-calibrated? When I say 30%, does it happen ~30% of the time?")

The last point connects to the forecasting literature (Tetlock's *Superforecasters*). The best predictors aren't smarter — they're better at updating.
