# Contributing to Global Connect Passport

Thank you for your interest in contributing! This project is designed to help organizations run networking games at global events.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/global-connect.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for full setup instructions.

**Quick setup:**
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Then deploy
twilio serverless:deploy
```

## Testing

Before submitting a PR, test your changes:

- [ ] Test message flow (activation, stamp collection)
- [ ] Test error cases (invalid codes, duplicates)
- [ ] Verify admin dashboard displays correctly
- [ ] Check Twilio Function logs for errors
- [ ] Test with both WhatsApp and SMS (if applicable)

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code structure
- Keep functions focused and modular

## Reporting Issues

When reporting issues, please include:
- Steps to reproduce
- Expected vs actual behavior
- Twilio Function logs (if applicable)
- Screenshots (for dashboard issues)

## Feature Requests

We welcome feature ideas! Please open an issue with:
- Use case description
- Proposed solution
- Any implementation thoughts

## Pull Request Process

1. Update README.md if adding new features
2. Update ARCHITECTURE.md if changing system design
3. Test all changes thoroughly
4. Ensure no credentials are committed
5. Describe changes clearly in PR description

## Questions?

Open an issue with the "question" label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
