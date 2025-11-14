/**
 * QR Code Shape Modifier
 * Modifies QR code shapes (body, eye frames, eye balls) using Canvas API
 */

export type BodyShape = 'square' | 'rounded' | 'dots' | 'circle';
export type EyeShape = 'square' | 'rounded' | 'circle';
export type OuterBorderShape = 'square' | 'rounded' | 'circle' | 'none';

interface ShapeOptions {
  bodyShape: BodyShape;
  eyeFrameShape: EyeShape;
  eyeBallShape: EyeShape;
  outerBorderShape?: OuterBorderShape;
  foregroundColor: string;
  backgroundColor: string;
}

/**
 * Applies shape modifications to a QR code image
 */
export async function applyQRShapes(
  imageUrl: string,
  options: ShapeOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Fill background
        const bgColor = hexToRgb(options.backgroundColor) || { r: 255, g: 255, b: 255 };
        ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw original image to get pixel data
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Detect module size
        const moduleSize = detectModuleSize(data, width, height);

        // Detect eye positions (position detection patterns)
        const eyePositions = detectEyePositions(data, width, height, moduleSize);

        // Clear canvas and redraw with shapes
        ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const fgColor = hexToRgb(options.foregroundColor) || { r: 0, g: 0, b: 0 };
        ctx.fillStyle = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;

        // If circle border, we need to clip the QR code to a circle first
        if (options.outerBorderShape === 'circle') {
          // Create a clipping path for the circle
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 2;
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
        }

        // Draw QR code modules with custom shapes
        drawQRWithShapes(ctx, data, width, height, moduleSize, eyePositions, options, fgColor, bgColor);

        // Restore context if we clipped
        if (options.outerBorderShape === 'circle') {
          ctx.restore();
        }

        // Draw outer border if specified
        if (options.outerBorderShape && options.outerBorderShape !== 'none') {
          drawOuterBorder(ctx, width, height, options.outerBorderShape, fgColor);
        }

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Detects the module size of the QR code
 */
function detectModuleSize(data: Uint8ClampedArray, width: number, height: number): number {
  // Sample middle row to detect module size
  const sampleY = Math.floor(height / 2);
  const transitions: number[] = [];
  let lastIsDark = false;

  for (let x = 0; x < width; x++) {
    const idx = (sampleY * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const isDark = (r + g + b) < 384;

    if (isDark !== lastIsDark) {
      transitions.push(x);
      lastIsDark = isDark;
    }
  }

  if (transitions.length < 4) {
    return Math.max(Math.floor(width / 25), 1); // Default estimate
  }

  // Calculate average distance between transitions
  let totalDist = 0;
  for (let i = 1; i < Math.min(transitions.length, 20); i++) {
    totalDist += transitions[i] - transitions[i - 1];
  }

  return Math.max(Math.floor(totalDist / Math.min(transitions.length - 1, 19)), 1);
}

/**
 * Detects the positions of the three eye patterns (position detection patterns)
 */
function detectEyePositions(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  moduleSize: number
): Array<{ x: number; y: number; size: number }> {
  const eyes: Array<{ x: number; y: number; size: number }> = [];
  const eyeSize = moduleSize * 7; // Standard QR eye pattern is 7x7 modules

  // Check top-left corner
  if (isEyePattern(data, width, height, eyeSize, eyeSize, moduleSize)) {
    eyes.push({ x: eyeSize, y: eyeSize, size: eyeSize });
  }

  // Check top-right corner
  if (isEyePattern(data, width, height, width - eyeSize * 2, eyeSize, moduleSize)) {
    eyes.push({ x: width - eyeSize, y: eyeSize, size: eyeSize });
  }

  // Check bottom-left corner
  if (isEyePattern(data, width, height, eyeSize, height - eyeSize * 2, moduleSize)) {
    eyes.push({ x: eyeSize, y: height - eyeSize, size: eyeSize });
  }

  return eyes;
}

/**
 * Checks if a region contains an eye pattern
 */
function isEyePattern(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  moduleSize: number
): boolean {
  // Check for the characteristic 7x7 eye pattern
  const eyeSize = moduleSize * 7;
  if (startX + eyeSize > width || startY + eyeSize > height) return false;

  let darkCount = 0;
  let totalCount = 0;

  for (let y = startY; y < startY + eyeSize && y < height; y++) {
    for (let x = startX; x < startX + eyeSize && x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isDark = (r + g + b) < 384;

      if (isDark) darkCount++;
      totalCount++;
    }
  }

  // Eye pattern should have roughly 50-75% dark pixels
  return totalCount > 0 && darkCount / totalCount > 0.5 && darkCount / totalCount < 0.8;
}

/**
 * Draws QR code with custom shapes
 */
function drawQRWithShapes(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  moduleSize: number,
  eyePositions: Array<{ x: number; y: number; size: number }>,
  options: ShapeOptions,
  fgColor: { r: number; g: number; b: number },
  bgColor: { r: number; g: number; b: number }
) {
  ctx.fillStyle = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;

  // Draw modules with custom body shape
  for (let y = 0; y < height; y += moduleSize) {
    for (let x = 0; x < width; x += moduleSize) {
      // Check if this module is dark
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isDark = (r + g + b) < 384;

      if (!isDark) continue;

      // Check if in eye region
      const isInEye = eyePositions.some(eye => {
        const eyeX = eye.x - eye.size / 2;
        const eyeY = eye.y - eye.size / 2;
        return x >= eyeX && x < eyeX + eye.size && y >= eyeY && y < eyeY + eye.size;
      });

      if (isInEye) continue; // Eyes are drawn separately

      // Draw module with custom shape
      if (options.bodyShape === 'square') {
        ctx.fillRect(x, y, moduleSize, moduleSize);
      } else if (options.bodyShape === 'rounded') {
        const radius = moduleSize * 0.2;
        ctx.beginPath();
        roundRect(ctx, x, y, moduleSize, moduleSize, radius);
        ctx.fill();
      } else if (options.bodyShape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (options.bodyShape === 'dots') {
        const dotSize = moduleSize * 0.6;
        ctx.beginPath();
        ctx.arc(x + moduleSize / 2, y + moduleSize / 2, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw eye patterns with custom shapes
  eyePositions.forEach(eye => {
    drawEyePattern(ctx, eye.x, eye.y, eye.size, moduleSize, options.eyeFrameShape, options.eyeBallShape, fgColor);
  });
}

/**
 * Draws an eye pattern (position detection pattern)
 */
function drawEyePattern(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  moduleSize: number,
  frameShape: EyeShape,
  ballShape: EyeShape,
  fgColor: { r: number; g: number; b: number }
) {
  ctx.fillStyle = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;

  // Outer frame (7x7 modules)
  const frameSize = size;
  const frameRadius = frameShape === 'rounded' ? moduleSize * 0.3 : 0;

  if (frameShape === 'square') {
    ctx.fillRect(centerX - frameSize / 2, centerY - frameSize / 2, frameSize, frameSize);
  } else if (frameShape === 'rounded') {
    ctx.beginPath();
    roundRect(ctx, centerX - frameSize / 2, centerY - frameSize / 2, frameSize, frameSize, frameRadius);
    ctx.fill();
  } else if (frameShape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, frameSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner white square (5x5 modules)
  ctx.fillStyle = `rgb(255, 255, 255)`;
  const innerSize = frameSize - moduleSize * 2;
  ctx.fillRect(centerX - innerSize / 2, centerY - innerSize / 2, innerSize, innerSize);

  // Inner dark square (3x3 modules) - the eye ball
  ctx.fillStyle = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;
  const ballSize = innerSize - moduleSize * 2;

  if (ballShape === 'square') {
    ctx.fillRect(centerX - ballSize / 2, centerY - ballSize / 2, ballSize, ballSize);
  } else if (ballShape === 'rounded') {
    const radius = moduleSize * 0.2;
    ctx.beginPath();
    roundRect(ctx, centerX - ballSize / 2, centerY - ballSize / 2, ballSize, ballSize, radius);
    ctx.fill();
  } else if (ballShape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, ballSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws a rounded rectangle (polyfill for browsers that don't support roundRect)
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, width, height, radius);
    return;
  }

  // Polyfill using arc
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws outer border around QR code
 */
function drawOuterBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  borderShape: OuterBorderShape,
  fgColor: { r: number; g: number; b: number }
) {
  const borderWidth = Math.min(width, height) * 0.03; // 3% of QR size for better visibility
  const padding = borderWidth;
  
  ctx.strokeStyle = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;
  ctx.lineWidth = borderWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (borderShape === 'square') {
    ctx.strokeRect(padding, padding, width - (padding * 2), height - (padding * 2));
  } else if (borderShape === 'rounded') {
    const radius = Math.min(width, height) * 0.08;
    ctx.beginPath();
    roundRect(ctx, padding, padding, width - (padding * 2), height - (padding * 2), radius);
    ctx.stroke();
  } else if (borderShape === 'circle') {
    const centerX = width / 2;
    const centerY = height / 2;
    // For circle, use the full available space minus padding
    const radius = Math.min(width, height) / 2 - padding;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

