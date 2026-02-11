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
import {
  analyzeSource,
  filterSnapshots,
  findSnapshotByPass,
  extractReactiveScopes,
  extractPhiFunctions,
  extractEffectSummary,
  extractReactiveVariables,
  extractBindingInfo,
} from './analyzer.mjs';
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

// ─── compact: 블로그 파이프라인 단계별 핵심 스냅샷 출력 ───
//
// https://www.load28.com/posts/react-compiler 의 파이프라인 단계를 따르되
// 각 단계에서 의미있는 최종 결과 하나만 출력한다:
//
//   1. HIR & Control Flow Graph  → 초기 HIR (기본 블록 + 제어 흐름)
//   2. SSA & Phi Functions       → SSA 변환 후 (단일 할당 + φ 함수)
//   3. Effect Analysis           → Effect 분류 (Read/Mutate/Freeze/Capture)
//   4. Reactive Analysis         → Reactive 표시 ({reactive} 마킹)
//   5. Scope Generation          → 최종 ReactiveFunction + Scope 요약
//   (6. Code Generation          → 제외)

program
  .command('compact <file>')
  .description('Show one key snapshot per blog pipeline stage (HIR → SSA → Effect → Reactive → Scope)')
  .option('-o, --output <file>', 'Write output to file instead of terminal')
  .option('--json', 'Output as JSON')
  .option('--target <version>', 'React target version (17, 18, 19)', '19')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename, { target: opts.target });

    // 블로그 파이프라인 단계별 핵심 패스 1개씩 선별
    const PIPELINE_STAGES = [
      {
        stage: '1. HIR & Control Flow Graph',
        desc: 'AST를 기본 블록(basic block) 단위의 제어 흐름 그래프로 변환. 조건 분기, 루프 등 실행 흐름이 드러난다.',
        kind: 'hir',
        match: (n) => n === 'HIR',
      },
      {
        stage: '2. SSA & Phi Functions',
        desc: '각 변수가 한 번만 할당되는 SSA 형태로 변환. 분기 합류점에 φ(phi) 함수가 삽입되어 데이터 의존성이 명시된다.',
        kind: 'hir',
        match: (n) => n === 'SSA',
      },
      {
        stage: '3. Effect Analysis',
        desc: '각 연산이 값을 어떻게 다루는지 분류: Read(읽기), Mutate(변경), Freeze(불변화), Capture(참조 캡처). 메모이제이션 안전성 판단의 핵심.',
        kind: 'hir',
        match: (n) => n === 'InferMutationAliasingEffects',
      },
      {
        stage: '4. Reactive Analysis',
        desc: 'props/state에서 파생된 값에 {reactive} 표시. 이 값이 바뀌면 리렌더링이 필요하다는 뜻.',
        kind: 'hir',
        match: (n) => n === 'InferReactivePlaces',
      },
      {
        stage: '5. Scope Generation',
        desc: '동일한 의존성을 공유하는 연산들을 하나의 reactive scope로 그룹핑. 각 scope가 독립적인 메모이제이션 단위가 된다.',
        kind: 'reactive',
        match: (n) => n === 'BuildReactiveFunction',
      },
    ];

    // 각 단계의 스냅샷 찾기
    const snapMap = {};
    for (const spec of PIPELINE_STAGES) {
      const snap = result.snapshots.find((s) => s.kind === spec.kind && spec.match(s.name));
      snapMap[spec.stage] = snap ? { kind: snap.kind, name: snap.name, printed: snap.printed, raw: snap.raw } : null;
    }

    // 각 단계에서 구조화된 요약 데이터 추출
    const ssaSnap = snapMap['2. SSA & Phi Functions'];
    const effectSnap = snapMap['3. Effect Analysis'];
    const reactiveSnap = snapMap['4. Reactive Analysis'];

    const extracted = {
      phis: ssaSnap ? extractPhiFunctions(ssaSnap) : [],
      bindings: ssaSnap ? extractBindingInfo(ssaSnap) : null,
      effects: effectSnap ? extractEffectSummary(effectSnap) : null,
      reactiveVars: reactiveSnap ? extractReactiveVariables(reactiveSnap) : null,
    };

    // stages 배열에 snap + extracted 데이터 병합
    const stages = PIPELINE_STAGES.map((spec) => ({
      stage: spec.stage,
      desc: spec.desc,
      snap: snapMap[spec.stage],
    }));

    // 마지막 ReactiveFunction에서 scope 추출
    const reactiveSnaps = filterSnapshots(result.snapshots, 'reactive');
    const lastReactive = reactiveSnaps[reactiveSnaps.length - 1];
    const scopes = lastReactive ? extractReactiveScopes(lastReactive) : [];

    if (opts.json) {
      const json = JSON.stringify({
        stages: stages.map((s) => ({
          stage: s.stage,
          description: s.desc,
          pass: s.snap?.name || null,
          content: s.snap?.printed || null,
        })),
        extracted,
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
      const text = formatCompactPlain(stages, scopes, extracted, result.events, result.error);
      writeOutput(opts.output, text);
    } else {
      const text = formatCompact(stages, scopes, extracted, result.events, result.error);
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
