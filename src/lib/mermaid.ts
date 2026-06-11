import mermaid from 'mermaid';

// Initialise once at module load. `securityLevel: 'strict'` sanitises the rendered
// SVG, which matters because the diagram source is model-generated, not trusted.
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  flowchart: { curve: 'basis', useMaxWidth: true },
});

// Mermaid needs a unique id per render to namespace the SVG it produces.
let renderCounter = 0;

// Validate, then render Mermaid source to an SVG string. Both steps reject on
// invalid syntax; callers surface the message to the user.
export async function renderMermaid(code: string): Promise<string> {
  await mermaid.parse(code); // rejects with a readable message on syntax errors
  const { svg } = await mermaid.render(`diagram-${++renderCounter}`, code);
  return svg;
}
