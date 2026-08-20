import {
  Bold, Code, Heading1, Heading2, Highlighter, ImagePlus, Italic, Link as LinkIcon,
  Columns2, List, ListOrdered, Minus, PaintBucket, Quote, Redo2, Strikethrough,
  Table2, Underline as UnderlineIcon, Undo2, Video,
} from "lucide-react";
import { ClipboardEvent, DragEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";

type LessonNoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadMedia?: (file: File) => Promise<string>;
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

export function normalizeLessonNoteHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasEditorMarkup = /<(h1|h2|h3|h4|p|ul|ol|li|blockquote|pre|table|figure|img|video|iframe|hr|div|section|strong|b|em|i|u|s|strike|a|span|br|code|mark|sub|sup)[\s>/]/i.test(trimmed);
  if (hasEditorMarkup) return trimmed;
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

const BACKGROUND_COLORS = [
  { label: "No background", value: "transparent" },
  { label: "Soft yellow", value: "#fff59d" },
  { label: "Soft green", value: "#c6f6d5" },
  { label: "Soft blue", value: "#bee3f8" },
  { label: "Soft purple", value: "#e9d8fd" },
  { label: "Soft pink", value: "#fed7e2" },
  { label: "Soft orange", value: "#feebc8" },
  { label: "Light gray", value: "#edf2f7" },
];

export function readEditorHtml(element: HTMLDivElement): string {
  const html = element.innerHTML.trim();
  return !element.textContent?.trim() && !element.querySelector("img, video, iframe, table, hr, .lesson-note-columns") ? "" : html;
}

function isMediaFile(file: File, kind: "image" | "video") {
  if (file.type.startsWith(`${kind}/`)) return true;
  return kind === "image"
    ? /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)
    : /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
}

export function splitPopulatedListItem(editor: HTMLElement, selection: Selection | null): boolean {
  if (!selection?.rangeCount || !selection.anchorNode) return false;
  const anchor = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode.parentElement;
  const listItem = anchor?.closest("li");
  if (!listItem || !editor.contains(listItem) || !listItem.textContent?.trim()) return false;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const tailRange = document.createRange();
  tailRange.setStart(range.startContainer, range.startOffset);
  tailRange.setEnd(listItem, listItem.childNodes.length);
  const tail = tailRange.extractContents();
  const nextItem = document.createElement("li");
  nextItem.append(tail);
  if (!nextItem.hasChildNodes()) nextItem.append(document.createElement("br"));
  listItem.parentNode?.insertBefore(nextItem, listItem.nextSibling);
  const nextRange = document.createRange();
  nextRange.selectNodeContents(nextItem);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  return true;
}

