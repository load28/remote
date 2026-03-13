---
tags: [react-hook-form, form, validation, zod, controlled, custom-hook, generic]
rules: [S-13, T-14, T-04, A-05, A-09]
description: React Hook Form 폼 패턴 — Zod input/output 타입 분리, register vs Controller 사용 기준
---

## 규칙 1: Zod input/output 타입 분리

> HTML 폼 입력은 항상 `string`이다. 그러나 서버에 보내는 값은 `number`, `Date`, `boolean` 등
> 다양한 타입이다. `z.infer`(= `z.output`)만 사용하면 폼 입력 타입과 제출 타입이 불일치한다.

```tsx
// ❌ BAD: z.infer만 사용 → 폼 입력 시 string인데 타입은 number
const schema = z.object({
  age: z.coerce.number().min(1).max(120),
  birthDate: z.coerce.date(),
});

type FormValues = z.infer<typeof schema>;
// → { age: number; birthDate: Date }
// → 하지만 <input> 값은 string → register 시 타입 불일치

// ✅ GOOD: z.input과 z.output을 분리하여 사용
const schema = z.object({
  age: z.coerce.number().min(1).max(120),
  birthDate: z.coerce.date(),
  isAgree: z.coerce.boolean(),
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

4. 다른 필드 값에 따라 동적으로 변하는가?
   → YES → Controller 사용 (watch + Controller 조합)
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
