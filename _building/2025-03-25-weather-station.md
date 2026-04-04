---
layout: post
path: /_building/
share: true
title: A Raspberry Pi weather station for the apartment
description: Temperature, humidity, pressure, and the satisfaction of seeing data from your own balcony.
summary: 
tags:
  - hardware
  - python
  - raspberry pi
excerpt: 
---

## Setup

A Raspberry Pi Zero W, a BME280 sensor (temperature + humidity + pressure), and a waterproof enclosure zip-tied to the balcony railing. Total cost: about $25.

The BME280 communicates over I2C. Two wires for data, two for power. A Python script reads the sensor every 60 seconds and appends to a SQLite database. A cron job runs the script on boot.

## Data pipeline

Every minute:
1. Read temperature (°C), relative humidity (%), and barometric pressure (hPa) from the sensor
2. Timestamp it
3. Insert into `readings` table
4. Every hour, compute and store the hourly average in a `hourly_summary` table

The raw database grows at about 1.5MB per month. At this rate, I could run it for 20 years on the Pi's SD card.

## Dashboard

A Flask app running on the Pi itself, accessible on my local network. Three time-series charts (one per metric), a current-conditions card, and a 24-hour min/max summary. The charts use Chart.js — nothing fancy, but responsive and readable.

The most useful feature: a pressure trend indicator. If pressure drops more than 3 hPa in 3 hours, the dashboard shows a "rain likely" badge. It's been right about 80% of the time, which is better than my intuition and worse than my phone's weather app, but the data is *mine* and that matters to me for reasons I can't fully articulate.

## Surprises

- The temperature inside my apartment varies by 4°C between 3 a.m. and 3 p.m. I did not expect this.
- Humidity spikes exactly 12 minutes after I start cooking. Every time. The kitchen ventilation is terrible.
- Bogotá's barometric pressure is remarkably stable compared to temperate climates. We sit at ~2,600m, so the baseline is around 740 hPa, and daily variation is rarely more than 5 hPa.

## What's next

- Add a rain gauge (tipping bucket sensor, ~$8)
- Wind speed/direction (anemometer — harder to mount on a balcony)
- Push daily summaries to this website via a GitHub Actions workflow
