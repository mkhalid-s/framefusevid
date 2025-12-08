// src/renderer/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, Film, Layout, Play, Trash2, Monitor, Users, Mic, FileText,
  FolderOpen, Settings, ChevronRight, CheckCircle, XCircle, Loader2,
  HardDrive, Clock, Maximize2, X, RefreshCw, FolderOutput, Move, Eye
} from 'lucide-react';

const LAYOUTS = {
  pip: { name: 'Picture-in-Picture', icon: '🖼️', desc: 'Main video with small overlay' },
  sidebyside: { name: 'Side by Side', icon: '⬛⬛', desc: '50/50 split screen' },
  sequential: { name: 'Sequential', icon: '▶️▶️', desc: 'One after another' },
  audioMerge: { name: 'Audio Merge', icon: '🔊', desc: 'Merge audio with video' }
};

const FILE_TYPES = {
  screenshare: { label: 'Screen Share', icon: Monitor, color: 'bg-blue-500' },
  speaker: { label: 'Speaker View', icon: Users, color: 'bg-green-500' },
  gallery: { label: 'Gallery View', icon: Layout, color: 'bg-purple-500' },
  audio: { label: 'Audio Only', icon: Mic, color: 'bg-orange-500' },
  transcript: { label: 'Transcript', icon: FileText, color: 'bg-yellow-500' }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
               : `${m}:${s.toString().padStart(2,'0')}`;
};

