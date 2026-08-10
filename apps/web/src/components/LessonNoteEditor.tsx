import {
  Bold, Code, Heading1, Heading2, ImagePlus, Italic, Link as LinkIcon,
  List, ListOrdered, Minus, Quote, Redo2, Strikethrough,
  Underline as UnderlineIcon, Undo2,
} from "lucide-react";
import { ClipboardEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";

type LessonNoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<string>;
};

type ActiveFormats = {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean;
  heading1: boolean; heading2: boolean; bulletList: boolean; orderedList: boolean;
  blockquote: boolean; codeBlock: boolean; link: boolean;
};

const EMPTY_FORMATS: ActiveFormats = {
  bold: false, italic: false, underline: false, strike: false,
  heading1: false, heading2: false, bulletList: false, orderedList: false,
  blockquote: false, codeBlock: false, link: false,
};

const MAX_PASTED_TEXT_LENGTH = 200_000;

export function normalizeLessonNoteHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasBlockTag = /<(h1|h2|h3|h4|p|ul|ol|li|blockquote|pre|table|div|section)[\s>]/i.test(trimmed);
  if (hasBlockTag) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function acknowledgePendingLessonNoteValue(pending: string[], value: string): boolean {
  const index = pending.lastIndexOf(value);
  if (index < 0) return false;
  pending.splice(0, index + 1);
  return true;
}

const TEXT_COLORS = [
  { label: "Default", value: "" }, { label: "Red", value: "#e53e3e" },
  { label: "Orange", value: "#dd6b20" }, { label: "Yellow", value: "#d69e2e" },
  { label: "Green", value: "#38a169" }, { label: "Teal", value: "#319795" },
  { label: "Blue", value: "#3182ce" }, { label: "Purple", value: "#805ad5" },
  { label: "Pink", value: "#d53f8c" }, { label: "Gray", value: "#718096" },
  { label: "Black", value: "#1a202c" },
];

function readEditorHtml(element: HTMLDivElement): string {
  const html = element.innerHTML.trim();
  return !element.textContent?.trim() && !element.querySelector("img, hr") ? "" : html;
}