export function LessonNoteEditor({ value, onChange, placeholder, onUploadMedia }: LessonNoteEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("");
  const [activeBackground, setActiveBackground] = useState("transparent");
  const [formats, setFormats] = useState<ActiveFormats>(EMPTY_FORMATS);
  const [uploadingMedia, setUploadingMedia] = useState<"image" | "video" | "">("");
  const [editorError, setEditorError] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const backgroundPickerRef = useRef<HTMLDivElement>(null);
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
    try {
      selection?.removeAllRanges();
      selection?.addRange(savedRange.current);
    } catch {
      // A saved range can become detached while an upload dialog is open.
      savedRange.current = null;
    }
  }, []);

  const runCommand = useCallback((command: string, commandValue?: string) => {
    restoreSelection();
    if (command === "italic" || command === "backColor") {
      document.execCommand("styleWithCSS", false, "true");
    }
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
      if (backgroundPickerRef.current && !backgroundPickerRef.current.contains(event.target as Node)) setShowBackgroundPicker(false);
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
      void insertMedia(images, "image");
      return;
    }
    const rawText = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, rawText);
    emitChange();
    saveSelection();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const media = Array.from(event.dataTransfer.files).filter((file) => isMediaFile(file, "image") || isMediaFile(file, "video"));
    if (!media.length) return;
    event.preventDefault();
    setEditorError("");

    const caretRange = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (caretRange && editorRef.current?.contains(caretRange.startContainer)) {
      savedRange.current = caretRange.cloneRange();
    } else {
      saveSelection();
    }
    const images = media.filter((file) => isMediaFile(file, "image"));
    const videos = media.filter((file) => isMediaFile(file, "video"));
    void (async () => {
      if (images.length) await insertMedia(images, "image");
      if (videos.length) await insertMedia(videos, "video");
    })();
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

  function applyBackgroundColor(color: string) {
    setShowBackgroundPicker(false);
    setActiveBackground(color);
    runCommand("backColor", color);
  }

  function applyQuickHighlight() {
    setActiveBackground("#fff59d");
    runCommand("backColor", "#fff59d");
  }

  function insertNodeAtSelection(node: Node) {
    restoreSelection();
    const selection = window.getSelection();
    const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const range = selectedRange && editorRef.current?.contains(selectedRange.commonAncestorContainer)
      ? selectedRange
      : null;
    const trailingParagraph = document.createElement("p");
    trailingParagraph.append(document.createElement("br"));
    const anchor = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
    const selectedFigure = anchor?.closest("figure.lesson-note-media");
    const selectedTextBlock = anchor?.closest("p, h1, h2, h3, blockquote, pre");
    const insertionAnchor = selectedFigure && editorRef.current?.contains(selectedFigure)
      ? selectedFigure
      : selectedTextBlock && editorRef.current?.contains(selectedTextBlock)
        ? selectedTextBlock
        : null;
    if (insertionAnchor?.parentNode) {
      if (range && !range.collapsed) range.deleteContents();
      insertionAnchor.parentNode.insertBefore(node, insertionAnchor.nextSibling);
      node.parentNode?.insertBefore(trailingParagraph, node.nextSibling);
    } else if (range) {
      range.deleteContents();
      range.insertNode(node);
      node.parentNode?.insertBefore(trailingParagraph, node.nextSibling);
    } else {
      editorRef.current?.append(node, trailingParagraph);
    }
    const nextRange = document.createRange();
    nextRange.setStart(trailingParagraph, 0);
    nextRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    savedRange.current = nextRange.cloneRange();
  }

  function moveCaretTo(element: Element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRange.current = range.cloneRange();
    (element as HTMLElement).focus?.();
  }

  function createMediaFigure(url: string, file: File, kind: "image" | "video") {
    const figure = document.createElement("figure");
    figure.className = `lesson-note-media lesson-note-media--${kind}`;
    figure.contentEditable = "false";
    const media = document.createElement(kind);
    media.setAttribute("src", url);
    if (kind === "image") {
      media.setAttribute("alt", file.name.replace(/\.[^.]+$/, ""));
      media.className = "lesson-note-img";
    } else {
      (media as HTMLVideoElement).controls = true;
      (media as HTMLVideoElement).preload = "metadata";
    }
    const caption = document.createElement("figcaption");
    caption.contentEditable = "true";
    caption.dataset.placeholder = "Add a short description (optional)";
    caption.setAttribute("aria-label", `${kind === "image" ? "Image" : "Video"} description`);
    figure.append(media, caption);
    return figure;
  }

  async function insertMedia(files: File[], kind: "image" | "video") {
    if (!onUploadMedia) return setEditorError("Media uploads are not available right now.");
    if (!files.length) return;
    setUploadingMedia(kind);
    setEditorError("");
    let insertedCount = 0;
    const failures: string[] = [];
    for (const file of files) {
      if (!isMediaFile(file, kind)) {
        failures.push(file.name);
        continue;
      }
      try {
        const url = await onUploadMedia(file);
        if (!url) throw new Error("The upload did not return a media URL.");
        const figure = createMediaFigure(url, file, kind);
        insertNodeAtSelection(figure);
        moveCaretTo(figure.querySelector("figcaption")!);
        insertedCount += 1;
      } catch {
        failures.push(file.name);
      }
    }
    try {
      if (insertedCount) {
        emitChange();
        saveSelection();
      }
      if (failures.length) {
        setEditorError(`${failures.length} ${kind}${failures.length === 1 ? "" : "s"} could not be inserted. Please try again.`);
      }
    } finally {
      setUploadingMedia("");
    }
  }

  function insertTable() {
    const rowInput = window.prompt("How many rows?", "3");
    if (rowInput === null) return;
    const columnInput = window.prompt("How many columns?", "3");
    if (columnInput === null) return;
    const rows = Math.min(12, Math.max(1, Number.parseInt(rowInput, 10) || 3));
    const columns = Math.min(8, Math.max(1, Number.parseInt(columnInput, 10) || 3));
    const table = document.createElement("table");
    table.className = "lesson-note-table";
    const tbody = document.createElement("tbody");
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const row = document.createElement("tr");
      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        const cell = document.createElement(rowIndex === 0 ? "th" : "td");
        cell.append(document.createElement("br"));
        row.append(cell);
      }
      tbody.append(row);
    }
    table.append(tbody);
    insertNodeAtSelection(table);
    moveCaretTo(table.querySelector("th, td")!);
    emitChange();
  }

  function insertColumns() {
    const columns = document.createElement("div");
    columns.className = "lesson-note-columns";
    for (const label of ["Left side", "Right side"]) {
      const column = document.createElement("div");
      column.className = "lesson-note-column";
      column.dataset.placeholder = `${label}: add text, an image, or a video`;
      const paragraph = document.createElement("p");
      paragraph.dataset.placeholder = column.dataset.placeholder;
      paragraph.append(document.createElement("br"));
      column.append(paragraph);
      columns.append(column);
    }
    insertNodeAtSelection(columns);
    moveCaretTo(columns.querySelector(".lesson-note-column p")!);
    emitChange();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || event.isDefaultPrevented() || event.nativeEvent.isComposing) return;
    const selection = window.getSelection();
    const anchor = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
    const caption = anchor?.closest("figcaption");
    if (caption && !event.shiftKey) {
      event.preventDefault();
      const figure = caption.closest("figure");
      let nextBlock = figure?.nextElementSibling;
      if (!nextBlock || nextBlock.tagName !== "P") {
        nextBlock = document.createElement("p");
        nextBlock.append(document.createElement("br"));
        figure?.parentNode?.insertBefore(nextBlock, figure.nextSibling);
        emitChange();
      }
      moveCaretTo(nextBlock);
      return;
    }
    if (event.shiftKey) return;
    if (!editorRef.current || !splitPopulatedListItem(editorRef.current, selection)) return;
    event.preventDefault();
    if (selection?.rangeCount) savedRange.current = selection.getRangeAt(0).cloneRange();
    emitChange();
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
      <button type="button" className="icon-button lesson-note-editor__highlight-btn" onMouseDown={toolbarAction(applyQuickHighlight)} title="Highlight selected text" aria-label="Highlight selected text"><Highlighter size={16} /><span aria-hidden="true" /></button>
      <div className="lesson-note-editor__color-wrap" ref={backgroundPickerRef}>
        <button type="button" className="icon-button lesson-note-editor__background-btn" onMouseDown={toolbarAction(() => setShowBackgroundPicker((current) => !current))} title="Text background colour" aria-label="Text background colour"><PaintBucket size={16} /><span className="lesson-note-editor__background-swatch" style={{ background: activeBackground }} /></button>
        {showBackgroundPicker ? <div className="lesson-note-editor__color-picker" role="menu" aria-label="Pick a text background colour">{BACKGROUND_COLORS.map((color) => <button key={color.value} type="button" className={`lesson-note-editor__color-dot${color.value === "transparent" ? " lesson-note-editor__color-dot--clear" : ""}`} title={color.label} aria-label={color.label} onMouseDown={toolbarAction(() => applyBackgroundColor(color.value))} style={{ background: color.value }} />)}</div> : null}
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
      <button type="button" className="icon-button" onMouseDown={toolbarAction(insertTable)} title="Insert table" aria-label="Insert table"><Table2 size={16} /></button>
      <button type="button" className="icon-button" onMouseDown={toolbarAction(insertColumns)} title="Insert two-column section" aria-label="Insert two-column section"><Columns2 size={16} /></button>
      {onUploadMedia ? <>
        <button
          type="button"
          className="icon-button"
          disabled={Boolean(uploadingMedia)}
          onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
          onClick={() => imageInputRef.current?.click()}
          title="Insert image"
          aria-label={uploadingMedia === "image" ? "Uploading image" : "Insert image"}
        ><ImagePlus size={16} /></button>
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => { const files = Array.from(event.target.files ?? []); event.currentTarget.value = ""; void insertMedia(files, "image"); }} />
        <button
          type="button"
          className="icon-button"
          disabled={Boolean(uploadingMedia)}
          onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
          onClick={() => videoInputRef.current?.click()}
          title="Insert video"
          aria-label={uploadingMedia === "video" ? "Uploading video" : "Insert video"}
        ><Video size={16} /></button>
        <input ref={videoInputRef} type="file" accept="video/*,.mp4,.webm,.mov,.m4v" hidden onChange={(event) => { const files = Array.from(event.target.files ?? []); event.currentTarget.value = ""; void insertMedia(files, "video"); }} />
      </> : null}
    </div>
    {editorError ? <p className="lesson-note-editor__error" role="alert">{editorError}</p> : null}
    <div className="lesson-note-editor__content"><div
      ref={editorRef} className="lesson-note-editor__prose" contentEditable suppressContentEditableWarning spellCheck
      role="textbox" aria-multiline="true" aria-label="Lesson notes and instructions"
      data-no-translate
      data-placeholder={placeholder ?? "Write the lesson explanation, examples, instructions, or transcript..."}
      onInput={() => { emitChange(); saveSelection(); }} onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop} onDragOver={(event) => { if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith("image/") || item.type.startsWith("video/"))) event.preventDefault(); }}
      onKeyUp={() => { saveSelection(); updateFormats(); }} onMouseUp={() => { saveSelection(); updateFormats(); }}
      onFocus={() => { saveSelection(); updateFormats(); }}
    /></div>
  </div>;
}