// Video Preview Component
function VideoPreview({ src, className = '', onLoad }) {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.src = `local-file://${src}`;
      videoRef.current.currentTime = 1; // Seek to 1 second for thumbnail
    }
  }, [src]);

  return (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {src ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted
          onLoadedData={() => {
            setLoaded(true);
            onLoad?.();
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-600">
          <Film className="w-8 h-8" />
        </div>
      )}
      {src && !loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  );
}

// Draggable PIP Overlay Component
function DraggableOverlay({
  containerRef,
  position,
  scale,
  onPositionChange,
  overlayVideoSrc,
  mainVideoSrc
}) {
  const overlayRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (position.x / 100) * containerRef.current.offsetWidth,
      y: e.clientY - (position.y / 100) * containerRef.current.offsetHeight
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const overlayWidth = scale * 100;
      const overlayHeight = scale * 100;

      let newX = ((e.clientX - dragStart.x) / container.offsetWidth) * 100;
      let newY = ((e.clientY - dragStart.y) / container.offsetHeight) * 100;

      // Clamp to container bounds
      newX = Math.max(0, Math.min(100 - overlayWidth, newX));
      newY = Math.max(0, Math.min(100 - overlayHeight, newY));

      onPositionChange({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, onPositionChange, containerRef]);

  return (
    <div
      ref={overlayRef}
      className={`absolute border-2 border-blue-400 rounded-lg overflow-hidden cursor-move shadow-lg ${
        isDragging ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${scale * 100}%`,
        height: `${scale * 100}%`,
      }}
      onMouseDown={handleMouseDown}
    >
      {overlayVideoSrc ? (
        <video
          src={`local-file://${overlayVideoSrc}`}
          className="w-full h-full object-cover"
          muted
          onLoadedData={(e) => { e.target.currentTime = 1; }}
        />
      ) : (
        <div className="w-full h-full bg-green-500/30 flex items-center justify-center">
          <Users className="w-6 h-6 text-green-400" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
        <Move className="w-6 h-6 text-white" />
      </div>
      <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
        Overlay
      </div>
    </div>
  );
}

// Layout Preview Component
function LayoutPreview({
  layout,
  settings,
  files,
  onSettingsChange
}) {
  const containerRef = useRef(null);
  const mainVideoSrc = files[settings.mainSource]?.path;
  const overlayVideoSrc = files[settings.pipSource]?.path;

  const handlePositionChange = (newPos) => {
    onSettingsChange({
      ...settings,
      pipPosition: 'custom',
      pipX: newPos.x,
      pipY: newPos.y
    });
  };

  // Convert preset positions to coordinates
  const getPositionCoords = () => {
    if (settings.pipPosition === 'custom') {
      return { x: settings.pipX || 70, y: settings.pipY || 70 };
    }
    const positions = {
      'top-left': { x: 2, y: 2 },
      'top-right': { x: 100 - (settings.pipScale * 100) - 2, y: 2 },
      'bottom-left': { x: 2, y: 100 - (settings.pipScale * 100) - 2 },
      'bottom-right': { x: 100 - (settings.pipScale * 100) - 2, y: 100 - (settings.pipScale * 100) - 2 }
    };
    return positions[settings.pipPosition] || positions['bottom-right'];
  };

  if (layout === 'sidebyside') {
    return (
      <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex">
        <div className="flex-1 border-r border-slate-700 relative">
          {mainVideoSrc ? (
            <video
              src={`local-file://${mainVideoSrc}`}
              className="w-full h-full object-contain"
              muted
              onLoadedData={(e) => { e.target.currentTime = 1; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Monitor className="w-12 h-12" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">Main</div>
        </div>
        <div className="flex-1 relative">
          {overlayVideoSrc ? (
            <video
              src={`local-file://${overlayVideoSrc}`}
              className="w-full h-full object-contain"
              muted
              onLoadedData={(e) => { e.target.currentTime = 1; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Users className="w-12 h-12" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">Second</div>
        </div>
      </div>
    );
  }

  if (layout === 'pip') {
    const position = getPositionCoords();
    return (
      <div
        ref={containerRef}
        className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative"
      >
        {mainVideoSrc ? (
          <video
            src={`local-file://${mainVideoSrc}`}
            className="w-full h-full object-contain"
            muted
            onLoadedData={(e) => { e.target.currentTime = 1; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Monitor className="w-16 h-16" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">Main Video</div>

        {containerRef.current && (
          <DraggableOverlay
            containerRef={containerRef}
            position={position}
            scale={settings.pipScale}
            onPositionChange={handlePositionChange}
            overlayVideoSrc={overlayVideoSrc}
            mainVideoSrc={mainVideoSrc}
          />
        )}

        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs flex items-center gap-1">
          <Move className="w-3 h-3" /> Drag to reposition
        </div>
      </div>
    );
  }

  // Default/sequential preview
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative">
      {mainVideoSrc ? (
        <video
          src={`local-file://${mainVideoSrc}`}
          className="w-full h-full object-contain"
          muted
          onLoadedData={(e) => { e.target.currentTime = 1; }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-600">
          <Monitor className="w-16 h-16" />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [files, setFiles] = useState({});
  const [fileInfos, setFileInfos] = useState({});
  const [folderPath, setFolderPath] = useState('');
  const [layout, setLayout] = useState('pip');
  const [settings, setSettings] = useState({
    pipPosition: 'bottom-right',
    pipScale: 0.25,
    pipX: 73,
    pipY: 73,
    mainSource: 'screenshare',
    pipSource: 'speaker',
    burnSubtitles: true,
    quality: 'medium'
  });
  const [outputPath, setOutputPath] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, timemark: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(true);

  // Setup FFmpeg listeners
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onFFmpegProgress((prog) => {
        setProgress(prog);
      });
      return () => window.electronAPI.removeFFmpegListeners();
    }
  }, []);

  // Auto-select available sources when files change
  useEffect(() => {
    const videoTypes = ['screenshare', 'speaker', 'gallery'];
    const availableVideos = videoTypes.filter(t => files[t]?.path);

    if (availableVideos.length > 0) {
      const newSettings = { ...settings };
      if (!files[settings.mainSource]?.path && availableVideos[0]) {
        newSettings.mainSource = availableVideos[0];
      }
      if (!files[settings.pipSource]?.path && availableVideos[1]) {
        newSettings.pipSource = availableVideos[1];
      } else if (!files[settings.pipSource]?.path && availableVideos[0] !== settings.mainSource) {
        newSettings.pipSource = availableVideos.find(v => v !== newSettings.mainSource) || availableVideos[0];
      }
      setSettings(newSettings);
    }
  }, [files]);

  const handleOpenFolder = async () => {
    const folder = await window.electronAPI.openFolder();
    if (folder) {
      setFolderPath(folder);
      setStatus({ type: 'info', message: 'Scanning folder...' });

      const scannedFiles = await window.electronAPI.scanFolder(folder);
      setFiles(scannedFiles);

      // Get file info for each found file
      const infos = {};
      for (const [type, file] of Object.entries(scannedFiles)) {
        if (file?.path) {
          try {
            infos[type] = await window.electronAPI.getFileInfo(file.path);
          } catch (e) { console.error(e); }
        }
      }
      setFileInfos(infos);

      const count = Object.values(scannedFiles).filter(Boolean).length;
      setStatus({ type: 'success', message: `Found ${count} Zoom recording files` });

      // Auto-advance to step 2
      if (count > 0) setTimeout(() => setStep(2), 500);
    }
  };

  const handleOpenFiles = async () => {
    const filePaths = await window.electronAPI.openFiles();
    if (filePaths.length > 0) {
      const newFiles = { ...files };
      const infos = { ...fileInfos };

      for (const filePath of filePaths) {
        const fileName = filePath.split(/[/\\]/).pop().toLowerCase();
        let type = 'screenshare';

        if (fileName.includes('speaker') || fileName.includes('active_speaker') || fileName.includes('_as_')) type = 'speaker';
        else if (fileName.includes('gallery') || fileName.includes('_gv_')) type = 'gallery';
        else if (fileName.includes('_avo_')) type = 'speaker';
        else if (fileName.endsWith('.m4a') || fileName.endsWith('.mp3')) type = 'audio';
        else if (fileName.endsWith('.vtt') || fileName.endsWith('.srt')) type = 'transcript';

        newFiles[type] = { name: filePath.split(/[/\\]/).pop(), path: filePath };

        try {
          infos[type] = await window.electronAPI.getFileInfo(filePath);
          newFiles[type].size = infos[type].size;
        } catch (e) { console.error(e); }
      }

      setFiles(newFiles);
      setFileInfos(infos);
      setStatus({ type: 'success', message: `Added ${filePaths.length} files` });
    }
  };

  const handleSelectOutput = async () => {
    const path = await window.electronAPI.saveFile('combined_output.mp4');
    if (path) setOutputPath(path);
  };

  const handleCombine = async () => {
    if (!outputPath) {
      await handleSelectOutput();
      if (!outputPath) return;
    }

    setProcessing(true);
    setProgress({ percent: 0, timemark: '' });
    setStatus({ type: 'info', message: 'Starting...' });

    try {
      const result = await window.electronAPI.combine({
        files, layout, settings, outputPath
      });

      setStatus({ type: 'success', message: 'Video combined successfully!' });
      setStep(4);
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    await window.electronAPI.cancelProcess();
    setProcessing(false);
    setStatus({ type: 'info', message: 'Process cancelled' });
  };

  const handleOpenOutput = () => {
    if (outputPath) window.electronAPI.openPath(outputPath);
  };

  const resetAll = () => {
    setFiles({});
    setFileInfos({});
    setFolderPath('');
    setOutputPath('');
    setProgress({ percent: 0 });
    setStatus({ type: '', message: '' });
    setStep(1);
  };

  const fileCount = Object.values(files).filter(Boolean).length;
  const availableVideoSources = ['screenshare', 'speaker', 'gallery'].filter(t => files[t]?.path);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Title Bar */}
      <div className="h-8 bg-slate-900/80 flex items-center justify-center px-4 drag-region border-b border-slate-700/50">
        <div className="flex items-center gap-2 no-drag">
          <Film className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">FrameFuseVid</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Steps */}
        <div className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 flex flex-col">
          <div className="space-y-2">
            {[
              { num: 1, label: 'Select Files', icon: FolderOpen },
              { num: 2, label: 'Layout & Preview', icon: Eye },
              { num: 3, label: 'Process', icon: Play },
              { num: 4, label: 'Complete', icon: CheckCircle }
            ].map(({ num, label, icon: Icon }) => (
              <button
                key={num}
                onClick={() => num <= Math.max(step, fileCount > 0 ? 2 : 1) && setStep(num)}
                disabled={num > step && !(num === 2 && fileCount > 0)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  step === num
                    ? 'bg-blue-500 text-white'
                    : num < step
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === num ? 'bg-white/20' : num < step ? 'bg-green-500/20 text-green-400' : 'bg-slate-700'
                }`}>
                  {num < step ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* File Summary */}
          {fileCount > 0 && (
            <div className="mt-6 p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Files Loaded</div>
              <div className="space-y-1">
                {Object.entries(FILE_TYPES).map(([type, config]) => {
                  const file = files[type];
                  return file ? (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      <span className="text-slate-300 truncate flex-1">{config.label}</span>
                      <span className="text-slate-500">{formatSize(file.size)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Quick settings in sidebar when on step 2 */}
          {step === 2 && layout === 'pip' && (
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg space-y-3">
              <div className="text-xs text-slate-400">Quick Adjustments</div>
              <div>
                <label className="text-xs text-slate-500">Overlay Size: {Math.round(settings.pipScale * 100)}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.02"
                  value={settings.pipScale}
                  onChange={(e) => setSettings(s => ({ ...s, pipScale: parseFloat(e.target.value) }))}
                  className="w-full mt-1"
                />
              </div>
              {settings.pipPosition === 'custom' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500">X Position: {Math.round(settings.pipX)}%</label>
                    <input
                      type="range"
                      min="0"
                      max={100 - settings.pipScale * 100}
                      step="1"
                      value={settings.pipX}
                      onChange={(e) => setSettings(s => ({ ...s, pipX: parseFloat(e.target.value) }))}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y Position: {Math.round(settings.pipY)}%</label>
                    <input
                      type="range"
                      min="0"
                      max={100 - settings.pipScale * 100}
                      step="1"
                      value={settings.pipY}
                      onChange={(e) => setSettings(s => ({ ...s, pipY: parseFloat(e.target.value) }))}
                      className="w-full mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Select Files */}
          {step === 1 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Select Zoom Recordings</h2>
                <p className="text-slate-400">Choose a folder containing your Zoom cloud recording files, or add files individually.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleOpenFolder}
                  className="p-6 bg-slate-800 hover:bg-slate-700 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 transition-all group"
                >
                  <FolderOpen className="w-10 h-10 mx-auto text-slate-500 group-hover:text-blue-400 mb-3" />
                  <p className="font-medium">Open Folder</p>
                  <p className="text-sm text-slate-500">Auto-detect all files</p>
                </button>

                <button
                  onClick={handleOpenFiles}
                  className="p-6 bg-slate-800 hover:bg-slate-700 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 transition-all group"
                >
                  <Upload className="w-10 h-10 mx-auto text-slate-500 group-hover:text-blue-400 mb-3" />
                  <p className="font-medium">Select Files</p>
                  <p className="text-sm text-slate-500">Choose specific files</p>
                </button>
              </div>

              {folderPath && (
                <div className="p-3 bg-slate-800 rounded-lg flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-300 truncate flex-1">{folderPath}</span>
                  <button onClick={resetAll} className="text-slate-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* File List with Video Previews */}
              {fileCount > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(FILE_TYPES).map(([type, config]) => {
                    const file = files[type];
                    const info = fileInfos[type];
                    const Icon = config.icon;
                    const isVideo = ['screenshare', 'speaker', 'gallery'].includes(type);

                    if (!file) return null;

                    return (
                      <div
                        key={type}
                        className="p-4 rounded-xl bg-slate-800 flex gap-4"
                      >
                        {/* Video Preview Thumbnail */}
                        {isVideo && (
                          <div className="w-40 h-24 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden">
                            <video
                              src={`local-file://${file.path}`}
                              className="w-full h-full object-cover"
                              muted
                              onLoadedData={(e) => { e.target.currentTime = 1; }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{config.label}</p>
                              <p className="text-sm text-slate-400 truncate">{file.name}</p>
                              {info && (
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                  <span>{formatSize(file.size)}</span>
                                  {info.duration && <span>{formatDuration(info.duration)}</span>}
                                  {info.video && (
                                    <>
                                      <span>{info.video.width}×{info.video.height}</span>
                                      <span>{Math.round(info.video.fps)} fps</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setFiles(f => ({ ...f, [type]: null }))}
                              className="p-2 hover:bg-slate-700 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {fileCount > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  Continue to Layout & Preview <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Step 2: Layout Settings with Live Preview */}
          {step === 2 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Layout & Preview</h2>
                <p className="text-slate-400">Choose layout and adjust positioning. Drag the overlay to reposition it.</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Object.entries(LAYOUTS).map(([key, { name, icon, desc }]) => (
                  <button
                    key={key}
                    onClick={() => setLayout(key)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      layout === key
                        ? 'bg-blue-500 ring-2 ring-blue-400'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{icon}</span>
                    <p className="font-medium text-sm">{name}</p>
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Live Preview
                  </h3>
                  <span className="text-xs text-slate-500">Drag overlay to reposition</span>
                </div>
                <LayoutPreview
                  layout={layout}
                  settings={settings}
                  files={files}
                  onSettingsChange={setSettings}
                />
              </div>

              {/* Source Selection */}
              <div className="bg-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Video Sources
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Main Video</label>
                    <select
                      value={settings.mainSource}
                      onChange={(e) => setSettings(s => ({ ...s, mainSource: e.target.value }))}
                      className="w-full bg-slate-700 rounded-lg px-4 py-2.5"
                    >
                      {availableVideoSources.map(source => (
                        <option key={source} value={source}>
                          {FILE_TYPES[source]?.label || source}
                        </option>
                      ))}
                    </select>
                  </div>

                  {layout !== 'audioMerge' && layout !== 'sequential' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        {layout === 'pip' ? 'Overlay Video' : 'Second Video'}
                      </label>
                      <select
                        value={settings.pipSource}
                        onChange={(e) => setSettings(s => ({ ...s, pipSource: e.target.value }))}
                        className="w-full bg-slate-700 rounded-lg px-4 py-2.5"
                      >
                        {availableVideoSources.map(source => (
                          <option key={source} value={source}>
                            {FILE_TYPES[source]?.label || source}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {layout === 'pip' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Position Preset</label>
                      <select
                        value={settings.pipPosition}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'custom') {
                            setSettings(s => ({ ...s, pipPosition: val }));
                          }
                        }}
                        className="w-full bg-slate-700 rounded-lg px-4 py-2.5"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="custom">Custom (Drag)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Overlay Size: {Math.round(settings.pipScale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.5"
                        step="0.02"
                        value={settings.pipScale}
                        onChange={(e) => setSettings(s => ({ ...s, pipScale: parseFloat(e.target.value) }))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Quality</label>
                      <select
                        value={settings.quality}
                        onChange={(e) => setSettings(s => ({ ...s, quality: e.target.value }))}
                        className="w-full bg-slate-700 rounded-lg px-4 py-2.5"
                      >
                        <option value="fast">Fast (Lower Quality)</option>
                        <option value="medium">Medium</option>
                        <option value="slow">Slow (Best Quality)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.burnSubtitles}
                      onChange={(e) => setSettings(s => ({ ...s, burnSubtitles: e.target.checked }))}
                      className="w-5 h-5 rounded"
                    />
                    <span>Burn subtitles into video</span>
                  </label>
                  {files.transcript && (
                    <span className="text-xs text-green-400">✓ Transcript available</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  Continue to Process <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Process */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Process Video</h2>
                <p className="text-slate-400">Choose output location and start combining.</p>
              </div>

              {/* Output Selection */}
              <div className="bg-slate-800 rounded-xl p-5">
                <label className="block text-sm text-slate-400 mb-2">Output File</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={outputPath}
                    placeholder="Select output location..."
                    readOnly
                    className="flex-1 bg-slate-700 rounded-lg px-4 py-2.5 text-slate-300"
                  />
                  <button
                    onClick={handleSelectOutput}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
                  >
                    <FolderOutput className="w-4 h-4" /> Browse
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="font-medium">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Layout:</span>
                    <span className="ml-2">{LAYOUTS[layout]?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Quality:</span>
                    <span className="ml-2 capitalize">{settings.quality}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Main Video:</span>
                    <span className="ml-2">{FILE_TYPES[settings.mainSource]?.label}</span>
                  </div>
                  {layout === 'pip' && (
                    <div>
                      <span className="text-slate-400">Overlay:</span>
                      <span className="ml-2">{FILE_TYPES[settings.pipSource]?.label} ({Math.round(settings.pipScale * 100)}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              {processing && (
                <div className="bg-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Processing...</span>
                    <span className="text-slate-400">{Math.round(progress.percent || 0)}%</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress.percent || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Time: {progress.timemark || '00:00:00'}</span>
                    <span>{progress.currentFps ? `${progress.currentFps} fps` : ''}</span>
                  </div>
                </div>
              )}

              {/* Status */}
              {status.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  status.type === 'error' ? 'bg-red-500/20 text-red-400' :
                  status.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {status.type === 'error' ? <XCircle className="w-5 h-5" /> :
                   status.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                   <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>{status.message}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={processing}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium disabled:opacity-50"
                >
                  ← Back
                </button>
                {processing ? (
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleCombine}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Start Processing
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Video Combined Successfully!</h2>
                <p className="text-slate-400">Your Zoom recordings have been merged into a single file.</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 text-left">
                <p className="text-sm text-slate-400 mb-1">Output File</p>
                <p className="text-slate-200 truncate">{outputPath}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleOpenOutput}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium flex items-center gap-2"
                >
                  <FolderOpen className="w-5 h-5" /> Show in Folder
                </button>
                <button
                  onClick={resetAll}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
