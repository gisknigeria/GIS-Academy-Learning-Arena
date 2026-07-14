import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, Presentation } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type ViewerInstance = import("@petepetepete/pptxviewjs").PPTXViewer;

type PowerPointViewerProps = {
  src: string;
  title: string;
};

export function PowerPointViewer({ src, title }: PowerPointViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changingSlide, setChangingSlide] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPresentation() {
      setLoading(true);
      setError("");
      setSlideIndex(0);
      setSlideCount(0);

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`The presentation could not be downloaded (${response.status}).`);

        const presentation = await response.arrayBuffer();
        if (!presentation.byteLength) throw new Error("The uploaded presentation is empty.");

        const { PPTXViewer } = await import("@petepetepete/pptxviewjs");
        if (cancelled || !canvasRef.current) return;

        const viewer = new PPTXViewer({
          canvas: canvasRef.current,
          slideSizeMode: "fit",
          autoRenderFirstSlide: false,
        });
        viewerRef.current = viewer;

        await viewer.loadFile(presentation);
        if (cancelled) {
          viewer.destroy();
          return;
        }

        await viewer.render(canvasRef.current, { slideIndex: 0, quality: "high" });
        setSlideCount(viewer.getSlideCount());
        setSlideIndex(viewer.getCurrentSlideIndex());
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "This PowerPoint could not be displayed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPresentation();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [src]);

  async function moveToSlide(nextIndex: number) {
    const viewer = viewerRef.current;
    if (!viewer || changingSlide || nextIndex < 0 || nextIndex >= slideCount) return;

    setChangingSlide(true);
    try {
      await viewer.goToSlide(nextIndex, canvasRef.current);
      setSlideIndex(viewer.getCurrentSlideIndex());
    } finally {
      setChangingSlide(false);
    }
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      void moveToSlide(slideIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      void moveToSlide(slideIndex + 1);
    }
  }

  async function openFullscreen() {
    await stageRef.current?.requestFullscreen?.();
  }

  return (
    <div
      ref={stageRef}
      className="powerpoint-viewer"
      tabIndex={0}
      onKeyDown={handleKeyboard}
      aria-label={`${title} slide viewer`}
    >
      <div className="powerpoint-canvas-wrap">
        <canvas ref={canvasRef} aria-label={title} />

        {loading ? (
          <div className="powerpoint-viewer-state" role="status">
            <Presentation size={34} />
            <strong>Preparing presentation...</strong>
            <span>The slides will appear here.</span>
          </div>
        ) : null}

        {error ? (
          <div className="powerpoint-viewer-state powerpoint-viewer-state--error" role="alert">
            <Presentation size={34} />
            <strong>We could not display this presentation</strong>
            <span>{error}</span>
            <a className="secondary-button" href={src} target="_blank" rel="noreferrer">
              Open original file
              <ExternalLink size={16} />
            </a>
          </div>
        ) : null}
      </div>

      {!loading && !error && slideCount > 0 ? (
        <div className="powerpoint-controls">
          <button
            type="button"
            className="icon-button"
            onClick={() => void moveToSlide(slideIndex - 1)}
            disabled={changingSlide || slideIndex === 0}
            aria-label="Previous slide"
            title="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>

          <strong>Slide {slideIndex + 1} of {slideCount}</strong>

          <button
            type="button"
            className="icon-button"
            onClick={() => void moveToSlide(slideIndex + 1)}
            disabled={changingSlide || slideIndex >= slideCount - 1}
            aria-label="Next slide"
            title="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            className="icon-button powerpoint-fullscreen-button"
            onClick={() => void openFullscreen()}
            aria-label="View presentation full screen"
            title="Full screen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
