'use client';

import { TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyCheckoutChartProps {
  data: Array<{ month: string; count: number }>;
}

const CHART_WIDTH = 680;
const CHART_HEIGHT = 280;
const PADDING_X = 34;
const PADDING_Y = 30;
const RANGE_OPTIONS = [3, 6, 12] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

function formatMonthLabel(value: string): string {
  if (!value) {
    return value;
  }

  return value.length > 3 ? value.slice(0, 3) : value;
}

export function MonthlyCheckoutChart({ data }: MonthlyCheckoutChartProps) {
  const [ready, setReady] = useState(false);
  const [range, setRange] = useState<RangeOption>(6);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const visibleData = useMemo(() => {
    if (data.length === 0) {
      return data;
    }

    return data.slice(-Math.min(range, data.length));
  }, [data, range]);

  const points = useMemo(() => {
    if (visibleData.length === 0) {
      return [];
    }

    const maxCount = Math.max(1, ...visibleData.map((item) => item.count));
    const step =
      visibleData.length > 1 ? (CHART_WIDTH - PADDING_X * 2) / (visibleData.length - 1) : 0;

    return visibleData.map((item, index) => {
      const ratio = item.count / maxCount;
      const x = PADDING_X + step * index;
      const y = CHART_HEIGHT - PADDING_Y - ratio * (CHART_HEIGHT - PADDING_Y * 2);
      return { ...item, ratio, x, y };
    });
  }, [visibleData]);

  const linePath = useMemo(() => {
    if (points.length === 0) {
      return '';
    }

    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) {
      return '';
    }

    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(2)} ${(CHART_HEIGHT - PADDING_Y).toFixed(2)} L ${first.x.toFixed(2)} ${(CHART_HEIGHT - PADDING_Y).toFixed(2)} Z`;
  }, [linePath, points]);

  const latest = visibleData[visibleData.length - 1]?.count ?? 0;
  const previous = visibleData[visibleData.length - 2]?.count ?? latest;
  const delta = latest - previous;
  const trendLabel = delta === 0 ? 'Flat from last month' : `${delta > 0 ? '+' : ''}${delta} vs last month`;
  const activeIndex = selectedIndex ?? hoveredIndex;
  const activePoint = activeIndex !== null && activeIndex < points.length ? points[activeIndex] : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="mb-0 space-y-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Monthly checkout trend</CardTitle>
            <CardDescription>
              Line + area diagram based on the immutable circulation ledger.
            </CardDescription>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {trendLabel}
            </div>
            <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1">
              {RANGE_OPTIONS.map((option) => {
                const isActive = range === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setRange(option);
                      setHoveredIndex(null);
                      setSelectedIndex(null);
                    }}
                    className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-[background-color,color,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_-12px_rgba(36,70,232,0.9)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                    }`}
                    aria-pressed={isActive}
                  >
                    {option}M
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {points.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)]/55 p-4 text-sm text-[var(--text-muted)]">
            No checkout events yet.
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,#f8faff_0%,#f0f4ff_100%)] p-2">
              {activePoint ? (
                <div
                  className="pointer-events-none absolute z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs shadow-[0_14px_26px_-20px_rgba(20,26,50,0.5)]"
                  style={{
                    left: `${(activePoint.x / CHART_WIDTH) * 100}%`,
                    top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
                    transform: 'translate(-50%, -125%)',
                  }}
                >
                  <p className="font-semibold text-[var(--text-primary)]">{activePoint.month}</p>
                  <p className="text-[var(--text-secondary)]">{activePoint.count} checkouts</p>
                </div>
              ) : null}
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                role="img"
                aria-label="Monthly checkout trend line chart"
                className="h-56 w-full sm:h-64"
              >
                <defs>
                  <linearGradient id="checkout-area-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#355af7" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#355af7" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {Array.from({ length: 4 }, (_, row) => {
                  const y = PADDING_Y + ((CHART_HEIGHT - PADDING_Y * 2) / 3) * row;
                  return (
                    <line
                      key={`grid-${row}`}
                      x1={PADDING_X}
                      x2={CHART_WIDTH - PADDING_X}
                      y1={y}
                      y2={y}
                      stroke="#dde4fb"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                <path
                  d={areaPath}
                  fill="url(#checkout-area-gradient)"
                  className="transition-opacity duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ opacity: ready ? 1 : 0 }}
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2f4ff0"
                  strokeWidth={3}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={ready ? 0 : 1}
                  className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                />

                {points.map((point, index) => (
                  <g
                    key={`point-${point.month}-${index}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setSelectedIndex((current) => (current === index ? null : index))}
                    style={{
                      opacity: ready ? 1 : 0,
                      transform: ready ? 'translateY(0px)' : 'translateY(8px)',
                      transformOrigin: `${point.x}px ${point.y}px`,
                      transition:
                        'opacity 620ms cubic-bezier(0.22,1,0.36,1), transform 620ms cubic-bezier(0.22,1,0.36,1)',
                      transitionDelay: `${index * 90}ms`,
                    }}
                  >
                    <circle cx={point.x} cy={point.y} r={12} fill="transparent" className="cursor-pointer" />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={activeIndex === index ? 8 : 6}
                      fill="#e5ebff"
                      className="transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={activeIndex === index ? 4.5 : 3.5}
                      fill="#2f4ff0"
                      className="transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                  </g>
                ))}
              </svg>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {activePoint
                ? 'Tip: tap the same point again to close the tooltip.'
                : 'Hover or tap a point to inspect monthly values.'}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {points.map((point, index) => (
                <div
                  key={`label-${point.month}-${index}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedIndex((current) => (current === index ? null : index))}
                  className={`cursor-pointer rounded-lg border px-2 py-2 text-center transition-[transform,border-color,box-shadow] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    activeIndex === index
                      ? 'border-[#bfcbff] bg-[#f6f8ff] shadow-[0_12px_24px_-20px_rgba(43,76,231,0.72)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:-translate-y-0.5 hover:border-[#c7d2ff]'
                  }`}
                  style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translateY(0px)' : 'translateY(8px)',
                    transition:
                      'opacity 560ms cubic-bezier(0.22,1,0.36,1), transform 560ms cubic-bezier(0.22,1,0.36,1)',
                    transitionDelay: `${120 + index * 80}ms`,
                  }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {formatMonthLabel(point.month)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)]">
                    <TrendingUp className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    {point.count}
                  </p>
                </div>
              ))}
            </div>

            {visibleData.length < Math.min(range, 12) ? (
              <p className="text-[11px] text-[var(--text-muted)]">
                Showing {visibleData.length} month{visibleData.length === 1 ? '' : 's'} of available data.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
