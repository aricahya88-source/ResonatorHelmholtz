import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  formula: string;
  block?: boolean;
  label?: string;
}

function renderLatex(formula: string, displayMode: boolean) {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    return formula;
  }
}

export function LatexMath({ formula, block = false, label }: MathProps) {
  const html = renderLatex(formula, block);

  if (block) {
    return (
      <figure className="latex-block">
        {label ? <figcaption>{label}</figcaption> : null}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </figure>
    );
  }

  return <span className="latex-inline" dangerouslySetInnerHTML={{ __html: html }} />;
}
