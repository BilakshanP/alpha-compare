# Sony Alpha Camera Comparison

Side-by-side spec comparison for Sony full-frame mirrorless cameras.

## Features

- Toggle cameras in/out of comparison
- Dynamic winner highlighting (higher/lower/manual rules)
- Multi-currency pricing with live conversion (frankfurter.dev)
- PPP (affordability) adjusted pricing
- Fixed vs live rate diff indicator
- Expandable notes per spec row
- Pros/cons per camera
- Click camera header → Sony spec page

## Stack

- Vite + React 19 + TypeScript
- Bun runtime/package manager
- No external UI libraries

## Run

```bash
bun install
bun run dev
```

## Add a camera

1. Create `src/data/cameras/<id>.json` (copy an existing one as template)
2. Add entry to `src/data/cameras.json`
3. Import in `src/App.tsx` and add to `CAMERA_DATA`

## Data sources

- https://www.sony.co.in/electronics/interchangeable-lens-cameras/ilce-7m5/specifications
- https://www.sony.co.in/electronics/interchangeable-lens-cameras/ilce-7rm6/specifications
- https://www.sony.co.in/electronics/interchangeable-lens-cameras/ilce-1m2/specifications
- https://www.sony.co.in/interchangeable-lens-cameras/products/ilce-9m3/spec?sku=ilce-9m3-in5
