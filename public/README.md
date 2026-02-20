# Public Assets Directory

This directory contains static assets that are served directly without processing by Vite.

## Usage

Files placed in this directory will be available at the root URL path. For example:

- `public/logo.png` → accessible at `/logo.png`
- `public/images/icon.svg` → accessible at `/images/icon.svg`
- `public/fonts/custom.woff2` → accessible at `/fonts/custom.woff2`

## What to Put Here

- Images (logos, icons, photos)
- Fonts
- Favicon files
- robots.txt
- Other static files that don't need processing

## What NOT to Put Here

- Files that should be imported in your code (use `src/assets/` instead)
- Files that need processing (optimization, transpilation, etc.)

## Notes

- Vite automatically copies files from this directory to the build output
- Files are served as-is without hashing or optimization
- Reference these files using absolute paths starting with `/`
