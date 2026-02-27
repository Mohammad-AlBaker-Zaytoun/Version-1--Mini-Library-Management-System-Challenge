'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CirculationBreakdownChartProps {
  totalBooks: number;
  activeLoans: number;
  overdueCount: number;
}

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  subtleColor: string;
}

const RADIUS = 76;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function CirculationBreakdownChart({
  totalBooks,
  activeLoans,
  overdueCount,
}: CirculationBreakdownChartProps) {
  const [ready, setReady] = useState(false);
  const [hoveredSegmentKey, setHoveredSegmentKey] = useState<string | null>(null);
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const available = Math.max(0, totalBooks - activeLoans);
  const onTimeLoans = Math.max(0, activeLoans - overdueCount);
  const boundedOverdue = Math.max(0, Math.min(overdueCount, activeLoans));

  const segments = useMemo<Segment[]>(
    () => [
      {
        key: 'available',
        label: 'Available',
        value: available,
        color: '#2f56ef',
        subtleColor: 'bg-[#eef2ff]',
      },
      {
        key: 'on-time',
        label: 'On-time loans',
        value: onTimeLoans,
        color: '#0f9f6e',
        subtleColor: 'bg-[#e5f8f1]',
      },
      {
        key: 'overdue',
        label: 'Overdue',
        value: boundedOverdue,
        color: '#db4f3f',
        subtleColor: 'bg-[#fee9e7]',
      },
    ],
    [available, boundedOverdue, onTimeLoans],
  );

  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.value, 0));
  const utilization = clampPercent((activeLoans / Math.max(1, totalBooks)) * 100);
  const segmentsWithStats = useMemo(() => {
    let accumulated = 0;

    return segments.map((segment) => {
      const fraction = segment.value / total;
      const pct = clampPercent(fraction * 100);
      const dash = CIRCUMFERENCE * fraction;
      const dashOffset = -accumulated * CIRCUMFERENCE;
      accumulated += fraction;

      return {
        ...segment,
        pct,
        dash,
        dashOffset,
      };
    });
  }, [segments, total]);

  const activeKey = selectedSegmentKey ?? hoveredSegmentKey;
  const activeSegment = activeKey
    ? segmentsWithStats.find((segment) => segment.key === activeKey) ?? null
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="mb-0">
        <CardTitle>Circulation composition</CardTitle>
        <CardDescription>Donut diagram for availability, active loans, and overdue pressure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mx-auto grid max-w-xs place-items-center sm:max-w-none sm:grid-cols-[auto_1fr] sm:items-center sm:gap-5">
          <div className="relative h-48 w-48">
            {activeSegment ? (
              <div className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1.5 text-center text-xs shadow-[0_14px_26px_-20px_rgba(20,26,50,0.5)]">
                <p className="font-semibold text-[var(--text-primary)]">{activeSegment.label}</p>
                <p className="text-[var(--text-secondary)]">
                  {activeSegment.value} items ({activeSegment.pct}%)
                </p>
              </div>
            ) : null}

            <svg
              viewBox="0 0 220 220"
              className="h-48 w-48"
              role="img"
              aria-label="Book circulation composition donut chart"
            >
              <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#e8edff" strokeWidth="20" />
              {segmentsWithStats.map((segment, index) => {
                const isActive = activeSegment?.key === segment.key;
                return (
                  <circle
                    key={segment.key}
                    cx="110"
                    cy="110"
                    r={RADIUS}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={isActive ? 24 : 20}
                    strokeLinecap="round"
                    strokeDasharray={`${ready ? segment.dash : 0} ${CIRCUMFERENCE}`}
                    strokeDashoffset={segment.dashOffset}
                    transform="rotate(-90 110 110)"
                    className="cursor-pointer transition-[stroke-width,filter] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    onMouseEnter={() => setHoveredSegmentKey(segment.key)}
                    onMouseLeave={() => setHoveredSegmentKey(null)}
                    onClick={() =>
                      setSelectedSegmentKey((current) =>
                        current === segment.key ? null : segment.key,
                      )
                    }
                    style={{
                      transition:
                        'stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1), opacity 520ms cubic-bezier(0.22,1,0.36,1), stroke-width 360ms cubic-bezier(0.22,1,0.36,1), filter 360ms cubic-bezier(0.22,1,0.36,1)',
                      transitionDelay: `${index * 140}ms`,
                      opacity: ready ? (isActive ? 1 : 0.92) : 0.6,
                      filter: isActive ? 'drop-shadow(0 0 7px rgba(36,70,232,0.35))' : 'none',
                    }}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-[var(--surface-card)]/95 px-4 py-2 text-center shadow-[0_8px_20px_-16px_rgba(20,26,50,0.45)] backdrop-blur-[1px]">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Utilization
                </p>
                <p className="text-3xl leading-none font-bold text-[var(--text-primary)]">
                  {utilization}%
                </p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2">
            {segmentsWithStats.map((segment, index) => {
              const isActive = activeSegment?.key === segment.key;
              return (
                <div
                  key={segment.key}
                  onMouseEnter={() => setHoveredSegmentKey(segment.key)}
                  onMouseLeave={() => setHoveredSegmentKey(null)}
                  onClick={() =>
                    setSelectedSegmentKey((current) => (current === segment.key ? null : segment.key))
                  }
                  className={`cursor-pointer rounded-xl border px-3 py-2 transition-[border-color,box-shadow,transform] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${segment.subtleColor} ${
                    isActive
                      ? 'border-[#c5d1ff] shadow-[0_14px_24px_-20px_rgba(31,52,166,0.72)]'
                      : 'border-[var(--border-subtle)] hover:-translate-y-0.5 hover:border-[#cfd7fb]'
                  }`}
                  style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translateX(0px)' : 'translateX(10px)',
                    transition:
                      'opacity 540ms cubic-bezier(0.22,1,0.36,1), transform 540ms cubic-bezier(0.22,1,0.36,1)',
                    transitionDelay: `${120 + index * 100}ms`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{segment.label}</p>
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      {segment.value} ({segment.pct}%)
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/70">
                    <div
                      className="h-1.5 rounded-full transition-[width] duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        width: ready ? `${Math.max(4, segment.pct)}%` : '0%',
                        backgroundColor: segment.color,
                        transitionDelay: `${220 + index * 90}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {activeSegment
            ? 'Tap the highlighted segment again to dismiss the tooltip.'
            : 'Hover or tap a donut slice (or its legend row) to inspect exact values.'}
        </p>
      </CardContent>
    </Card>
  );
}
