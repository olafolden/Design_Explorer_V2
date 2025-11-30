import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { loadPLYGeometry } from '../services/plyParser';
import { geometryCache } from '../services/geometryCache';

interface PLYModelProps {
  url: string;
}

export function PLYModel({ url }: PLYModelProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        let geo = geometryCache.get(url);

        if (!geo) {
          // Load from file
          geo = await loadPLYGeometry(url);
          geometryCache.set(url, geo);
        }

        if (mounted) {
          setGeometry(geo);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load PLY:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load model');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading || !geometry) return null;

  if (error) {
    console.error('PLY load error:', error);
    return null;
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors={geometry.attributes.color !== undefined}
        flatShading
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
