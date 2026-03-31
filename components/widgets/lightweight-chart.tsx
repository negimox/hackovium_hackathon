"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import {
    createChart,
    CandlestickSeries,
    AreaSeries,
    HistogramSeries,
    ColorType,
    CrosshairMode,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type SingleValueData,
    type Time,
} from "lightweight-charts";
import { BarChart3, TrendingUp, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OHLCVBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface LightweightChartProps {
    marketType: string;    // nse, bse, us, crypto, commodity
    symbol: string;        // RELIANCE, 500002, AAPL, BTC, GOLD
    currentPrice?: number;
    change?: number;
}

type ChartMode = "candlestick" | "area";

interface TimeRange {
    label: string;
    period: string;
    interval: string;
}

const TIME_RANGES: TimeRange[] = [
    { label: "1D", period: "1d", interval: "5m" },
    { label: "1W", period: "5d", interval: "15m" },
    { label: "1M", period: "1mo", interval: "1h" },
    { label: "3M", period: "3mo", interval: "1d" },
    { label: "1Y", period: "1y", interval: "1d" },
    { label: "All", period: "max", interval: "1wk" },
];

// ─── Theme ────────────────────────────────────────────────────────────────────

const CHART_COLORS = {
    background: "#0a0a0a",
    textColor: "#9ca3af",
    gridColor: "rgba(255, 255, 255, 0.04)",
    crosshairColor: "rgba(255, 255, 255, 0.15)",
    upColor: "#22c55e",
    downColor: "#ef4444",
    upAreaTop: "rgba(34, 197, 94, 0.25)",
    upAreaBottom: "rgba(34, 197, 94, 0.01)",
    downAreaTop: "rgba(239, 68, 68, 0.25)",
    downAreaBottom: "rgba(239, 68, 68, 0.01)",
    volumeUp: "rgba(34, 197, 94, 0.15)",
    volumeDown: "rgba(239, 68, 68, 0.15)",
};

// ─── Component ────────────────────────────────────────────────────────────────

function LightweightChartWidget({ marketType, symbol, currentPrice, change }: LightweightChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [chartMode, setChartMode] = useState<ChartMode>("candlestick");
    const [activeRange, setActiveRange] = useState<number>(4); // default 1Y
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bars, setBars] = useState<OHLCVBar[]>([]);

    // ─── Fetch Data ───────────────────────────────────────────────────────────

    const fetchData = useCallback(async (rangeIdx: number) => {
        const range = TIME_RANGES[rangeIdx];
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/watchlist/history/${marketType}/${symbol}?period=${range.period}&interval=${range.interval}`
            );
            const json = await res.json();

            if (json.error && (!json.bars || json.bars.length === 0)) {
                setError("No data available for this symbol");
                setBars([]);
            } else if (json.bars && json.bars.length > 0) {
                setBars(json.bars);
            } else {
                setError("No historical data found");
                setBars([]);
            }
        } catch (err) {
            console.error("Chart data fetch error:", err);
            setError("Failed to load chart data");
            setBars([]);
        } finally {
            setLoading(false);
        }
    }, [marketType, symbol]);

    // Fetch on mount and range change
    useEffect(() => {
        fetchData(activeRange);
    }, [activeRange, fetchData]);

    // ─── Create / Update Chart ────────────────────────────────────────────────

    useEffect(() => {
        if (!chartContainerRef.current || bars.length === 0) return;

        // Clean up previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
        }

        const container = chartContainerRef.current;

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: CHART_COLORS.background },
                textColor: CHART_COLORS.textColor,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: CHART_COLORS.gridColor },
                horzLines: { color: CHART_COLORS.gridColor },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: CHART_COLORS.crosshairColor,
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1f2937",
                },
                horzLine: {
                    color: CHART_COLORS.crosshairColor,
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1f2937",
                },
            },
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.08)",
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.08)",
                timeVisible: activeRange <= 2, // show time for 1D, 1W, 1M
                secondsVisible: false,
            },
            handleScroll: { vertTouchDrag: false },
        });

        chartRef.current = chart;

        // Determine if the overall trend is up or down
        const isUpTrend = bars.length > 1 && bars[bars.length - 1].close >= bars[0].close;

        // ─── Main Series ──────────────────────────────────────────────────

        if (chartMode === "candlestick") {
            const series = chart.addSeries(CandlestickSeries, {
                upColor: CHART_COLORS.upColor,
                downColor: CHART_COLORS.downColor,
                borderUpColor: CHART_COLORS.upColor,
                borderDownColor: CHART_COLORS.downColor,
                wickUpColor: CHART_COLORS.upColor,
                wickDownColor: CHART_COLORS.downColor,
            });

            const candleData: CandlestickData<Time>[] = bars.map(b => ({
                time: b.time as Time,
                open: b.open,
                high: b.high,
                low: b.low,
                close: b.close,
            }));
            series.setData(candleData);
            mainSeriesRef.current = series;
        } else {
            const series = chart.addSeries(AreaSeries, {
                lineColor: isUpTrend ? CHART_COLORS.upColor : CHART_COLORS.downColor,
                topColor: isUpTrend ? CHART_COLORS.upAreaTop : CHART_COLORS.downAreaTop,
                bottomColor: isUpTrend ? CHART_COLORS.upAreaBottom : CHART_COLORS.downAreaBottom,
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                crosshairMarkerBackgroundColor: isUpTrend ? CHART_COLORS.upColor : CHART_COLORS.downColor,
            });

            const areaData: SingleValueData<Time>[] = bars.map(b => ({
                time: b.time as Time,
                value: b.close,
            }));
            series.setData(areaData);
            mainSeriesRef.current = series;
        }

        // ─── Volume Series ────────────────────────────────────────────────

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
        });

        chart.priceScale("volume").applyOptions({
            scaleMargins: {
                top: 0.85,
                bottom: 0,
            },
        });

        const volumeData = bars.map(b => ({
            time: b.time as Time,
            value: b.volume,
            color: b.close >= b.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
        }));
        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;

        // Fit content
        chart.timeScale().fitContent();

        // ─── Resize Observer ──────────────────────────────────────────────

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                chart.applyOptions({ width, height });
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, [bars, chartMode, activeRange]);

    // ─── Range Change Handler ─────────────────────────────────────────────

    const handleRangeChange = (idx: number) => {
        setActiveRange(idx);
    };

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full w-full">
            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                {/* Time Range Buttons */}
                <div className="flex items-center gap-1">
                    {TIME_RANGES.map((range, idx) => (
                        <button
                            key={range.label}
                            onClick={() => handleRangeChange(idx)}
                            className={`
                                px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                                ${activeRange === idx
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                                }
                            `}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>

                {/* Chart Type Toggle */}
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
                    <button
                        onClick={() => setChartMode("candlestick")}
                        className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
                            ${chartMode === "candlestick"
                                ? "bg-white/[0.08] text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }
                        `}
                        title="Candlestick"
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Candles</span>
                    </button>
                    <button
                        onClick={() => setChartMode("area")}
                        className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
                            ${chartMode === "area"
                                ? "bg-white/[0.08] text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }
                        `}
                        title="Area"
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Area</span>
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative min-h-0">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Loading chart…</span>
                        </div>
                    </div>
                )}

                {error && !loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <BarChart3 className="w-10 h-10 opacity-20" />
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={() => fetchData(activeRange)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                <div
                    ref={chartContainerRef}
                    className="w-full h-full"
                    style={{ minHeight: "100%" }}
                />
            </div>

            {/* TradingView Attribution (required by license) */}
            <div className="px-4 py-1.5 border-t border-white/[0.06] flex items-center justify-end">
                <a
                    href="https://www.tradingview.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                >
                    Charts by TradingView
                </a>
            </div>
        </div>
    );
}

export default memo(LightweightChartWidget);
