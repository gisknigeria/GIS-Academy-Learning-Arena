import {
  Bold,
  Code,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
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

// Preset text colours available in the picker
const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red",     value: "#e53e3e" },
  { label: "Orange",  value: "#dd6b20" },
  { label: "Yellow",  value: "#d69e2e" },
  { label: "Green",   value: "#38a169" },
  { label: "Teal",    value: "#319795" },
  { label: "Blue",    value: "#3182ce" },
  { label: "Purple",  value: "#805ad5" },
  { label: "Pink",    value: "#d53f8c" },
  { label: "Gray",    value: "#718096" },
  { label: "White",   value: "#ffffff" },
  { label: "Black",   value: "#1a202c" },
];

// Save & restore the current selection so toolbar interactions don't lose it
function saveSelection(): Range | null {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).cloneRange();
  return null;
}

function restoreSelection(range: Range | null) {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

export function LessonNoteEditor({ value, onChange, placeholder }: LessonNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const lastEmittedRef = useRef<string>("");

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  // Hidden file input for image uploads
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Seed the editor on mount / external value change only
  useEffect(() => {
    if (!editorRef.current) return;
    if (mountedRef.current && lastEmittedRef.current === value) return;

    const nextHtml = normalizeLessonNoteHtml(value);
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
    mountedRef.current = true;
  }, [value]);

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function syncContent() {
    const nextHtml = editorRef.current?.innerHTML ?? "";
    lastEmittedRef.current = nextHtml;
    onChange(nextHtml);
  }

  function exec(command: string, valueArg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg ?? undefined);
    syncContent();
  }

  function formatBlock(tag: string) {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    syncContent();
  }

  function insertLink() {
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;
    exec("createLink", url);
  }

  function insertCodeBlock() {
    editorRef.current?.focus();
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
      const newRange = document.createRange();
      newRange.setStartAfter(pre);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    syncContent();
  }

  function insertHRule() {
    exec("insertHTML", "<hr><p><br></p>");
  }

  // ── Colour picker ────────────────────────────────────────────────────
  function openColorPicker() {
    savedSelectionRef.current = saveSelection();
    setShowColorPicker((v) => !v);
  }

  function applyColor(color: string) {
    setActiveColor(color);
    setShowColorPicker(false);
    restoreSelection(savedSelectionRef.current);
    editorRef.current?.focus();
    if (color) {
      document.execCommand("foreColor", false, color);
    } else {
      document.execCommand("removeFormat", false, undefined);
    }
    syncContent();
  }

  // ── Image upload ─────────────────────────────────────────────────────
  function openImagePicker() {
    // Save cursor position before the file dialog steals focus
    savedSelectionRef.current = saveSelection();
    imageInputRef.current?.click();
  }

  function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        // Restore the saved cursor position so the image lands where the user was
        restoreSelection(savedSelectionRef.current);
        editorRef.current?.focus();

        // Build a figure wrapper so we can style/resize the image
        const figure = document.createElement("figure");
        figure.className = "lesson-note-image";

        const img = document.createElement("img");
        img.src = dataUrl;
        img.alt = file.name.replace(/\.[^.]+$/, ""); // use filename as alt, strip extension
        img.style.maxWidth = "100%";

        figure.appendChild(img);

        // Insert at cursor; fall back to appending if no selection
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(figure);
          // Move cursor to after the figure
          const newRange = document.createRange();
          newRange.setStartAfter(figure);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          editorRef.current?.appendChild(figure);
        }

        syncContent();
      };
      reader.readAsDataURL(file);
    });
  }

  // Also handle drag-and-drop images directly onto the editor
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const imageFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return; // let browser handle non-image drops

    e.preventDefault();
    savedSelectionRef.current = saveSelection();

    const dt = new DataTransfer();
    imageFiles.forEach((f) => dt.items.add(f));
    handleImageFiles(dt.files);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return; // let browser handle plain text/html paste

    e.preventDefault();
    savedSelectionRef.current = saveSelection();

    const dt = new DataTransfer();
    imageFiles.forEach((f) => dt.items.add(f));
    handleImageFiles(dt.files);
  }

  return (
    <div className="lesson-note-editor">
      <div className="lesson-note-editor__toolbar" role="toolbar" aria-label="Lesson note formatting">

        {/* ── Text style ──────────────────────────── */}
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} title="Underline">
          <Underline size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }} title="Strikethrough">
          <Strikethrough size={16} />
        </button>

        {/* ── Text colour ─────────────────────────── */}
        <div className="lesson-note-editor__color-wrap" ref={colorPickerRef}>
          <button
            type="button"
            className="icon-button lesson-note-editor__color-btn"
            onMouseDown={(e) => { e.preventDefault(); openColorPicker(); }}
            title="Text colour"
            aria-label="Text colour"
          >
            <span className="lesson-note-editor__color-icon">
              <span style={{ color: activeColor || "inherit" }}>A</span>
              <span className="lesson-note-editor__color-swatch" style={{ background: activeColor || "var(--ink)" }} />
            </span>
          </button>

          {showColorPicker && (
            <div className="lesson-note-editor__color-picker" role="menu" aria-label="Pick a text colour">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value || "default"}
                  type="button"
                  className="lesson-note-editor__color-dot"
                  title={c.label}
                  aria-label={c.label}
                  onMouseDown={(e) => { e.preventDefault(); applyColor(c.value); }}
                  style={{
                    background: c.value || "#e2e8f0",
                    outline: activeColor === c.value ? "2px solid var(--green-700)" : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="lesson-note-editor__divider" />

        {/* ── Headings ────────────────────────────── */}
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); formatBlock("h1"); }} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); formatBlock("h2"); }} title="Heading 2">
          <Heading2 size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* ── Lists ───────────────────────────────── */}
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} title="Bullet list">
          <List size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} title="Numbered list">
          <ListOrdered size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* ── Blocks ──────────────────────────────── */}
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); formatBlock("blockquote"); }} title="Blockquote">
          <Quote size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); insertCodeBlock(); }} title="Code block">
          <Code size={16} />
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); insertHRule(); }} title="Horizontal divider">
          <Minus size={16} />
        </button>

        <span className="lesson-note-editor__divider" />

        {/* ── Link ────────────────────────────────── */}
        <button type="button" className="icon-button" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} title="Insert link">
          <Link size={16} />
        </button>

        {/* ── Image ───────────────────────────────── */}
        <button
          type="button"
          className="icon-button"
          onMouseDown={(e) => { e.preventDefault(); openImagePicker(); }}
          title="Insert image"
          aria-label="Insert image"
        >
          <ImagePlus size={16} />
        </button>

        {/* Hidden file input — accepts common image types, allows multiple */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          multiple
          aria-hidden="true"
          tabIndex={-1}
          style={{ display: "none" }}
          onChange={(e) => handleImageFiles(e.target.files)}
        />

      </div>

      <div
        ref={editorRef}
        className="lesson-note-editor__content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Write the lesson explanation, examples, instructions, or transcript..."}
        onInput={syncContent}
        onBlur={syncContent}
        onDrop={handleDrop}
        onPaste={handlePaste}
      />
    </div>
  );
}
