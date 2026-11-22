import type { ElementType } from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

// Rookpilot's replies, rendered as markdown: bold, lists, links, and so on.
// react-markdown builds React elements and never injects HTML. On top of that, HTML in a reply
// is dropped and only simple elements are allowed, so a reply can't add images.

const ALLOWED = ["p", "strong", "em", "del", "ul", "ol", "li", "a", "code", "pre", "blockquote", "br", "h1", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td"];

/** A plain element with our classes and props. Drops `node`, the markdown tree react-markdown passes along. */
function styled(Tag: ElementType, className: string, extra: Record<string, string> = {}) {
  return function Styled(props: ExtraProps) {
    const rest: Record<string, unknown> = { ...props };
    delete rest.node;
    return <Tag className={className} {...rest} {...extra} />;
  };
}

// Headings step down in size, but stay smaller than the page's own headings: a chat bubble isn't a document.
const heading = "font-heading font-bold leading-snug [&:not(:first-child)]:mt-3";
const Table = styled("table", "w-full text-left text-xs [&_td]:border-t [&_td]:border-border [&_td]:py-1 [&_td]:pr-3 [&_th]:py-1 [&_th]:pr-3 [&_th]:font-semibold");

const components: Components = {
  p: styled("p", "[&:not(:first-child)]:mt-2"),
  ul: styled("ul", "my-1.5 list-disc space-y-0.5 pl-5"),
  ol: styled("ol", "my-1.5 list-decimal space-y-0.5 pl-5"),
  strong: styled("strong", "font-semibold"),
  a: styled("a", "underline underline-offset-2", { target: "_blank", rel: "noreferrer noopener" }),
  code: styled("code", "rounded bg-background/60 px-1 py-px font-mono text-[0.85em]"),
  pre: styled("pre", "my-1.5 overflow-x-auto rounded-lg bg-background/60 p-2 [&_code]:bg-transparent [&_code]:p-0"),
  blockquote: styled("blockquote", "my-1.5 border-l-2 border-border pl-2.5 text-muted-foreground"),
  h1: styled("p", `${heading} text-lg`),
  h2: styled("p", `${heading} text-base`),
  h3: styled("p", `${heading} text-sm`),
  h4: styled("p", `${heading} text-sm text-muted-foreground`),
  // Wide tables scroll inside the bubble instead of stretching it.
  table: (props) => (
    <div className="my-1.5 overflow-x-auto">
      <Table {...props} />
    </div>
  ),
};

export function ChatMarkdown({ children }: { children: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} allowedElements={ALLOWED} unwrapDisallowed skipHtml components={components}>
      {children}
    </Markdown>
  );
}
