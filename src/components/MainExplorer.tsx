import { useDesignStore } from '../store/useDesignStore';
import { ParallelCoordinates } from './ParallelCoordinates';
import { RadarChart } from './RadarChart';
import { ThreeDViewer } from './ThreeDViewer';
import { ThumbnailGrid } from './ThumbnailGrid';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

interface MainExplorerProps {
  onReset?: () => void;
}

export function MainExplorer({ onReset }: MainExplorerProps) {
  const loadedFiles = useDesignStore(state => state.loadedFiles);

  if (!loadedFiles) {
    return <div>No data loaded</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Design Explorer
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {loadedFiles.jsonData.length} design variants loaded
            </p>
          </div>
          {onReset && (
            <Button onClick={onReset} variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Load New Data
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Top Row: Parallel Coordinates + Radar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ParallelCoordinates />
          </div>
          <div>
            <RadarChart />
          </div>
        </div>

        {/* Middle Row: 3D Viewer */}
        <ThreeDViewer />

        {/* Bottom Row: Thumbnail Grid */}
        <ThumbnailGrid />
      </main>
    </div>
  );
}
