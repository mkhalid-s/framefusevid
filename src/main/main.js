// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Store = require('electron-store');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Configure ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const store = new Store();
let mainWindow;
let currentProcess = null;

// Register custom protocol for serving local files
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    show: false
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  mainWindow.loadURL(startUrl);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register protocol handler to serve local files
  protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''));
    callback({ path: filePath });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============ IPC Handlers ============

// Open file dialog
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'm4v', 'mov', 'mkv', 'avi'] },
      { name: 'Audio Files', extensions: ['m4a', 'mp3', 'aac', 'wav'] },
      { name: 'Subtitle Files', extensions: ['vtt', 'srt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.filePaths;
});

// Open folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'combined_output.mp4',
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'MKV Video', extensions: ['mkv'] },
      { name: 'MOV Video', extensions: ['mov'] }
    ]
  });
  return result.filePath;
});

// Get file info using ffprobe
ipcMain.handle('file:getInfo', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err.message);
        return;
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          fps: eval(videoStream.r_frame_rate)
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate
        } : null
      });
    });
  });
});

// Scan folder for Zoom recordings
ipcMain.handle('folder:scan', async (event, folderPath) => {
  const files = fs.readdirSync(folderPath);
  const zoomFiles = {
    screenshare: null,
    speaker: null,
    gallery: null,
    audio: null,
    transcript: null
  };

  const patterns = {
    screenshare: ['shared_screen', 'screenshare', 'screen_share'],
    speaker: ['speaker', 'active_speaker', '_as_', '_avo_'],
    gallery: ['gallery', '_gv_', '_gvo_'],
    audio: ['audio_only', '.m4a', '.mp3'],
    transcript: ['.vtt', '.srt']
  };

  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
  const unmatchedVideos = [];

  for (const file of files) {
    const lower = file.toLowerCase();
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (!stat.isFile()) continue;

    let matched = false;
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(k => lower.includes(k))) {
        zoomFiles[type] = {
          name: file,
          path: fullPath,
          size: stat.size
        };
        matched = true;
        break;
      }
    }

    // Track unmatched video files
    if (!matched && videoExtensions.some(ext => lower.endsWith(ext))) {
      unmatchedVideos.push({
        name: file,
        path: fullPath,
        size: stat.size
      });
    }
  }

  // If no screenshare found, use first unmatched video
  if (!zoomFiles.screenshare && unmatchedVideos.length > 0) {
    zoomFiles.screenshare = unmatchedVideos[0];
    // If there's a second video, assign to speaker
    if (!zoomFiles.speaker && unmatchedVideos.length > 1) {
      zoomFiles.speaker = unmatchedVideos[1];
    }
  }

  return zoomFiles;
});

// Combine videos
ipcMain.handle('ffmpeg:combine', async (event, options) => {
  const { files, layout, settings, outputPath } = options;
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    
    // Add input files based on layout
    const mainFile = files[settings.mainSource]?.path;
    const pipFile = files[settings.pipSource]?.path;
    const audioFile = files.audio?.path;
    const subtitleFile = files.transcript?.path;

    if (!mainFile) {
      reject('Main video file not found');
      return;
    }

    // Build filter complex based on layout
    let filterComplex = '';
    let outputOptions = [];

    if (layout === 'pip' && pipFile) {
      command.input(mainFile).input(pipFile);

      const posMap = {
        'bottom-right': 'main_w-overlay_w-20:main_h-overlay_h-20',
        'bottom-left': '20:main_h-overlay_h-20',
        'top-right': 'main_w-overlay_w-20:20',
        'top-left': '20:20'
      };

      // Calculate overlay position - support custom X/Y or preset positions
      let overlayPosition;
      if (settings.pipPosition === 'custom' && settings.pipX !== undefined && settings.pipY !== undefined) {
        // Convert percentage (0-100) to FFmpeg overlay coordinates
        // pipX/pipY represent percentage of available space (accounting for overlay size)
        overlayPosition = `(main_w-overlay_w)*${settings.pipX}/100:(main_h-overlay_h)*${settings.pipY}/100`;
      } else {
        overlayPosition = posMap[settings.pipPosition] || posMap['bottom-right'];
      }

      filterComplex = `[1:v]scale=iw*${settings.pipScale}:ih*${settings.pipScale}[pip];` +
                      `[0:v][pip]overlay=${overlayPosition}`;
      
      if (settings.burnSubtitles && subtitleFile) {
        filterComplex += `[vtmp];[vtmp]subtitles='${subtitleFile.replace(/\\/g, '/').replace(/'/g, "\\'")}'[v]`;
      } else {
        filterComplex += '[v]';
      }
      
      outputOptions = ['-map', '[v]', '-map', '0:a?'];
      
    } else if (layout === 'sidebyside' && pipFile) {
      command.input(mainFile).input(pipFile);
      
      filterComplex = '[0:v]scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2[left];' +
                      '[1:v]scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2[right];' +
                      '[left][right]hstack';
      
      if (settings.burnSubtitles && subtitleFile) {
        filterComplex += `,subtitles='${subtitleFile.replace(/\\/g, '/').replace(/'/g, "\\'")}'[v]`;
      } else {
        filterComplex += '[v]';
      }
      
      outputOptions = ['-map', '[v]', '-map', '0:a?'];
      
    } else if (layout === 'audioMerge' && audioFile) {
      command.input(mainFile).input(audioFile);
      outputOptions = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy'];
      
    } else {
      command.input(mainFile);
      if (settings.burnSubtitles && subtitleFile) {
        filterComplex = `subtitles='${subtitleFile.replace(/\\/g, '/').replace(/'/g, "\\'")}'[v]`;
        outputOptions = ['-map', '[v]', '-map', '0:a?'];
      }
    }

    // Apply filter complex if exists
    if (filterComplex) {
      command.complexFilter(filterComplex);
    }

    // Quality settings
    const presets = { fast: 'ultrafast', medium: 'medium', slow: 'slow' };
    const crfs = { fast: '28', medium: '23', slow: '20' };

    command
      .outputOptions(outputOptions)
      .videoCodec('libx264')
      .addOption('-preset', presets[settings.quality] || 'medium')
      .addOption('-crf', crfs[settings.quality] || '23')
      .audioCodec('aac')
      .audioBitrate('192k')
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFmpeg started:', cmd);
        mainWindow.webContents.send('ffmpeg:started', cmd);
      })
      .on('progress', (progress) => {
        mainWindow.webContents.send('ffmpeg:progress', {
          percent: progress.percent || 0,
          timemark: progress.timemark,
          currentFps: progress.currentFps,
          targetSize: progress.targetSize
        });
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message);
        currentProcess = null;
        reject(err.message);
      })
      .on('end', () => {
        console.log('FFmpeg finished');
        currentProcess = null;
        resolve({ success: true, outputPath });
      });

    currentProcess = command;
    command.run();
  });
});

// Cancel current process
ipcMain.handle('ffmpeg:cancel', () => {
  if (currentProcess) {
    currentProcess.kill('SIGKILL');
    currentProcess = null;
    return true;
  }
  return false;
});

// Open file in system
ipcMain.handle('shell:openPath', (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// Store operations
ipcMain.handle('store:get', (event, key) => store.get(key));
ipcMain.handle('store:set', (event, key, value) => store.set(key, value));

// Get app version
ipcMain.handle('app:getVersion', () => app.getVersion());
