# Design Explorer React - Implementation Plan

## Project Overview

**Goal:** Build a modern web-based design exploration tool for architectural/building performance analysis

**Tech Stack:**
- Vite + React 18 + TypeScript (SPA)
- Zustand for state management
- VisX for parallel coordinates
- Nivo for radar chart
- React Three Fiber + Drei for 3D visualization
- Tailwind CSS + Shadcn UI for styling

**Data Scale:** Up to 300 design variants maximum

**Git Repository:** https://github.com/olafolden/Design_Explorer_V2

**Project Location:** `/home/olaf/design-explorer-react/`

**Reference Files:** `/mnt/c/20251130_designExplorer_v4/start-files/`
- `example.json` - 5 sample variants with 24 inputs + 7 outputs
- `gltb-test.ply` - Sample 3D model (80K vertices)
- `LandingPage.png` - UI mockup
- `SelectedDesign.png` - Detail view mockup

---

## Data Structure

### JSON Format (variants.json)
```json
[
  {
    "id": "2;22",
    "input": [
      { "value": 7.0, "label": "wlc_North_fin", "col-id": "wlcnorthfin" },
      // ... 23 more inputs
    ],
    "output": [
      { "value": 0, "label": "Summer - west - area (%) > 1 hour", "col-id": "summerWestArea(%)>1Hour" },
      // ... 6 more outputs
    ]
  }
]
```

### PLY File Convention
- **Pattern:** `{id}_{layer}.ply`
- **Examples:** `2;22_main.ply`, `2;22_solar.ply`, `2;22_thermal.ply`
- **Layers:** Multiple visualization layers per design variant

---

## Phase 1: Project Setup (Week 1)

### 1.1 Initialize Project

```bash
cd /home/olaf
npm create vite@latest design-explorer-react -- --template react-ts
cd design-explorer-react
git init
git remote add origin https://github.com/olafolden/Design_Explorer_V2.git
```

### 1.2 Install Dependencies

**Visualization & 3D:**
```bash
npm install @visx/axis @visx/curve @visx/group @visx/scale @visx/shape
npm install @nivo/radar
npm install @react-three/fiber @react-three/drei three
npm install @types/three --save-dev
```

**State & Utils:**
```bash
npm install zustand immer
npm install d3-scale d3-array d3-format
```

**UI Framework:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### 1.3 Project Structure

```
src/
├── components/
│   ├── ui/                      # Shadcn primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   └── select.tsx
│   ├── LandingPage.tsx          # Directory upload
│   ├── Header.tsx               # Top navigation
│   ├── ParallelCoordinates.tsx  # Custom VisX PCP
│   ├── RadarChart.tsx           # Nivo radar
│   ├── ThreeDViewer.tsx         # R3F canvas
│   ├── PLYModel.tsx             # PLY loader
│   ├── ThumbnailGrid.tsx        # Variant gallery
│   └── MainExplorer.tsx         # Main layout
├── store/
│   ├── useDesignStore.ts        # Zustand store
│   └── types.ts                 # TypeScript interfaces
├── services/
│   ├── fileLoader.ts            # Directory upload
│   ├── plyParser.ts             # PLY parsing with Three.js
│   └── geometryCache.ts         # LRU cache (max 15)
├── utils/
│   ├── colorScale.ts            # Gradient for metrics
│   └── dataTransform.ts         # PCP formatting
├── lib/
│   └── utils.ts                 # cn() helper
├── App.tsx
├── main.tsx
└── index.css
```

### 1.4 Configure Tailwind

**tailwind.config.js:**
```javascript
export default {
  darkMode: ["class"],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
  }
}
```

---

## Phase 2: Type Definitions & State (Week 1-2)

### 2.1 TypeScript Interfaces

**src/store/types.ts:**

```typescript
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
```

### 2.2 Zustand Store

**src/store/useDesignStore.ts:**

Key features:
- `loadedFiles`: Stores JSON data + PLY/thumbnail URLs
- `selectedId`: Currently selected design
- `hoveredId`: Hovered design (for preview)
- `filters`: Array of axis filter ranges
- `colorByMetric`: Which metric drives line colors
- `getFilteredVariants()`: Computed getter applying filters
- `getSelectedVariant()`: Get selected design object
- `getHoveredVariant()`: Get hovered design object

