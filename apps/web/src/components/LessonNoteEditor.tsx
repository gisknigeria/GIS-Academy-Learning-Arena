import { Bold, Heading1, Heading2, List, Quote, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LessonNoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeLessonNoteHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasBlockTag = /<(h1|h2|h3|h4|p|ul|ol|li|blockquote|pre|table|div|section)[\s>]/i.test(trimmed);
  if (hasBlockTag) return trimmed;

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return paragraphs;
}

export function LessonNoteEditor({ value, onChange, placeholder }: LessonNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState(normalizeLessonNoteHtml(value));

  useEffect(() => {
    const nextHtml = normalizeLessonNoteHtml(value);
    setHtml(nextHtml);
    if (editorRef.current && editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  function exec(command: string, valueArg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    syncContent();
  }

  function syncContent() {
    const nextHtml = editorRef.current?.innerHTML ?? "";
    setHtml(nextHtml);
    onChange(nextHtml);
  }

  function insertHeading(level: 1 | 2) {
    exec("formatBlock", `<h${level}>`);
  }

  return (
    <div className="lesson-note-editor">
      <div className="lesson-note-editor__toolbar" role="toolbar" aria-label="Lesson note formatting">
        <button type="button" className="icon-button" onClick={() => exec("bold")} title="Bold"><Bold size={16} /></button>
        <button type="button" className="icon-button" onClick={() => exec("italic")} title="Italic"><Type size={16} /></button>
        <button type="button" className="icon-button" onClick={() => insertHeading(1)} title="Heading 1"><Heading1 size={16} /></button>
        <button type="button" className="icon-button" onClick={() => insertHeading(2)} title="Heading 2"><Heading2 size={16} /></button>
        <button type="button" className="icon-button" onClick={() => exec("insertUnorderedList")} title="Bullet list"><List size={16} /></button>
        <button type="button" className="icon-button" onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote size={16} /></button>
      </div>
      <div
        ref={editorRef}
        className="lesson-note-editor__content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncContent}
        onBlur={syncContent}
        dangerouslySetInnerHTML={{ __html: html || `<p>${escapeHtml(placeholder ?? "Start writing your lesson note...")}</p>` }}
      />
    </div>
  );
}
