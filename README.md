# Design Explorer V2

A modern web-based tool for exploring and analyzing architectural design variants with interactive visualizations.

🚀 **Live Demo:** https://olafolden.github.io/Design_Explorer_V2/

## Features

### 📊 Interactive Parallel Coordinates
- Visualize 24 input parameters + 7 output metrics simultaneously
- Click to select design variants
- Hover for real-time preview
- Color coding by performance metrics

### 🕸️ Radar Chart
- Display 7 performance output metrics
- Smooth animations
- Responsive design
- Automatically updates with selection

### 🎨 3D Model Viewer
- Real-time 3D visualization of design variants
- PLY file support with vertex colors
- Interactive orbit controls
- Smart geometry caching (LRU, max 15 models)
- Environment lighting and grid

### 🖼️ Thumbnail Grid
- Color-coded thumbnails by performance
- Quick variant selection
- Visual performance indicators
- Hover preview integration

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **State Management:** Zustand with Immer
- **Visualizations:**
  - VisX for parallel coordinates
  - Nivo for radar charts
  - React Three Fiber for 3D rendering
- **UI:** Tailwind CSS v4 + Shadcn UI components
- **3D:** Three.js PLY loader
- **Deployment:** GitHub Pages

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/olafolden/Design_Explorer_V2.git
cd Design_Explorer_V2

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Using the App

### 1. Prepare Your Data

Create a directory with:
- `variants.json` - Design variant data (required)
- `*.ply` - 3D model files for each variant (optional)
- `*.png` or `*.jpg` - Thumbnail images (optional)

### 2. Upload Directory

1. Click "Upload Design Directory" button
2. Select your data directory
3. The app loads all variants and visualizations

### 3. Explore Designs

- **Click** a line in the parallel coordinates to select a variant
- **Hover** over lines to preview in 3D
- **Click** thumbnails for quick selection
- **Orbit** the 3D model with mouse drag

## Data Format

### variants.json Structure

```json
[
  {
    "id": "2;22",
    "input": [
      {
        "value": 7.0,
        "label": "wlc_North_fin",
        "col-id": "wlcnorthfin"
      },
      // ... 23 more input parameters
    ],
    "output": [
      {
        "value": 36,
        "label": "Winter hours blocked (%)",
        "col-id": "winterHoursBlocked(%)"
      },
      // ... 6 more output metrics
    ]
  }
]
```

### PLY File Naming

- Pattern: `{variant-id}.ply`
- Example: `2;22.ply`, `3;19.ply`

### Test Data

A complete test dataset is included in `public/test-data/`:
- 5 design variants
- PLY files for each variant
- Example JSON with all parameters

Download this folder and upload it to try the app!

## Architecture

### Key Components

```
src/
├── components/
│   ├── LandingPage.tsx          # Directory upload UI
│   ├── MainExplorer.tsx         # Main layout
│   ├── ParallelCoordinates.tsx  # VisX parallel coordinates
│   ├── RadarChart.tsx           # Nivo radar chart
│   ├── ThreeDViewer.tsx         # R3F 3D canvas
│   ├── PLYModel.tsx             # PLY loader component
│   └── ThumbnailGrid.tsx        # Variant thumbnails
├── store/
│   ├── types.ts                 # TypeScript interfaces
│   └── useDesignStore.ts        # Zustand store
├── services/
│   ├── fileLoader.ts            # Directory upload handler
│   ├── plyParser.ts             # PLY file parser
│   └── geometryCache.ts         # LRU geometry cache
└── utils/
    └── colorScale.ts            # D3 color gradients
```

### State Management

The app uses Zustand for reactive state:
- `loadedFiles` - Uploaded JSON data + file URLs
- `selectedId` - Currently selected variant
- `hoveredId` - Hovered variant (for preview)
- `filters` - Active parameter filters (future)

All components subscribe to state changes and update automatically.

### Performance Optimizations

1. **LRU Geometry Cache** - Max 15 3D models in memory
2. **Lazy Loading** - PLY files loaded on-demand
3. **React.memo** - Prevent unnecessary re-renders
4. **ObjectURLs** - Browser-native file references

## Development

### Project Structure

- `/src` - Application source code
- `/public/test-data` - Example datasets
- `/dist` - Production build output
- `IMPLEMENTATION_PLAN.md` - Detailed implementation guide

### Key Dependencies

```json
{
  "react": "^18.3.1",
  "zustand": "^5.0.9",
  "@visx/axis": "^3.12.0",
  "@visx/scale": "^3.12.0",
  "@nivo/radar": "^0.99.0",
  "@react-three/fiber": "^9.4.2",
  "@react-three/drei": "^10.7.7",
  "three": "^0.181.2",
  "tailwindcss": "^4.1.17"
}
```

## Deployment

The app is configured for GitHub Pages:
1. Build generates static files to `/dist`
2. `gh-pages` publishes to `gh-pages` branch
3. GitHub serves from `https://olafolden.github.io/Design_Explorer_V2/`

Automatic deployment on:
```bash
npm run deploy
```

## Future Enhancements

- [ ] Brushing/filtering on parallel coordinates axes
- [ ] Export filtered variants as CSV
- [ ] Dark mode toggle
- [ ] Multiple PLY layers per variant (base, solar, thermal)
- [ ] Share scenarios via URL parameters
- [ ] Side-by-side variant comparison
- [ ] Animation through design space

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Inspired by Ladybug Tools Design Explorer
- UI components from [Shadcn UI](https://ui.shadcn.com/)

---

**Made with ❤️ for architects and building performance analysts**
