/**
 * 분석 결과를 터미널 또는 파일 출력용으로 포매팅한다.
 *
 * 블로그 글(https://www.load28.com/posts/react-compiler) 에서 설명된
 * 파이프라인 단계별 구조에 맞추어 출력을 구성한다:
 *
 *   1. HIR & Control Flow Graph
 *   2. SSA & Phi Functions
 *   3. Effect Classification (Read, Store, Capture, Mutate, Freeze)
 *   4. Reactive Analysis (props/state 의존성 추적)
 *   5. Scope Generation (메모이제이션 단위 그룹핑)
 */

import chalk from 'chalk';

const PHASE_MAP = {
  // HIR 관련 패스
  'lower': { phase: 'HIR Lowering', order: 1 },
  'prunemayb': { phase: 'HIR Lowering', order: 1 },
  'inlineimm': { phase: 'HIR Lowering', order: 1 },
  'mergeconsecutive': { phase: 'HIR Lowering', order: 1 },

  // SSA 관련 패스
  'ssa': { phase: 'SSA Conversion', order: 2 },
  'enterssa': { phase: 'SSA Conversion', order: 2 },
  'eliminateredundantphi': { phase: 'SSA Conversion', order: 2 },
  'constantpropagation': { phase: 'SSA Conversion', order: 2 },

  // 타입 및 Effect 분석
  'infertypes': { phase: 'Type & Effect Analysis', order: 3 },
  'validatehooks': { phase: 'Type & Effect Analysis', order: 3 },
  'analysefunctions': { phase: 'Type & Effect Analysis', order: 3 },
  'infermutationalias': { phase: 'Type & Effect Analysis', order: 3 },
  'deadcodeelimination': { phase: 'Type & Effect Analysis', order: 3 },
  'instructionreordering': { phase: 'Type & Effect Analysis', order: 3 },

  // Reactive 분석
  'inferreactiveplaces': { phase: 'Reactive Analysis', order: 4 },
  'inferreactivescope': { phase: 'Reactive Analysis', order: 4 },
  'rewriteinstruction': { phase: 'Reactive Analysis', order: 4 },
  'memoizefbt': { phase: 'Reactive Analysis', order: 4 },
  'alignmethod': { phase: 'Reactive Analysis', order: 4 },
  'alignobject': { phase: 'Reactive Analysis', order: 4 },

  // Scope 생성
  'buildreactive': { phase: 'Scope Generation', order: 5 },
  'mergereactive': { phase: 'Scope Generation', order: 5 },
  'mergeoverlapping': { phase: 'Scope Generation', order: 5 },
  'flattenreactive': { phase: 'Scope Generation', order: 5 },
  'propagatescopedependencies': { phase: 'Scope Generation', order: 5 },
  'prunescope': { phase: 'Scope Generation', order: 5 },
  'prunenonescaping': { phase: 'Scope Generation', order: 5 },
  'prunenonreactive': { phase: 'Scope Generation', order: 5 },
  'pruneunused': { phase: 'Scope Generation', order: 5 },
  'prunealways': { phase: 'Scope Generation', order: 5 },
  'renamevariables': { phase: 'Scope Generation', order: 5 },
  'promoteused': { phase: 'Scope Generation', order: 5 },
  'stabilize': { phase: 'Scope Generation', order: 5 },
  'propagateearly': { phase: 'Scope Generation', order: 5 },
};

/**
 * 패스 이름에서 파이프라인 단계를 추정한다.
 */
