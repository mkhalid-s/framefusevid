# Contributing to FrameFuseVid

Thank you for your interest in contributing to FrameFuseVid! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots or animated GIFs if possible**
- **Include your environment details** (OS, Node.js version, Electron version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

- Fill in the pull request template
- Follow the style guidelines
- Include screenshots or GIFs demonstrating your changes for UI updates
- Update documentation if needed
- Add tests if applicable
- Ensure all tests pass

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/framefusevid.git
cd framefusevid
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Build the application**

```bash
npm run build
```

## Pull Request Process

1. **Create a feature branch** from `main`

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** and commit them with clear, descriptive messages

```bash
git commit -m "Add feature: description of your changes"
```

3. **Push to your fork**

```bash
git push origin feature/your-feature-name
```

4. **Open a Pull Request** against the `main` branch

5. **Wait for review** - maintainers will review your PR and may request changes

6. **After approval**, your PR will be merged

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add drag-and-drop PIP positioning
Fix audio sync issue in sequential mode
Update README with new screenshots
```

### JavaScript/React Style

- Use ES6+ features
- Use functional components with hooks
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code formatting (we may add ESLint/Prettier in the future)

### Code Structure

- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Place utility functions in separate files
- Keep files under 300 lines when possible

## Project Structure

```
framefusevid/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Main process entry
│   │   └── preload.js  # Preload script for IPC
│   ├── App.jsx         # React application
│   ├── index.js        # React entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── docs/               # Additional documentation
└── README.md           # Main documentation
```

## Testing

Currently, FrameFuseVid doesn't have automated tests. Adding tests is a great way to contribute! We welcome:

- Unit tests for utility functions
- Integration tests for video processing
- E2E tests for the Electron app

## Need Help?

- Check the [README.md](README.md) for usage documentation
- Browse existing [GitHub Issues](https://github.com/YOUR-USERNAME/framefusevid/issues)
- Ask questions in [GitHub Discussions](https://github.com/YOUR-USERNAME/framefusevid/discussions)

## Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make FrameFuseVid better!

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.
