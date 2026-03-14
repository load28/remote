---
tags: [controlled, uncontrolled, discriminated-union, component, ref]
rules: [S-13, T-14]
description: Controlled/Uncontrolled 명확한 택일 — discriminated union 분리
---

```tsx
// shared/components/FormField.tsx
// ✅ controlled / uncontrolled를 discriminated union으로 분리 (S-13, T-14)

export type FormFieldProps =
  | {
      mode: 'controlled';
      value: string;
      onChange: (value: string) => void;
    }
  | {
      mode: 'uncontrolled';
      defaultValue?: string;
      inputRef?: React.RefObject<HTMLInputElement>;
    };

export function FormField(props: FormFieldProps) {
  if (props.mode === 'controlled') {
    return (
      <input
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      defaultValue={props.defaultValue}
      ref={props.inputRef}
    />
  );
}
```
