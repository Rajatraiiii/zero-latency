import { Minus, Plus } from 'lucide-react';

function DiffViewer({ originalCode = '', suggestedFix = '' }) {
  const originalLines = originalCode.split('\n');
  const suggestedLines = suggestedFix.split('\n');
  const rowCount = Math.max(originalLines.length, suggestedLines.length);

  return (
    <div className="diff-viewer" aria-label="Code diff">
      <div className="diff-column diff-before">
        {Array.from({ length: rowCount }, (_, index) => (
          <div className="diff-line" key={`before-${index}`}>
            <span className="line-number">{index + 1}</span>
            <span className="line-marker">{originalLines[index] !== suggestedLines[index] ? <Minus size={12} /> : null}</span>
            <code>{originalLines[index] ?? ''}</code>
          </div>
        ))}
      </div>
      <div className="diff-column diff-after">
        {Array.from({ length: rowCount }, (_, index) => (
          <div className="diff-line" key={`after-${index}`}>
            <span className="line-number">{index + 1}</span>
            <span className="line-marker">{originalLines[index] !== suggestedLines[index] ? <Plus size={12} /> : null}</span>
            <code>{suggestedLines[index] ?? ''}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiffViewer;
