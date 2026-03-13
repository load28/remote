---
tags: [react-hook-form, form, validation, zod, controlled, custom-hook, generic]
rules: [S-13, T-14, T-04, A-05, A-09, S-01]
description: React Hook Form 폼 패턴 — Zod input/output 타입 분리, register vs Controller 사용 기준, watch 조건부 필드, useFieldArray, 서버 에러 핸들링
---

## 규칙 1: Zod 양방향 타입 분리 (input ↔ output)

> 폼 스키마는 반드시 **양방향 타입이 분리**되도록 작성한다.
> — `z.input`: 외부(폼 필드)에서 들어오는 타입 (항상 `string` 기반)
> — `z.output`: 내부(비즈니스 로직)에서 사용하는 타입 (`number`, `Date`, `boolean` 등)
> 이는 Effect Schema의 Encoding/Decoding 개념과 동일한 원칙이다:
> 스키마 하나로 **외부 표현(Encoded)과 내부 표현(Type)을 동시에 정의**한다.
>
> **필수**: `z.coerce`를 단독으로 사용하지 않는다 (Zod v3에서 input 타입이 output과 동일).
> 반드시 `z.string().pipe()`로 감싸서 input 타입이 `string`임을 명시한다.

```tsx
// ❌ BAD: z.coerce만 사용 → z.input 타입이 string이 아님
const badSchema = z.object({
  age: z.coerce.number().min(1).max(120),
  //   z.input → number (Zod v3), unknown (Zod v4)
  //   실제 <input>은 string을 반환 → 타입 불일치
});

// ❌ BAD: z.infer만 사용 → input/output 구분 불가
type FormValues = z.infer<typeof badSchema>;
// → { age: number } — 폼 필드도 number, 제출도 number → 구분 없음

// ✅ GOOD: z.string().pipe()로 명시적 string → number 변환
const schema = z.object({
  age: z.string().min(1, '필수').pipe(z.coerce.number().min(1).max(120)),
  birthDate: z.string().min(1, '필수').pipe(z.coerce.date()),
  isAgree: z.string().pipe(z.coerce.boolean()),
});

// 폼 필드 타입 — 사용자가 입력하는 값 (string 기반)
type FormInput = z.input<typeof schema>;
// → { age: string; birthDate: string; isAgree: string }

// 제출 결과 타입 — Zod가 변환한 후 값
type FormOutput = z.output<typeof schema>;
// → { age: number; birthDate: Date; isAgree: boolean }
```

```tsx
// ✅ GOOD: useForm에 input/output 타입 모두 전달
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<FormInput, unknown, FormOutput>({
  //                 ^^^^^^^^           ^^^^^^^^^^
  //                 폼 필드 타입        handleSubmit 콜백 파라미터 타입
  resolver: zodResolver(schema),
  defaultValues: {
    age: '',         // ✅ string — FormInput 타입에 맞음
    birthDate: '',   // ✅ string
    isAgree: '',     // ✅ string
  },
});

// handleSubmit 콜백에서 data는 FormOutput 타입 (변환 완료)
form.handleSubmit((data) => {
  data.age;       // number ✅
  data.birthDate; // Date ✅
  data.isAgree;   // boolean ✅
});
```

```tsx
// ✅ GOOD: z.pipe()로 복잡한 변환 체인
const priceSchema = z.object({
  // string → 숫자 추출 → number 검증
  price: z
    .string()
    .transform((val) => val.replace(/[^0-9]/g, ''))
    .pipe(z.coerce.number().min(0).max(1_000_000)),

  // string → Date → 미래 날짜 검증
  scheduledAt: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date().min(new Date(), '미래 날짜만 선택 가능합니다')),
});

type PriceFormInput = z.input<typeof priceSchema>;
// → { price: string; scheduledAt: string }

type PriceFormOutput = z.output<typeof priceSchema>;
// → { price: number; scheduledAt: Date }
```

---

## 규칙 2: register vs Controller 사용 기준

> `register` = uncontrolled (DOM 기반, 리렌더 최소).
> `Controller` = controlled (React state 기반, 리렌더 발생).
> **기본은 register, 필요할 때만 Controller.**

