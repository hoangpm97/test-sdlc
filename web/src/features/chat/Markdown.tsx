import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/cn";
import type { Citation } from "@/shared/types";
import { CitationChip } from "./CitationChip";
import { remarkCitations } from "./remarkCitations";

interface MarkdownProps {
  content: string;
  /** null = chưa có dữ liệu nguồn (đang stream) */
  citations: Citation[] | null;
  streaming?: boolean;
}

const remarkPlugins = [remarkGfm, remarkCitations];

export const Markdown = memo(function Markdown({ content, citations, streaming }: MarkdownProps) {
  const components = useMemo<Components>(
    () => ({
      cite: ({ node }) => {
        const index = Number(node?.properties?.dataIndex);
        return (
          <CitationChip
            index={index}
            citation={citations?.find((c) => c.index === index) ?? null}
          />
        );
      },
      a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
      table: ({ node: _node, ...props }) => (
        <div className="overflow-x-auto">
          <table {...props} />
        </div>
      ),
    }),
    [citations],
  );

  return (
    <div className={cn("prose-chat break-words", streaming && "streaming-caret")}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
