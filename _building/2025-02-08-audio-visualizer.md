---
layout: post
path: /_building/
share: true
title: Audio visualizer with the Web Audio API
description: Real-time FFT analysis, frequency-reactive geometry, and making music visible.
summary: 
tags:
  - javascript
  - web audio
  - canvas
excerpt: 
---

## Overview

The Web Audio API gives you access to the raw frequency and time-domain data of any audio playing in the browser. An `AnalyserNode` performs a real-time FFT (Fast Fourier Transform) and hands you an array of frequency magnitudes at 60fps. The question is what to do with that array.

## Architecture

The signal chain:

```
AudioSource → AnalyserNode → (visualization)
                ↓
          GainNode → AudioDestination (speakers)
```

The analyser sits on a branch — it taps the signal without modifying it. I configure it with `fftSize: 2048`, which gives me 1024 frequency bins. Each bin represents a frequency band, with the spacing determined by the sample rate (typically 44.1kHz). So each bin spans about 43Hz.

## Visualization modes

**Waveform:** The simplest — plot `getByteTimeDomainData()` as a line. This gives you the raw waveform, which is satisfying for percussive music but kind of boring for sustained tones.

**Spectrum bars:** Classic. Map each frequency bin (or a group of bins) to a bar height. I use a logarithmic frequency scale so bass frequencies get adequate visual space — on a linear scale, the first few bars would contain everything from 20Hz to 2kHz and the remaining 1020 bars would cover the inaudible upper range.

**Radial:** My favorite. Arrange the frequency bins in a circle, with magnitude controlling radius. Bass in the center, treble on the outside. When a kick drum hits, the whole thing pulses outward. When a hi-hat hits, the outer ring flickers. It makes the frequency content spatially intuitive.

**Particle field:** 500 particles whose behavior is driven by frequency bands. Low frequencies control gravity. Mid frequencies control velocity. High frequencies control color temperature. The result is a particle system that "dances" — not randomly, but in response to the actual harmonic content of the music. Rhythmic music produces rhythmic motion. Ambient music produces slow drifts.

## Challenges

**Latency.** The analyser introduces a small delay (one FFT window, ~23ms at 2048 samples). For visualization this is imperceptible. For anything requiring sync with video, it matters.

**Perceptual weighting.** Raw FFT magnitudes don't correspond to perceived loudness. I apply A-weighting to approximate how human hearing works — we're most sensitive around 2-5kHz and less sensitive at the extremes. Without this, bass-heavy music looks underwhelming even when it *sounds* overwhelming.

**Microphone input.** Using `getUserMedia()` to visualize ambient sound (from a room mic) instead of a file. Works great for live performances. The permissions UX is terrible.
