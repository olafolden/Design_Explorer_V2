import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useDesignStore } from '../store/useDesignStore';
import { loadDesignDirectory } from '../services/fileLoader';

interface LandingPageProps {
  onLoadComplete: () => void;
}

export function LandingPage({ onLoadComplete }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const setLoadedFiles = useDesignStore(state => state.setLoadedFiles);

  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedFiles = await loadDesignDirectory(files);
      setLoadedFiles(loadedFiles);
      onLoadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-12 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Design Explorer
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Explore and analyze architectural design variants
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => directoryInputRef.current?.click()}
            disabled={isLoading}
            size="lg"
            className="w-full h-16 text-lg"
          >
            <Upload className="mr-2 h-6 w-6" />
            {isLoading ? 'Loading...' : 'Upload Design Directory'}
          </Button>

          <input
            ref={directoryInputRef}
            type="file"
            /* @ts-expect-error webkitdirectory not in TypeScript types */
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleDirectorySelect}
            className="hidden"
          />

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground mt-6 space-y-2">
            <p className="font-medium">Expected directory structure:</p>
            <ul className="list-disc list-inside space-y-1 text-xs pl-2">
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">variants.json</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">example.json</code> (required)</li>
              <li>PLY files: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">*.ply</code> (optional)</li>
              <li>Thumbnails: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">*.png</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">*.jpg</code> (optional)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
