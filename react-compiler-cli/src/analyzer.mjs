/**
 * React Compiler 분석 엔진
 *
 * babel-plugin-react-compiler의 내부 파이프라인을 활용하여
 * 코드 생성(Codegen) 전까지의 모든 분석 단계를 수집한다.
 *
 * 파이프라인 단계:
 *   AST → HIR(lower) → SSA → InferTypes → Effect 분석
 *   → Reactive 분석 → Scope 생성 → (Codegen 제외)
 *
 * runBabelPluginReactCompiler 대신 직접 Babel transformFromAstSync를 호출하여
 * FBT 플러그인 의존성 없이 동작한다.
 */

import { parse } from '@babel/parser';
import { transformFromAstSync } from '@babel/core';
import BabelPluginReactCompiler, {
  printHIR,
  printReactiveFunction,
  printFunctionWithOutlined,
} from 'babel-plugin-react-compiler';

/**
 * @typedef {Object} PipelineSnapshot
 * @property {string} kind - 'hir' | 'reactive' | 'ast' | 'debug'
 * @property {string} name - 패스 이름
 * @property {string} printed - 사람이 읽을 수 있는 문자열
 * @property {Object} raw - 원본 IR 객체
 */

/**
 * @typedef {Object} CompileEvent
 * @property {string} kind - 이벤트 종류
 * @property {Object} [detail] - 이벤트 세부 정보
 */

/**
 * React 소스 코드를 분석하여 컴파일러 파이프라인의 각 단계를 수집한다.
 *
 * @param {string} sourceCode - 분석할 React 소스 코드
 * @param {string} filename - 파일 이름 (확장자로 언어 판별)
 * @param {Object} [options]
 * @param {string} [options.target] - React 타겟 버전 ('17' | '18' | '19')
 * @param {string} [options.compilationMode] - 컴파일 모드 ('all' | 'infer' | 'annotation' | 'syntax')
 * @param {boolean} [options.captureAst] - Codegen AST도 수집할지 여부
 * @param {boolean} [options.codegen] - 코드 생성(Codegen) 결과도 반환할지 여부 (기본: false)
 * @returns {{ snapshots: PipelineSnapshot[], events: CompileEvent[], error: Error|null, generatedCode: string|null }}
 */
export function analyzeSource(sourceCode, filename, options = {}) {
  const { target = '19', compilationMode = 'all', captureAst = false, codegen = false } = options;

  const snapshots = [];
  const events = [];
  let error = null;
  let generatedCode = null;

  const language = detectLanguage(filename);

  const logger = {
    logEvent(file, event) {
      events.push({ ...event });
    },
    debugLogIRs(value) {
      // Codegen(ast) 결과는 옵션에 따라 제외
      if (value.kind === 'ast' && !captureAst) return;

      const printed = printPipelineValue(value);
      snapshots.push({
        kind: value.kind,
        name: value.name,
        printed,
        raw: value.value,
      });
    },
  };

  const pluginOptions = {
    logger,
    compilationMode,
    target,
    panicThreshold: 'none',
    environment: {},
  };

  try {
    // Babel AST 파싱
    const ast = parse(sourceCode, {
      sourceFilename: filename,
      plugins: [language, 'jsx'],
      sourceType: 'module',
    });

    // React Compiler 바벨 플러그인만 직접 적용 (FBT 플러그인 제외)
    const result = transformFromAstSync(ast, sourceCode, {
      filename,
      highlightCode: false,
      retainLines: true,
      plugins: [[BabelPluginReactCompiler, pluginOptions]],
      sourceType: 'module',
      configFile: false,
      babelrc: false,
    });

    if (codegen && result && result.code) {
      generatedCode = result.code;
    }
  } catch (err) {
    error = err;
  }

  return { snapshots, events, error, generatedCode };
}

/**
 * 파이프라인 값을 사람이 읽을 수 있는 문자열로 변환한다.
 */
function printPipelineValue(value) {
  switch (value.kind) {
    case 'hir':
      try {
        return printFunctionWithOutlined(value.value);
      } catch {
        try {
          return printHIR(value.value.body);
        } catch {
          return `[HIR: ${value.name}] (print failed)`;
        }
      }
    case 'reactive':
      try {
        return printReactiveFunction(value.value);
      } catch {
        return `[Reactive: ${value.name}] (print failed)`;
      }
    case 'ast':
      return `[Codegen] memoSlots=${value.value.memoSlotsUsed}, memoBlocks=${value.value.memoBlocks}, memoValues=${value.value.memoValues}`;
    case 'debug':
      return typeof value.value === 'string' ? value.value : JSON.stringify(value.value);
    default:
      return `[Unknown: ${value.kind}]`;
  }
}

/**
 * 파일 확장자에서 언어를 판별한다.
 */