```
사용 기준 판단:

1. 네이티브 HTML 요소인가? (<input>, <select>, <textarea>)
   → YES → register 사용

2. 서드파티 UI 라이브러리 컴포넌트인가? (MUI, Ant Design, React Select 등)
   → YES → Controller 사용 (ref를 직접 노출하지 않음)

3. 값의 타입이 string이 아닌가? (Slider min/max, Rating 숫자, Color Picker 등)
   → YES → Controller 사용
```

```tsx
// ✅ register — 네이티브 HTML 요소
function NativeForm() {
  const { register, formState: { errors } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  return (
    <form>
      {/* ✅ 네이티브 input → register */}
      <input {...register('name')} />
      <input type="email" {...register('email')} />
      <input type="number" {...register('age')} />
      <select {...register('role')}>
        <option value="admin">관리자</option>
        <option value="member">멤버</option>
      </select>
      <textarea {...register('bio')} />
    </form>
  );
}
```

```tsx
// ✅ Controller — 서드파티 컴포넌트 / 비표준 값 타입
import { Controller } from 'react-hook-form';

function ControllerForm() {
  const { control, formState: { errors } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  return (
    <form>
      {/* ✅ 서드파티 DatePicker → Controller */}
      <Controller
        name="birthDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      {/* ✅ 비표준 값 타입 (number[]) → Controller */}
      <Controller
        name="priceRange"
        control={control}
        render={({ field }) => (
          <RangeSlider
            min={0}
            max={100}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {/* ✅ 커스텀 토글 (ref 미지원) → Controller */}
      <Controller
        name="isPublic"
        control={control}
        render={({ field }) => (
          <ToggleSwitch
            isChecked={field.value === 'true'}
            onToggle={(checked) => field.onChange(String(checked))}
          />
        )}
      />
    </form>
  );
}
```

```tsx
// ❌ BAD: 네이티브 input에 Controller 사용 — 불필요한 리렌더
<Controller
  name="name"
  control={control}
  render={({ field }) => <input {...field} />}
/>

// ✅ GOOD: 네이티브 input에는 register
<input {...register('name')} />

// ❌ BAD: 같은 필드에 register + Controller 동시 사용 — 이중 등록 에러
<Controller
  name="email"
  control={control}
  render={({ field }) => <input {...field} {...register('email')} />}
/>
```

---

## 규칙 3: watch + 조건부 필드

> `watch`는 구독한 필드가 변경될 때마다 리렌더를 발생시킨다.
> 전체 `watch()`가 아닌 **특정 필드만 구독**하여 리렌더 범위를 최소화한다.
> 조건부 스키마는 Zod의 `superRefine`으로 처리한다.
> **주의**: `z.discriminatedUnion`은 유니온 타입을 생성하므로, RHF의 `register`가
> 공통 필드만 허용하여 조건부 필드에서 TS 에러가 발생한다. 단일 스키마 + `superRefine`을 사용한다.

```tsx
// ❌ BAD: watch() 전체 구독 → 어떤 필드든 변경되면 리렌더
const allValues = watch(); // 모든 필드 변경에 반응

// ❌ BAD: 조건부 필드의 검증을 컴포넌트에서 수동 처리
const type = watch('type');
if (type === 'business' && !getValues('companyName')) {
  setError('companyName', { message: '필수' });
}

// ❌ BAD: discriminatedUnion → 유니온 타입 → register('companyName') TS 에러
const badSchema = z.discriminatedUnion('accountType', [
  z.object({ accountType: z.literal('personal'), name: z.string() }),
  z.object({ accountType: z.literal('business'), name: z.string(), companyName: z.string() }),
]);
// z.input → { accountType: 'personal'; name: string } | { accountType: 'business'; ... }
// register('companyName') → TS Error: 'companyName'은 공통 필드가 아님

// ✅ GOOD: 특정 필드만 구독
const accountType = watch('accountType');

// ✅ GOOD: 단일 스키마 + superRefine으로 조건부 검증 (A-05: 비즈니스 로직 분리)
const accountSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  name: z.string().min(1, '이름은 필수입니다'),
  email: z.string().email('올바른 이메일을 입력하세요'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.accountType === 'business') {
    if (!data.companyName || data.companyName.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: '회사명은 필수입니다',
      });
    }
    if (!data.taxId || !/^\d{3}-\d{2}-\d{5}$/.test(data.taxId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taxId'],
        message: '사업자등록번호 형식이 올바르지 않습니다',
      });
    }
  }
});

type AccountInput = z.input<typeof accountSchema>;
type AccountOutput = z.output<typeof accountSchema>;
```

