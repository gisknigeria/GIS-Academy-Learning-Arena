import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonNoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeLessonNoteHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasBlockTag = /<(h1|h2|h3|h4|p|ul|ol|li|blockquote|pre|table|div|section)[\s>]/i.test(trimmed);
  if (hasBlockTag) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) =>
      `<p>${b
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

// ─── Colour palette ───────────────────────────────────────────────────────────

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
  { label: "Black",   value: "#1a202c" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonNoteEditor({ value, onChange, placeholder }: LessonNoteEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // The last HTML we pushed into onChange — used to skip no-op external updates
  const lastEmitted = useRef("");

  const editor = useEditor({
    autofocus: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: { class: "lesson-code-block" },
        },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({
        HTMLAttributes: { class: "lesson-note-img" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write the lesson explanation, examples, instructions, or transcript...",
      }),
    ],
    content: normalizeLessonNoteHtml(value),
    // Prevent TipTap from moving focus to position 0 on mount
    editorProps: {
      attributes: {
        class: "lesson-note-editor__prose",
        spellcheck: "true",
      },
      handleDOMEvents: {
        focus: (_view, event) => {
          // Only allow focus events that originate from a real user interaction
          // (pointer or keyboard), not synthetic ones fired during mount/init
          if (!event.isTrusted) return true; // block synthetic focus → return true = handled
          return false; // let natural user focus through
        },
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Sync external value changes (e.g. form reset) without disturbing the cursor
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (lastEmitted.current === value) return; // came from our own onUpdate — skip
    const normalized = normalizeLessonNoteHtml(value);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized, false); // false = don't emit update
    }
  }, [editor, value]);

  // Close colour picker on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (!editor) return null;

  // ── Toolbar actions ────────────────────────────────────────────────────────

  function insertLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", previous ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  function applyColor(color: string) {
    setActiveColor(color);
    setShowColorPicker(false);
    if (color) {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
  }

  function insertImage(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result as string, alt: file.name.replace(/\.[^.]+$/, "") })
          .run();
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Active-state helpers ──────────────────────────────────────────────────

  function btnClass(active: boolean) {
    return `icon-button${active ? " icon-button--active" : ""}`;
  }

  return (
    <div className="lesson-note-editor">

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="lesson-note-editor__toolbar" role="toolbar" aria-label="Lesson note formatting">

        {/* Text style */}
        <button type="button" className={btnClass(editor.isActive("bold"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          title="Bold"><Bold size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("italic"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          title="Italic"><Italic size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("underline"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          title="Underline"><UnderlineIcon size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("strike"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
          title="Strikethrough"><Strikethrough size={16} /></button>

        {/* Colour picker */}
        <div className="lesson-note-editor__color-wrap" ref={colorPickerRef}>
          <button
            type="button"
            className="icon-button lesson-note-editor__color-btn"
            onMouseDown={(e) => { e.preventDefault(); setShowColorPicker((v) => !v); }}
            title="Text colour" aria-label="Text colour"
          >
            <span className="lesson-note-editor__color-icon">
              <span style={{ color: activeColor || "inherit" }}>A</span>
              <span className="lesson-note-editor__color-swatch"
                style={{ background: activeColor || "var(--ink)" }} />
            </span>
          </button>
          {showColorPicker && (
            <div className="lesson-note-editor__color-picker" role="menu" aria-label="Pick a text colour">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value || "default"}
                  type="button"
                  className="lesson-note-editor__color-dot"
                  title={c.label} aria-label={c.label}
                  onMouseDown={(e) => { e.preventDefault(); applyColor(c.value); }}
                  style={{
                    background: c.value || "#e2e8f0",
                    outline: activeColor === c.value ? "2px solid var(--green-700)" : undefined,
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="lesson-note-editor__divider" />

        {/* Headings */}
        <button type="button" className={btnClass(editor.isActive("heading", { level: 1 }))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
          title="Heading 1"><Heading1 size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("heading", { level: 2 }))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          title="Heading 2"><Heading2 size={16} /></button>

        <span className="lesson-note-editor__divider" />

        {/* Lists */}
        <button type="button" className={btnClass(editor.isActive("bulletList"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          title="Bullet list"><List size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("orderedList"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          title="Numbered list"><ListOrdered size={16} /></button>

        <span className="lesson-note-editor__divider" />

        {/* Blocks */}
        <button type="button" className={btnClass(editor.isActive("blockquote"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
          title="Blockquote"><Quote size={16} /></button>

        <button type="button" className={btnClass(editor.isActive("codeBlock"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }}
          title="Code block"><Code size={16} /></button>

        <button type="button" className="icon-button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
          title="Horizontal divider"><Minus size={16} /></button>

        <span className="lesson-note-editor__divider" />

        {/* Link */}
        <button type="button" className={btnClass(editor.isActive("link"))}
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          title="Insert / edit link"><LinkIcon size={16} /></button>

        {/* Image */}
        <button type="button" className="icon-button"
          onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
          title="Insert image" aria-label="Insert image">
          <ImagePlus size={16} />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          multiple
          aria-hidden="true"
          tabIndex={-1}
          style={{ display: "none" }}
          onChange={(e) => { insertImage(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* ── Editor content area ─────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="lesson-note-editor__content"
      />
    </div>
  );
}