function detectLanguage(filename) {
  if (/\.tsx?$/.test(filename)) return 'typescript';
  return 'flow';
}

/**
 * 스냅샷 목록에서 특정 종류(hir/reactive/ast)만 필터링한다.
 */
export function filterSnapshots(snapshots, kind) {
  return snapshots.filter((s) => s.kind === kind);
}

/**
 * 스냅샷 목록에서 특정 패스 이름으로 필터링한다.
 */
export function findSnapshotByPass(snapshots, passName) {
  return snapshots.filter((s) => s.name.toLowerCase().includes(passName.toLowerCase()));
}

/**
 * ReactiveFunction 스냅샷에서 reactive scope 정보를 추출한다.
 */
export function extractReactiveScopes(reactiveSnapshot) {
  if (!reactiveSnapshot || reactiveSnapshot.kind !== 'reactive') return [];
  const scopes = [];
  walkReactiveBlock(reactiveSnapshot.raw.body, scopes);
  return scopes;
}

/**
 * HIR 스냅샷(SSA 이후)에서 phi 함수 목록을 추출한다.
 * 블로그: "total_2 = φ(total_0, total_1)" 형태.
 */
export function extractPhiFunctions(hirSnapshot) {
  if (!hirSnapshot || hirSnapshot.kind !== 'hir') return [];
  const phis = [];
  const blocks = hirSnapshot.raw.body?.blocks;
  if (!blocks) return phis;

  for (const [blockId, block] of blocks) {
    if (!block.phis) continue;
    for (const phi of block.phis) {
      const target = resolveIdentName(phi.place?.identifier);
      const operands = [];
      if (phi.operands) {
        for (const [fromBlock, place] of phi.operands) {
          operands.push({ block: fromBlock, name: resolveIdentName(place?.identifier) });
        }
      }
      phis.push({ block: blockId, target, operands });
    }
  }
  return phis;
}

/**
 * HIR 스냅샷(Effect 분석 이후)에서 effect 통계를 추출한다.
 * 블로그: "11 Read, 2 Mutate, 1 Create" 형태.
 */
export function extractEffectSummary(hirSnapshot) {
  if (!hirSnapshot || hirSnapshot.kind !== 'hir') return null;
  const blocks = hirSnapshot.raw.body?.blocks;
  if (!blocks) return null;

  const counts = {};
  const details = [];

  for (const [, block] of blocks) {
    for (const instr of block.instructions) {
      // instruction-level effects
      if (instr.effects) {
        for (const eff of instr.effects) {
          const kind = eff.kind;
          counts[kind] = (counts[kind] || 0) + 1;
        }
      }
      // place-level effects (lvalue, operands)
      collectPlaceEffect(instr.lvalue, counts);
      collectValuePlaceEffects(instr.value, counts);

      // 의미 있는 effect가 있는 instruction 기록
      if (instr.effects && instr.effects.length > 0) {
        const instrName = instr.value?.kind || 'unknown';
        const lname = resolveIdentName(instr.lvalue?.identifier);
        details.push({
          id: instr.id,
          instruction: instrName,
          lvalue: lname,
          effects: instr.effects.map((e) => e.kind),
        });
      }
    }
  }

  return { counts, details };
}

function collectPlaceEffect(place, counts) {
  if (!place || !place.effect || place.effect === '<unknown>') return;
  const key = `place:${place.effect}`;
  counts[key] = (counts[key] || 0) + 1;
}

function collectValuePlaceEffects(value, counts) {
  if (!value) return;
  // args, callee, object, property 등에서 effect 수집
  const places = [];
  if (value.callee) places.push(value.callee);
  if (value.object) places.push(value.object);
  if (value.value && value.value.kind === 'Identifier') places.push(value.value);
  if (value.place) places.push(value.place);
  if (value.args) {
    for (const arg of value.args) {
      if (arg.kind === 'Spread') places.push(arg.place);
      else if (arg.kind === 'Identifier') places.push(arg);
    }
  }
  for (const p of places) {
    collectPlaceEffect(p, counts);
  }
}

/**
 * HIR 스냅샷(Reactive 분석 이후)에서 reactive/non-reactive 변수를 분류한다.
 * 블로그: "reactive: items, coupon, user / non-reactive: 'VIP', 0"
 */
