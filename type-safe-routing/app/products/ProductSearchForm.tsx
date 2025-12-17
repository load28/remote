"use client";

import { useProductSearchParams, productSortOptions } from "@/shared/routing";
import { useState, useTransition } from "react";

export function ProductSearchForm() {
  const [params, setParams] = useProductSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localQ, setLocalQ] = useState(params.q);
  const [localMinPrice, setLocalMinPrice] = useState(String(params.priceRange.min));
  const [localMaxPrice, setLocalMaxPrice] = useState(String(params.priceRange.max));

  const handleSearch = () => {
    startTransition(() => {
      setParams({
        q: localQ,
        priceRange: {
          min: Number(localMinPrice) || 0,
          max: Number(localMaxPrice) || 1000000,
        },
        page: 1, // 검색 시 첫 페이지로 이동
      });
    });
  };

  const handleCategoryToggle = (category: string) => {
    startTransition(() => {
      const newCategories = params.categories.includes(category)
        ? params.categories.filter((c) => c !== category)
        : [...params.categories, category];
      setParams({ categories: newCategories, page: 1 });
    });
  };

  const handleSortChange = (sort: typeof params.sort) => {
    startTransition(() => {
      setParams({ sort });
    });
  };

  const handleInStockToggle = () => {
    startTransition(() => {
      setParams({ inStock: !params.inStock });
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      setParams({ page });
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setParams({
        q: "",
        categories: [],
        priceRange: { min: 0, max: 1000000 },
        sort: "newest",
        page: 1,
        limit: 20,
        inStock: false,
      });
      setLocalQ("");
      setLocalMinPrice("0");
      setLocalMaxPrice("1000000");
    });
  };

  const categories = ["electronics", "clothing", "books", "home", "sports"];

  return (
    <div style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="form-group">
        <label>검색어</label>
        <div className="flex flex-gap">
          <input
            type="text"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="검색어를 입력하세요"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>카테고리</label>
        <div className="flex flex-gap" style={{ flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${params.categories.includes(cat) ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleCategoryToggle(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>가격 범위</label>
        <div className="flex flex-gap" style={{ alignItems: "center" }}>
          <input
            type="number"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            placeholder="최소"
            style={{ width: "150px" }}
          />
          <span>~</span>
          <input
            type="number"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            placeholder="최대"
            style={{ width: "150px" }}
          />
          <button className="btn btn-secondary" onClick={handleSearch}>
            적용
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>정렬</label>
        <select
          value={params.sort}
          onChange={(e) => handleSortChange(e.target.value as typeof params.sort)}
          style={{ width: "200px" }}
        >
          {productSortOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "price_asc" && "가격 낮은순"}
              {opt === "price_desc" && "가격 높은순"}
              {opt === "newest" && "최신순"}
              {opt === "popular" && "인기순"}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={params.inStock}
            onChange={handleInStockToggle}
            style={{ marginRight: "0.5rem" }}
          />
          재고 있는 상품만 표시
        </label>
      </div>

      <div className="form-group">
        <label>페이지네이션</label>
        <div className="flex flex-gap">
          <button
            className="btn btn-secondary"
            disabled={params.page <= 1}
            onClick={() => handlePageChange(params.page - 1)}
          >
            이전
          </button>
          <span style={{ alignSelf: "center" }}>
            {params.page} 페이지 (페이지당 {params.limit}개)
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(params.page + 1)}
          >
            다음
          </button>
        </div>
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
