/**
 * Plugin remark chuyển "[n]" trong câu trả lời thành node trích dẫn,
 * được render thành phần tử <cite data-index="n"> rồi thay bằng <CitationChip /> (plan mục 7.3).
 */

type Part = { type: "text"; value: string } | { type: "cite"; index: number };

export function splitCitations(text: string): Part[] {
  const parts: Part[] = [];
  const pattern = /\[(\d{1,2})\]/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: "text", value: text.slice(last, start) });
    parts.push({ type: "cite", index: Number(match[1]) });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

function walk(node: MdNode) {
  if (!node.children) return;
  const next: MdNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value) {
      for (const part of splitCitations(child.value)) {
        next.push(
          part.type === "text"
            ? { type: "text", value: part.value }
            : {
                type: "citation",
                children: [],
                data: { hName: "cite", hProperties: { dataIndex: part.index } },
              },
        );
      }
    } else {
      if (child.type !== "code" && child.type !== "inlineCode") walk(child);
      next.push(child);
    }
  }
  node.children = next;
}

export function remarkCitations() {
  return (tree: MdNode) => walk(tree);
}