```tsx
// ✅ GOOD: 조건부 필드 렌더링 — 단일 타입이므로 register 에러 없음
function AccountForm() {
  const { register, watch, formState: { errors } } =
    useForm<AccountInput, unknown, AccountOutput>({
      resolver: zodResolver(accountSchema),
      defaultValues: {
        accountType: 'personal',
        name: '',
        email: '',
        companyName: '',
        taxId: '',
      },
    });

  // ✅ 특정 필드만 구독 — accountType 변경 시에만 리렌더
  const accountType = watch('accountType');

  return (
    <form>
      <select {...register('accountType')}>
        <option value="personal">개인</option>
        <option value="business">사업자</option>
      </select>

      <input {...register('name')} />
      <input type="email" {...register('email')} />

      {/* ✅ 조건부 렌더 — accountType에 따라 추가 필드 */}
      {accountType === 'business' ? (
        <>
          <input {...register('companyName')} placeholder="회사명" />
          {errors.companyName ? <p role="alert">{errors.companyName.message}</p> : null}

          <input {...register('taxId')} placeholder="000-00-00000" />
          {errors.taxId ? <p role="alert">{errors.taxId.message}</p> : null}
        </>
      ) : null}
    </form>
  );
}
```

---

## 규칙 4: 서버 에러 → setError 매핑

> 서버 검증 에러는 `setError`로 필드에 매핑한다.
> 필드 특정 에러와 글로벌 에러를 분리한다 (`root` 키 활용).

```tsx
// ❌ BAD: 서버 에러를 별도 state로 관리 → 폼 에러와 이원화
const [serverError, setServerError] = useState<string | null>(null);

const onSubmit = async (data: FormOutput) => {
  try {
    await createUser(data);
  } catch (err) {
    setServerError('서버 오류가 발생했습니다'); // 폼 에러 시스템 밖에서 관리
  }
};

// ✅ GOOD: setError로 폼 에러 시스템에 통합
interface ServerValidationError {
  field: string;
  message: string;
}

const onSubmit = form.handleSubmit(async (data) => {
  try {
    await createUser.mutateAsync(data);
    form.reset();
  } catch (error) {
    if (isValidationError(error)) {
      // ✅ 필드별 에러 매핑
      error.errors.forEach(({ field, message }) => {
        if (isFieldName(field)) {
          form.setError(field, { type: 'server', message });
        }
      });
    } else {
      // ✅ 글로벌 에러는 root에 설정
      form.setError('root', {
        type: 'server',
        message: '서버 오류가 발생했습니다. 다시 시도해주세요.',
      });
    }
  }
});
```

```tsx
// ✅ GOOD: 글로벌 에러 표시
function UserForm() {
  const { formState: { errors } } = form;

  return (
    <form onSubmit={onSubmit}>
      {/* ✅ 글로벌 에러 (root) 표시 */}
      {errors.root ? (
        <div role="alert">{errors.root.message}</div>
      ) : null}

      {/* 필드별 에러는 각 필드 옆에 표시 */}
      <input {...form.register('email')} />
      {errors.email ? <p role="alert">{errors.email.message}</p> : null}
    </form>
  );
}
```

---

## 규칙 5: useFieldArray — 동적 필드 배열

> 반복 필드(항목 추가/삭제)는 `useFieldArray`를 사용한다.
> 배열 항목의 key는 useFieldArray가 제공하는 `field.id`를 사용한다 (인덱스 key 금지 — C-03).
> 배열 직접 변경(mutate) 금지 — `append`, `remove`, `move` 등 제공 메서드만 사용한다 (S-01).

```tsx
// 스키마 — 배열 필드 포함
const orderSchema = z.object({
  customerName: z.string().min(1),
  items: z
    .array(
      z.object({
        productName: z.string().min(1, '상품명 필수'),
        quantity: z.string().min(1).pipe(z.coerce.number().min(1, '1개 이상')),
        unitPrice: z.string().pipe(z.coerce.number().min(0)),
      }),
    )
    .min(1, '최소 1개 항목이 필요합니다'),
});

type OrderInput = z.input<typeof orderSchema>;
type OrderOutput = z.output<typeof orderSchema>;
```