Implementation uses Immer middleware for simple state updates.

---

## Phase 3: File Loading Service (Week 2)

### 3.1 Directory Upload

**src/services/fileLoader.ts:**

```typescript
export async function loadDesignDirectory(files: FileList): Promise<LoadedFiles> {
  // 1. Find and parse variants.json
  const variantsFile = findFile(files, 'variants.json');
  const jsonData = JSON.parse(await variantsFile.text());

  // 2. Process PLY files
  const plyFiles = new Map<string, string>();
  for (const file of filterFiles(files, '.ply')) {
    plyFiles.set(file.name, URL.createObjectURL(file));
  }

  // 3. Process thumbnails
  const thumbnails = new Map<string, string>();
  for (const file of filterFiles(files, /\.(png|jpg)$/)) {
    const id = file.name.replace(/\.(png|jpg)$/, '');
    thumbnails.set(id, URL.createObjectURL(file));
  }

  return { jsonData, plyFiles, thumbnails };
}
```

**Key points:**
- Use `webkitdirectory` attribute on input element
- Create ObjectURLs for binary files (PLY, images)
- Store in memory (suitable for <300 variants)

### 3.2 PLY Parser

**src/services/plyParser.ts:**

```typescript
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

export async function loadPLYGeometry(url: string): Promise<THREE.BufferGeometry> {
  return new Promise((resolve, reject) => {
    new PLYLoader().load(url, (geometry) => {
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }
      geometry.center();
      resolve(geometry);
    }, undefined, reject);
  });
}
```

### 3.3 LRU Geometry Cache

**src/services/geometryCache.ts:**

- Max 15 geometries in memory
- Evict oldest when full
- Dispose Three.js geometries to free GPU memory
- Track last access time for LRU

---

## Phase 4: Landing Page (Week 2)

**src/components/LandingPage.tsx:**

Features:
- Glassmorphism card with gradient background
- "Upload Design Directory" button
- Hidden file input with `webkitdirectory` attribute
- Loading state during file parsing
- Error display for invalid directories
- Calls `loadDesignDirectory()` and updates Zustand store
- Triggers `onLoadComplete()` callback to show main explorer

---

## Phase 5: Parallel Coordinates (Week 3-4)

### 5.1 Custom VisX Implementation

**CRITICAL:** Do NOT use `parcoord-es` library (causes CSS conflicts with Three.js)

**src/components/ParallelCoordinates.tsx:**

