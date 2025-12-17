"use client";

import { useSearchParams, searchTypeOptions } from "@/shared/routing";
import { useState, useTransition } from "react";

export function SearchForm() {
  const [params, setParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localQuery, setLocalQuery] = useState(params.query);
  const [localFromDate, setLocalFromDate] = useState(
    params.from?.toISOString().split("T")[0] ?? ""
  );
  const [localToDate, setLocalToDate] = useState(
    params.to?.toISOString().split("T")[0] ?? ""
  );

  const handleSearch = () => {
    startTransition(() => {
      setParams({
        query: localQuery,
        from: localFromDate ? new Date(localFromDate) : null,
        to: localToDate ? new Date(localToDate) : null,
        page: 1,
      });
    });
  };

  const handleTypeChange = (type: typeof params.type) => {
    startTransition(() => {
      setParams({ type, page: 1 });
    });
  };

  const handleAddFilter = (key: string, value: unknown) => {
    startTransition(() => {
      setParams({
        filters: {
          ...params.filters,
          [key]: value,
        },
      });
    });
  };

  const handleRemoveFilter = (key: string) => {
    startTransition(() => {
      if (params.filters) {
        const newFilters = { ...params.filters };
        delete newFilters[key as keyof typeof newFilters];
        setParams({
          filters: Object.keys(newFilters).length > 0 ? newFilters : null,
        });
      }
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setParams({
        query: "",
        type: "all",
        from: null,
        to: null,
        filters: null,
        page: 1,
      });
      setLocalQuery("");
      setLocalFromDate("");
      setLocalToDate("");
    });
  };

  return (
    <div style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="form-group">
        <label>검색어</label>
        <div className="flex flex-gap">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>검색 유형</label>
        <div className="flex flex-gap">
          {searchTypeOptions.map((type) => (
            <button
              key={type}
              className={`btn ${params.type === type ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleTypeChange(type)}
            >
              {type === "all" && "전체"}
              {type === "products" && "상품"}
              {type === "users" && "사용자"}
              {type === "posts" && "게시글"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>날짜 범위</label>
        <div className="flex flex-gap" style={{ alignItems: "center" }}>
          <input
            type="date"
            value={localFromDate}
            onChange={(e) => setLocalFromDate(e.target.value)}
            style={{ width: "180px" }}
          />
          <span>~</span>
          <input
            type="date"
            value={localToDate}
            onChange={(e) => setLocalToDate(e.target.value)}
            style={{ width: "180px" }}
          />
          <button className="btn btn-secondary" onClick={handleSearch}>
            적용
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>고급 필터 (JSON 객체)</label>
        <div className="flex flex-gap" style={{ flexWrap: "wrap" }}>
          <button
            className={`btn ${params.filters?.verified ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              params.filters?.verified
                ? handleRemoveFilter("verified")
                : handleAddFilter("verified", true)
            }
          >
            인증된 사용자만
          </button>
          <button
            className={`btn ${params.filters?.minRating ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              params.filters?.minRating
                ? handleRemoveFilter("minRating")
                : handleAddFilter("minRating", 4)
            }
          >
            평점 4점 이상
          </button>
          <button
            className={`btn ${params.filters?.tags?.length ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              params.filters?.tags?.length
                ? handleRemoveFilter("tags")
                : handleAddFilter("tags", ["추천", "베스트"])
            }
          >
            추천 태그
          </button>
        </div>
        {params.filters && (
          <div className="code" style={{ marginTop: "0.5rem" }}>
            <pre>{JSON.stringify(params.filters, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="flex flex-gap" style={{ marginTop: "1rem" }}>
        <button className="btn btn-secondary" onClick={handleReset}>
          초기화
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("URL이 클립보드에 복사되었습니다!");
          }}
        >
          URL 복사
        </button>
      </div>
    </div>
  );
}