```tsx
// ✅ GOOD: useFieldArray 사용
import { useForm, useFieldArray } from 'react-hook-form';

function OrderForm() {
  const form = useForm<OrderInput, unknown, OrderOutput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      items: [{ productName: '', quantity: '', unitPrice: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('customerName')} />

      {fields.map((field, index) => (
        // ✅ field.id를 key로 사용 (C-03: 인덱스 key 금지)
        <div key={field.id}>
          <input {...form.register(`items.${index}.productName`)} />
          {form.formState.errors.items?.[index]?.productName ? (
            <p role="alert">
              {form.formState.errors.items[index].productName.message}
            </p>
          ) : null}

          <input type="number" {...form.register(`items.${index}.quantity`)} />
          <input type="number" {...form.register(`items.${index}.unitPrice`)} />

          {/* ✅ 최소 1개 유지 */}
          {fields.length > 1 ? (
            <button type="button" onClick={() => remove(index)}>삭제</button>
          ) : null}
        </div>
      ))}

      {/* ✅ append로 추가 — 직접 push 금지 (S-01) */}
      <button
        type="button"
        onClick={() => append({ productName: '', quantity: '', unitPrice: '' })}
      >
        항목 추가
      </button>

      {/* 배열 레벨 에러 */}
      {form.formState.errors.items?.root ? (
        <p role="alert">{form.formState.errors.items.root.message}</p>
      ) : null}
    </form>
  );
}
```

```tsx
// ❌ BAD: 배열 직접 조작 (S-01 위반)
const addItem = () => {
  const current = form.getValues('items');
  current.push({ productName: '', quantity: '', unitPrice: '' }); // 직접 변경
  form.setValue('items', current);
};

// ❌ BAD: 인덱스를 key로 사용 (C-03 위반)
{fields.map((field, index) => (
  <div key={index}> {/* 삭제/정렬 시 상태 불일치 */}
    ...
  </div>
))}

// ✅ GOOD: useFieldArray 메서드 사용
append({ productName: '', quantity: '', unitPrice: '' }); // 추가
remove(index);                                            // 삭제
move(fromIndex, toIndex);                                 // 순서 변경
update(index, newValue);                                  // 특정 항목 업데이트
```

---

## 규칙 6: defaultValues 필수 설정

> `defaultValues`를 생략하면 dirty 체크, reset, 조건부 렌더링이 예측 불가능하게 동작한다.
> **모든 필드의 defaultValues를 명시적으로 설정한다.**

```tsx
// ❌ BAD: defaultValues 생략 → isDirty, reset 오동작
const form = useForm<FormInput, unknown, FormOutput>({
  resolver: zodResolver(schema),
  // defaultValues 없음 → 필드 값이 undefined → isDirty 항상 false
});

// ❌ BAD: 일부 필드만 설정 → 누락된 필드는 undefined
const form = useForm<FormInput, unknown, FormOutput>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    // email 누락 → reset() 시 email이 undefined가 됨
  },
});

// ✅ GOOD: 모든 필드 명시
const form = useForm<FormInput, unknown, FormOutput>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    email: '',
    role: 'member',
    bio: '',
  },
});
```

---

## 규칙 7: 언마운트된 필드와 shouldUnregister

> RHF v7+의 `shouldUnregister` 기본값은 `false` — 필드가 언마운트되어도 **값은 form state에 유지**된다.
> 다만 언마운트된 필드는 **유효성 검증이 건너뛰어진다** (내장 validation 스킵).
> `shouldUnregister: true`를 명시하면 언마운트 시 값과 검증 모두 제거된다.

