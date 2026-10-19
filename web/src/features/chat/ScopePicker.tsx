import {
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { DocumentItem } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Checkbox, Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/overlays";

interface ScopePickerProps {
  /** null = tất cả tài liệu */
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  documents: DocumentItem[];
}

/** Bộ chọn phạm vi tài liệu cho hội thoại (FR-22) */
export function ScopePicker({ value, onChange, documents }: ScopePickerProps) {
  const [query, setQuery] = useState("");
  const selected = value ? documents.filter((d) => value.includes(d.id)) : [];
  const filtered = documents.filter((d) =>
    d.fileName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function toggle(id: string) {
    const current = new Set(value ?? []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange(current.size > 0 ? [...current] : null);
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full">
            <LayersIcon className="text-brand" />
            {value ? `${selected.length} tài liệu` : `Tất cả tài liệu (${documents.length})`}
            <ChevronDownIcon className="text-fg-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <div className="relative border-b border-line">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tài liệu…"
              className="h-11 w-full bg-transparent pr-3 pl-9 text-small focus:outline-none"
              aria-label="Tìm tài liệu"
            />
          </div>
          <div className="scrollbar-thin max-h-72 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small hover:bg-surface-3"
            >
              <LayersIcon className="size-4 text-brand" />
              <span className="flex-1 font-medium">Tất cả tài liệu</span>
              {value === null && <CheckIcon className="size-4 text-brand" />}
            </button>
            <div className="my-1 h-px bg-line" />
            {filtered.length === 0 && (
              <p className="px-2.5 py-4 text-center text-small text-fg-muted">
                Không có tài liệu phù hợp
              </p>
            )}
            {filtered.map((doc) => (
              <label
                key={doc.id}
                htmlFor={`scope-${doc.id}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-small hover:bg-surface-3"
              >
                <Checkbox
                  id={`scope-${doc.id}`}
                  checked={Boolean(value?.includes(doc.id))}
                  onCheckedChange={() => toggle(doc.id)}
                />
                <FileTextIcon className="size-4 shrink-0 text-fg-muted" />
                <span className="truncate">{doc.fileName}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Chip các tài liệu đang chọn – luôn hiển thị phạm vi (FR-22) */}
      <div className="hidden min-w-0 items-center gap-1.5 overflow-hidden lg:flex">
        <AnimatePresence initial={false}>
          {selected.slice(0, 2).map((doc) => (
            <motion.span
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex max-w-44 items-center gap-1 rounded-full bg-brand-soft py-0.5 pr-1 pl-2.5 text-[12px] text-brand-soft-fg"
            >
              <span className="truncate">{doc.fileName}</span>
              <button
                type="button"
                onClick={() => toggle(doc.id)}
                aria-label={`Bỏ ${doc.fileName} khỏi phạm vi`}
                className="rounded-full p-0.5 hover:bg-brand/15"
              >
                <XIcon className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {selected.length > 2 && (
          <span className={cn("shrink-0 text-[12px] text-fg-muted")}>+{selected.length - 2}</span>
        )}
      </div>
    </div>
  );
}
