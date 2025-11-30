import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import * as THREE from 'three';

export async function loadPLYGeometry(url: string): Promise<THREE.BufferGeometry> {
  return new Promise((resolve, reject) => {
    const loader = new PLYLoader();

    loader.load(
      url,
      (geometry) => {
        // Compute normals if not present
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        // Center the geometry
        geometry.center();
        resolve(geometry);
      },
      undefined,
      reject
    );
  });
}

export function getPLYFilesForVariant(
  variantId: string,
  layerId: string,
  availableFiles: Map<string, string>
): string | null {
  // Try specific layer file first: {id}_{layer}.ply
  const specificFile = `${variantId}_${layerId}.ply`;

  // Try base file: {id}.ply
  const baseFile = `${variantId}.ply`;

  if (availableFiles.has(specificFile)) {
    return availableFiles.get(specificFile) || null;
  } else if (layerId === 'base' && availableFiles.has(baseFile)) {
    return availableFiles.get(baseFile) || null;
  }

  return null;
}
