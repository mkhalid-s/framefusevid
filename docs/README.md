# FrameFuseVid Documentation

This directory contains the source for the FrameFuseVid documentation website, hosted via GitHub Pages.

## Website Structure

```
docs/
├── index.html                              # Landing page
├── docs.html                               # Documentation (installation, usage, architecture, API)
├── style.css                               # Site-wide styles (dark theme)
├── PRODUCT_OVERVIEW.md                     # Product documentation & market analysis
├── FrameFuseVid_Documentation.docx         # Additional docs (Word format)
├── README.md                               # This file
└── blog/
    ├── index.html                          # Blog index
    ├── introducing-framefusevid.html       # Launch announcement
    ├── introducing-framefusevid.md         # (markdown source)
    ├── architecture-deep-dive.html         # Architecture & FFmpeg deep dive
    ├── how-to-contribute.html              # Contribution guide
    ├── how-to-contribute.md                # (markdown source)
    └── why-privacy-matters.html            # Privacy & local processing
```

## Pages

| Page | URL Path | Description |
|------|----------|-------------|
| **Landing Page** | `/` | Hero, features, layouts, architecture, comparison, quick start |
| **Documentation** | `/docs.html` | Installation, usage, IPC API reference, FFmpeg pipeline, FAQ |
| **Blog Index** | `/blog/` | Grid of all blog posts |
| **Blog: Introducing** | `/blog/introducing-framefusevid.html` | Launch announcement |
| **Blog: Architecture** | `/blog/architecture-deep-dive.html` | Technical deep dive |
| **Blog: Contributing** | `/blog/how-to-contribute.html` | Contribution guide |
| **Blog: Privacy** | `/blog/why-privacy-matters.html` | Privacy-first approach |

## Development

The site is plain HTML + CSS (no build step). Edit files directly and push to `main` — the GitHub Actions workflow in `.github/workflows/deploy-docs.yml` deploys automatically.

## For Users

For installation and usage instructions, see the main [README.md](../README.md).

## For Contributors

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
