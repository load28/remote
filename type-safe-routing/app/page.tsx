import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <nav className="nav">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/products">Products</Link>
          </li>
          <li>
            <Link href="/search">Search</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
        </ul>
      </nav>

      <div className="container">
        <h1>Type-Safe Routing with nuqs</h1>

        <div className="card mb-2">
          <h2>nuqs를 사용한 타입 세이프 라우팅 시스템</h2>
          <p className="mb-1">
            이 프로젝트는 Next.js App Router에서 nuqs 라이브러리를 사용하여
            타입 세이프한 쿼리 파라미터 관리 시스템을 구현합니다.
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <h3>상품 검색 페이지</h3>
            <p className="mb-1">
              카테고리, 가격 범위, 정렬 옵션 등 다양한 필터를 URL로 관리합니다.
            </p>
            <Link href="/products" className="btn btn-primary">
              Products 페이지로 이동
            </Link>
          </div>

          <div className="card">
            <h3>일반 검색 페이지</h3>
            <p className="mb-1">
              날짜 필터, JSON 객체 필터 등 복잡한 쿼리 파라미터를 관리합니다.
            </p>
            <Link href="/search" className="btn btn-primary">
              Search 페이지로 이동
            </Link>
          </div>

          <div className="card">
            <h3>대시보드 페이지</h3>
            <p className="mb-1">
              보기 모드, 시간 범위, 메트릭 선택 등을 URL로 공유할 수 있습니다.
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard 페이지로 이동
            </Link>
          </div>
        </div>

        <div className="card mb-2" style={{ marginTop: "2rem" }}>
          <h3>주요 기능</h3>
          <ul style={{ marginLeft: "1.5rem", lineHeight: "1.8" }}>
            <li>
              <strong>타입 세이프:</strong> TypeScript를 통한 완전한 타입 추론
            </li>
            <li>
              <strong>직렬화/역직렬화:</strong> 복잡한 객체를 URL 쿼리로 변환
            </li>
            <li>
              <strong>커스텀 파서:</strong> 날짜, 숫자 범위, JSON 등 다양한 타입 지원
            </li>
            <li>
              <strong>URL 공유:</strong> 현재 상태를 URL로 공유 가능
            </li>
            <li>
              <strong>서버/클라이언트 지원:</strong> RSC와 클라이언트 컴포넌트 모두 지원
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
