import React, { useMemo, useState } from 'react';
import { Unit } from '../services/apiHelpers';

type ViewerUnit = Pick<Unit, 'id' | 'code' | 'category'>;

interface Props {
  imageUrl: string;
  svg: string;
  units?: ViewerUnit[];
  onImageSize?: (size: { width: number; height: number }) => void;
}

// Default look for shapes. Applied as inherited attributes on a wrapping <g>, so any
// fill/stroke set on a shape or its own group still wins
const DEFAULT_STYLE = { fill: 'red', 'fill-opacity': '0.3', stroke: 'red', 'stroke-width': '2' };

const UNIT_ID = /^unit-(\d+)$/;

// Parses the user's SVG and returns safe markup for inline rendering, or null if it is invalid.
// Inline rendering is needed for hover; it means scripts, handlers, <style> (which would leak
// into the page) and external references have to be removed.
const sanitizeSvg = (source: string, size: { width: number; height: number } | null): string | null => {
  if (source.trim() === '') return null;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg' || doc.querySelector('parsererror')) return null;

  root.querySelectorAll('script, foreignObject, style, iframe, object, embed').forEach((node) => node.remove());
  [root, ...Array.from(root.querySelectorAll('*'))].forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      const isLink = name === 'href' || name.endsWith(':href');
      if (
        name.startsWith('on') ||
        (isLink && !value.startsWith('#')) ||
        (name === 'style' && value.includes('url('))
      ) {
        node.removeAttribute(attr.name);
      }
    });
  });

  if (!root.hasAttribute('viewBox') && size) root.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
  root.setAttribute('width', '100%');
  root.setAttribute('height', '100%');

  const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
  Object.entries(DEFAULT_STYLE).forEach(([name, value]) => group.setAttribute(name, value));
  while (root.firstChild) group.appendChild(root.firstChild);
  root.appendChild(group);

  return new XMLSerializer().serializeToString(root);
};

// Shows an image with an SVG laid over it; the box takes the image's aspect ratio.
// Hovering an element with id "unit-<unitId>" shows that unit's code and category.
const LocationLayoutViewer: React.FC<Props> = ({ imageUrl, svg, units = [], onImageSize }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [hover, setHover] = useState<{ unit: ViewerUnit; x: number; y: number } | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const next = { width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight };
    setSize(next);
    onImageSize?.(next);
  };

  const markup = useMemo(() => sanitizeSvg(svg, size), [svg, size]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const match = (e.target as Element).closest?.('[id^="unit-"]')?.id.match(UNIT_ID);
    const unit = match ? units.find((item) => item.id === Number(match[1])) : undefined;
    if (!unit) {
      setHover(null);
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    setHover({ unit, x: e.clientX - box.left, y: e.clientY - box.top });
  };

  return (
    <div
      className="position-relative border rounded overflow-hidden"
      style={{ aspectRatio: size ? `${size.width} / ${size.height}` : undefined }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(null)}
    >
      <img src={imageUrl} alt="" onLoad={handleLoad} className="w-100 h-100 d-block" />
      {markup && (
        <div className="position-absolute top-0 start-0 w-100 h-100" dangerouslySetInnerHTML={{ __html: markup }} />
      )}
      {hover && (
        <div
          className="position-absolute bg-dark text-white small rounded px-2 py-1 shadow"
          style={{ left: hover.x + 12, top: hover.y + 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 1 }}
        >
          <strong>{hover.unit.code}</strong>
          {hover.unit.category && <span> · {hover.unit.category}</span>}
        </div>
      )}
    </div>
  );
};

export default LocationLayoutViewer;
