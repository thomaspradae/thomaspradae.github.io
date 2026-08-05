---
layout: post
path: /_writing/
share: true
title: The weight of unfinished things
description: On half-read books, abandoned projects, and the guilt that accumulates in the margins — with lists, images, and footnotes.
summary: 
tags:
  - personal
  - reflection
excerpt: 
last_modified_at: 2026-03-18
---

There's a shelf in my room that functions less as storage and more as an indictment. Fourteen books, give or take, each one started with the kind of conviction that only lasts about forty pages. A bookmark wedged between chapters three and four of *Gödel, Escher, Bach*. A dog-eared copy of *The Brothers Karamazov* that I swore I'd finish during the semester break. A highlighted-to-death introduction to measure theory that I now use to level my desk.[^1]

[^1]: Not a joke about measure theory — okay, *slightly* a joke. For actual intuition: [Measure (mathematics)](https://en.wikipedia.org/wiki/Measure_(mathematics)). Inline ritual: `open book → read 10 pages → feel virtuous → close book`.

It's not laziness. Or maybe it is. I can't tell anymore.

The thing about unfinished things is that they don't just sit there quietly. They hum. A low-grade frequency, barely perceptible during the day but deafening at three in the morning when you're cataloguing your failures. Each abandoned project becomes a small vote against yourself, a data point in the growing dataset titled "things you said you'd do."

I have a folder on my laptop called `projects/` with seventeen subdirectories. Three of them have a README. One of those READMEs just says `TODO`. I check this folder every few weeks like someone visiting a grave.

### A typology (because naming the beast helps)

- **The noble stall:** “I paused to do it *right*.” (Narrator: you did not pause to do it right.)
- **The shame spiral:** you avoid the folder because opening it means confronting who you thought you were.
- **The productive displacement:** you start a *new* project to avoid the old one — fresh guilt, modern problems.
- **The almost:** the worst — close enough to completion that you can taste it, far enough that you’ll never ship without a painful sprint you refuse to schedule.

> And yet — and here's the part I keep circling back to — maybe the weight isn't the problem. Maybe the problem is expecting weightlessness. The fantasy that one day you'll wake up light, every project finished, every book absorbed, every idea brought to completion.

Nested, because the inner voice also nests:

> That's not how this works. You carry the weight, and you learn to walk with it, and some of the things you put down stay down, and that has to be okay.
>
> > The alternative is paralysis. Never starting because you might not finish.

### Numbered truths (debatable)

1. Finishing is a skill separate from talent.
2. Shame is a bad optimizer — it changes behavior, but rarely in the direction you think.
3. “Discipline” without design is just self-punishment with a spreadsheet.
4. Sometimes the unfinished thing is a *bookmark* for a version of you that no longer exists — and that’s allowed.[^2]

[^2]: Related: [Sunk cost](https://en.wikipedia.org/wiki/Sunk_cost) — not always applicable to creative work, but worth keeping in the mental toolbox.

## Figures (images + captions)

Your stylesheet treats `*italic line after an image*` as a caption — here’s that pattern in the wild:

<div class="figures-counted" markdown="1">

![Trail photo — altitude, fog, small figure](/assets/images/posts/hiking.jpeg)
*Hiking frame: the kind of day where the body is tired enough to stop narrating.*

![Notebook / screen snapshot from a daily-note session](/assets/images/posts/Pasted%20image%2020240630002657.png)
*Late-night “daily note” energy — half therapy, half autocomplete.*

</div>

## Mixed list: what actually helps vs what is cosplay

What helps (empirically, *n* = 1):

- Smaller scopes — “one screen of writing,” “one function,” “one chapter.”
- Public embarrassment — telling someone you’ll send a draft by Tuesday. Cruel, effective.
- Replacing the omnibus project with a **pipeline** — same long arc, smaller boxes.

What is cosplay:

- [ ] Color-coded Notion databases that never get opened.
- [ ] Buying a new notebook to fix a life problem.
- [x] Writing a blog post about unfinished work instead of finishing work. (This checkbox joke only works if your Markdown pipeline supports task lists — if not, it still reads fine as bullets.)

## A small table: the shelf as inventory

| Object | Started | Status | Honest label |
| --- | --- | --- | --- |
| *GEB* | 2023 | p. ~180 | “active delusion” |
| Measure theory PDF | 2022 | Ch. 2 | “doorstop” |
| Side project repo | 2024 | 3 commits | “proof of concept (lie)” |

## Code as confession

```bash
# How I pretend I'm organizing my reading list
find ~/reading -name "*.pdf" | wc -l
```

```text
OUTPUT (example):
27
```

```python
# The emotionally accurate model
unfinished = {"books": 14, "essays": 9, "repos": 17}
print(len(unfinished))  # categories, not items — easier to count
```

---

The alternative is paralysis. Never starting because you might not finish. Never opening the book because the shelf already accuses you. Never writing the first line because the last line feels impossibly far.

I'm writing this instead of finishing three other things. The irony isn't lost on me. But maybe the act of naming it — naming the weight, dragging it into the light — is itself a kind of completion. Not of the thing, but of the feeling.

Small victories. I'll take it. If you want a pointless stress-test for footnotes with code and links, here is one.[^3]

[^3]: Thanks for reading. This footnote exists to test **code in footnotes**: `grep -R "TODO" .` and a link: [Field notes home](/).