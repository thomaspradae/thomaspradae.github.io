---
layout: post
path: /_marginalia/
share: true
title: Tools I actually use every day
description: Not aspirational tools. Not tools I installed once. Tools I actually use — plus config snippets, tables, and footnotes.
summary: 
tags:
  - tools
excerpt: 
last_modified_at: 2026-02-28
---

The internet is full of "tools I use" posts that are basically affiliate-link farms. This isn't that. These are the things I open every single day, verified by my shell history — and this revision exists to **stress-test** the blog: lists inside blockquotes, tables, fenced code in several languages, task lists, and footnotes that contain both `inline code` and [links](https://example.com).[^1]

[^1]: Yes, `example.com` is a placeholder — RFC 2606 reserves it for documentation. Real links in real posts; this one is deliberately boring.

## The honest stack (short form)

**Editor:** VS Code. I've tried Neovim three times. Each time I get the config just right, spend a week feeling productive, and then need to do something that requires fifteen keystrokes in Vim and one click in VS Code. I'll try again next year.

**Terminal:** Kitty. Fast, GPU-accelerated, good font rendering. I switched from iTerm2 and the difference in latency is noticeable if you're the kind of person who notices latency (I am, unfortunately).

**Shell:** zsh with a minimal `~/.zshrc`. No Oh My Zsh. I used to have 200 lines of shell config. Now I have 40. Most of the 200 were solving problems created by the other 200.

**Notes:** Obsidian. Markdown files in a folder. No lock-in. The graph view is a toy I look at once a month. The real value is the speed of `[[wikilinks]]` and the daily notes feature.

**Browser:** Firefox. Privacy reasons, mostly. Also because Chrome's memory usage makes my laptop sound like it's preparing for takeoff.

**Music:** Spotify. I hate the algorithm but I'm too deep in the playlist ecosystem to leave. Stockholm syndrome, but for playlists.

**Python env:** `uv` for everything now. It's fast enough that I stopped noticing environment management as a separate step. Before this: conda, then virtualenv, then poetry, then back to virtualenv. Each migration took a year of my life.

**Git GUI:** Lazygit. Changed my relationship with git. I stage hunks, rebase interactively, and resolve conflicts in the terminal now. Didn't think I needed a TUI for git until I used one.

**Drawing/diagrams:** Excalidraw for quick sketches, Figma for anything that needs to look presentable. I draw architecture diagrams in Excalidraw and only move to Figma when someone asks "can you make it look professional?"

**Everything else:** I use `rg` instead of `grep`, `fd` instead of `find`, `bat` instead of `cat`, `eza` instead of `ls`. Not because the originals are bad, but because the modern rewrites have better defaults and I'm lazy.

---

## Blockquote + nested list (reading flow)

> **Rule:** If a tool needs a conference talk to justify itself, I’m suspicious.
>
> **Corollary:** If a tool needs a *second* conference talk to explain the first conference talk, I’m out — unless it’s Emacs, in which case I’m out *respectfully*.
>
> Daily drivers, in order of touching:
> 1. Terminal
> 2. Editor
> 3. Browser
> 4. Music player (guilty)
> 5. That one stray PDF reader I refuse to update

---

## Table: “claimed benefit” vs “actual benefit”

| Tool | Claimed benefit | Actual benefit |
| --- | --- | --- |
| `rg` | Speed | *Not* having to think about flags |
| `bat` | Syntax highlight | Pagination that doesn’t make me angry |
| `fd` | Speed | Respects `.gitignore` by default |
| Kitty | GPU | Font rendering that doesn’t look like 2009 |

*Small comparison table — baseline caption pattern after a table.*

## Table stress: wide cells, code, math, dollars

