"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import SourceIcon from './SourceIcon';

interface SourceFilterProps {
  sources: string[];
  selectedSources: string[];
  onSourceToggle: (source: string) => void;
}

const SourceFilter: FC<SourceFilterProps> = ({ sources, selectedSources, onSourceToggle }) => {
  return (
    <div className="mb-8 p-4 bg-card rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3 text-card-foreground">Filter by Source</h2>
      <div className="flex flex-wrap gap-3">
        {sources.map((source) => (
          <Button
            key={source}
            variant={selectedSources.includes(source) ? "default" : "outline"}
            onClick={() => onSourceToggle(source)}
            className="transition-all duration-200 ease-in-out transform hover:scale-105"
            aria-pressed={selectedSources.includes(source)}
          >
            <SourceIcon sourceName={source} className="mr-2 w-5 h-5" />
            {source}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SourceFilter;