```tsx
// ⚠️ 주의: 값은 유지되지만, 언마운트된 필드의 ref가 없으므로
// focus 이동, DOM 기반 검증은 동작하지 않는다.
function TabbedForm() {
  const [tab, setTab] = useState('basic');
  const form = useForm({
    // shouldUnregister: false (기본값) → 언마운트돼도 값 유지
    defaultValues: { name: '', bio: '' },
  });

  return (
    <>
      {/* ✅ 조건부 렌더: 값은 form state에 유지됨 */}
      {tab === 'basic' ? (
        <input {...form.register('name')} />
      ) : null}
      {tab === 'detail' ? (
        <input {...form.register('bio')} />
      ) : null}
    </>
  );
}

// ✅ GOOD: CSS로 숨기면 ref도 유지 → focus, validation 모두 정상 동작
function TabbedFormWithCSS() {
  const [tab, setTab] = useState('basic');
  const form = useForm({ defaultValues: { name: '', bio: '' } });

  return (
    <>
      {/* display:none으로 숨김 — DOM에 유지되어 ref + 값 모두 보존 */}
      <div style={{ display: tab === 'basic' ? 'block' : 'none' }}>
        <input {...form.register('name')} />
      </div>
      <div style={{ display: tab === 'detail' ? 'block' : 'none' }}>
        <input {...form.register('bio')} />
      </div>
    </>
  );
}

// ⚠️ shouldUnregister: true → 언마운트 시 값 + 검증 모두 제거
const form = useForm({
  shouldUnregister: true, // 명시적으로 설정한 경우에만 값이 사라짐
  defaultValues: { name: '', bio: '' },
});
```

---

## 규칙 8: mode 설정 — 검증 타이밍 선택

> 기본 mode는 `'onSubmit'` — 제출 시에만 검증한다.
> 실시간 피드백이 필요하면 `mode`를 명시적으로 설정한다.

```
mode 옵션:
  'onSubmit'  — 제출 시에만 검증 (기본값, 가장 가벼움)
  'onBlur'    — 필드에서 포커스 아웃 시 검증 (권장: 성능과 UX 균형)
  'onChange'  — 타이핑마다 검증 (리렌더 많음 — 필요한 경우만)
  'onTouched' — 첫 blur 이후부터 onChange로 검증
  'all'       — onBlur + onChange 동시 (가장 무거움)
```

```tsx
// ✅ GOOD: 대부분의 폼에 권장 — 블러 시 검증
const form = useForm<FormInput, unknown, FormOutput>({
  resolver: zodResolver(schema),
  mode: 'onBlur',
  defaultValues: { ... },
});
```

---

## 규칙 9: formState 구독 최적화

> `formState`는 getter 기반 — **실제로 접근(read)한 프로퍼티만 구독**한다.
> 구조 분해 깊이(1단계 vs 2단계)는 상관없다. 핵심은 **렌더 중에 어떤 프로퍼티를 읽었는가**이다.
> 조건부 접근, 이른 return, 콜백 내 접근은 구독이 누락될 수 있으므로 주의한다.

```tsx
// ✅ 둘 다 동일 — errors만 구독됨 (getter가 errors에서만 호출)
const { formState: { errors } } = useForm();
// 또는
const { formState } = useForm();
const { errors } = formState; // 동일하게 errors getter만 호출됨

// ❌ BAD: 불필요한 프로퍼티까지 구조 분해 → 해당 getter 모두 호출 → 전부 구독
const { errors, isDirty, isValid, isSubmitting, touchedFields, dirtyFields } = formState;
// errors만 필요해도 6개 프로퍼티 모두 구독됨

// ✅ GOOD: 필요한 프로퍼티만 구조 분해
const { formState: { errors } } = useForm(); // errors 변경 시에만 리렌더

// ❌ BAD: 콜백 내부에서 접근 → 렌더 시점에 getter가 호출되지 않아 구독 안 됨
const onClick = () => {
  if (formState.isValid) { /* ... */ } // 렌더가 아닌 클릭 시 접근 → 구독 X
};

// ❌ BAD: 이른 return 이후의 프로퍼티 → 구독 누락
function MyForm() {
  const { formState } = useForm();
  if (loading) return <Spinner />;
  const { errors } = formState; // loading=true일 때 errors getter 미호출 → 구독 X
}

// ✅ GOOD: 제출 버튼에서 isSubmitting만 필요한 경우
function SubmitButton({ form }: { form: UseFormReturn }) {
  const { isSubmitting } = form.formState; // isSubmitting만 구독
  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? '저장 중...' : '저장'}
    </button>
  );
}
```
