---
layout: post
path: /_notes/
share: true
title: "Notes on Gödel, Escher, Bach"
description: Reading notes on Hofstadter's GEB. Formal systems, strange loops, and the nature of self-reference.
summary: 
tags:
  - book notes
  - math
  - philosophy
excerpt: 
---

## What the book is actually about

Everyone says GEB is about artificial intelligence. Hofstadter himself has said that people miss the point. The book is about *how meaning arises from meaningless elements*. How do symbols that have no inherent significance (like neurons firing, or characters on a page, or notes in a scale) combine to create something that refers to something, that *means* something?

The answer, as far as I understand it: **strange loops**. Systems that, when you move through their levels, unexpectedly return you to where you started. Gödel's incompleteness theorem is the formal version: arithmetic is powerful enough to encode statements *about itself*, and this self-reference creates propositions that are true but unprovable within the system. The loop is: the system talks about itself, and in doing so, exceeds itself.

## The MU puzzle

Chapter 1 is a microcosm of the whole book. You're given a formal system (the MIU system) with simple rules: you can add U after a string ending in I, double everything after M, replace III with U, and drop UU. Starting from MI, can you produce MU?

You can't. But you can't prove it within the system. You have to step *outside*, notice that the number of I's is never divisible by 3, and reason about the system from a higher level. This is the template for everything that follows.

## Formal systems and isomorphism

Hofstadter spends a lot of time on what makes a formal system — axioms, rules of inference, theorems. The key insight: a formal system is "meaningless" in itself. It's just strings and transformation rules. *Meaning* enters when you establish an **isomorphism** between the formal system and something in the world.

The pq-system: strings like `--p---q-----` are theorems. Meaningless — until you interpret `-` as 1, `p` as "plus," and `q` as "equals." Then `--p---q-----` maps to 2 + 3 = 5, and suddenly the formal system is "about" addition. But the system doesn't know that. The meaning is in the mapping, not the strings.

## Gödel numbering

This is the key technical idea. Gödel showed that you can encode any statement of arithmetic as a number (a Gödel number). Statements *about* statements are just arithmetic operations on those numbers. This means arithmetic can talk about itself.

The punchline: you can construct a statement G that, when decoded, says "G is not provable in this system." If G is provable, then the system proves something false (a contradiction, so the system is inconsistent). If G is not provable, then G is true but unprovable (the system is incomplete). Either way, the system can't be both consistent and complete.

I had to read this chapter three times.

## Connections to consciousness

Hofstadter's claim (which he develops more in *I Am a Strange Loop*): consciousness is a strange loop. The brain is a formal system (neurons, connections, activation patterns) that develops the ability to model *itself*. The "I" is not a thing, it's a pattern — a self-referential loop at a level of description high enough to feel like something.

I'm not sure I buy this fully. But I find it more compelling than most theories of consciousness, because it doesn't require magic. It says: self-reference, at sufficient complexity, *is* what consciousness is. The loop is the thing.

## Status

I'm on chapter 14 of 20. The later chapters on TNT (Typographical Number Theory) and BlooP/FlooP are denser. Taking a break before the final push. Will update when finished.
