import { readFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mdToPdf } from 'md-to-pdf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/**
 * Ordered list of markdown files to include in the PDF.
 * Paths are relative to the project root.
 */
const FILES = [
  'README.md',
  'docs/developer/README.md',
  'docs/developer/setup-and-configuration.md',
  'docs/developer/architecture.md',
  'docs/developer/data-model.md',
  'docs/developer/authentication.md',
  'docs/developer/permissions.md',
  'docs/developer/backend-api.md',
  'docs/developer/services-and-state.md',
  'docs/developer/components.md',
  'docs/user/README.md',
  'docs/user/getting-started.md',
  'docs/user/access-and-roles.md',
  'docs/user/manage-users.md',
  'docs/user/managing-sections.md',
  'docs/user/managing-subsections.md',
  'docs/user/documents.md',
  'docs/user/links.md',
  'docs/user/search.md',
  'docs/user/trash-bin.md',
];

/**
 * Converts a root-relative file path to a stable HTML anchor ID.
 * e.g. "docs/user/getting-started.md" -> "docs-user-getting-started"
 */
function pathToAnchorId(rootRelativePath) {
  return rootRelativePath
    .replace(/\.mdx?$/, '')
    .replace(/[/\\]/g, '-')
    .replace(/\./g, '-')
    .toLowerCase();
}

// Map from absolute path -> anchor ID for every file in the set.
const fileAnchorMap = new Map(
  FILES.map((f) => [resolve(root, f), pathToAnchorId(f)])
);

/**
 * Rewrites cross-file markdown links to internal #anchor-id references so
 * they work as clickable links within the combined PDF.
 * Same-file #fragment links and external URLs are left unchanged.
 */
function rewriteLinks(content, sourceDir) {
  return content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href) => {
    if (/^https?:\/\//.test(href) || href.startsWith('#')) return match;

    const [filePart, fragment] = href.split('#');
    if (!filePart.match(/\.mdx?$/)) return match;

    const absPath = resolve(sourceDir, filePart);
    const anchorId = fileAnchorMap.get(absPath);
    if (!anchorId) return match;

    const target = fragment ? `#${fragment}` : `#${anchorId}`;
    return `[${text}](${target})`;
  });
}

/**
 * Reads all markdown files and concatenates them with page-break separators.
 * Each file is prefixed with a named anchor so cross-file links can target it.
 * @returns {string} Combined markdown content
 */
function buildCombinedMarkdown() {
  return FILES.map((relativePath) => {
    const fullPath = join(root, relativePath);
    const sourceDir = dirname(fullPath);
    const anchorId = pathToAnchorId(relativePath);
    const content = rewriteLinks(readFileSync(fullPath, 'utf-8').trimEnd(), sourceDir);
    return `<a id="${anchorId}"></a>\n\n${content}`;
  }).join('\n\n<div style="page-break-after: always;"></div>\n\n');
}

/**
 * Generates a PDF from the project README and all /docs markdown files.
 */
async function generatePdf() {
  const outputDir = join(root, 'docs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'virtual-data-room.pdf');

  console.log('Building combined markdown...');
  const combined = buildCombinedMarkdown();

  console.log(`Converting ${FILES.length} files to PDF...`);
  const pdf = await mdToPdf(
    { content: combined },
    {
      pdf_options: {
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        printBackground: true,
      },
      css: `
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; line-height: 1.6; }
        h1 { border-bottom: 2px solid #e1e4e8; padding-bottom: 8px; }
        h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: 4px; }
        code { background: #f6f8fa; padding: 2px 5px; border-radius: 3px; font-size: 85%; }
        pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d0d7de; padding: 6px 12px; }
        th { background: #f6f8fa; }
        blockquote { border-left: 4px solid #d0d7de; margin: 0; padding-left: 16px; color: #57606a; }
        img { max-width: 100%; }
      `,
    }
  );

  if (!pdf?.content) {
    throw new Error('PDF generation produced no content.');
  }

  const { writeFileSync } = await import('fs');
  writeFileSync(outputPath, pdf.content);
  console.log(`PDF written to: ${outputPath}`);
}

generatePdf().catch((error) => {
  console.error('PDF generation failed:', error.message);
  process.exit(1);
});
