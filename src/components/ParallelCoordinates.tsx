import { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { AxisLeft } from '@visx/axis';
import { useDesignStore } from '../store/useDesignStore';
import { getColorForValue } from '../utils/colorScale';
import { Card } from './ui/card';

export function ParallelCoordinates() {
  const loadedFiles = useDesignStore(state => state.loadedFiles);
  const selectedId = useDesignStore(state => state.selectedId);
  const hoveredId = useDesignStore(state => state.hoveredId);
  const colorByMetric = useDesignStore(state => state.colorByMetric);
  const setHoveredId = useDesignStore(state => state.setHoveredId);
  const setSelectedId = useDesignStore(state => state.setSelectedId);

  const variants = loadedFiles?.jsonData || [];

  // Transform to flat format for easier rendering
  const pcpData = useMemo(() => {
    return variants.map(v => {
      const dataPoint: Record<string, string | number> = { id: v.id };
      v.input.forEach(p => {
        dataPoint[p["col-id"]] = p.value;
      });
      v.output.forEach(p => {
        dataPoint[p["col-id"]] = p.value;
      });
      return dataPoint;
    });
  }, [variants]);

  // Get all axis keys (inputs + outputs)
  const axisKeys = useMemo(() => {
    if (variants.length === 0) return [];
    const first = variants[0];
    return [
      ...first.input.map(p => p["col-id"]),
      ...first.output.map(p => p["col-id"])
    ];
  }, [variants]);

  // Get labels for axes
  const axisLabels = useMemo(() => {
    if (variants.length === 0) return {};
    const first = variants[0];
    const labels: Record<string, string> = {};
    first.input.forEach(p => {
      labels[p["col-id"]] = p.label;
    });
    first.output.forEach(p => {
      labels[p["col-id"]] = p.label;
    });
    return labels;
  }, [variants]);

  // Dimensions
  const width = Math.min(1400, window.innerWidth - 100);
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 40, left: 120 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // X scale (horizontal position of axes)
  const xScale = scalePoint({
    domain: axisKeys,
    range: [0, innerWidth],
    padding: 0.5,
  });

  // Y scales (one per axis)
  const yScales = useMemo(() => {
    const scales: Record<string, any> = {};

    axisKeys.forEach(key => {
      const values = pcpData.map(d => d[key] as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * 0.1 || 1; // Add 10% padding or 1 if min=max

      scales[key] = scaleLinear({
        domain: [min - padding, max + padding],
        range: [innerHeight, 0],
      });
    });

    return scales;
  }, [axisKeys, pcpData, innerHeight]);

  // Line color logic
  const getLineColor = useCallback((dataPoint: Record<string, string | number>) => {
    if (dataPoint.id === selectedId) return '#000000';  // Bold black
    if (dataPoint.id === hoveredId) return '#3B82F6';   // Blue

    if (colorByMetric && dataPoint[colorByMetric] !== undefined) {
      const value = dataPoint[colorByMetric] as number;
      const scale = yScales[colorByMetric];
      if (scale) {
        const domain = scale.domain();
        const normalized = (value - domain[0]) / (domain[1] - domain[0]);
        return getColorForValue(normalized);
      }
    }

    return '#94A3B8';  // Slate-400
  }, [selectedId, hoveredId, colorByMetric, yScales]);

  // Generate SVG path
  const getLinePath = useCallback((dataPoint: Record<string, string | number>) => {
    return axisKeys.map((key, i) => {
      const x = xScale(key) || 0;
      const y = yScales[key](dataPoint[key] as number);
      return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');
  }, [axisKeys, xScale, yScales]);

  if (variants.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No data loaded</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Parallel Coordinates</h2>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Lines - render non-selected first, then selected/hovered on top */}
          <Group>
            {/* Background lines */}
            {pcpData.filter(d => d.id !== selectedId && d.id !== hoveredId).map((dataPoint) => (
              <path
                key={dataPoint.id as string}
                d={getLinePath(dataPoint)}
                stroke={getLineColor(dataPoint)}
                strokeWidth={1}
                fill="none"
                opacity={0.3}
                onMouseEnter={() => setHoveredId(dataPoint.id as string)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(dataPoint.id as string)}
                className="cursor-pointer transition-opacity hover:opacity-70"
              />
            ))}
            {/* Hovered line */}
            {pcpData.filter(d => d.id === hoveredId && d.id !== selectedId).map((dataPoint) => (
              <path
                key={`hovered-${dataPoint.id}`}
                d={getLinePath(dataPoint)}
                stroke={getLineColor(dataPoint)}
                strokeWidth={2}
                fill="none"
                opacity={0.9}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(dataPoint.id as string)}
                className="cursor-pointer"
                pointerEvents="stroke"
                strokeLinecap="round"
              />
            ))}
            {/* Selected line */}
            {pcpData.filter(d => d.id === selectedId).map((dataPoint) => (
              <path
                key={`selected-${dataPoint.id}`}
                d={getLinePath(dataPoint)}
                stroke={getLineColor(dataPoint)}
                strokeWidth={3}
                fill="none"
                opacity={1}
                onClick={() => setSelectedId(null)}
                className="cursor-pointer"
                pointerEvents="stroke"
                strokeLinecap="round"
              />
            ))}
          </Group>

          {/* Axes */}
          {axisKeys.map((key) => {
            const x = xScale(key) || 0;
            const label = axisLabels[key] || key;

            return (
              <Group key={key} left={x}>
                <AxisLeft
                  scale={yScales[key]}
                  numTicks={5}
                  tickStroke="#CBD5E1"
                  stroke="#CBD5E1"
                  tickLabelProps={() => ({
                    fill: '#64748B',
                    fontSize: 9,
                    textAnchor: 'end',
                    dx: -4,
                  })}
                />
                <text
                  x={0}
                  y={-10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="500"
                  fill="#334155"
                  className="select-none"
                >
                  {label.length > 20 ? label.substring(0, 20) + '...' : label}
                </text>
              </Group>
            );
          })}
        </Group>
      </svg>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Click a line to select a design variant. Hover to preview.</p>
        <p className="text-xs mt-1">{variants.length} variants • {axisKeys.length} parameters</p>
      </div>
    </Card>
  );
}