function classifyPass(passName) {
  const lower = passName.toLowerCase().replace(/[\s_-]/g, '');
  for (const [key, value] of Object.entries(PHASE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return { phase: 'Other', order: 9 };
}

/**
 * 스냅샷 목록을 파이프라인 단계별로 그룹화한다.
 */
export function groupByPhase(snapshots) {
  const groups = new Map();
  for (const snap of snapshots) {
    const { phase, order } = classifyPass(snap.name);
    if (!groups.has(phase)) {
      groups.set(phase, { order, snapshots: [] });
    }
    groups.get(phase).snapshots.push(snap);
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([phase, data]) => ({ phase, snapshots: data.snapshots }));
}

/**
 * 전체 분석 결과를 터미널용 문자열로 포매팅한다.
 */
export function formatForTerminal(analysisResult, options = {}) {
  const { verbose = false, phase: filterPhase = null, pass: filterPass = null } = options;
  const { snapshots, events, error } = analysisResult;
  const lines = [];

  // 헤더
  lines.push('');
  lines.push(chalk.bold.cyan('╔══════════════════════════════════════════════════════════════╗'));
  lines.push(chalk.bold.cyan('║') + chalk.bold.white('     React Compiler Pipeline Analysis                       ') + chalk.bold.cyan('║'));
  lines.push(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
  lines.push('');

  // 요약
  const hirCount = snapshots.filter((s) => s.kind === 'hir').length;
  const reactiveCount = snapshots.filter((s) => s.kind === 'reactive').length;
  const debugCount = snapshots.filter((s) => s.kind === 'debug').length;

  lines.push(chalk.bold('Summary'));
  lines.push(chalk.dim('─'.repeat(60)));
  lines.push(`  Total passes captured : ${chalk.yellow(snapshots.length)}`);
  lines.push(`  HIR passes            : ${chalk.green(hirCount)}`);
  lines.push(`  Reactive passes       : ${chalk.magenta(reactiveCount)}`);
  lines.push(`  Debug entries         : ${chalk.gray(debugCount)}`);
  lines.push('');

  // 이벤트 요약
  if (events.length > 0) {
    lines.push(chalk.bold('Compiler Events'));
    lines.push(chalk.dim('─'.repeat(60)));
    for (const event of events) {
      const icon = getEventIcon(event.kind);
      const detail = formatEventDetail(event);
      lines.push(`  ${icon} ${chalk.bold(event.kind)}${detail ? ': ' + detail : ''}`);
    }
    lines.push('');
  }

  // 에러 표시
  if (error) {
    lines.push(chalk.bold.red('Compilation Error'));
    lines.push(chalk.dim('─'.repeat(60)));
    lines.push(chalk.red(`  ${error.message || error}`));
    lines.push('');
  }

  // 패스별 필터 적용
  let filtered = snapshots;
  if (filterPass) {
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(filterPass.toLowerCase()));
  }

  // 단계별 그룹핑 출력
  const groups = groupByPhase(filtered);
  for (const group of groups) {
    if (filterPhase && !group.phase.toLowerCase().includes(filterPhase.toLowerCase())) {
      continue;
    }

    const phaseColor = getPhaseColor(group.phase);
    lines.push(phaseColor(`▎ ${group.phase}`));
    lines.push(chalk.dim('─'.repeat(60)));

    for (const snap of group.snapshots) {
      const kindBadge = getKindBadge(snap.kind);
      lines.push(`  ${kindBadge} ${chalk.bold(snap.name)}`);

      if (verbose) {
        // 전체 IR 출력
        const indented = snap.printed
          .split('\n')
          .map((l) => '    ' + l)
          .join('\n');
        lines.push(chalk.dim(indented));
      } else {
        // 요약 출력 (첫 5줄)
        const previewLines = snap.printed.split('\n').slice(0, 5);
        const indented = previewLines.map((l) => chalk.dim('    ' + l)).join('\n');
        lines.push(indented);
        const totalLines = snap.printed.split('\n').length;
        if (totalLines > 5) {
          lines.push(chalk.dim(`    ... (${totalLines - 5} more lines, use --verbose to see all)`));
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Reactive scope 요약을 포매팅한다.
 */
export function formatReactiveScopes(scopes) {
  if (scopes.length === 0) return chalk.dim('  No reactive scopes found.');

  const lines = [];
  lines.push(chalk.bold.magenta('▎ Reactive Scopes'));
  lines.push(chalk.dim('─'.repeat(60)));

  for (const scope of scopes) {
    const status = scope.pruned ? chalk.red('[pruned]') : chalk.green('[active]');
    const locStr = formatLoc(scope.loc);
    lines.push(`  ${chalk.bold(`Scope #${scope.id}`)} ${status} ${chalk.dim(locStr)}`);
    lines.push(`    Range     : ${scope.range?.start ?? '?'} ~ ${scope.range?.end ?? '?'}`);

    if (scope.dependencies.length > 0) {
      lines.push(`    Deps      : ${chalk.cyan(scope.dependencies.join(', '))}`);
    } else {
      lines.push(`    Deps      : ${chalk.dim('(none)')}`);
    }

    if (scope.declarations.length > 0) {
      lines.push(`    Declares  : ${chalk.yellow(scope.declarations.join(', '))}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 분석 결과를 파일 출력용 plain text로 포매팅한다.
 */
export function formatForFile(analysisResult, options = {}) {
  const { verbose = true, phase: filterPhase = null, pass: filterPass = null } = options;
  const { snapshots, events, error } = analysisResult;
  const lines = [];

  lines.push('='.repeat(60));
  lines.push(' React Compiler Pipeline Analysis');
  lines.push('='.repeat(60));
  lines.push('');

  const hirCount = snapshots.filter((s) => s.kind === 'hir').length;
  const reactiveCount = snapshots.filter((s) => s.kind === 'reactive').length;

  lines.push(`Total passes: ${snapshots.length}`);
  lines.push(`  HIR: ${hirCount}, Reactive: ${reactiveCount}`);
  lines.push('');

  if (events.length > 0) {
    lines.push('[Events]');
    for (const event of events) {
      lines.push(`  ${event.kind}: ${formatEventDetail(event)}`);
    }
    lines.push('');
  }

  if (error) {
    lines.push(`[Error] ${error.message || error}`);
    lines.push('');
  }

  let filtered = snapshots;
  if (filterPass) {
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(filterPass.toLowerCase()));
  }

  const groups = groupByPhase(filtered);
  for (const group of groups) {
    if (filterPhase && !group.phase.toLowerCase().includes(filterPhase.toLowerCase())) {
      continue;
    }

    lines.push('-'.repeat(60));
    lines.push(`[${group.phase}]`);
    lines.push('-'.repeat(60));

    for (const snap of group.snapshots) {
      lines.push(`  Pass: ${snap.name} (${snap.kind})`);
      if (verbose) {
        lines.push(snap.printed);
      } else {
        const preview = snap.printed.split('\n').slice(0, 10).join('\n');
        lines.push(preview);
        const totalLines = snap.printed.split('\n').length;
        if (totalLines > 10) {
          lines.push(`  ... (${totalLines - 10} more lines)`);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * 파일 출력용 reactive scopes 포맷
 */
export function formatReactiveScopesPlain(scopes) {
  if (scopes.length === 0) return '  No reactive scopes found.';

  const lines = [];
  lines.push('[Reactive Scopes]');
  lines.push('-'.repeat(60));

  for (const scope of scopes) {
    const status = scope.pruned ? '[pruned]' : '[active]';
    lines.push(`  Scope #${scope.id} ${status}`);
    lines.push(`    Range: ${scope.range?.start ?? '?'} ~ ${scope.range?.end ?? '?'}`);
    lines.push(`    Deps: ${scope.dependencies.length > 0 ? scope.dependencies.join(', ') : '(none)'}`);
    if (scope.declarations.length > 0) {
      lines.push(`    Declares: ${scope.declarations.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * compact 모드: 블로그 파이프라인 단계별 터미널 출력
 *
 * https://www.load28.com/posts/react-compiler 에 기술된 단계를 따르되
 * 각 단계에서 raw IR 대신 구조화된 요약 데이터를 출력한다.
 * (https://www.load28.com/posts/refactor-functional-programming 참고)
 *
 * @param {Array} stages - { stage, desc, snap } 배열
 * @param {Array} scopes - extractReactiveScopes 결과
 * @param {Object} extracted - { phis, bindings, effects, reactiveVars }
 * @param {Array} events - 컴파일러 이벤트
 * @param {Error|null} error
 */
export function formatCompact(stages, scopes, extracted, events, error, options = {}) {
  const { verbose = false } = options;
  const STAGE_COLORS = [
    chalk.bold.blue,     // 1. HIR
    chalk.bold.green,    // 2. SSA
    chalk.bold.yellow,   // 3. Effect
    chalk.bold.magenta,  // 4. Reactive
    chalk.bold.cyan,     // 5. Scope
  ];

  const lines = [];

  lines.push('');
  lines.push(chalk.bold.cyan('╔══════════════════════════════════════════════════════════════╗'));
  lines.push(chalk.bold.cyan('║') + chalk.bold.white('     React Compiler Pipeline Analysis                       ') + chalk.bold.cyan('║'));
  lines.push(chalk.bold.cyan('║') + chalk.dim('     https://www.load28.com/posts/react-compiler             ') + chalk.bold.cyan('║'));
  lines.push(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
  lines.push('');

  // 컴파일 결과 요약
  for (const event of events) {
    if (event.kind === 'CompileSuccess') {
      lines.push(chalk.green(`  ✓ ${event.fnName || 'anonymous'}: ${event.memoSlots} memo slots, ${event.memoBlocks} blocks, ${event.memoValues} values`));
    } else if (event.kind === 'CompileSkip') {
      lines.push(chalk.yellow(`  ⊘ Skipped: ${event.reason}`));
    }
  }
  if (error) {
    lines.push(chalk.red(`  ✗ Error: ${error.message || error}`));
  }
  lines.push('');

  // 단계별 출력
  for (let i = 0; i < stages.length; i++) {
    const { stage, desc, snap } = stages[i];
    const color = STAGE_COLORS[i] || chalk.bold.white;

    lines.push(color(`▎ ${stage}`));
    lines.push(chalk.dim(`  ${desc}`));
    lines.push(chalk.dim('─'.repeat(60)));

    if (!snap) {
      lines.push(chalk.dim('  (해당 패스 없음)'));
      lines.push('');
      continue;
    }

    // 1. HIR: raw IR 출력 (제어 흐름이 핵심이므로)
    if (i === 0) {
      const indented = snap.printed.split('\n').map((l) => '  ' + l).join('\n');
      lines.push(indented);
    }

    // 2. SSA: phi 함수 + 바인딩 요약 (+ verbose 시 raw IR)
    if (i === 1) {
      const { phis, bindings } = extracted;

      if (phis.length > 0) {
        lines.push(chalk.green('  Phi Functions:'));
        for (const phi of phis) {
          const ops = phi.operands.map((o) => `bb${o.block}: ${o.name || '?'}`).join(', ');
          lines.push(`    ${chalk.bold(phi.target || '?')} = φ(${ops})`);
        }
      } else {
        lines.push(chalk.dim('  Phi Functions: (none - no control flow merge)'));
      }

      if (bindings) {
        const reassigned = bindings.variables.filter((v) => v.assignments > 1);
        if (reassigned.length > 0) {
          lines.push(chalk.green('  Reassigned variables:'));
          for (const v of reassigned) {
            lines.push(`    ${chalk.bold(v.name)}: ${v.assignments} assignments`);
          }
        }
        lines.push(chalk.dim(`  Total phi nodes: ${bindings.phiCount}`));
      }

      if (verbose) {
        lines.push('');
        lines.push(chalk.dim('  ── Raw SSA IR ──'));
        const indented = snap.printed.split('\n').map((l) => '  ' + l).join('\n');
        lines.push(indented);
      }
    }

    // 3. Effect: effect 통계 요약
    if (i === 2) {
      const { effects } = extracted;
      if (effects) {
        const { counts, details } = effects;

        // aliasing effect 종류별 카운트
        const aliasingKeys = Object.keys(counts).filter((k) => !k.startsWith('place:'));
        const placeKeys = Object.keys(counts).filter((k) => k.startsWith('place:'));

        if (aliasingKeys.length > 0) {
          lines.push(chalk.yellow('  Aliasing Effects:'));
          for (const key of aliasingKeys.sort()) {
            lines.push(`    ${chalk.bold(key)}: ${counts[key]}`);
          }
        }

        if (placeKeys.length > 0) {
          lines.push(chalk.yellow('  Place Effects:'));
          for (const key of placeKeys.sort()) {
            const label = key.replace('place:', '');
            lines.push(`    ${chalk.bold(label)}: ${counts[key]}`);
          }
        }

        if (details.length > 0) {
          lines.push(chalk.yellow('  Instructions with effects:'));
          const showAll = verbose;
          const limit = showAll ? details.length : 20;
          for (const d of details.slice(0, limit)) {
            const effs = d.effects.join(', ');
            lines.push(`    [${d.id}] ${chalk.dim(d.instruction)} ${d.lvalue ? chalk.bold(d.lvalue) : ''} → ${effs}`);
          }
          if (!showAll && details.length > limit) {
            lines.push(chalk.dim(`    ... (${details.length - limit} more, use --verbose to see all)`));
          }
        }

        if (verbose) {
          lines.push('');
          lines.push(chalk.dim('  ── Raw Effect IR ──'));
          const indented = snap.printed.split('\n').map((l) => '  ' + l).join('\n');
          lines.push(indented);
        }
      } else {
        lines.push(chalk.dim('  (effect 데이터 없음)'));
      }
    }

    // 4. Reactive: reactive vs non-reactive 변수 분류
    if (i === 3) {
      const { reactiveVars } = extracted;
      if (reactiveVars) {
        const { reactive, nonReactive } = reactiveVars;
        if (reactive.length > 0) {
          lines.push(chalk.magenta('  Reactive (props/state 의존):'));
          for (const v of reactive) {
            const typeStr = v.type ? chalk.dim(` : ${v.type}`) : '';
            lines.push(`    ${chalk.bold(v.name)}${typeStr}`);
          }
        }
        if (nonReactive.length > 0) {
          lines.push(chalk.dim('  Non-reactive (상수/리터럴):'));
          for (const v of nonReactive) {
            const typeStr = v.type ? chalk.dim(` : ${v.type}`) : '';
            lines.push(`    ${v.name}${typeStr}`);
          }
        }

        if (verbose) {
          lines.push('');
          lines.push(chalk.dim('  ── Raw Reactive IR ──'));
          const indented = snap.printed.split('\n').map((l) => '  ' + l).join('\n');
          lines.push(indented);
        }
      } else {
        lines.push(chalk.dim('  (reactive 데이터 없음)'));
      }
    }

    // 5. Scope: ReactiveFunction IR + scope 요약
    if (i === 4) {
      const indented = snap.printed.split('\n').map((l) => '  ' + l).join('\n');
      lines.push(indented);
    }

    lines.push('');
  }

  // Scope 요약
  lines.push(chalk.bold.cyan('  ┌─ Scope Summary'));
  lines.push(chalk.dim('  │  각 scope = 독립적 메모이제이션 단위. deps가 바뀔 때만 재계산.'));

  if (scopes.length === 0) {
    lines.push(chalk.dim('  │  (reactive scope 없음)'));
  } else {
    for (const scope of scopes) {
      const status = scope.pruned ? chalk.red('pruned') : chalk.green('active');
      const deps = scope.dependencies.length > 0
        ? chalk.cyan(scope.dependencies.join(', '))
        : chalk.dim('(none)');
      const decls = scope.declarations.length > 0
        ? chalk.yellow(scope.declarations.join(', '))
        : '';
      lines.push(`  │  ${chalk.bold(`#${scope.id}`)} [${status}] deps=[${deps}]${decls ? ` → ${decls}` : ''}`);
    }
  }
  lines.push(chalk.bold.cyan('  └─'));
  lines.push('');

  return lines.join('\n');
}

/**
 * compact 모드: 파일 출력용 plain text
 */
export function formatCompactPlain(stages, scopes, extracted, events, error, options = {}) {
  const { verbose = false } = options;
  const lines = [];

  lines.push('='.repeat(60));
  lines.push(' React Compiler Pipeline Analysis');
  lines.push(' https://www.load28.com/posts/react-compiler');
  lines.push('='.repeat(60));
  lines.push('');

  for (const event of events) {
    if (event.kind === 'CompileSuccess') {
      lines.push(`[OK] ${event.fnName || 'anonymous'}: ${event.memoSlots} memo slots, ${event.memoBlocks} blocks, ${event.memoValues} values`);
    }
  }
  if (error) {
    lines.push(`[Error] ${error.message || error}`);
  }
  lines.push('');

  for (let i = 0; i < stages.length; i++) {
    const { stage, desc, snap } = stages[i];
    lines.push('-'.repeat(60));
    lines.push(`[${stage}]`);
    lines.push(desc);
    lines.push('-'.repeat(60));

    if (!snap) {
      lines.push('  (해당 패스 없음)');
      lines.push('');
      continue;
    }

    // 1. HIR: raw IR
    if (i === 0) {
      lines.push(snap.printed);
    }

    // 2. SSA: phi + bindings
    if (i === 1) {
      const { phis, bindings } = extracted;
      if (phis.length > 0) {
        lines.push('  Phi Functions:');
        for (const phi of phis) {
          const ops = phi.operands.map((o) => `bb${o.block}: ${o.name || '?'}`).join(', ');
          lines.push(`    ${phi.target || '?'} = phi(${ops})`);
        }
      } else {
        lines.push('  Phi Functions: (none)');
      }
      if (bindings) {
        const reassigned = bindings.variables.filter((v) => v.assignments > 1);
        if (reassigned.length > 0) {
          lines.push('  Reassigned:');
          for (const v of reassigned) {
            lines.push(`    ${v.name}: ${v.assignments} assignments`);
          }
        }
        lines.push(`  Total phi nodes: ${bindings.phiCount}`);
      }
      if (verbose) {
        lines.push('');
        lines.push('  -- Raw SSA IR --');
        lines.push(snap.printed);
      }
    }

    // 3. Effect: counts
    if (i === 2) {
      const { effects } = extracted;
      if (effects) {
        const { counts, details } = effects;
        lines.push('  Effect counts:');
        for (const [key, val] of Object.entries(counts).sort()) {
          lines.push(`    ${key}: ${val}`);
        }
        if (details.length > 0) {
          lines.push('  Instructions with effects:');
          for (const d of details) {
            lines.push(`    [${d.id}] ${d.instruction} ${d.lvalue || ''} → ${d.effects.join(', ')}`);
          }
        }
      }
      if (verbose) {
        lines.push('');
        lines.push('  -- Raw Effect IR --');
        lines.push(snap.printed);
      }
    }

    // 4. Reactive: variable classification
    if (i === 3) {
      const { reactiveVars } = extracted;
      if (reactiveVars) {
        if (reactiveVars.reactive.length > 0) {
          lines.push('  Reactive (props/state dependent):');
          for (const v of reactiveVars.reactive) {
            lines.push(`    ${v.name}${v.type ? ` : ${v.type}` : ''}`);
          }
        }
        if (reactiveVars.nonReactive.length > 0) {
          lines.push('  Non-reactive (constants):');
          for (const v of reactiveVars.nonReactive) {
            lines.push(`    ${v.name}${v.type ? ` : ${v.type}` : ''}`);
          }
        }
      }
      if (verbose) {
        lines.push('');
        lines.push('  -- Raw Reactive IR --');
        lines.push(snap.printed);
      }
    }

    // 5. Scope: ReactiveFunction IR
    if (i === 4) {
      lines.push(snap.printed);
    }

    lines.push('');
  }

  lines.push('-'.repeat(60));
  lines.push('[Scope Summary]');
  lines.push('각 scope = 독립적 메모이제이션 단위. deps가 바뀔 때만 재계산.');
  lines.push('-'.repeat(60));

  if (scopes.length === 0) {
    lines.push('  (reactive scope 없음)');
  } else {
    for (const scope of scopes) {
      const status = scope.pruned ? 'pruned' : 'active';
      const deps = scope.dependencies.length > 0 ? scope.dependencies.join(', ') : '(none)';
      const decls = scope.declarations.length > 0 ? ` → ${scope.declarations.join(', ')}` : '';
      lines.push(`  #${scope.id} [${status}] deps=[${deps}]${decls}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Helpers ────

function getEventIcon(kind) {
  switch (kind) {
    case 'CompileSuccess': return chalk.green('✓');
    case 'CompileError': return chalk.red('✗');
    case 'CompileSkip': return chalk.yellow('⊘');
    case 'CompileDiagnostic': return chalk.blue('ℹ');
    default: return chalk.dim('·');
  }
}

function formatEventDetail(event) {
  switch (event.kind) {
    case 'CompileSuccess':
      return `${event.fnName || 'anonymous'} → memoSlots=${event.memoSlots}, blocks=${event.memoBlocks}, values=${event.memoValues}`;
    case 'CompileError':
      return event.detail?.reason || '';
    case 'CompileSkip':
      return `${event.reason}`;
    case 'CompileDiagnostic':
      return event.detail?.reason || '';
    default:
      return '';
  }
}

function getPhaseColor(phase) {
  switch (phase) {
    case 'HIR Lowering': return chalk.bold.blue;
    case 'SSA Conversion': return chalk.bold.green;
    case 'Type & Effect Analysis': return chalk.bold.yellow;
    case 'Reactive Analysis': return chalk.bold.magenta;
    case 'Scope Generation': return chalk.bold.cyan;
    default: return chalk.bold.white;
  }
}

function getKindBadge(kind) {
  switch (kind) {
    case 'hir': return chalk.bgBlue.white(' HIR ');
    case 'reactive': return chalk.bgMagenta.white(' RFn ');
    case 'ast': return chalk.bgGreen.white(' AST ');
    case 'debug': return chalk.bgGray.white(' DBG ');
    default: return chalk.bgWhite.black(` ${kind} `);
  }
}

function formatLoc(loc) {
  if (!loc || typeof loc === 'symbol') return '';
  if (loc.start && loc.end) {
    return `${loc.start.line}:${loc.start.column}-${loc.end.line}:${loc.end.column}`;
  }
  return '';
}
