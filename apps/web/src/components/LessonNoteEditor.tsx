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
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonNoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<string>;
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

export function acknowledgePendingLessonNoteValue(pending: string[], value: string): boolean {
  const index = pending.lastIndexOf(value);
  if (index < 0) return false;
  pending.splice(0, index + 1);
  return true;
}

const MAX_PASTED_HTML_LENGTH = 500_000;
const MAX_PASTED_TEXT_LENGTH = 200_000;

export function sanitizeLessonNotePaste(html: string): string {
  if (typeof DOMParser === "undefined") return html;

  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script, style, meta, link, iframe, object, embed, svg, canvas, form, input, button")
    .forEach((node) => node.remove());

  document.body.querySelectorAll("*").forEach((element) => {
    const tag = element.tagName.toLowerCase();
    for (const attribute of Array.from(element.attributes)) {
      const keep = (tag === "a" && ["href", "title"].includes(attribute.name.toLowerCase()))
        || (tag === "img" && ["src", "alt", "title"].includes(attribute.name.toLowerCase()));
      if (!keep) element.removeAttribute(attribute.name);
    }

    if (tag === "a") {
      const href = element.getAttribute("href") ?? "";
      if (href && !/^(?:https?:|mailto:|tel:|#|\/)/i.test(href)) element.removeAttribute("href");
    }

    if (tag === "img") {
      const src = element.getAttribute("src") ?? "";
      if (!/^(?:https?:|\/)/i.test(src)) element.remove();
    }
  });

  return document.body.innerHTML;
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

export function LessonNoteEditor({ value, onChange, placeholder, onUploadImage }: LessonNoteEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingValues = useRef<string[]>([]);


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
    editorProps: {
      attributes: {
        class: "lesson-note-editor__prose",
        spellcheck: "true",
      },
      transformPastedHTML(html) {
        return sanitizeLessonNotePaste(html);
      },
      handlePaste(view, event) {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        setImageError("");

        const images = Array.from(clipboard.files).filter((file) => file.type.startsWith("image/"));
        if (images.length) {
          event.preventDefault();
          void insertImage(images);
          return true;
        }

        const html = clipboard.getData("text/html");
        if (html.length <= MAX_PASTED_HTML_LENGTH) return false;

        event.preventDefault();
        const text = clipboard.getData("text/plain").slice(0, MAX_PASTED_TEXT_LENGTH);
        view.dispatch(view.state.tr.insertText(text));
        setImageError("Heavy clipboard formatting was removed to keep the editor responsive.");
        return true;
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? "" : editor.getHTML();
      pendingValues.current.push(html);
      if (pendingValues.current.length > 100) pendingValues.current.shift();
      onChange(html);
    },
    onSelectionUpdate({ editor }) {
      setActiveColor((editor.getAttributes("textStyle").color as string | undefined) ?? "");
    },
  });

  // Sync external value changes (e.g. form reset) without disturbing the cursor.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // React can deliver an earlier onChange value after the editor has already
    // accepted more keystrokes. Treat it as an acknowledgement, not new content,
    // so setContent never moves the caret back to the beginning while typing.
    if (acknowledgePendingLessonNoteValue(pendingValues.current, value)) return;

    // Treat TipTap's empty-doc HTML and empty string as equivalent so we never
    // reset the cursor just because "" !== "<p></p>".
    const editorHtml = editor.getHTML();
    const isEmpty = (s: string) => s === "" || s === "<p></p>";
    if (isEmpty(value) && isEmpty(editorHtml)) return;

    // Only push new content when it's genuinely different from what's on screen.
    const normalized = normalizeLessonNoteHtml(value);
    if (editorHtml === normalized) return;

    editor.commands.setContent(normalized, false);
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
      const href = /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
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

  async function insertImage(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      setImageError("Please choose a supported image file.");
      return;
    }
    if (!onUploadImage) {
      setImageError("Image uploads are not available right now.");
      return;
    }

    setUploadingImage(true);
    setImageError("");
    try {
      for (const file of images) {
        const url = await onUploadImage(file);
        editor
          .chain()
          .focus()
          .setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") })
          .run();
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
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

        <button type="button" className="icon-button"
          disabled={!editor.can().undo()}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
          title="Undo"><Undo2 size={16} /></button>

        <button type="button" className="icon-button"
          disabled={!editor.can().redo()}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
          title="Redo"><Redo2 size={16} /></button>

        <span className="lesson-note-editor__divider" />

        {/* Link */}
        <button type="button" className={btnClass(editor.isActive("link"))}
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          title="Insert / edit link"><LinkIcon size={16} /></button>

        {/* Image */}
        <button type="button" className="icon-button"
          disabled={uploadingImage}
          onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
          title={uploadingImage ? "Uploading image" : "Insert image"}
          aria-label={uploadingImage ? "Uploading image" : "Insert image"}>
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
          onChange={(e) => { void insertImage(e.target.files); e.target.value = ""; }}
        />
      </div>

      {imageError ? <p className="lesson-note-editor__error" role="alert">{imageError}</p> : null}

      {/* ── Editor content area ─────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="lesson-note-editor__content"
      />
    </div>
  );
}
