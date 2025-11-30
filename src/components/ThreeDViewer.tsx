import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { useDesignStore } from '../store/useDesignStore';
import { PLYModel } from './PLYModel';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ThreeDViewer() {
  const selectedVariant = useDesignStore(state => state.getSelectedVariant());
  const hoveredVariant = useDesignStore(state => state.getHoveredVariant());
  const loadedFiles = useDesignStore(state => state.loadedFiles);

  // Show selected variant, or hovered if nothing selected
  const displayVariant = selectedVariant || hoveredVariant;

  if (!displayVariant) {
    return (
      <Card className="h-[500px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-muted-foreground">Hover or select a design to preview 3D model</p>
        <p className="text-sm text-muted-foreground mt-2">Click a line in the chart above</p>
      </Card>
    );
  }

  // Try to find PLY file for this variant
  const plyFileName = `${displayVariant.id}.ply`;
  const plyURL = loadedFiles?.plyFiles.get(plyFileName);

  return (
    <Card className="h-[500px] overflow-hidden relative">
      {/* Variant info overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium">Design: {displayVariant.id}</p>
        <p className="text-xs text-muted-foreground">
          Winter blocked: {displayVariant.output.find(o => o["col-id"] === "winterHoursBlocked(%)")?.value}%
        </p>
      </div>

      {plyURL ? (
        <Canvas className="bg-slate-50 dark:bg-slate-900">
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
          />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />

          {/* 3D Model */}
          <Suspense fallback={null}>
            <PLYModel url={plyURL} />
          </Suspense>

          {/* Environment and Grid */}
          <Environment preset="apartment" />
          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#94a3b8"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#64748b"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
        </Canvas>
      ) : (
        <div className="h-full flex flex-col items-center justify-center">
          <Skeleton className="w-3/4 h-3/4" />
          <p className="text-sm text-muted-foreground mt-4">
            No 3D model available for variant {displayVariant.id}
          </p>
        </div>
      )}
    </Card>
  );
}
