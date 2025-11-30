export interface Parameter {
  label: string;
  "col-id": string;
  value: number;
}

export interface DesignVariant {
  id: string;
  input: Parameter[];      // 24 parameters
  output: Parameter[];     // 7 metrics
  inputRaw?: number[];
}

export interface LoadedFiles {
  jsonData: DesignVariant[];
  plyFiles: Map<string, string>;      // filename -> ObjectURL
  thumbnails: Map<string, string>;    // variantId -> ObjectURL
}

export interface FilterRange {
  axisId: string;
  min: number;
  max: number;
}

export interface DesignStore {
  // Data
  loadedFiles: LoadedFiles | null;

  // UI State
  selectedId: string | null;
  hoveredId: string | null;
  filters: FilterRange[];
  colorByMetric: string | null;

  // Actions
  setLoadedFiles: (files: LoadedFiles) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setFilters: (filters: FilterRange[]) => void;
  setColorByMetric: (metricId: string | null) => void;

  // Computed
  getFilteredVariants: () => DesignVariant[];
  getSelectedVariant: () => DesignVariant | null;
  getHoveredVariant: () => DesignVariant | null;
}
