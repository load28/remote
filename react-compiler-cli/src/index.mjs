#!/usr/bin/env node

/**
 * React Compiler CLI (rcc)
 *
 * React Compiler 바벨 플러그인의 내부 파이프라인을 활용하여
 * 코드 생성(Codegen) 전까지의 분석 내용을 출력하는 CLI 도구.
 *
 * 사용법:
 *   rcc analyze <file>           전체 파이프라인 분석
 *   rcc compact <file>           AI에게 유의미한 핵심 스냅샷만 출력
 *   rcc hir <file>               HIR만 출력
 *   rcc scopes <file>            Reactive Scope 요약
 *   rcc pipeline <file>          패스 목록만 출력
 *
 * 참고:
 *   - https://www.load28.com/posts/react-compiler
 *   - babel-plugin-react-compiler 내부 API
 */

import { program } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { analyzeSource, filterSnapshots, findSnapshotByPass, extractReactiveScopes } from './analyzer.mjs';
import {
  formatForTerminal,
  formatForFile,
  formatCompact,
  formatCompactPlain,
  formatReactiveScopes,
  formatReactiveScopesPlain,
  groupByPhase,
} from './formatter.mjs';

program
  .name('rcc')
  .description('React Compiler analysis CLI - inspect HIR, effects, reactive scopes before codegen')
  .version('1.0.0');

// ─── analyze: 전체 파이프라인 분석 ───

program
  .command('analyze <file>')
  .description('Run full pipeline analysis and display all passes')
  .option('-v, --verbose', 'Show full IR output for each pass')
  .option('-p, --phase <phase>', 'Filter by phase (hir, ssa, effect, reactive, scope)')
  .option('--pass <name>', 'Filter by pass name (e.g. InferTypes, SSA)')
  .option('-o, --output <file>', 'Write output to file instead of terminal')
  .option('--target <version>', 'React target version (17, 18, 19)', '19')
  .option('--mode <mode>', 'Compilation mode (all, infer, annotation, syntax)', 'all')
  .option('--json', 'Output as JSON')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename, {
      target: opts.target,
      compilationMode: opts.mode,
    });

    if (opts.json) {
      const json = JSON.stringify({
        passes: result.snapshots.map((s) => ({
          kind: s.kind,
          name: s.name,
          content: s.printed,
        })),
        events: result.events,
        error: result.error?.message || null,
      }, null, 2);

      if (opts.output) {
        writeOutput(opts.output, json);
      } else {
        console.log(json);
      }
      return;
    }

    if (opts.output) {
      const text = formatForFile(result, { verbose: true, phase: opts.phase, pass: opts.pass });
      writeOutput(opts.output, text);
    } else {
      const text = formatForTerminal(result, {
        verbose: opts.verbose,
        phase: opts.phase,
        pass: opts.pass,
      });
      console.log(text);
    }
  });

// ─── compact: AI에게 유의미한 핵심 스냅샷만 출력 ───
//
// 44개+ 패스 중 AI가 React 코드를 이해하는 데 실제로 필요한 건 4가지:
//   1. 초기 HIR        → 컴포넌트 제어 흐름 구조
//   2. Effect 분석     → 연산별 Read/Mutate/Freeze (순수성 판단)
//   3. Reactive 표시   → props/state 의존 값 (리렌더링 원인)
//   4. 최종 Scope 요약 → 메모이제이션 단위와 의존성 그래프

program
  .command('compact <file>')
  .description('Output only the key analysis snapshots that matter for understanding React code')
  .option('-o, --output <file>', 'Write output to file instead of terminal')
  .option('--json', 'Output as JSON')
  .option('--target <version>', 'React target version (17, 18, 19)', '19')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename, { target: opts.target });

    // 핵심 패스만 선별
    const KEY_PASSES = [
      { kind: 'hir', match: (n) => n === 'HIR', label: 'Initial HIR', desc: 'Component control flow structure' },
      { kind: 'hir', match: (n) => n === 'InferMutationAliasingEffects', label: 'Effect Analysis', desc: 'Read/Mutate/Freeze/Capture classification per operation' },
      { kind: 'hir', match: (n) => n === 'InferReactivePlaces', label: 'Reactive Analysis', desc: 'Which values depend on props/state (marked {reactive})' },
    ];

    const keySnapshots = [];
    for (const spec of KEY_PASSES) {
      const snap = result.snapshots.find((s) => s.kind === spec.kind && spec.match(s.name));
      if (snap) keySnapshots.push({ ...snap, label: spec.label, desc: spec.desc });
    }

    // 마지막 ReactiveFunction에서 scope 추출
    const reactiveSnaps = filterSnapshots(result.snapshots, 'reactive');
    const lastReactive = reactiveSnaps[reactiveSnaps.length - 1];
    const scopes = lastReactive ? extractReactiveScopes(lastReactive) : [];

    if (opts.json) {
      const json = JSON.stringify({
        keySnapshots: keySnapshots.map((s) => ({
          label: s.label,
          description: s.desc,
          pass: s.name,
          content: s.printed,
        })),
        reactiveScopes: scopes,
        events: result.events,
        error: result.error?.message || null,
      }, null, 2);

      if (opts.output) {
        writeOutput(opts.output, json);
      } else {
        console.log(json);
      }
      return;
    }

    if (opts.output) {
      const text = formatCompactPlain(keySnapshots, scopes, result.events, result.error);
      writeOutput(opts.output, text);
    } else {
      const text = formatCompact(keySnapshots, scopes, result.events, result.error);
      console.log(text);
    }
  });

