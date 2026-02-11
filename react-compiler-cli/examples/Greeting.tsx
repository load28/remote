/**
 * 블로그(https://www.load28.com/posts/react-compiler) 예제와 유사한
 * 단순 Greeting 컴포넌트.
 *
 * 컴파일러가 name prop 의존성을 추적하여
 * JSX를 하나의 reactive scope로 감싸는지 확인.
 */
export function Greeting({ name }: { name: string }) {
  return (
    <div>
      <p>{name}</p>
    </div>
  );
}
