import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "./chat-markdown";

// Newlines between tags are dropped so the checks are about the elements, not the spacing.
const render = (markdown: string) => renderToStaticMarkup(createElement(ChatMarkdown, null, markdown)).replaceAll("\n", "");

describe("ChatMarkdown", () => {
  it("renders bold, lists, and links", () => {
    expect(render("You have one project: **Countertop Island**.")).toContain('<strong class="font-semibold">Countertop Island</strong>');
    expect(render("- Replace filter\n- Test smoke alarm")).toMatch(/<ul[^>]*><li>Replace filter<\/li><li>Test smoke alarm<\/li><\/ul>/);
    expect(render("[the manual](https://example.com/manual)")).toContain('href="https://example.com/manual"');
    expect(render("[the manual](https://example.com/manual)")).toContain('target="_blank"');
  });

  it("gives headings their own sizes, as paragraphs so they don't change the page's outline", () => {
    expect(render("# Due this week")).toMatch(/^<p class="[^"]*text-lg[^"]*">Due this week<\/p>$/);
    expect(render("## Fire pit")).toMatch(/^<p class="[^"]*text-base[^"]*">Fire pit<\/p>$/);
  });

  it("drops HTML, images, and unsafe links", () => {
    expect(render('Hi <script>alert(1)</script><img src="x" onerror="alert(1)">')).not.toMatch(/script|img|onerror/);
    expect(render("![a photo](https://example.com/x.png)")).not.toContain("<img");
    expect(render("[click](javascript:alert(1))")).not.toContain("javascript:");
  });
});
