import { useDesignStore } from '../store/useDesignStore';
import { Card } from './ui/card';

export function ThumbnailGrid() {
  const filteredVariants = useDesignStore(state => state.getFilteredVariants());
  const selectedId = useDesignStore(state => state.selectedId);
  const hoveredId = useDesignStore(state => state.hoveredId);
  const setSelectedId = useDesignStore(state => state.setSelectedId);
  const setHoveredId = useDesignStore(state => state.setHoveredId);
  const loadedFiles = useDesignStore(state => state.loadedFiles);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Design Variants ({filteredVariants.length})
      </h3>

      <div className="grid grid-cols-8 gap-3 max-h-96 overflow-y-auto">
        {filteredVariants.map(variant => {
          const thumbnailURL = loadedFiles?.thumbnails.get(variant.id);
          const isSelected = variant.id === selectedId;
          const isHovered = variant.id === hoveredId;

          // Get a metric for color coding
          const winterBlocked = variant.output.find(o => o["col-id"] === "winterHoursBlocked(%)")?.value || 0;
          const getColorClass = () => {
            if (winterBlocked < 35) return 'bg-green-100 border-green-300';
            if (winterBlocked < 45) return 'bg-yellow-100 border-yellow-300';
            return 'bg-red-100 border-red-300';
          };

          return (
            <button
              key={variant.id}
              onClick={() => setSelectedId(variant.id)}
              onMouseEnter={() => setHoveredId(variant.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative aspect-square rounded-full overflow-hidden
                transition-all duration-200 transform border-2
                ${isSelected ? 'ring-4 ring-blue-600 scale-110 z-10' : ''}
                ${isHovered && !isSelected ? 'ring-2 ring-blue-400 scale-105 z-5' : ''}
                ${!isSelected && !isHovered ? getColorClass() : 'border-blue-500'}
                hover:shadow-lg
              `}
              title={`Variant ${variant.id} - Winter: ${winterBlocked}%`}
            >
              {thumbnailURL ? (
                <img
                  src={thumbnailURL}
                  alt={`Variant ${variant.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-slate-700">{variant.id}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{winterBlocked}%</span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-300"></div>
          <span>Low (&lt;35%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-100 border-2 border-yellow-300"></div>
          <span>Medium (35-45%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-300"></div>
          <span>High (&gt;45%)</span>
        </div>
      </div>
    </Card>
  );
}
