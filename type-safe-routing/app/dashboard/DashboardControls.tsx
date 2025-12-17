"use client";

import {
  useDashboardParams,
  dashboardViewOptions,
  timeRangeOptions,
} from "@/shared/routing";
import { useTransition } from "react";

export function DashboardControls() {
  const [params, setParams] = useDashboardParams();
  const [isPending, startTransition] = useTransition();

  const availableMetrics = [
    "revenue",
    "users",
    "orders",
    "pageviews",
    "conversions",
  ];

  const handleViewChange = (view: typeof params.view) => {
    startTransition(() => {
      setParams({ view });
    });
  };

  const handleTimeRangeChange = (timeRange: typeof params.timeRange) => {
    startTransition(() => {
      setParams({ timeRange });
    });
  };

  const handleMetricToggle = (metric: string) => {
    startTransition(() => {
      const newMetrics = params.metrics.includes(metric)
        ? params.metrics.filter((m) => m !== metric)
        : [...params.metrics, metric];
      setParams({ metrics: newMetrics.length > 0 ? newMetrics : ["revenue"] });
    });
  };

  const handleCompareToggle = () => {
    startTransition(() => {
      setParams({ compare: !params.compare });
    });
  };

  const handleDetailOpen = (id: string | null) => {
    startTransition(() => {
      setParams({ detailId: id });
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setParams({
        view: "grid",
        timeRange: "month",
        metrics: ["revenue", "users"],
        compare: false,
        detailId: null,
      });
    });
  };

  return (
    <div style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="form-group">
        <label>보기 모드</label>
        <div className="flex flex-gap">
          {dashboardViewOptions.map((view) => (
            <button
              key={view}
              className={`btn ${params.view === view ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleViewChange(view)}
            >
              {view === "grid" && "그리드"}
              {view === "list" && "리스트"}
              {view === "table" && "테이블"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>시간 범위</label>
        <div className="flex flex-gap" style={{ flexWrap: "wrap" }}>
          {timeRangeOptions.map((range) => (
            <button
              key={range}
              className={`btn ${params.timeRange === range ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range === "today" && "오늘"}
              {range === "week" && "이번 주"}
              {range === "month" && "이번 달"}
              {range === "quarter" && "이번 분기"}
              {range === "year" && "올해"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>메트릭 선택</label>
        <div className="flex flex-gap" style={{ flexWrap: "wrap" }}>
          {availableMetrics.map((metric) => (
            <button
              key={metric}
              className={`btn ${params.metrics.includes(metric) ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleMetricToggle(metric)}
            >
              {metric === "revenue" && "매출"}
              {metric === "users" && "사용자"}
              {metric === "orders" && "주문"}
              {metric === "pageviews" && "페이지뷰"}
              {metric === "conversions" && "전환"}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          선택됨:{" "}
          {params.metrics.map((m) => (
            <span key={m} className="badge badge-blue" style={{ marginRight: "0.5rem" }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={params.compare}
            onChange={handleCompareToggle}
            style={{ marginRight: "0.5rem" }}
          />
          비교 모드 활성화
        </label>
        {params.compare && (
          <span className="badge badge-green" style={{ marginLeft: "0.5rem" }}>
            이전 기간과 비교 중
          </span>
        )}
      </div>

      <div className="form-group">
        <label>상세 패널</label>
        <div className="flex flex-gap">
          <button
            className={`btn ${params.detailId === "metric-revenue" ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              handleDetailOpen(
                params.detailId === "metric-revenue" ? null : "metric-revenue"
              )
            }
          >
            매출 상세
          </button>
          <button
            className={`btn ${params.detailId === "metric-users" ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              handleDetailOpen(
                params.detailId === "metric-users" ? null : "metric-users"
              )
            }
          >
            사용자 상세
          </button>
          <button
            className={`btn ${params.detailId === "metric-orders" ? "btn-primary" : "btn-secondary"}`}
            onClick={() =>
              handleDetailOpen(
                params.detailId === "metric-orders" ? null : "metric-orders"
              )
            }
          >
            주문 상세
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
