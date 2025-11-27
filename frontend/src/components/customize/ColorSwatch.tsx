'use client';

export interface ColorSwatchProps {
  colorId: string;
  name: string;
  hex: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ColorSwatch({
  colorId,
  name,
  hex,
  selected = false,
  onClick,
}: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
        selected
          ? 'bg-base-200 ring-2 ring-primary'
          : 'hover:bg-base-200'
      }`}
      aria-label={`Select ${name} color`}
      aria-pressed={selected}
      data-color-id={colorId}
    >
      <span
        className="w-6 h-6 rounded-full border border-base-300 flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
      <span className="text-sm">{name}</span>
    </button>
  );
}
