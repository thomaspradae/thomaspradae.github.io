---
layout: post
path: /_building/
share: true
title: Writing a chess engine from scratch
description: Bitboards, alpha-beta pruning, and the humbling experience of losing to your own creation.
summary: 
tags:
  - algorithms
  - chess
  - c++
excerpt: 
---

## Why

Because I wanted to understand search. Not the Google kind — the adversarial kind. Minimax, alpha-beta pruning, iterative deepening. These algorithms show up everywhere in AI and game theory, and I figured the best way to learn them was to build something that uses them to beat me at a game I'm mediocre at.

## Board representation

I went with bitboards. A bitboard is a 64-bit integer where each bit represents a square on the chessboard. You have one bitboard per piece type per color (12 total), and operations like "find all squares attacked by white knights" become bitwise AND/OR/XOR on integers. It's fast, cache-friendly, and makes move generation almost entirely branchless.

Example: to generate knight moves from square `sq`, you look up a precomputed attack table:

```cpp
uint64_t knight_attacks = KNIGHT_TABLE[sq] & ~friendly_pieces;
```

That single line gives you every legal knight move. No loops, no conditionals.

## Search

The search is alpha-beta pruning on top of minimax with iterative deepening. At depth 1, the engine evaluates all legal moves and picks the best. At depth 2, it assumes the opponent also picks their best. And so on, with alpha-beta cutting branches that can't possibly affect the result.

In practice, the raw search depth I can reach in a reasonable time (~2 seconds per move) is about 7-8 plies. With move ordering heuristics (searching captures first, using killer moves from previous iterations), the effective depth is closer to 10-12 because the pruning is more efficient.

## Evaluation

This is where the engine is weakest and where I'm spending most of my time now. The evaluation function takes a board position and returns a score in centipawns. Currently it considers:

- Material balance (standard piece values)
- Piece-square tables (knights are better in the center, kings should castle)
- Pawn structure (doubled pawns, isolated pawns, passed pawns)
- Basic king safety (pawn shield, open files near king)

What it *doesn't* do yet: mobility, rook on open file bonus, bishop pair, endgame-specific evaluation, or any kind of neural network scoring. Adding NNUE-style evaluation is on the roadmap but would change the project significantly.

## Current strength

It beats me consistently (I'm ~1400 on Lichess). Against Stockfish, it loses badly, obviously. Against other amateur engines, it holds its own at rapid time controls. I estimate its strength at roughly 1800-2000 Elo depending on time control.

The humbling part is realizing how much chess knowledge is encoded in a good evaluation function. The search is elegant — alpha-beta is beautiful mathematics. But the evaluation is where human chess understanding gets translated into numbers, and that translation is lossy in ways that are hard to debug.

## Lessons

1. Bitwise operations are criminally underused in day-to-day programming
2. Move ordering matters more than search depth
3. Debugging a chess engine is uniquely painful — the bug manifests as "it plays a bad move" and you have to trace through a search tree with millions of nodes to find where the evaluation went wrong
4. C++ is the right language for this. I tried a Python prototype first. It searched about 800 nodes/second. The C++ version does 5 million.