| Kind | Example |
| --- | --- |
| Inline code | `rg --files \| head`, `sed -E 's/foo/bar/g'`, `` `nested` `` |
| Inline TeX | KL: \\(D_{\mathrm{KL}}(p\&#124;q)\\); entropy \\(H\\) in bits: \\(-\sum p_i \log_2 p_i\\) |
| Dollar signs (escaped) | MSRP \$299 — \$49/mo — use backslash-dollar so parsers don’t treat `\$...` as math |
| Long prose in one cell | This cell is intentionally long: you’re checking line-height, wrapping, border alignment, and whether the row still feels readable when someone pastes a whole paragraph of rationale, caveats, and “by the way” clauses that should have been footnotes but weren’t. |

*Footer: mixed modalities in one table — inline code, TeX-style math \\(H(X)\\), and literal currency via `\$`.*

<div class="figures-counted" markdown="1">

| Step | Command | What it does |
| --- | --- | --- |
| 1 | `git rebase -i HEAD~3` | Interactive rebase; editor opens for `pick` / `squash` / `reword`. |
| 2 | `git commit --amend --no-edit` | Amend last commit message or files without opening editor. |
| 3 | `diff <(git show :2:file) <(git show :3:file)` | Compare stages during conflict (bash process substitution). |

*Numbered table prefix (Table 1, Table 2, …) only inside `.figures-counted` — see `fugg2.css`.*

| Env var | Typical value | Note |
| --- | --- | --- |
| `PATH` | `/usr/local/bin:\$HOME/.local/bin` | Escaped `\$` so it’s not math. |
| `EDITOR` | `nvim` or `code --wait` | Inline code in cells. |
| `HISTFILE` | `\$HOME/.zsh_history` | Another `\$HOME` sanity check. |

*Second table in the same counted block — table counter should increment.*

</div>

## Task list (GFM-style — if your pipeline supports it)

If this renders as checkboxes, great. If not, it still reads as bullets — that’s fine.

- [x] Admit I will never be a Neovim influencer
- [ ] Finish migrating shell aliases to a single file
- [ ] Delete the duplicate `~/bin` scripts (there are three `pdf*` scripts and they all hate each other)
- [x] Write a blog post instead

## Code: shell, JS, YAML

### Shell — find what you actually typed last week

```bash
HISTFILE=~/.zsh_history
# macOS / Linux: adjust path; zsh uses different files sometimes
tail -n 200 "$HISTFILE" | awk '{print $2}' | sort | uniq -c | sort -nr | head
```

### JavaScript — one-off “which day was I productive?” joke

```javascript
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const mood = (d) => (d === "sat" || d === "sun" ? "delusional calm" : "caffeinated dread");
console.log(mood("mon"));
```

### YAML — fake `~/.config` fragment

```yaml
terminal:
  font: "JetBrains Mono"
  font_size: 13
  padding: 12
  scrollback_lines: 100000  # hoarding, but make it ergonomic
```

## Definition list (terminology I actually use)

dotfiles
: The sacred texts — and the reason your laptop is slightly different from everyone else’s in ways that matter only to you.

rice
: Making the desktop look good enough to post on r/unixporn, then never finishing the README.

yak shave
: What happens when you open your shell config to change one alias and emerge three hours later with a new prompt theme and no memory of your original goal.

## Image + caption (chair, because why not)

![Chair render / reference asset from the posts folder](/assets/images/posts/chair.png)
*Chair.png — exists in `assets/images/posts/`; caption line is plain italic per site CSS.*

---

## Footnote with link + code (the “whole nine yards”)

Sometimes I need to remember the exact install line without Googling again:[^2]

[^2]: `uv` self-install (check upstream docs for changes): `curl -LsSf https://astral.sh/uv/install.sh | sh` — official site: [astral.sh/uv](https://astral.sh/uv). If that script ever changes, don’t trust a blog from the past; trust the docs.

And sometimes I need to remember how to *undo* my own mess:

```bash
# Nuclear option: reset shell experiment (don't run blindly)
# cp ~/.zshrc ~/.zshrc.bak && echo '# reset' > ~/.zshrc
```

> Final word: tools don’t save you — they reduce friction. The friction was never *only* technical.