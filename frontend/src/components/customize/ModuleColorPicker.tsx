'use client';

import { useRef, useEffect } from 'react';
import { GOOGLE_CALENDAR_COLORS, getColorById } from '@/utils/colors';

export interface ModuleColorPickerProps {
  modules: string[];
  colors: Record<string, string>;
  onChange: (module: string, colorId: string) => void;
}

export function ModuleColorPicker({
  modules,
  colors,
  onChange,
}: ModuleColorPickerProps) {
  const getModuleColor = (module: string) => {
    const colorId = colors[module] || '7'; // Default to Peacock (blue)
    return getColorById(colorId) || GOOGLE_CALENDAR_COLORS[6];
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Module Colors</h3>
        <p className="text-xs text-base-content/70 mt-1">
          Assign colors to each module for easy identification in your calendar.
        </p>
      </div>
      
      <div className="space-y-1.5">
        {modules.map((module) => {
          const selectedColor = getModuleColor(module);

          return (
            <div
              key={module}
              className="flex items-center justify-between p-2 bg-base-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-base-300 flex-shrink-0"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span className="font-medium text-sm font-mono">{module}</span>
              </div>

              <ColorDropdown
                module={module}
                selectedColor={selectedColor}
                currentColorId={colors[module]}
                onChange={onChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ColorDropdownProps {
  module: string;
  selectedColor: { id: string; name: string; hex: string };
  currentColorId?: string;
  onChange: (module: string, colorId: string) => void;
}

function ColorDropdown({ module, selectedColor, currentColorId, onChange }: ColorDropdownProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleColorSelect = (colorId: string) => {
    onChange(module, colorId);
    // Close the dropdown
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="btn btn-sm btn-ghost gap-2 m-0">
        <span
          className="w-4 h-4 rounded-full border border-base-300"
          style={{ backgroundColor: selectedColor.hex }}
        />
        {selectedColor.name}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-96 max-h-60 overflow-y-auto">
        {GOOGLE_CALENDAR_COLORS.map((color) => (
          <li key={color.id}>
            <button
              type="button"
              className={`flex items-center gap-2 ${
                currentColorId === color.id ? 'active' : ''
              }`}
              onClick={() => handleColorSelect(color.id)}
            >
              <span
                className="w-4 h-4 rounded-full border border-base-300 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name}</span>
              <span className="text-xs text-base-content/50 ml-auto">
                {color.hex}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
