export type ShapeKind = 'rect' | 'line' | 'circle';

export const SHAPE_KINDS: ShapeKind[] = ['rect', 'line', 'circle'];

// Builds a starter shape centred on the canvas, sized relative to it
export const buildShape = (kind: ShapeKind, width: number, height: number): string => {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const size = Math.max(10, Math.round(Math.min(width, height) / 10));

  switch (kind) {
    case 'rect':
      return `<rect x="${cx - size}" y="${cy - Math.round(size / 2)}" width="${size * 2}" height="${size}" />`;
    case 'line':
      return `<line x1="${cx - size}" y1="${cy}" x2="${cx + size}" y2="${cy}" />`;
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${size}" />`;
  }
};

// Appends the shape just before the closing </svg>, or at the end if there is none
export const insertShape = (svg: string, shape: string): string => {
  const end = svg.lastIndexOf('</svg>');
  if (end === -1) return `${svg}${svg === '' || svg.endsWith('\n') ? '' : '\n'}${shape}\n`;
  const head = svg.slice(0, end);
  return `${head}${head === '' || head.endsWith('\n') ? '' : '\n'}  ${shape}\n${svg.slice(end)}`;
};
