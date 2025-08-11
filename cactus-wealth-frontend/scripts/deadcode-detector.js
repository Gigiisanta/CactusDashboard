#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to run command and capture output
function runCommand(command, description) {
  try {
    log(`\n${colors.bold}${colors.blue}🔎 ${description}...${colors.reset}`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout ? error.stdout.toString().trim() : error.message 
    };
  }
}

// Main dead code detection function
function detectDeadCode() {
  log(`${colors.bold}${colors.magenta}🧹 CACTUS WEALTH - DEAD CODE DETECTION${colors.reset}`, 'magenta');
  log(`${colors.cyan}================================================${colors.reset}`, 'cyan');
  
  const results = {
    unusedDependencies: null,
    unusedExports: null,
    unusedImports: null,
    orphanedFiles: null,
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0
    }
  };

  // 1. Check for unused dependencies
  log(`\n${colors.bold}1. Checking for unused dependencies (depcheck)...${colors.reset}`, 'yellow');
  const depcheckResult = runCommand('npx depcheck --json', 'Analyzing package.json dependencies');
  
  if (depcheckResult.success) {
    try {
      const depcheckData = JSON.parse(depcheckResult.output);
      results.unusedDependencies = depcheckData;
      
      const unusedDeps = depcheckData.dependencies || [];
      const unusedDevDeps = depcheckData.devDependencies || [];
      
      if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
        log(`${colors.red}❌ Found unused dependencies:${colors.reset}`, 'red');
        if (unusedDeps.length > 0) {
          log(`  Dependencies: ${unusedDeps.join(', ')}`, 'red');
          results.summary.criticalIssues += unusedDeps.length;
        }
        if (unusedDevDeps.length > 0) {
          log(`  DevDependencies: ${unusedDevDeps.join(', ')}`, 'yellow');
          results.summary.warnings += unusedDevDeps.length;
        }
      } else {
        log(`${colors.green}✅ No unused dependencies found${colors.reset}`, 'green');
      }
    } catch (e) {
      log(`${colors.red}❌ Error parsing depcheck output: ${e.message}${colors.reset}`, 'red');
    }
  } else {
    log(`${colors.red}❌ Depcheck failed: ${depcheckResult.output}${colors.reset}`, 'red');
  }

  // 2. Check for unused TypeScript exports
  log(`\n${colors.bold}2. Checking for unused exports (ts-prune)...${colors.reset}`, 'yellow');
  const tsPruneResult = runCommand('npx ts-prune', 'Analyzing TypeScript exports');
  
  if (tsPruneResult.success) {
    results.unusedExports = tsPruneResult.output;
    
    if (tsPruneResult.output.trim()) {
      log(`${colors.red}❌ Found unused exports:${colors.reset}`, 'red');
      log(tsPruneResult.output, 'red');
      const exportCount = (tsPruneResult.output.match(/\n/g) || []).length + 1;
      results.summary.criticalIssues += exportCount;
    } else {
      log(`${colors.green}✅ No unused exports found${colors.reset}`, 'green');
    }
  } else {
    log(`${colors.red}❌ ts-prune failed: ${tsPruneResult.output}${colors.reset}`, 'red');
  }

  // 3. Check for unused imports
  log(`\n${colors.bold}3. Checking for unused imports (eslint)...${colors.reset}`, 'yellow');
  const eslintResult = runCommand('npx eslint . --ext .ts,.tsx --rule "" --format=compact', 'Analyzing unused imports');
  
  if (eslintResult.success) {
    results.unusedImports = eslintResult.output;
    
    if (eslintResult.output.trim()) {
      log(`${colors.red}❌ Found unused imports:${colors.reset}`, 'red');
      log(eslintResult.output, 'red');
      const importCount = (eslintResult.output.match(/\n/g) || []).length + 1;
      results.summary.criticalIssues += importCount;
    } else {
      log(`${colors.green}✅ No unused imports found${colors.reset}`, 'green');
    }
  } else {
    // ESLint might return non-zero exit code when it finds issues
    if (eslintResult.output.includes('unused-imports/no-unused-imports')) {
      log(`${colors.red}❌ Found unused imports:${colors.reset}`, 'red');
      log(eslintResult.output, 'red');
      const importCount = (eslintResult.output.match(/\n/g) || []).length + 1;
      results.summary.criticalIssues += importCount;
    } else {
      log(`${colors.green}✅ No unused imports found${colors.reset}`, 'green');
    }
  }

  // 4. Check for orphaned files
  log(`\n${colors.bold}4. Checking for orphaned files (madge)...${colors.reset}`, 'yellow');
  const madgeResult = runCommand('npx madge --orphans --extensions ts,tsx app components hooks lib services stores types', 'Analyzing file dependencies');
  
  if (madgeResult.success) {
    results.orphanedFiles = madgeResult.output;
    
    if (madgeResult.output.trim()) {
      log(`${colors.yellow}⚠️  Found potentially orphaned files:${colors.reset}`, 'yellow');
      log(madgeResult.output, 'yellow');
      const orphanCount = (madgeResult.output.match(/\n/g) || []).length + 1;
      results.summary.warnings += orphanCount;
    } else {
      log(`${colors.green}✅ No orphaned files found${colors.reset}`, 'green');
    }
  } else {
    log(`${colors.red}❌ Madge failed: ${madgeResult.output}${colors.reset}`, 'red');
  }

  // Generate summary report
  log(`\n${colors.bold}${colors.magenta}📊 DEAD CODE DETECTION SUMMARY${colors.reset}`, 'magenta');
  log(`${colors.cyan}================================${colors.reset}`, 'cyan');
  
  results.summary.totalIssues = results.summary.criticalIssues + results.summary.warnings;
  
  if (results.summary.criticalIssues > 0) {
    log(`${colors.red}❌ Critical Issues: ${results.summary.criticalIssues}${colors.reset}`, 'red');
  }
  
  if (results.summary.warnings > 0) {
    log(`${colors.yellow}⚠️  Warnings: ${results.summary.warnings}${colors.reset}`, 'yellow');
  }
  
  if (results.summary.totalIssues === 0) {
    log(`${colors.green}🎉 No dead code issues found! Repository is clean.${colors.reset}`, 'green');
  } else {
    log(`\n${colors.bold}Total Issues: ${results.summary.totalIssues}${colors.reset}`, 'red');
    
    log(`\n${colors.bold}${colors.blue}🔧 RECOMMENDED ACTIONS:${colors.reset}`, 'blue');
    log('1. Remove unused dependencies from package.json', 'cyan');
    log('2. Delete unused TypeScript exports', 'cyan');
    log('3. Remove unused imports from files', 'cyan');
    log('4. Review orphaned files and remove if not needed', 'cyan');
    log('\nRun these commands to fix issues:', 'cyan');
    log('  npm run lint:fix          # Fix unused imports', 'cyan');
    log('  npm run analyze:dead-code # Show unused exports', 'cyan');
    log('  npx depcheck             # Show unused dependencies', 'cyan');
  }

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'deadcode-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`, 'blue');

  // Exit with appropriate code
  if (results.summary.criticalIssues > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the detection
detectDeadCode(); 