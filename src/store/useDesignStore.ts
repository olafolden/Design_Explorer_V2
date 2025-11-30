import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DesignStore, DesignVariant, FilterRange, LoadedFiles } from './types';

export const useDesignStore = create<DesignStore>()(
  immer((set, get) => ({
    // Initial state
    loadedFiles: null,
    selectedId: null,
    hoveredId: null,
    filters: [],
    colorByMetric: null,

    // Actions
    setLoadedFiles: (files: LoadedFiles) => set({ loadedFiles: files }),
    setSelectedId: (id: string | null) => set({ selectedId: id }),
    setHoveredId: (id: string | null) => set({ hoveredId: id }),
    setFilters: (filters: FilterRange[]) => set({ filters }),
    setColorByMetric: (metricId: string | null) => set({ colorByMetric: metricId }),

    // Computed getters
    getFilteredVariants: (): DesignVariant[] => {
      const { loadedFiles, filters } = get();
      if (!loadedFiles?.jsonData) return [];
      if (filters.length === 0) return loadedFiles.jsonData;

      return loadedFiles.jsonData.filter((variant) => {
        return filters.every((filter) => {
          // Check output metrics
          const metric = variant.output.find(m => m["col-id"] === filter.axisId);
          if (metric) {
            return metric.value >= filter.min && metric.value <= filter.max;
          }

          // Check input parameters
          const inputMetric = variant.input.find(m => m["col-id"] === filter.axisId);
          if (inputMetric) {
            return inputMetric.value >= filter.min && inputMetric.value <= filter.max;
          }

          return true; // No data, don't filter out
        });
      });
    },

    getSelectedVariant: (): DesignVariant | null => {
      const { loadedFiles, selectedId } = get();
      if (!selectedId || !loadedFiles?.jsonData) return null;
      return loadedFiles.jsonData.find((v) => v.id === selectedId) || null;
    },

    getHoveredVariant: (): DesignVariant | null => {
      const { loadedFiles, hoveredId } = get();
      if (!hoveredId || !loadedFiles?.jsonData) return null;
      return loadedFiles.jsonData.find((v) => v.id === hoveredId) || null;
    },
  }))
);
