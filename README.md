# FrameFuseVid

A desktop application to combine Zoom cloud recording files (screen share, speaker view, gallery view, audio, and transcripts) into a single video with customizable layouts.

## Features

- **Auto-detect Zoom files** - Automatically identifies screen share, speaker view, gallery view, audio, and transcript files
- **Multiple layouts** - Picture-in-Picture (PIP), Side-by-Side, Sequential, or Audio Merge
- **Interactive PIP positioning** - Drag the overlay directly in the live preview to position it anywhere
- **Live preview** - See your exact layout with actual video thumbnails before processing
- **Video thumbnails** - Preview all detected video files with metadata (duration, resolution, fps)
- **Burn subtitles** - Embed VTT/SRT captions directly into the video
- **Quality presets** - Fast (quick encoding), Medium (balanced), or Slow (best quality)
- **Cross-platform** - Works on macOS, Windows, and Linux

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

## Installation

1. **Clone or download the repository**

   ```bash
   cd framefusevid
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This will install all required packages including:
   - Electron (desktop framework)
   - React (UI framework)
   - FFmpeg (video processing - bundled automatically)
   - Tailwind CSS (styling)

## Running the App

### Development Mode

Run the app in development mode with hot-reload:

```bash
npm run dev
```

This will:
1. Start the React development server on `http://localhost:3000`
2. Launch the Electron app once the server is ready
3. Open DevTools automatically for debugging

### Production Mode (without building)

```bash
npm start
```

> Note: You need to run `npm run build` first to create the production build.

## Building Standalone App

Build the app as a standalone executable for distribution.

### Build for All Platforms

```bash
npm run build
```

This creates:
- React production build in `/build`
- Platform-specific installers in `/dist`

### Build for Specific Platform

**macOS (.dmg):**
```bash
npm run build:mac
```

**Windows (.exe installer):**
```bash
npm run build:win
```

**Linux (.AppImage):**
```bash
npm run build:linux
```

### Build Output

After building, find your installers in the `/dist` folder:

| Platform | Output File |
|----------|-------------|
| macOS (Apple Silicon) | `FrameFuseVid-0.1.0-arm64.dmg` |
| macOS (Intel) | `FrameFuseVid-0.1.0-x64.dmg` |
| Windows | `FrameFuseVid Setup 0.1.0.exe` |
| Linux | `FrameFuseVid-0.1.0.AppImage` |

> **Note:** macOS builds are not code-signed by default. For distribution, you'll need an Apple Developer certificate. Unsigned builds work fine for local use but macOS may show a security warning.

## Usage Guide

### Step 1: Select Files

1. Click **"Scan Zoom Folder"** to auto-detect files from a Zoom recording folder
   - Or click **"Select Individual Files"** to manually choose files

2. The app automatically detects:
   - **Screen Share** - Main presentation/screen recording
   - **Speaker View** - Active speaker video (`_as_`, `_avo_` patterns)
   - **Gallery View** - Grid view of all participants (`_gv_`, `_gvo_` patterns)
   - **Audio** - Audio-only file (`.m4a`, `.mp3`)
   - **Transcript** - Subtitle file (`.vtt`, `.srt`)

### Step 2: Layout & Preview

1. Choose a layout:
   - **Picture-in-Picture** - Overlay one video on another (e.g., speaker over screen share)
   - **Side by Side** - Two videos next to each other (50/50 split)
   - **Sequential** - Videos played one after another
   - **Audio Merge** - Replace video audio with a separate audio file

2. For PIP layout:
   - Select **Main Video** source (background)
   - Select **Overlay Video** source (small video)
   - **Drag the overlay** directly in the preview to position it anywhere
   - Choose from preset positions (corners) or use custom placement
   - Adjust overlay size with the slider (10% to 50%)

3. **Live Preview** - See your layout in real-time with actual video thumbnails before combining

### Step 3: Combine & Export

1. Configure output settings:
   - **Quality**: Fast (quick, larger file), Medium (balanced), Slow (best quality)
   - **Burn Subtitles**: Embed captions into video

2. Click **"Start Combining"**

3. Choose output location and filename

4. Wait for processing to complete

5. Click **"Show in Folder"** to locate your combined video

## Supported File Formats

### Input
- **Video**: MP4, MOV, M4V, AVI, MKV, WebM
- **Audio**: M4A, MP3, AAC, WAV
- **Subtitles**: VTT, SRT

### Output
- **Video**: MP4 (H.264), MKV, MOV

## Zoom File Detection Patterns

The app automatically identifies Zoom files by these naming patterns:

| Type | Patterns Detected |
|------|-------------------|
| Screen Share | `shared_screen`, `screenshare`, `screen_share`, or fallback to base filename |
| Speaker View | `speaker`, `active_speaker`, `_as_`, `_avo_` |
| Gallery View | `gallery`, `_gv_`, `_gvo_` |
| Audio | `audio_only`, `.m4a`, `.mp3` |
| Transcript | `.vtt`, `.srt` |

## Troubleshooting

### "Main video file not found"
- Ensure you've selected or scanned a folder with video files
- Check that at least one video source is assigned

### Videos not detected correctly
- Zoom file naming varies; use "Select Individual Files" to manually assign
- The base video (no suffix) is treated as screen share by default

### Build fails on Windows
- Run as Administrator
- Ensure no antivirus is blocking the build process

### Build fails on macOS
- For signing/notarization, you need an Apple Developer account
- For local testing, unsigned builds work fine

### Video preview not loading
- The app uses a custom protocol (`local-file://`) to load videos
- Restart the app if previews don't appear

## Project Structure

```
framefusevid/
├── src/
│   ├── main/
│   │   ├── main.js       # Electron main process
│   │   └── preload.js    # Preload script for IPC
│   ├── App.jsx           # React application
│   ├── index.js          # React entry point
│   └── index.css         # Global styles (Tailwind)
├── public/
│   └── index.html        # HTML template
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
└── README.md             # This file
```

## Tech Stack

- **Electron 28** - Cross-platform desktop framework
- **React 18** - UI library
- **Tailwind CSS 3** - Utility-first CSS
- **FFmpeg** - Video processing (bundled via ffmpeg-static)
- **Lucide React** - Icons
- **electron-builder** - App packaging and distribution

## License

MIT License - Feel free to use, modify, and distribute.
