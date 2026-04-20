"use client";

import { useEffect, useState } from "react";
import { getMetrics, subscribeMetrics } from "./search-api";

export function useNetworkMetrics() {
  const [metrics, setMetrics] = useState(getMetrics);
  useEffect(() => subscribeMetrics(() => setMetrics({ ...getMetrics() })), []);
  return metrics;
}