export function extractReactiveVariables(hirSnapshot) {
  if (!hirSnapshot || hirSnapshot.kind !== 'hir') return null;
  const blocks = hirSnapshot.raw.body?.blocks;
  if (!blocks) return null;

  const reactive = new Map();   // name → type 정보
  const nonReactive = new Map();

  for (const [, block] of blocks) {
    // phi에서도 reactive 체크
    if (block.phis) {
      for (const phi of block.phis) {
        classifyPlace(phi.place, reactive, nonReactive);
      }
    }
    for (const instr of block.instructions) {
      classifyPlace(instr.lvalue, reactive, nonReactive);
      // value 내부의 place들도 분류
      classifyValuePlaces(instr.value, reactive, nonReactive);
    }
  }

  return {
    reactive: [...reactive.entries()].map(([name, info]) => ({ name, ...info })),
    nonReactive: [...nonReactive.entries()].map(([name, info]) => ({ name, ...info })),
  };
}

function classifyPlace(place, reactive, nonReactive) {
  if (!place || place.kind !== 'Identifier') return;
  const name = resolveIdentName(place.identifier);
  if (!name || name.startsWith('$')) return; // 임시 변수 건너뛰기

  const info = { type: formatType(place.identifier?.type) };
  if (place.reactive) {
    reactive.set(name, info);
  } else {
    nonReactive.set(name, info);
  }
}

function classifyValuePlaces(value, reactive, nonReactive) {
  if (!value) return;
  const places = [];
  if (value.place) places.push(value.place);
  if (value.value && value.value.kind === 'Identifier') places.push(value.value);
  if (value.lvalue?.place) places.push(value.lvalue.place);
  for (const p of places) {
    classifyPlace(p, reactive, nonReactive);
  }
}

function formatType(type) {
  if (!type) return null;
  if (type.kind === 'Primitive') return 'Primitive';
  if (type.kind === 'Function') return 'Function';
  if (type.kind === 'Object') return type.shapeId ? `Object<${type.shapeId}>` : 'Object';
  if (type.kind === 'Poly') return 'Poly';
  return type.kind || null;
}

/**
 * HIR 스냅샷에서 변수 바인딩(재할당) 정보를 추출한다.
 */
export function extractBindingInfo(hirSnapshot) {
  if (!hirSnapshot || hirSnapshot.kind !== 'hir') return null;
  const blocks = hirSnapshot.raw.body?.blocks;
  if (!blocks) return null;

  const assignments = new Map(); // name → count

  for (const [, block] of blocks) {
    for (const instr of block.instructions) {
      const kind = instr.value?.kind;
      if (kind === 'StoreLocal' || kind === 'StoreContext' || kind === 'DeclareLocal' || kind === 'DeclareContext') {
        const place = instr.value.lvalue?.place || instr.lvalue;
        const name = resolveIdentName(place?.identifier);
        if (name && !name.startsWith('$')) {
          assignments.set(name, (assignments.get(name) || 0) + 1);
        }
      }
    }
  }

  const phiCount = [...blocks.values()].reduce((sum, b) => sum + (b.phis?.size || 0), 0);

  return {
    variables: [...assignments.entries()].map(([name, count]) => ({ name, assignments: count })),
    phiCount,
  };
}

function resolveIdentName(ident) {
  if (!ident) return null;
  if (ident.name?.value) return ident.name.value;
  if (typeof ident.name === 'string') return ident.name;
  return null;
}

function walkReactiveBlock(block, scopes) {
  if (!Array.isArray(block)) return;
  for (const stmt of block) {
    if (stmt.kind === 'scope' || stmt.kind === 'pruned-scope') {
      const scope = stmt.scope;
      const deps = [];
      if (scope.dependencies) {
        for (const dep of scope.dependencies) {
          const name = dep.identifier?.name?.value ?? dep.identifier?.name ?? `$${dep.identifier?.id}`;
          const path = dep.path?.map((p) => p.property).join('.') || '';
          deps.push(path ? `${name}.${path}` : String(name));
        }
      }
      const decls = [];
      if (scope.declarations) {
        for (const [, decl] of scope.declarations) {
          const name = decl.identifier?.name?.value ?? decl.identifier?.name ?? `$${decl.identifier?.id}`;
          decls.push(String(name));
        }
      }
      scopes.push({
        id: scope.id,
        range: scope.range,
        dependencies: deps,
        declarations: decls,
        pruned: stmt.kind === 'pruned-scope',
        loc: scope.loc,
      });
      walkReactiveBlock(stmt.instructions, scopes);
    } else if (stmt.kind === 'terminal') {
      const terminal = stmt.terminal;
      if (terminal.consequent) walkReactiveBlock(terminal.consequent, scopes);
      if (terminal.alternate) walkReactiveBlock(terminal.alternate, scopes);
      if (terminal.loop) walkReactiveBlock(terminal.loop, scopes);
      if (terminal.block) walkReactiveBlock(terminal.block, scopes);
      if (terminal.handler) walkReactiveBlock(terminal.handler, scopes);
      if (terminal.cases) {
        for (const c of terminal.cases) {
          if (c.block) walkReactiveBlock(c.block, scopes);
        }
      }
    }
  }
}
