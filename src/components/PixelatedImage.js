import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls';

function PixelatedImage({ 
  imageFile, 
  pixelWidth, 
  pixelHeight, 
  selectedColor, 
  scale, 
  position, 
  setPosition 
}) {
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(1);
  const [lineStart, setLineStart] = useState(null);

  // Para detectar si estamos dibujando o no (cuando arrastramos en móvil/desktop)
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const sourceCanvas = sourceCanvasRef.current;
          const outputCanvas = outputCanvasRef.current;
          const sourceCtx = sourceCanvas.getContext('2d');
          const outputCtx = outputCanvas.getContext('2d');

          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;
          outputCanvas.width = sourceCanvas.width * 10;
          outputCanvas.height = sourceCanvas.height * 10;

          // Dibuja la imagen en tamaño pixelado en el canvas base
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

          // Escala (10x) la imagen "pixelada" al canvas de salida
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              outputCtx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              outputCtx.fillRect(x * 10, y * 10, 10, 10);
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, pixelWidth, pixelHeight]);

  // Dibuja un cuadrado de color
  const drawSquare = (ctx, x, y, color, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * 10, y * 10, 10 * size, 10 * size);
  };

  // Borra un cuadrado
  const clearSquare = (ctx, x, y, size) => {
    ctx.clearRect(x * 10, y * 10, 10 * size, 10 * size);
  };

  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;

    const x = Math.floor(((clientX - rect.left) * scaleX) / 10);
    const y = Math.floor(((clientY - rect.top) * scaleY) / 10);

    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      // Inicia pan/arrastre (solo en desktop con ctrl presionado)
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line') {
      // Inicia trazo de línea
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      setLineStart({ x, y });
    } else {
      // Comienza dibujo/edición normal (pincel/borrador)
      setIsDrawing(true);
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      // Si estamos haciendo pan
      setPosition({
        x: e.clientX - startCoords.x,
        y: e.clientY - startCoords.y,
      });
    } else if (tool !== 'line' && isDrawing) {
      // Si estamos dibujando o borrando mientras arrastramos
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    setIsDrawing(false);

    // Finaliza la línea
    if (tool === 'line' && lineStart) {
      const { x: endX, y: endY } = getCanvasCoordinates(e.clientX, e.clientY);
      drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      setLineStart(null);
    }
  };

  // Función para trazar una línea con "Bresenham" pixel a pixel
  const drawLine = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      drawSquare(ctx, x0, y0, color, size);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const paintOrErase = (clientX, clientY, toolType) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    if (toolType === 'eraser') {
      clearSquare(ctx, x, y, brushSize);
    } else if (toolType === 'brush') {
      drawSquare(ctx, x, y, selectedColor, brushSize);
    }
  };

  // ---- Soporte táctil ----
  const handleTouchStart = (e) => {
    e.preventDefault(); // Evita el scroll en móvil mientras dibujamos
    // Usamos el primer toque
    const touch = e.touches[0];
    // No hay ctrlKey en móvil, así que no haremos pan con un toque simple.
    // Podrías implementar un "doble toque" o "dos dedos" para panning si deseas.
    if (tool === 'line') {
      const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
      setLineStart({ x, y });
    } else {
      setIsDrawing(true);
      paintOrErase(touch.clientX, touch.clientY, tool);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Si estamos dibujando, continuamos pintando/borrando
    if (isDrawing && tool !== 'line') {
      const touch = e.touches[0];
      paintOrErase(touch.clientX, touch.clientY, tool);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);

    if (tool === 'line' && lineStart) {
      // Tomamos la última posición del touch end
      // Nota: e.changedTouches[0] son los toques que terminaron
      const touch = e.changedTouches[0];
      const { x: endX, y: endY } = getCanvasCoordinates(touch.clientX, touch.clientY);
      drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      setLineStart(null);
    }
  };

  return (
    <div>
      {/* Controles de herramienta (Pincel, Línea, Borrador) */}
      <ToolControls
        tool={tool}
        setTool={setTool}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
      <div
        className="canvas-container"
        style={{ userSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        
        // Eventos táctiles
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
        <canvas
          ref={outputCanvasRef}
          id="output-canvas"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'top left',
            border: '1px solid #ccc',
          }}
        ></canvas>
      </div>
    </div>
  );
}

export default PixelatedImage;