// ─── hir: HIR만 출력 ───

program
  .command('hir <file>')
  .description('Display HIR (High-level Intermediate Representation) passes only')
  .option('-v, --verbose', 'Show full HIR output')
  .option('--pass <name>', 'Filter to specific HIR pass (e.g. SSA, InferTypes)')
  .option('--last', 'Show only the last HIR snapshot (most processed)')
  .option('-o, --output <file>', 'Write output to file')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename);
    let hirSnaps = filterSnapshots(result.snapshots, 'hir');

    if (opts.pass) {
      hirSnaps = findSnapshotByPass(hirSnaps, opts.pass);
    }
    if (opts.last && hirSnaps.length > 0) {
      hirSnaps = [hirSnaps[hirSnaps.length - 1]];
    }

    if (hirSnaps.length === 0) {
      console.log(chalk.yellow('No HIR snapshots found.'));
      return;
    }

    const lines = [];
    lines.push('');
    lines.push(chalk.bold.blue('▎ HIR Analysis'));
    lines.push(chalk.dim('─'.repeat(60)));
    lines.push(`  ${chalk.dim('Captured')} ${chalk.yellow(hirSnaps.length)} ${chalk.dim('HIR pass(es)')}`);
    lines.push('');

    for (const snap of hirSnaps) {
      lines.push(chalk.bold(`  Pass: ${snap.name}`));
      if (opts.verbose) {
        lines.push(snap.printed.split('\n').map((l) => '    ' + l).join('\n'));
      } else {
        const preview = snap.printed.split('\n').slice(0, 8);
        lines.push(preview.map((l) => chalk.dim('    ' + l)).join('\n'));
        const total = snap.printed.split('\n').length;
        if (total > 8) {
          lines.push(chalk.dim(`    ... (${total - 8} more lines, use --verbose)`));
        }
      }
      lines.push('');
    }

    const output = lines.join('\n');
    if (opts.output) {
      writeOutput(opts.output, stripAnsi(output));
    } else {
      console.log(output);
    }
  });

// ─── scopes: Reactive Scope 요약 ───

program
  .command('scopes <file>')
  .description('Display reactive scope analysis (dependencies, declarations, memoization units)')
  .option('-o, --output <file>', 'Write output to file')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename);
    const reactiveSnaps = filterSnapshots(result.snapshots, 'reactive');

    // 마지막 reactive 스냅샷에서 scope 추출
    const lastReactive = reactiveSnaps[reactiveSnaps.length - 1];
    const scopes = lastReactive ? extractReactiveScopes(lastReactive) : [];

    const lines = [];
    lines.push('');

    // 이벤트 요약
    for (const event of result.events) {
      if (event.kind === 'CompileSuccess') {
        lines.push(chalk.green(`✓ ${event.fnName || 'anonymous'}: ${event.memoSlots} memo slots, ${event.memoBlocks} blocks, ${event.memoValues} values`));
      }
    }
    lines.push('');

    if (opts.output) {
      const text = formatReactiveScopesPlain(scopes);
      writeOutput(opts.output, text);
    } else {
      lines.push(formatReactiveScopes(scopes));
      console.log(lines.join('\n'));
    }
  });

// ─── pipeline: 패스 목록만 출력 ───

program
  .command('pipeline <file>')
  .description('List all compiler passes in execution order')
  .option('--kind <kind>', 'Filter by IR kind (hir, reactive, debug)')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename, { captureAst: true });
    let snaps = result.snapshots;

    if (opts.kind) {
      snaps = filterSnapshots(snaps, opts.kind);
    }

    console.log('');
    console.log(chalk.bold('Compiler Pipeline Passes'));
    console.log(chalk.dim('─'.repeat(60)));

    const groups = groupByPhase(snaps);
    let index = 1;
    for (const group of groups) {
      const phaseColor = getPhaseColorSimple(group.phase);
      console.log(phaseColor(`\n  [${group.phase}]`));
      for (const snap of group.snapshots) {
        const badge = snap.kind === 'hir'
          ? chalk.blue('HIR')
          : snap.kind === 'reactive'
          ? chalk.magenta('RFn')
          : snap.kind === 'ast'
          ? chalk.green('AST')
          : chalk.gray('DBG');
        console.log(`    ${chalk.dim(String(index).padStart(3, ' '))}. ${badge} ${snap.name}`);
        index++;
      }
    }
    console.log('');
    console.log(chalk.dim(`  Total: ${snaps.length} passes`));
    console.log('');
  });

// ─── Helpers ───

function readSource(filePath) {
  const filename = resolve(filePath);
  try {
    const source = readFileSync(filename, 'utf-8');
    return { source, filename };
  } catch (err) {
    console.error(chalk.red(`Error: Cannot read file "${filePath}"`));
    console.error(chalk.dim(err.message));
    process.exit(1);
  }
}

function writeOutput(filePath, content) {
  const outPath = resolve(filePath);
  writeFileSync(outPath, content, 'utf-8');
  console.log(chalk.green(`Output written to ${outPath}`));
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function getPhaseColorSimple(phase) {
  switch (phase) {
    case 'HIR Lowering': return chalk.blue;
    case 'SSA Conversion': return chalk.green;
    case 'Type & Effect Analysis': return chalk.yellow;
    case 'Reactive Analysis': return chalk.magenta;
    case 'Scope Generation': return chalk.cyan;
    default: return chalk.white;
  }
}

program.parse();
