---
layout: post
path: /_building/
share: true
title: Mapping Bogotá's bus network from GTFS data
description: Parsing transit data, building a graph, and visualizing the hidden structure of TransMilenio.
summary: 
tags:
  - data
  - visualization
  - bogotá
excerpt: 
---

## (0.0.0) - Overview

Bogotá publishes its TransMilenio GTFS feed openly. GTFS (General Transit Feed Specification) is a standardized format for public transit schedules — it's basically a set of CSV files describing stops, routes, trips, and schedules. I wanted to turn that into something visual: a network graph where nodes are stations and edges are weighted by the number of trips connecting them per day.

## (1.0.0) - Parsing the feed

The GTFS zip contains about a dozen text files. The key ones:

- `stops.txt` — lat/lon and name for each station
- `routes.txt` — route identifiers and names
- `trips.txt` — links routes to specific scheduled trips
- `stop_times.txt` — the big one. Every scheduled stop event, with arrival/departure times. ~2.4 million rows.

I used Python with pandas for the initial parsing. The join pattern is: `stop_times → trips → routes`, then group by pairs of consecutive stops to build the edge list.

## (2.0.0) - Building the graph

With the edge list, I used NetworkX to build a weighted directed graph. Each edge weight is the total number of trips per weekday connecting two consecutive stops. This immediately reveals the backbone of the system — the troncal routes along the Caracas and Autopista Norte corridors have edges 10x heavier than feeder routes.

Some interesting things that emerged:

- **Portal del Norte** and **Portal del Sur** are the highest-degree nodes, which makes sense — they're the terminal stations where feeder buses converge.
- The network has a surprisingly low diameter. Most station pairs are reachable in ≤ 3 transfers, but the time cost of those transfers is another story.
- Several feeder routes form near-isolated subgraphs, connected to the rest of the system by a single troncal station. If that station goes down, entire neighborhoods lose access.

## (3.0.0) - Visualization

I rendered the graph using D3.js with a force-directed layout, then overlaid it on a Leaflet map. The force-directed version is more useful for seeing structure; the geographic version is more useful for seeing how the system serves (or fails to serve) specific areas.

The most striking thing: the western expansion zones (Suba, Engativá) have massive populations but thin, dendritic transit connections. Compare that to the dense mesh along the historic center-north corridor. The network encodes the city's inequality in its topology.

## (4.0.0) - Next steps

- Isochrone analysis: from any given station, where can you reach in 30/60/90 minutes?
- Compare weekday vs. weekend service
- Historical comparison with pre-TransMilenio bus routes (if I can find the data)