export function LessonNoteEditor({ value, onChange, placeholder, onUploadImage }: LessonNoteEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("");
  const [formats, setFormats] = useState<ActiveFormats>(EMPTY_FORMATS);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editorError, setEditorError] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const pendingValues = useRef<string[]>([]);
  const savedRange = useRef<Range | null>(null);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = readEditorHtml(editorRef.current);
    pendingValues.current.push(html);
    if (pendingValues.current.length > 100) pendingValues.current.shift();
    onChange(html);
  }, [onChange]);

  const updateFormats = useCallback(() => {
    const selection = window.getSelection();
    if (!editorRef.current || !selection?.anchorNode || !editorRef.current.contains(selection.anchorNode)) return;
    const block = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
    setFormats({
      bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"),
      heading1: block === "h1", heading2: block === "h2",
      bulletList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
      blockquote: block === "blockquote", codeBlock: block === "pre",
      link: Boolean(selection.anchorNode.parentElement?.closest("a")),
    });
    const color = String(document.queryCommandValue("foreColor") || "");
    if (color) setActiveColor(color);
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    editorRef.current?.focus();
    if (!savedRange.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange.current);
  }, []);

  const runCommand = useCallback((command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emitChange();
    updateFormats();
    saveSelection();
  }, [emitChange, restoreSelection, saveSelection, updateFormats]);

  useEffect(() => {
    const element = editorRef.current;
    if (!element) return;
    if (acknowledgePendingLessonNoteValue(pendingValues.current, value)) return;
    const normalized = normalizeLessonNoteHtml(value);
    if (element.innerHTML !== normalized) {
      element.innerHTML = normalized;
      pendingValues.current = [];
    }
  }, [value]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) setShowColorPicker(false);
    }
    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("selectionchange", updateFormats);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("selectionchange", updateFormats);
    };
  }, [updateFormats]);

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    setEditorError("");
    const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
    if (images.length) {
      saveSelection();
      void insertImages(images);
      return;
    }
    const rawText = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, rawText.slice(0, MAX_PASTED_TEXT_LENGTH));
    emitChange();
    saveSelection();
    if (rawText.length > MAX_PASTED_TEXT_LENGTH) {
      setEditorError("Only the first 200,000 pasted characters were inserted to keep the editor responsive.");
    }
  }

  function insertLink() {
    saveSelection();
    const url = window.prompt("Enter URL:", "https://");
    if (url === null) return;
    if (!url.trim()) return runCommand("unlink");
    runCommand("createLink", /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url}`);
  }

  function applyColor(color: string) {
    setShowColorPicker(false);
    setActiveColor(color);
    runCommand("foreColor", color || "#1a202c");
  }

  async function insertImages(files: File[]) {
    if (!onUploadImage) return setEditorError("Image uploads are not available right now.");
    setUploadingImage(true);
    setEditorError("");
    try {
      for (const file of files) {
        const url = await onUploadImage(file);
        restoreSelection();
        const image = document.createElement("img");
        image.src = url;
        image.alt = file.name.replace(/\.[^.]+$/, "");
        image.className = "lesson-note-img";
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        if (range) {
          range.deleteContents(); range.insertNode(image); range.setStartAfter(image); range.collapse(true);
          selection?.removeAllRanges(); selection?.addRange(range); savedRange.current = range.cloneRange();
        } else editorRef.current?.append(image);
      }
      emitChange();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  const buttonClass = (active: boolean) => `icon-button${active ? " icon-button--active" : ""}`;
  const toolbarAction = (action: () => void) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); saveSelection(); action();
  };

  return <div className="lesson-note-editor">
    <div className="lesson-note-editor__toolbar" role="toolbar" aria-label="Lesson note formatting">
      <button type="button" className={buttonClass(formats.bold)} onMouseDown={toolbarAction(() => runCommand("bold"))} title="Bold"><Bold size={16} /></button>
      <button type="button" className={buttonClass(formats.italic)} onMouseDown={toolbarAction(() => runCommand("italic"))} title="Italic"><Italic size={16} /></button>
      <button type="button" className={buttonClass(formats.underline)} onMouseDown={toolbarAction(() => runCommand("underline"))} title="Underline"><UnderlineIcon size={16} /></button>
      <button type="button" className={buttonClass(formats.strike)} onMouseDown={toolbarAction(() => runCommand("strikeThrough"))} title="Strikethrough"><Strikethrough size={16} /></button>
      <div className="lesson-note-editor__color-wrap" ref={colorPickerRef}>
        <button type="button" className="icon-button lesson-note-editor__color-btn" onMouseDown={toolbarAction(() => setShowColorPicker((current) => !current))} title="Text colour" aria-label="Text colour"><span className="lesson-note-editor__color-icon"><span style={{ color: activeColor || "inherit" }}>A</span><span className="lesson-note-editor__color-swatch" style={{ background: activeColor || "var(--ink)" }} /></span></button>
        {showColorPicker ? <div className="lesson-note-editor__color-picker" role="menu" aria-label="Pick a text colour">{TEXT_COLORS.map((color) => <button key={color.value || "default"} type="button" className="lesson-note-editor__color-dot" title={color.label} aria-label={color.label} onMouseDown={toolbarAction(() => applyColor(color.value))} style={{ background: color.value || "#e2e8f0" }} />)}</div> : null}
      </div>
      <span className="lesson-note-editor__divider" />
      <button type="button" className={buttonClass(formats.heading1)} onMouseDown={toolbarAction(() => runCommand("formatBlock", formats.heading1 ? "p" : "h1"))} title="Heading 1"><Heading1 size={16} /></button>
      <button type="button" className={buttonClass(formats.heading2)} onMouseDown={toolbarAction(() => runCommand("formatBlock", formats.heading2 ? "p" : "h2"))} title="Heading 2"><Heading2 size={16} /></button>
      <span className="lesson-note-editor__divider" />
      <button type="button" className={buttonClass(formats.bulletList)} onMouseDown={toolbarAction(() => runCommand("insertUnorderedList"))} title="Bullet list"><List size={16} /></button>
      <button type="button" className={buttonClass(formats.orderedList)} onMouseDown={toolbarAction(() => runCommand("insertOrderedList"))} title="Numbered list"><ListOrdered size={16} /></button>
      <span className="lesson-note-editor__divider" />
      <button
        type="button"
        className={`${buttonClass(formats.blockquote)} lesson-note-editor__callout-button`}
        onMouseDown={toolbarAction(() => runCommand("formatBlock", formats.blockquote ? "p" : "blockquote"))}
        title="Definition / note callout"
        aria-label="Definition or note with vertical line"
      >
        <span className="lesson-note-editor__callout-line" aria-hidden="true" />
        <Quote size={13} />
      </button>
      <button type="button" className={buttonClass(formats.codeBlock)} onMouseDown={toolbarAction(() => runCommand("formatBlock", formats.codeBlock ? "p" : "pre"))} title="Code block"><Code size={16} /></button>
      <button type="button" className="icon-button" onMouseDown={toolbarAction(() => runCommand("insertHorizontalRule"))} title="Horizontal divider"><Minus size={16} /></button>
      <span className="lesson-note-editor__divider" />
      <button type="button" className="icon-button" onMouseDown={toolbarAction(() => runCommand("undo"))} title="Undo"><Undo2 size={16} /></button>
      <button type="button" className="icon-button" onMouseDown={toolbarAction(() => runCommand("redo"))} title="Redo"><Redo2 size={16} /></button>
      <span className="lesson-note-editor__divider" />
      <button type="button" className={buttonClass(formats.link)} onMouseDown={toolbarAction(insertLink)} title="Insert / edit link"><LinkIcon size={16} /></button>
      <button type="button" className="icon-button" disabled={uploadingImage} onMouseDown={toolbarAction(() => imageInputRef.current?.click())} title="Insert image" aria-label={uploadingImage ? "Uploading image" : "Insert image"}><ImagePlus size={16} /></button>
      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onChange={(event) => { saveSelection(); void insertImages(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} />
    </div>
    {editorError ? <p className="lesson-note-editor__error" role="alert">{editorError}</p> : null}
    <div className="lesson-note-editor__content"><div
      ref={editorRef} className="lesson-note-editor__prose" contentEditable suppressContentEditableWarning spellCheck
      role="textbox" aria-multiline="true" aria-label="Lesson notes and instructions"
      data-placeholder={placeholder ?? "Write the lesson explanation, examples, instructions, or transcript..."}
      onInput={() => { emitChange(); saveSelection(); }} onPaste={handlePaste}
      onKeyUp={() => { saveSelection(); updateFormats(); }} onMouseUp={() => { saveSelection(); updateFormats(); }}
      onFocus={() => { saveSelection(); updateFormats(); }}
    /></div>
  </div>;
}
