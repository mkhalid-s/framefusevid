# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in FrameFuseVid, please email security@framefusevid.com instead of using the public issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will acknowledge receipt of your report within 48 hours and provide a detailed response within one week.

## Security Considerations

### Local Processing

FrameFuseVid is designed with privacy and security as core principles:

- **All processing is local** - video files never leave your machine
- **No network calls** - the application works completely offline
- **No telemetry** - we don't collect any usage data
- **No third-party data processing** - we don't share data with external services

### Data Protection

- FrameFuseVid does not store, transmit, or collect any personal data from users
- All temporary files created during processing are stored locally on your machine
- Video files are processed entirely on your machine and are never uploaded anywhere

### Dependencies

We regularly audit our dependencies for known vulnerabilities. You can review the project's dependencies in `package.json`.

To check for known vulnerabilities in the project, run:

```bash
npm audit
```

## Electron Security

FrameFuseVid is built with Electron and follows security best practices:

- **Context Isolation** is enabled to isolate the renderer process from the main process
- **No remote code execution** - all code is bundled locally
- **Sandboxing** - renderer processes run in a sandboxed environment
- **Content Security Policy** - strict CSP headers are enforced

## Responsible Disclosure

We appreciate your efforts to responsibly disclose security issues and will make every effort to:

1. Acknowledge receipt of your vulnerability report
2. Assess the vulnerability
3. Develop and test a fix
4. Release a patched version
5. Credit you in the release notes (if desired)

## Version Support

Security updates are provided for the latest version of FrameFuseVid. We recommend always updating to the latest version to ensure you have the latest security patches.

## Security Updates

We will release security updates as needed. Check the [Releases](https://github.com/YOUR-USERNAME/framefusevid/releases) page for the latest version.

## Additional Resources

- [Electron Security Documentation](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)

Thank you for helping keep FrameFuseVid secure!