Architecture:
1. **Data transformation:** Flatten variant objects to `{ id, input1, input2, ..., output1, ... }`
2. **X Scale:** scalePoint for horizontal axis positions (24 inputs + 7 outputs)
3. **Y Scales:** One scaleLinear per axis (domain = [min, max] of values)
4. **Line rendering:** SVG `<path>` elements connecting axis values
5. **Color logic:**
   - Selected: Bold black (#000)
   - Hovered: Blue (#3B82F6)
   - By metric: Gradient (blue → red based on normalized value)
   - Default: Gray (#94A3B8, opacity 0.3)
6. **Interactions:**
   - `onMouseEnter`: Set hoveredId → syncs with 3D viewer
   - `onClick`: Set selectedId → loads full 3D model
   - Brush ranges: Track min/max per axis → update filters

### 5.2 Brushing/Filtering (Future Enhancement)

For MVP: Click-to-select only
Future: Add brush rectangles on each axis using VisX Brush component

---

## Phase 6: Radar Chart (Week 4)

**src/components/RadarChart.tsx:**

- Use Nivo's `<ResponsiveRadar>`
- Display 7 output metrics only
- Data format: `[{ metric: "label", value: number }, ...]`
- Configuration:
  - `maxValue`: Auto-calculate or normalize to 1.0
  - `curve`: linearClosed
  - `fillOpacity`: 0.25
  - `animate`: true
- Show empty state if no variant selected

---

## Phase 7: 3D Viewer (Week 4-5)

### 7.1 Canvas Setup

**src/components/ThreeDViewer.tsx:**

```typescript
<Canvas>
  <PerspectiveCamera position={[5, 5, 5]} />
  <OrbitControls enableDamping />

  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} />

  <Suspense fallback={null}>
    {plyURL && <PLYModel url={plyURL} />}
  </Suspense>

  <Environment preset="apartment" />
  <gridHelper args={[20, 20]} />
</Canvas>
```

Features:
- Layer switcher UI (Base, Solar, Thermal)
- Load different PLY files: `{id}_base.ply`, `{id}_solar.ply`, etc.
- Show loading skeleton during parsing
- Display hovered OR selected variant (priority: selected > hovered)

### 7.2 PLY Model Component

**src/components/PLYModel.tsx:**

```typescript
export function PLYModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let geo = geometryCache.get(url);
    if (!geo) {
      geo = await loadPLYGeometry(url);
      geometryCache.set(url, geo);
    }
    setGeometry(geo);
  }, [url]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  );
}
```

**Key points:**
- Check cache before loading
- Use `vertexColors` for PLY color data
- Dispose geometries when evicted from cache

---

## Phase 8: Thumbnail Grid (Week 5)

**src/components/ThumbnailGrid.tsx:**

Layout:
- Grid of circular thumbnails (8 columns)
- Show `filteredVariants` only
- Visual states:
  - Selected: Blue ring (ring-4), scale-110
  - Hovered: Light ring (ring-2), scale-105
  - Default: No ring
- Click: setSelectedId
- Hover: setHoveredId
- Fallback: Show variant ID text if no thumbnail image

Display count: "Design Variants (N)"

---

## Phase 9: Main Layout (Week 5)

**src/components/MainExplorer.tsx:**

Grid layout:
```
┌─────────────────────────────────────┐
│ Header                              │
├──────────────────────┬──────────────┤
│ Parallel Coords (2/3)│ Radar (1/3) │
├──────────────────────┴──────────────┤
│ 3D Viewer (full width)              │
├─────────────────────────────────────┤
│ Thumbnail Grid (full width)         │
└─────────────────────────────────────┘
```

Responsive:
- Desktop: 3-column grid
- Tablet: Stack vertically
- Mobile: Single column

---

## Phase 10: Header & UI Polish (Week 6)

**src/components/Header.tsx:**

Elements:
- "Design Explorer" title
- Upload new directory button (clears current data)
- Dark mode toggle
- Settings dropdown (future: export, sharing)
- Current scenario name (from JSON metadata)

**Modern UI Features:**
1. **Dark mode:** Use Tailwind's `dark:` variants
2. **Glassmorphism:** `backdrop-blur-sm bg-white/90`
3. **Skeleton loaders:** Show while PLY parses
4. **Smooth transitions:** `transition-all duration-200`
5. **Hover effects:** Scale, ring, shadow

---

## Phase 11: Testing (Week 7)

### Unit Tests (Vitest)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Coverage targets:**
- `useDesignStore`: Filter logic, getters (90%+)
- `fileLoader`: JSON parsing, file mapping (80%+)
- `colorScale`: Pure functions (100%)

**Example test:**
```typescript
describe('useDesignStore', () => {
  it('filters variants by output metric range', () => {
    const store = useDesignStore.getState();
    store.setFilters([{ axisId: 'winterHoursBlocked', min: 30, max: 40 }]);
    const filtered = store.getFilteredVariants();
    expect(filtered.length).toBeLessThan(store.loadedFiles.jsonData.length);
  });
});
```

### Integration Tests (Playwright)

```bash
npm install -D @playwright/test
```

**Scenarios:**
1. Upload directory → Verify variants load
2. Click PCP line → 3D model appears
3. Hover thumbnail → 3D preview updates
4. Switch layer → Different PLY loads

---

## Phase 12: Deployment (Week 8)

### GitHub Pages

**Install:**
```bash
npm install -D gh-pages
```

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/Design_Explorer_V2/',
});
```

**package.json:**
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**Deploy:**
```bash
npm run deploy
```

Site will be live at: `https://olafolden.github.io/Design_Explorer_V2/`

---

## Technical Challenges & Solutions

### Challenge 1: PLY File Naming with Semicolons
**Problem:** IDs like "2;22" create filenames `2;22_main.ply` which may cause issues

**Solution:**
- Store ObjectURLs in Map (no filesystem encoding needed)
- Or normalize IDs: Replace `;` with `-` for filenames

### Challenge 2: Memory with 300 Variants × Multiple PLYs
**Problem:** Each PLY = ~1-2 MB, total = ~600-1800 MB if all loaded

**Solution:**
- LRU cache with max 15 geometries
- Lazy load: Only load when variant selected/hovered
- Dispose old geometries to free GPU memory

### Challenge 3: PCP Performance with 300 Lines
**Problem:** 300 SVG paths × 31 segments = 9,300 DOM nodes

**Solution:**
- Use VisX (acceptable for 300 variants per user requirement)
- Reduce opacity for non-selected lines (0.3)
- Consider Canvas rendering if needed (future optimization)

### Challenge 4: Synchronizing Hover State Across Components
**Problem:** Hover in PCP should update 3D viewer instantly

**Solution:**
- Zustand provides reactive updates
- All components subscribe to `hoveredId`
- React re-renders only affected components

---

## File Processing Expectations

### Directory Structure Users Upload
```
design-project/
├── variants.json          # Required
├── geometry/
│   ├── 001_main.ply
│   ├── 001_solar.ply
│   ├── 002_main.ply
│   └── ...
└── thumbnails/
    ├── 001.png
    ├── 002.png
    └── ...
```

### Validation
- Check `variants.json` exists and is valid JSON
- Show warning if no PLY files found (can still visualize data)
- Gracefully handle missing thumbnails (show ID text)

---

## Implementation Priority

**MVP (Weeks 1-5):**
1. ✅ Setup + Types + Store
2. ✅ File loading
3. ✅ Landing page
4. ✅ Parallel coordinates (basic - no brushing)
5. ✅ 3D viewer with layer switching
6. ✅ Thumbnail grid
7. ✅ Click-to-select interactions

**Polish (Weeks 6-7):**
8. ⚡ Radar chart
9. ⚡ Dark mode
10. ⚡ Hover interactions
11. ⚡ Loading skeletons
12. ⚡ Testing

**Future Enhancements:**
- Brushing/filtering on PCP axes
- Export filtered variants as CSV
- Share scenarios via URL params
- Side-by-side comparison mode
- Animation through design space

---

## Key Dependencies Summary

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.2",
    "immer": "^10.1.1",
    "@visx/axis": "^3.10.1",
    "@visx/scale": "^3.5.0",
    "@visx/shape": "^3.5.0",
    "@visx/group": "^3.3.0",
    "@nivo/radar": "^0.87.0",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.117.3",
    "three": "^0.171.0",
    "d3-scale": "^4.0.2",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/three": "^0.171.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8",
    "@playwright/test": "^1.49.1",
    "gh-pages": "^6.2.0"
  }
}
```

---

## Success Metrics

✅ **Functional:**
- Upload directory with 300 variants → Loads in <5 seconds
- Click variant → 3D model renders in <1 second
- Hover line → Preview appears instantly (<100ms)
- Filter by axis → Thumbnails update immediately

✅ **Visual:**
- Matches mockup aesthetic (modern, clean, dark mode)
- Smooth animations (no jank)
- Responsive layout (desktop, tablet, mobile)

✅ **Performance:**
- 60 FPS on 3D orbit
- No memory leaks (stable at <500 MB after 10 minutes)
- Works in Chrome, Firefox, Safari

---

## Risk Mitigation

**Risk:** VisX performance degrades with 300 variants
**Mitigation:** Profile early; switch to Canvas if needed

**Risk:** PLY files too large (>10 MB each)
**Mitigation:** Add file size warnings; suggest mesh decimation

**Risk:** Browser memory limits with full dataset
**Mitigation:** LRU cache + aggressive disposal

**Risk:** GitHub Pages doesn't support directory upload API
**Mitigation:** Confirmed - works in all modern browsers as client-side only

---

## Critical Implementation Notes

1. **DO NOT** use `parcoord-es` library (CSS conflicts)
2. **DO** dispose Three.js geometries when evicted from cache
3. **DO** use ObjectURLs for file references (no server needed)
4. **DO** normalize colors to [0, 1] range for consistent gradients
5. **DO** handle missing files gracefully (show placeholders)
6. **DO** test with real data early (copy from `/mnt/c/.../start-files/`)

---

## Next Steps

After plan approval:

1. Initialize Vite project with TypeScript
2. Set up git repository
3. Install all dependencies
4. Copy example data to `public/test-data/` for development
5. Implement Phase 1-2 (types + store)
6. Build incrementally, testing each phase

Total estimated effort: **6-8 weeks** for full implementation + testing + deployment
