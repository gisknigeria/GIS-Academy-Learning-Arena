import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useRef } from "react";

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
  // Track whether the editor has been initialised so we don't overwrite user input
  const initialised = useRef(false);

  // Only set innerHTML on first mount or when value changes externally (not from our own syncContent)
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = normalizeLessonNoteHtml(value);

    // Skip the update if we just emitted this value — prevents cursor-jump on every keystroke
    if (initialised.current && lastEmittedRef.current === value) return;

    if (!initialised.current || editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
    initialised.current = true;
  }, [value]);

  function exec(command: string, valueArg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    syncContent();
  }

  function syncContent() {
    const nextHtml = editorRef.current?.innerHTML ?? "";
    lastEmittedRef.current = nextHtml;
    onChange(nextHtml);
  }

  function insertHeading(level: 1 | 2) {
    exec("formatBlock", `h${level}`);
  }

  function insertLink() {
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;
    exec("createLink", url);
  }

  function insertCodeBlock() {
    editorRef.current?.focus();

    // Wrap the current selection in a <pre><code> block
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = selectedText || "// your code here";
      pre.appendChild(code);

      range.deleteContents();
      range.insertNode(pre);

      // Move cursor to end of inserted node
      const newRange = document.createRange();
      newRange.setStartAfter(pre);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    syncContent();
  }

  function insertHRule() {
    exec("insertHTML", "<hr /><p><br /></p>");
  }

  return (
    <div className="lesson-note-editor">
      <div className="lesson-note-editor__toolbar" role="toolbar" aria-label="Lesson note formatting">
        {/* Text style */}
        <button type="button" className="icon-button" onClick={() => exec("bold")} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => exec("italic")} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => exec("underline")} title="Underline">
          <Underline size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => exec("strikeThrough")} title="Strikethrough">
          <Strikethrough size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* Headings */}
        <button type="button" className="icon-button" onClick={() => insertHeading(1)} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => insertHeading(2)} title="Heading 2">
          <Heading2 size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* Lists */}
        <button type="button" className="icon-button" onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <List size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* Block elements */}
        <button type="button" className="icon-button" onClick={() => exec("formatBlock", "blockquote")} title="Blockquote">
          <Quote size={16} />
        </button>
        <button type="button" className="icon-button" onClick={insertCodeBlock} title="Code block">
          <Code size={16} />
        </button>
        <button type="button" className="icon-button" onClick={insertHRule} title="Horizontal divider">
          <Minus size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* Link */}
        <button type="button" className="icon-button" onClick={insertLink} title="Insert link">
          <Link size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        className="lesson-note-editor__content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Write the lesson explanation, examples, instructions, or transcript..."}
        onInput={syncContent}
        onBlur={syncContent}
      />
    </div>
  );
}
