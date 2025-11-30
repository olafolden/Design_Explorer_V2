import { Card } from './ui/card';
import { useDesignStore } from '../store/useDesignStore';

export function MainExplorer() {
  const loadedFiles = useDesignStore(state => state.loadedFiles);

  if (!loadedFiles) {
    return <div>No data loaded</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Design Explorer
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {loadedFiles.jsonData.length} design variants loaded
        </p>
      </header>

      <main className="space-y-6">
        {/* Parallel Coordinates Placeholder */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Parallel Coordinates</h2>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
            <p className="text-slate-500">Parallel coordinates visualization will go here</p>
          </div>
        </Card>

        {/* 3D Viewer Placeholder */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">3D Viewer</h2>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
            <p className="text-slate-500">3D model viewer will go here</p>
          </div>
        </Card>

        {/* Thumbnail Grid Placeholder */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Design Variants</h2>
          <div className="grid grid-cols-8 gap-3">
            {loadedFiles.jsonData.slice(0, 16).map(variant => (
              <div
                key={variant.id}
                className="aspect-square rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs"
              >
                {variant.id}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
