export interface ClientCoordinates {
  clientX: number;
  clientY: number;
}

export interface CanvasDimensionsLike {
  width: number;
  height: number;
  getBoundingClientRect: () => {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface CanvasPoint {
  x: number;
  y: number;
}

/**
 * Maps a viewport-relative client coordinate to the exact internal canvas coordinate.
 * Shared mapping formula:
 *   x = (e.clientX - rect.left) * (canvas.width / rect.width)
 *   y = (e.clientY - rect.top) * (canvas.height / rect.height)
 * using canvas.getBoundingClientRect() fresh on each event.
 */
export function mapPointerEventToCanvas(
  e: ClientCoordinates,
  canvas: CanvasDimensionsLike
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  const rectWidth = rect.width || 1;
  const rectHeight = rect.height || 1;

  return {
    x: (e.clientX - rect.left) * (canvas.width / rectWidth),
    y: (e.clientY - rect.top) * (canvas.height / rectHeight)
  };
}

/**
 * Converts a mapped canvas coordinate back to element CSS space (for DOM cursor alignment)
 */
export function canvasPointToCss(
  point: CanvasPoint,
  canvas: CanvasDimensionsLike
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = canvas.width || 1;
  const canvasHeight = canvas.height || 1;

  return {
    x: point.x * (rect.width / canvasWidth),
    y: point.y * (rect.height / canvasHeight)
  };
}
