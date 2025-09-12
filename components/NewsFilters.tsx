"use client";
import { useState } from "react";

interface NewsFiltersProps {
  sources: string[];
  onChange: (filters: { s?: string; q?: string }) => void;
}

export default function NewsFilters({ sources, onChange }: NewsFiltersProps) {
  const [s, setS] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const handleSourceChange = (value: string) => {
    setS(value);
    onChange({ s: value, q });
  };

  const handleQueryChange = (value: string) => {
    setQ(value);
    onChange({ s, q: value });
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <select 
        className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-green-500 transition-colors"
        value={s} 
        onChange={e => handleSourceChange(e.target.value)}
      >
        <option value="">Все источники</option>
        {sources.map(source => (
          <option key={source} value={source}>{source}</option>
        ))}
      </select>
      
      <input 
        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors"
        placeholder="Поиск по заголовку" 
        value={q} 
        onChange={e => handleQueryChange(e.target.value)}
      />
    </div>
  );
}
