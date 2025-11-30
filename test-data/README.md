# Test Data for Design Explorer

This directory contains sample data for testing the Design Explorer application.

## Files

- `variants.json` - 5 design variants with input parameters and output metrics
- `*.ply` - 3D geometry files for each variant (PLY format)

## Variant IDs

- 2;22 - Winter hours blocked: 36%
- 2;30 - Winter hours blocked: 40%
- 3;2 - Winter hours blocked: 53%
- 3;19 - Winter hours blocked: 41% (has summer west issues)
- 3;62 - Winter hours blocked: 37% (has summer south issues)

## Data Structure

Each variant has:
- **24 input parameters**: Window/shading control parameters (fin, cantilever, openness) for 8 directions
- **7 output metrics**: Building performance indicators (daylight, shading, solar heat gain)

## How to Use

1. Download this entire `test-data` directory
2. In Design Explorer, click "Upload Design Directory"
3. Select the `test-data` folder
4. The app will load all variants and their 3D models

## Parameter Ranges

- Fin parameters: 0-10
- Cantilever parameters: 0-10
- Openness parameters: 0.0-1.0 (fractions)
