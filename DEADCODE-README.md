# 🧹 Dead Code Detection System

Cactus Wealth implements a comprehensive dead code detection system to maintain a clean and efficient codebase. This system automatically identifies and reports unused code, dependencies, and files.

## 🚀 Quick Start

### Run Complete Dead Code Detection
```bash
# From project root
task lint:deadcode

# Or from frontend directory
cd cactus-wealth-frontend
npm run lint:deadcode
```

### Individual Checks
```bash
# Check unused dependencies
task lint:unused-deps

# Check unused TypeScript exports
task lint:unused-exports

# Check unused imports
task lint:unused-imports

# Check orphaned files
task lint:orphaned-files
```

## 🛠️ Tools Used

### 1. **depcheck** - Unused Dependencies
- **Purpose**: Identifies unused dependencies in `package.json`
- **Command**: `npx depcheck`
- **Output**: Lists unused dependencies and devDependencies

### 2. **ts-prune** - Unused TypeScript Exports
- **Purpose**: Finds unused TypeScript exports across the codebase
- **Command**: `npx ts-prune`
- **Configuration**: Configured in `package.json` to ignore specific files

### 3. **eslint-plugin-unused-imports** - Unused Imports
- **Purpose**: Detects and can auto-fix unused imports
- **Command**: `npm run lint:fix`
- **Configuration**: Integrated into ESLint config

### 4. **madge** - Orphaned Files & Dependency Cycles
- **Purpose**: Identifies files not imported anywhere and dependency cycles
- **Command**: `npx madge --orphans --extensions ts,tsx`
- **Scopes**: `app`, `components`, `hooks`, `lib`, `services`, `stores`, `types`

## 📊 Report Structure

The dead code detection generates a comprehensive report with:

### Critical Issues (Block CI/CD)
- ❌ **Unused Dependencies**: Packages in `package.json` not used in code
- ❌ **Unused Exports**: TypeScript exports not imported anywhere
- ❌ **Unused Imports**: Import statements that are never used

### Warnings (Informational)
- ⚠️ **Unused Dev Dependencies**: Development packages not used
- ⚠️ **Orphaned Files**: Files not imported anywhere (potential false positives)

## 🔧 Fixing Issues

### 1. Remove Unused Dependencies
```bash
# Check what's unused
npm run lint:unused-deps

# Remove unused packages
npm uninstall <package-name>
```

### 2. Fix Unused Imports
```bash
# Auto-fix unused imports
npm run lint:fix

# Or manually remove unused imports from files
```

### 3. Remove Unused Exports
```bash
# See unused exports
npm run analyze:dead-code

# Manually remove unused exports from files
```

### 4. Review Orphaned Files
```bash
# Check orphaned files
npm run lint:orphaned-files

# Review each file and remove if not needed
# Note: Some files might be intentionally orphaned (e.g., test files)
```

## 🚦 CI/CD Integration

### GitHub Actions
The dead code detection runs automatically on:
- **Pull Requests** to `main` and `develop` branches
- **Pushes** to `main` and `develop` branches

### Workflow Behavior
1. **Runs dead code detection** on every PR
2. **Comments on PR** with detailed results
3. **Blocks merge** if critical issues are found
4. **Uploads report** as artifact for review

### Example PR Comment
```
## Dead Code Detection Results

⚠️ **Found 5 issues:**
- ❌ **3 critical issues** (unused dependencies, exports, imports)
- ⚠️ **2 warnings** (orphaned files, unused dev dependencies)

### Recommended Actions:
1. Remove unused dependencies from `package.json`
2. Delete unused TypeScript exports
3. Remove unused imports from files
4. Review orphaned files and remove if not needed

### Commands to fix:
```bash
cd cactus-wealth-frontend
npm run lint:fix          # Fix unused imports
npm run analyze:dead-code # Show unused exports
npx depcheck             # Show unused dependencies
```
```

## 📁 Configuration Files

### ESLint Configuration (`.eslintrc.json`)
```json
{
  "extends": ["next"],
  "plugins": ["unused-imports"],
  "rules": {
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        "vars": "all",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }
    ]
  }
}
```

### ts-prune Configuration (`package.json`)
```json
{
  "ts-prune": {
    "ignore": "playwright\\.config\\.ts|tailwind\\.config\\.ts|postcss\\.config\\.js|next\\.config\\.js|e2e/.*|\\.next/.*|app/.*/\\(page\\|layout\\|template\\|loading\\|error\\|not-found\\)\\.tsx"
  }
}
```

## 🎯 Best Practices

### 1. **Regular Maintenance**
- Run `task lint:deadcode` before committing
- Fix issues immediately to prevent accumulation
- Review orphaned files during code reviews

### 2. **False Positives**
- **Next.js Pages**: Files like `page.tsx`, `layout.tsx` are intentionally "orphaned"
- **Test Files**: Some test utilities might appear unused
- **Configuration Files**: Config files are often not imported

### 3. **Performance Impact**
- Dead code detection adds ~30-60 seconds to CI/CD
- Tools are optimized for TypeScript/React projects
- Reports are cached to avoid redundant analysis

### 4. **Team Workflow**
- **Developers**: Run locally before pushing
- **Code Reviewers**: Check dead code report in PR comments
- **Maintainers**: Monitor overall codebase health

## 🔍 Troubleshooting

### Common Issues

#### 1. **ESLint Plugin Conflicts**
```bash
# If you see peer dependency warnings
npm install --legacy-peer-deps
```

#### 2. **False Positives with Next.js**
- Next.js automatically imports certain files
- Use the ignore patterns in `ts-prune` config
- Some files are intentionally orphaned

#### 3. **Madge Not Finding Files**
```bash
# Check if files are in the correct directories
# Madge only scans: app, components, hooks, lib, services, stores, types
```

#### 4. **Performance Issues**
```bash
# Run individual checks instead of full scan
npm run lint:unused-deps
npm run lint:unused-exports
```

## 📈 Metrics & Monitoring

### Report Location
- **Local**: `cactus-wealth-frontend/deadcode-report.json`
- **CI/CD**: Uploaded as GitHub Actions artifact
- **Retention**: Reports kept for 30 days

### Key Metrics
- **Total Issues**: Sum of critical issues and warnings
- **Critical Issues**: Issues that block CI/CD
- **Warnings**: Informational issues that don't block CI/CD
- **Trend Analysis**: Monitor over time to ensure codebase health

## 🤝 Contributing

### Adding New Tools
1. Install the tool as devDependency
2. Add script to `package.json`
3. Add task to `Taskfile.yml`
4. Update the dead code detector script
5. Update this documentation

### Customizing Rules
1. Modify ESLint rules in `.eslintrc.json`
2. Update ts-prune ignore patterns in `package.json`
3. Adjust madge scan directories in scripts
4. Test changes thoroughly

---

**Maintained by**: Cactus Wealth Development Team  
**Last Updated**: August 2024  
**Version**: 1.0.0 