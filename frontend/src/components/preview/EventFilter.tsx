'use client';

export interface EventFilterProps {
  modules: string[];
  selectedModule: string;
  onChange: (module: string) => void;
}

/**
 * EventFilter - Dropdown to filter events by module
 * Requirements: 6.8
 */
export function EventFilter({ modules, selectedModule, onChange }: EventFilterProps) {
  return (
    <div className="form-control w-full max-w-xs">
      <label className="label">
        <span className="label-text">Filter by Module</span>
      </label>
      <select
        className="select select-bordered focus:outline-none focus:border-primary"
        value={selectedModule}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All Modules</option>
        {modules.map((module) => (
          <option key={module} value={module}>
            {module}
          </option>
        ))}
      </select>
    </div>
  );
}
