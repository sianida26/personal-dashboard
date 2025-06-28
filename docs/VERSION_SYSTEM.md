# Auto Version Bumping System

This project includes an automatic version bumping system that increments the patch version on every build.

## How it works

1. **Version Storage**: The current version is stored in a `version` file at the root of the project
2. **Auto-increment**: Every time you run `bun run build`, the version is automatically incremented
3. **Synchronization**: The version is also updated in `package.json` for consistency

## Usage

### Building with auto-version bump
```bash
bun run build
```
This will:
- Read the current version from the `version` file
- Increment the patch version (e.g., 1.0.0 → 1.0.1)
- Update both the `version` file and `package.json`
- Proceed with the normal build process

### Manual version bump
```bash
bun run bump-version
```
This will increment the version without building.

### Current version
Check the current version:
```bash
cat version
```

## Version Format

The system uses semantic versioning (semver) format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Manual increment for breaking changes
- **MINOR**: Manual increment for new features
- **PATCH**: Auto-incremented on every build

## Manual Version Changes

If you need to manually change the version (e.g., for major or minor releases):

1. Edit the `version` file directly:
   ```bash
   echo "2.0.0" > version
   ```

2. Or update both files for consistency:
   ```bash
   echo "2.0.0" > version
   bun run bump-version  # This will sync package.json
   ```

## Files Involved

- `/version` - Main version storage file
- `/scripts/bump-version.ts` - Version bumping script
- `/package.json` - Also updated for consistency
- `/scripts/bump-version.test.ts` - Tests for version bumping logic

## Configuration

The version bumping is integrated into the build process via:
- `package.json` scripts
- `turbo.json` global dependencies (includes `version` file)

This ensures that version changes are properly tracked by Turbo's caching system.
