# SpaceView 🌌

A React Native/Expo app that displays a daily curated gallery of astrophotography from NASA's Image Library featuring stunning images of the cosmos.

## Features

### Curated Astrophotography Gallery
- 🖼️ **Daily curated selection** of 2 high-quality astrophotography images
- 🔄 **Topic rotation**: James Webb, nebulas, black holes, deep fields, planets, galaxies
- 💾 **Local caching** using expo-file-system (images persist for the day)
- 📍 **Rich metadata**: photographer credits, location data when available
- 🎨 **Grid layout**: Beautiful 2-column gallery showcasing JWST, nebulas, deep fields, black holes, and more
- 🎯 Tap any image to view in high resolution

### UI/UX
- 🌑 **Pure black background** (#000000) for optimal OLED viewing
- 📱 Pull-to-refresh for updates
- ⚡ Graceful loading states
- ✨ Clean dark UI optimized for astrophotography

## Getting Started

```bash
# Install dependencies
npm install

# Run on web
npm run web

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## API

### NASA Image Library
Queries the [NASA Image Library API](https://images-api.nasa.gov/) for curated astrophotography. The app cycles through topics daily based on the date:
- James Webb Space Telescope images
- Nebulas and star-forming regions
- Black holes and accretion disks
- Deep field observations
- Planetary imagery
- Galaxies and large-scale structures

## Tech Stack

- React Native
- Expo
- NASA Image Library API
- expo-file-system (local caching)

## Architecture

### Caching Strategy
The app implements a daily caching mechanism for curated images:
- Images are downloaded once per day to device storage
- Metadata (title, photographer, location) is cached alongside images
- On subsequent app loads during the same day, cached images are served instantly
- Cache automatically refreshes with new content the next day

### Services
- `services/nasaLibrary.js` — NASA Image Library API integration, caching, and topic rotation logic

## Screenshots

*Space is beautiful. So is this app.*

---

Built with ☕ and curiosity about the cosmos.

**Last updated**: 2026-02-22
