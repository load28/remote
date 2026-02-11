#!/usr/bin/env node

/**
 * React Compiler CLI (rcc)
 *
 * React Compiler 바벨 플러그인의 내부 파이프라인을 활용하여
 * 코드 생성(Codegen) 전까지의 분석 내용을 출력하는 CLI 도구.
 *
 * 사용법:
 *   rcc <file>                    파이프라인 단계별 핵심 분석 (기본 모드)
 *   rcc <file> -v                 각 단계의 Raw IR도 함께 표시
 *   rcc <file> -a                 모든 패스의 전체 분석 결과 표시
 *   rcc <file> -a -v              전체 분석 + 전체 IR 출력
 *   rcc <file> --codegen          코드 생성(Codegen) 결과도 함께 출력
 *   rcc hir <file>                HIR만 출력
 *   rcc scopes <file>             Reactive Scope 요약
 *   rcc pipeline <file>           패스 목록만 출력
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
  .version('1.0.0')
  .argument('<file>', '분석할 React 소스 파일')
  .option('-a, --all', '모든 패스의 전체 분석 결과 표시')
  .option('-v, --verbose', '각 단계의 Raw IR도 함께 표시 (기본 모드에서는 stage별 IR, --all에서는 패스별 전체 IR)')
  .option('-p, --phase <phase>', '단계별 필터 (hir, ssa, effect, reactive, scope) [--all 전용]')
  .option('--pass <name>', '패스 이름 필터 (e.g. InferTypes, SSA) [--all 전용]')
  .option('-o, --output <file>', '터미널 대신 파일로 출력')
  .option('--target <version>', 'React 타겟 버전 (17, 18, 19)', '19')
  .option('--mode <mode>', '컴파일 모드 (all, infer, annotation, syntax)', 'all')
  .option('--codegen', '코드 생성(Codegen) 결과도 함께 출력 (기본: 생성 안 함)')
  .option('--json', 'JSON 형식으로 출력')
  .action((file, opts) => {
    if (opts.all) {
      runFullAnalysis(file, opts);
    } else {
      runCompactAnalysis(file, opts);
    }
  });

// ─── hir: HIR만 출력 ───

program
  .command('hir <file>')
  .description('HIR (High-level Intermediate Representation) 패스만 출력')
  .option('-v, --verbose', 'HIR 전체 출력')
  .option('--pass <name>', '특정 HIR 패스 필터 (e.g. SSA, InferTypes)')
  .option('--last', '가장 마지막 HIR 스냅샷만 출력')
  .option('-o, --output <file>', '파일로 출력')
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
      console.log(chalk.yellow('HIR 스냅샷을 찾을 수 없습니다.'));
      return;
    }

    const lines = [];
    lines.push('');
    lines.push(chalk.bold.blue('▎ HIR Analysis'));
    lines.push(chalk.dim('─'.repeat(60)));
    lines.push(`  ${chalk.dim('캡처된')} ${chalk.yellow(hirSnaps.length)} ${chalk.dim('개의 HIR 패스')}`);
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
          lines.push(chalk.dim(`    ... (${total - 8}줄 더 있음, --verbose 사용)`));
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
  .description('Reactive scope 분석 (의존성, 선언, 메모이제이션 단위)')
  .option('-o, --output <file>', '파일로 출력')
  .action((file, opts) => {
    const { source, filename } = readSource(file);
    const result = analyzeSource(source, filename);
    const reactiveSnaps = filterSnapshots(result.snapshots, 'reactive');

    const lastReactive = reactiveSnaps[reactiveSnaps.length - 1];
    const scopes = lastReactive ? extractReactiveScopes(lastReactive) : [];

    const lines = [];
    lines.push('');

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
  .description('컴파일러 패스 목록을 실행 순서대로 출력')
  .option('--kind <kind>', 'IR 종류 필터 (hir, reactive, debug)')
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

// ─── 기본 모드: compact 분석 ───
//
// https://www.load28.com/posts/react-compiler 의 파이프라인 단계를 따르되
// 각 단계에서 의미있는 최종 결과 하나만 출력한다:
//
//   1. HIR & Control Flow Graph  → 초기 HIR (기본 블록 + 제어 흐름)
//   2. SSA & Phi Functions       → SSA 변환 후 (단일 할당 + φ 함수)
//   3. Effect Analysis           → Effect 분류 (Read/Mutate/Freeze/Capture)
//   4. Reactive Analysis         → Reactive 표시 ({reactive} 마킹)
//   5. Scope Generation          → 최종 ReactiveFunction + Scope 요약
//   6. Code Generation           → --codegen 옵션 사용 시 출력 (기본: 제외)

function runCompactAnalysis(file, opts) {
  const { source, filename } = readSource(file);
  const result = analyzeSource(source, filename, { target: opts.target, codegen: !!opts.codegen });

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

  const snapMap = {};
  for (const spec of PIPELINE_STAGES) {
    const snap = result.snapshots.find((s) => s.kind === spec.kind && spec.match(s.name));
    snapMap[spec.stage] = snap ? { kind: snap.kind, name: snap.name, printed: snap.printed, raw: snap.raw } : null;
  }

  const ssaSnap = snapMap['2. SSA & Phi Functions'];
  const effectSnap = snapMap['3. Effect Analysis'];
  const reactiveSnap = snapMap['4. Reactive Analysis'];

  const extracted = {
    phis: ssaSnap ? extractPhiFunctions(ssaSnap) : [],
    bindings: ssaSnap ? extractBindingInfo(ssaSnap) : null,
    effects: effectSnap ? extractEffectSummary(effectSnap) : null,
    reactiveVars: reactiveSnap ? extractReactiveVariables(reactiveSnap) : null,
  };

  const stages = PIPELINE_STAGES.map((spec) => ({
    stage: spec.stage,
    desc: spec.desc,
    snap: snapMap[spec.stage],
  }));

  const reactiveSnaps = filterSnapshots(result.snapshots, 'reactive');
  const lastReactive = reactiveSnaps[reactiveSnaps.length - 1];
  const scopes = lastReactive ? extractReactiveScopes(lastReactive) : [];

  if (opts.json) {
    const jsonObj = {
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
    };
    if (result.generatedCode) {
      jsonObj.generatedCode = result.generatedCode;
    }
    const json = JSON.stringify(jsonObj, null, 2);

    if (opts.output) {
      writeOutput(opts.output, json);
    } else {
      console.log(json);
    }
    return;
  }

  if (opts.output) {
    const text = formatCompactPlain(stages, scopes, extracted, result.events, result.error, { verbose: opts.verbose, generatedCode: result.generatedCode });
    writeOutput(opts.output, text);
  } else {
    const text = formatCompact(stages, scopes, extracted, result.events, result.error, { verbose: opts.verbose, generatedCode: result.generatedCode });
    console.log(text);
  }
}

// ─── --all 모드: 전체 파이프라인 분석 ───

function runFullAnalysis(file, opts) {
  const { source, filename } = readSource(file);
  const result = analyzeSource(source, filename, {
    target: opts.target,
    compilationMode: opts.mode,
    codegen: !!opts.codegen,
  });

  if (opts.json) {
    const jsonObj = {
      passes: result.snapshots.map((s) => ({
        kind: s.kind,
        name: s.name,
        content: s.printed,
      })),
      events: result.events,
      error: result.error?.message || null,
    };
    if (result.generatedCode) {
      jsonObj.generatedCode = result.generatedCode;
    }
    const json = JSON.stringify(jsonObj, null, 2);

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
      generatedCode: result.generatedCode,
    });
    console.log(text);
  }
}

// ─── Helpers ───

function readSource(filePath) {
  const filename = resolve(filePath);
  try {
    const source = readFileSync(filename, 'utf-8');
    return { source, filename };
  } catch (err) {
    console.error(chalk.red(`Error: "${filePath}" 파일을 읽을 수 없습니다`));
    console.error(chalk.dim(err.message));
    process.exit(1);
  }
}

function writeOutput(filePath, content) {
  const outPath = resolve(filePath);
  writeFileSync(outPath, content, 'utf-8');
  console.log(chalk.green(`출력 완료: ${outPath}`));
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
