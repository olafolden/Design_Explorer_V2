import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { scaleLinear, scalePoint } from 'd3-scale';
import { useDesignStore } from '../store/useDesignStore';
import { getColorForValue } from '../utils/colorScale';
import { Card } from './ui/card';

export function ParallelCoordinatesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 1400, height: 400 });

  const loadedFiles = useDesignStore(state => state.loadedFiles);
  const selectedId = useDesignStore(state => state.selectedId);
  const hoveredId = useDesignStore(state => state.hoveredId);
  const colorByMetric = useDesignStore(state => state.colorByMetric);
  const setHoveredId = useDesignStore(state => state.setHoveredId);
  const setSelectedId = useDesignStore(state => state.setSelectedId);

  const variants = loadedFiles?.jsonData || [];

  // Transform data to flat format
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

  // Get all axis keys and labels
  const { axisKeys, axisLabels } = useMemo(() => {
    if (variants.length === 0) return { axisKeys: [], axisLabels: {} };

    const first = variants[0];
    const keys = [
      ...first.input.map(p => p["col-id"]),
      ...first.output.map(p => p["col-id"])
    ];

    const labels: Record<string, string> = {};
    first.input.forEach(p => {
      labels[p["col-id"]] = p.label;
    });
    first.output.forEach(p => {
      labels[p["col-id"]] = p.label;
    });

    return { axisKeys: keys, axisLabels: labels };
  }, [variants]);

  const margin = { top: 60, right: 40, bottom: 60, left: 40 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(() => {
    const scale = scalePoint<string>()
      .domain(axisKeys)
      .range([0, innerWidth])
      .padding(0.5);
    return scale;
  }, [axisKeys, innerWidth]);

  const yScales = useMemo(() => {
    const scales: Record<string, any> = {};

    axisKeys.forEach(key => {
      const values = pcpData.map(d => d[key] as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * 0.1 || 1;

      const scale = scaleLinear()
        .domain([min - padding, max + padding])
        .range([innerHeight, 0]);

      scales[key] = scale;
    });

    return scales;
  }, [axisKeys, pcpData, innerHeight]);

  // Get line color
  const getLineColor = useCallback((dataPoint: Record<string, string | number>, alpha: number = 1) => {
    if (dataPoint.id === selectedId) return `rgba(0, 0, 0, ${alpha})`;
    if (dataPoint.id === hoveredId) return `rgba(59, 130, 246, ${alpha})`;

    if (colorByMetric && dataPoint[colorByMetric] !== undefined) {
      const value = dataPoint[colorByMetric] as number;
      const scale = yScales[colorByMetric];
      if (scale) {
        const domain = scale.domain();
        const normalized = (value - domain[0]) / (domain[1] - domain[0]);
        const color = getColorForValue(normalized);
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }

    return `rgba(148, 163, 184, ${alpha})`; // Slate-400
  }, [selectedId, hoveredId, colorByMetric, yScales]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Translate to margin
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // Draw axes
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    axisKeys.forEach(key => {
      const x = xScale(key) || 0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, innerHeight);
      ctx.stroke();
    });

    // Draw axis labels
    ctx.fillStyle = '#334155';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    axisKeys.forEach(key => {
      const x = xScale(key) || 0;
      const label = axisLabels[key] || key;
      const truncated = label.length > 15 ? label.substring(0, 15) + '...' : label;
      ctx.fillText(truncated, x, -10);
    });

    // Draw lines - background first
    pcpData
      .filter(d => d.id !== selectedId && d.id !== hoveredId)
      .forEach(dataPoint => {
        ctx.beginPath();
        ctx.strokeStyle = getLineColor(dataPoint, 0.15);
        ctx.lineWidth = 1;

        axisKeys.forEach((key, i) => {
          const x = xScale(key) || 0;
          const y = yScales[key](dataPoint[key] as number);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      });

    // Draw hovered line
    if (hoveredId) {
      const hoveredData = pcpData.find(d => d.id === hoveredId);
      if (hoveredData && hoveredData.id !== selectedId) {
        ctx.beginPath();
        ctx.strokeStyle = getLineColor(hoveredData, 0.9);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        axisKeys.forEach((key, i) => {
          const x = xScale(key) || 0;
          const y = yScales[key](hoveredData[key] as number);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      }
    }

    // Draw selected line on top
    if (selectedId) {
      const selectedData = pcpData.find(d => d.id === selectedId);
      if (selectedData) {
        ctx.beginPath();
        ctx.strokeStyle = getLineColor(selectedData, 1);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        axisKeys.forEach((key, i) => {
          const x = xScale(key) || 0;
          const y = yScales[key](selectedData[key] as number);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      }
    }

    ctx.restore();
  }, [dimensions, pcpData, axisKeys, axisLabels, xScale, yScales, selectedId, hoveredId, getLineColor, margin, innerHeight]);

  // Handle canvas click/hover
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const y = e.clientY - rect.top - margin.top;

    // Find closest line
    let closestId: string | null = null;
    let minDistance = 20; // Click tolerance in pixels

    pcpData.forEach(dataPoint => {
      // Check distance to line at each segment
      for (let i = 0; i < axisKeys.length - 1; i++) {
        const key1 = axisKeys[i];
        const key2 = axisKeys[i + 1];

        const x1 = xScale(key1) || 0;
        const y1 = yScales[key1](dataPoint[key1] as number);
        const x2 = xScale(key2) || 0;
        const y2 = yScales[key2](dataPoint[key2] as number);

        // Point-to-line-segment distance
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearX = x1 + t * dx;
        const nearY = y1 + t * dy;
        const dist = Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2);

        if (dist < minDistance) {
          minDistance = dist;
          closestId = dataPoint.id as string;
        }
      }
    });

    if (closestId) {
      setSelectedId(closestId === selectedId ? null : closestId);
    }
  }, [pcpData, axisKeys, xScale, yScales, margin, selectedId, setSelectedId]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const y = e.clientY - rect.top - margin.top;

    let closestId: string | null = null;
    let minDistance = 15;

    pcpData.forEach(dataPoint => {
      for (let i = 0; i < axisKeys.length - 1; i++) {
        const key1 = axisKeys[i];
        const key2 = axisKeys[i + 1];

        const x1 = xScale(key1) || 0;
        const y1 = yScales[key1](dataPoint[key1] as number);
        const x2 = xScale(key2) || 0;
        const y2 = yScales[key2](dataPoint[key2] as number);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearX = x1 + t * dx;
        const nearY = y1 + t * dy;
        const dist = Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2);

        if (dist < minDistance) {
          minDistance = dist;
          closestId = dataPoint.id as string;
        }
      }
    });

    setHoveredId(closestId);
  }, [pcpData, axisKeys, xScale, yScales, margin, setHoveredId]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, [setHoveredId]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth - 48, 1400);
        setDimensions({ width, height: 400 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (variants.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No data loaded</p>
      </Card>
    );
  }

  return (
    <Card className="p-6" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-4">Parallel Coordinates</h2>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="cursor-crosshair"
        />
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Click a line to select a design variant. Hover to preview.</p>
        <p className="text-xs mt-1">{variants.length} variants • {axisKeys.length} parameters</p>
      </div>
    </Card>
  );
}
