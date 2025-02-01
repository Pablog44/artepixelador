import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls';

function PixelatedImage({ 
  imageFile, 
  frameData,
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
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Se determina la fuente de la imagen: si existe frameData se usa éste; si no, se utiliza imageFile
    let imgSrc = null;
    if (frameData) {
      imgSrc = frameData;
    } else if (imageFile) {
      // imageFile es un objeto File, por lo que se lee con FileReader
      const reader = new FileReader();
      reader.onload = function (e) {
        imgSrc = e.target.result;
        loadImage(imgSrc);
      };
      reader.readAsDataURL(imageFile);
      return; // Se sale ya que se llama a loadImage dentro del reader
    }
    if (imgSrc) {
      loadImage(imgSrc);
    }
    
    function loadImage(src) {
      const img = new Image();
      img.onload = function () {
        const sourceCanvas = sourceCanvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        const sourceCtx = sourceCanvas.getContext('2d');
        const outputCtx = outputCanvas.getContext('2d');
  
        // Se configuran los tamaños de los canvas
        sourceCanvas.width = pixelWidth;
        sourceCanvas.height = pixelHeight;
        outputCanvas.width = pixelWidth * 10;
        outputCanvas.height = pixelHeight * 10;
  
        // Se limpian ambos canvas
        sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  
        // Se dibuja la imagen en tamaño pixelado en el canvas oculto
        sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  
        // Se escala la imagen “pixelada” en el canvas de salida
        for (let y = 0; y < pixelHeight; y++) {
          for (let x = 0; x < pixelWidth; x++) {
            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
            outputCtx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
            outputCtx.fillRect(x * 10, y * 10, 10, 10);
          }
        }
      };
      img.src = src;
    }
  }, [imageFile, frameData, pixelWidth, pixelHeight]);

  // Función para dibujar un cuadrado (píxel) en el canvas
  const drawSquare = (ctx, x, y, color, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * 10, y * 10, 10 * size, 10 * size);
  };

  // Función para borrar un cuadrado (píxel)
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
      // Inicia pan (arrastre) cuando se presiona Ctrl
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line') {
      // Inicia trazo de línea
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      setLineStart({ x, y });
    } else {
      // Inicia dibujo (pincel o borrador)
      setIsDrawing(true);
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - startCoords.x,
        y: e.clientY - startCoords.y,
      });
    } else if (tool !== 'line' && isDrawing) {
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    setIsDrawing(false);
    if (tool === 'line' && lineStart) {
      const { x: endX, y: endY } = getCanvasCoordinates(e.clientX, e.clientY);
      drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      setLineStart(null);
    }
  };

  // Dibuja una línea utilizando el algoritmo de Bresenham
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

  // Soporte para eventos táctiles
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
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
    if (isDrawing && tool !== 'line') {
      const touch = e.touches[0];
      paintOrErase(touch.clientX, touch.clientY, tool);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    if (tool === 'line' && lineStart) {
      const touch = e.changedTouches[0];
      const { x: endX, y: endY } = getCanvasCoordinates(touch.clientX, touch.clientY);
      drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      setLineStart(null);
    }
  };

  return (
    <div>
      {/* Controles de herramienta: pincel, línea, borrador */}
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
