"use client";

import { MODULES, MODULE_IDS, type ModuleId } from "@/lib/modules/registry";
import { legacyBusinessTypeToModule } from "@/lib/modules/resolve";

/**
 * Business type for a catalog: one list grouped by module (Restaurant, Café & Bakery, Shop,
 * Services). The chosen sub-type decides the module, so both are always consistent.
 */
export function ModuleTypePicker({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (businessType: string, module: ModuleId) => void;
  className?: string;
}) {
  const current = legacyBusinessTypeToModule(value);
  // Old values (e.g. "other", "supermarket") show as the module's first sub-type until changed
  const known = MODULES[current].subTypes.some((sub) => sub.id === value);
  return (
    <select
      id={id}
      value={known ? value : MODULES[current].subTypes[0].id}
      onChange={(e) => onChange(e.target.value, legacyBusinessTypeToModule(e.target.value))}
      className={className}
    >
      {MODULE_IDS.map((moduleId) => (
        <optgroup key={moduleId} label={MODULES[moduleId].label.en}>
          {MODULES[moduleId].subTypes.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.label.en}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
