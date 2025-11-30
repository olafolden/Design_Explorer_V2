import { ResponsiveRadar } from '@nivo/radar';
import { useDesignStore } from '../store/useDesignStore';
import { Card } from './ui/card';

export function RadarChart() {
  const selectedVariant = useDesignStore(state => state.getSelectedVariant());

  if (!selectedVariant) {
    return (
      <Card className="p-6 h-96 flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Select a design to view metrics</p>
        <p className="text-sm text-muted-foreground mt-2">Click a line in the parallel coordinates chart</p>
      </Card>
    );
  }

  // Prepare data for radar chart - normalize values to 0-1 range
  const metrics = selectedVariant.output;
  const maxValues: Record<string, number> = {
    'summerWestArea(%)>1Hour': 100,
    'summerSouthArea(%)>1Hour': 100,
    'winterHoursBlocked(%)': 100,
    'windowArea': 10000,
    'shadingArea': 6000,
    'df>2%': 100,
    'ase>250Hours%': 100,
  };

  const data = metrics.map(metric => ({
    metric: metric.label.replace(/\(.*?\)/g, '').trim(), // Remove units from label
    value: metric.value,
    // Normalize to 0-100 scale for better visualization
    normalized: (metric.value / (maxValues[metric["col-id"]] || 100)) * 100,
  }));

  return (
    <Card className="p-6 h-96 flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <p className="text-sm text-muted-foreground">Design variant: {selectedVariant.id}</p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveRadar
          data={data}
          keys={['value']}
          indexBy="metric"
          valueFormat=">-.0f"
          margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
          borderColor={{ from: 'color' }}
          gridLabelOffset={16}
          dotSize={8}
          dotColor={{ theme: 'background' }}
          dotBorderWidth={2}
          colors={{ scheme: 'nivo' }}
          blendMode="multiply"
          motionConfig="gentle"
          legends={[]}
          theme={{
            text: {
              fontSize: 10,
              fill: '#64748B',
            },
            grid: {
              line: {
                stroke: '#CBD5E1',
                strokeWidth: 1,
              },
            },
          }}
        />
      </div>
      <div className="mt-4 space-y-1">
        {metrics.slice(0, 3).map(metric => (
          <div key={metric["col-id"]} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{metric.label}:</span>
            <span className="font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
