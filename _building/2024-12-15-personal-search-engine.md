---
layout: post
path: /_building/
share: true
title: A tiny search engine for personal notes
description: TF-IDF, inverted indices, and 300 lines of Python that replaced my Ctrl+F habit.
summary: 
tags:
  - python
  - information retrieval
excerpt: 
---

## The problem

I have ~400 markdown files in my notes folder. Some are structured, most are brain dumps. When I need to find something, I grep. Grep is great for exact matches. Grep is terrible when I remember the *concept* but not the exact words I used.

"That thing about gradient descent and saddle points" — good luck grepping for that.

## The solution

A local search engine that indexes my notes using TF-IDF (Term Frequency–Inverse Document Frequency) and ranks results by relevance, not just string matching.

The core is about 300 lines of Python:

1. **Tokenizer:** Splits text into words, lowercases, strips punctuation, removes stop words. Nothing fancy.
2. **Inverted index:** Maps each token to the set of documents containing it, along with positional information.
3. **TF-IDF scoring:** For a query, each matching document gets a score based on how frequently the query terms appear in it (TF) relative to how common those terms are across all documents (IDF). Rare terms in a document score higher.
4. **CLI interface:** `./search.py "saddle points gradient"` returns the top 10 matching files, ranked.

## Tricks that helped

**Stemming.** Using NLTK's Porter stemmer so that "running", "runs", and "ran" all match "run". This alone doubled the useful results for most queries.

**Phrase proximity.** When query terms appear near each other in a document, that document gets a boost. This helps distinguish a note that mentions both "gradient" and "saddle" in the same paragraph from one that mentions them pages apart.

**Incremental indexing.** The index is serialized to a JSON file. On startup, only files modified since the last index build are re-processed. This keeps search startup under 200ms even with 400 files.

## What I learned

TF-IDF is from the 1970s and it's still remarkably effective for small corpora. The urge to use embeddings and vector search is strong — and for a larger corpus it'd make sense — but for 400 personal notes, a well-tuned TF-IDF index is faster, simpler, and doesn't require a GPU or an API key.

Sometimes the boring solution is the right one.
