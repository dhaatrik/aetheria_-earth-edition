# Contributing to Aetheria: Earth Edition

Thank you for your interest in contributing to **Aetheria: Earth Edition**! Below you'll find guidelines to help you get started.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/aetheria_-earth-edition.git
   cd aetheria_-earth-edition
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the App

Start the Vite development server:

```bash
npm run dev
```

Start the API server (requires `GEMINI_API_KEY` in a `.env` file):

```bash
npm run server
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Building for Production

```bash
npm run build
```

## Making Changes

1. Keep changes focused — one feature or fix per pull request.
2. Write or update tests for any new functionality.
3. Ensure all tests pass (`npm test`) before submitting.
4. Ensure type checking passes (`npm run typecheck`) before submitting.
5. Follow the existing code style and conventions.

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new data layer for radiation levels`
- `fix: correct cloud density calculation at poles`
- `docs: update README with new setup instructions`
- `test: add unit tests for SoundEngine volume control`

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a **Pull Request** against the `main` branch of the upstream repository.
3. Describe your changes clearly in the PR description.
4. Link any related issues.

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/dhaatrik/aetheria_-earth-edition/issues) with:

- A clear title and description.
- Steps to reproduce (for bugs).
- Expected vs. actual behavior.

## Code of Conduct

Be respectful and constructive in all interactions. We're all here to build something awesome.

---

Thank you for contributing! 🚀
