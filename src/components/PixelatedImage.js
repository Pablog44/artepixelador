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

  // Calcula el tamaño base de cada "píxel" para que el canvas ocupe ~90% de la ventana.
  const basePixelSize = Math.floor(
    Math.min(
      window.innerWidth * 0.9 / pixelWidth,
      window.innerHeight * 0.9 / pixelHeight
    )
  );

  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');

    // Desactivar el suavizado para lograr un efecto pixelado
    sourceCtx.imageSmoothingEnabled = false;
    outputCtx.imageSmoothingEnabled = false;

    if (frameData) {
      // Si se está editando un frame guardado, se asume que ya es una imagen pixelada.
      // Se asigna la resolución del canvas en función de la grilla.
      sourceCanvas.width = pixelWidth * basePixelSize;
      sourceCanvas.height = pixelHeight * basePixelSize;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      // Se dibuja la imagen escalándola al tamaño del canvas.
      const img = new Image();
      img.onload = function () {
        outputCtx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);
      };
      img.src = frameData;
    } else if (imageFile) {
      // Al cargar una imagen se crea el efecto pixelado.
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgSrc = e.target.result;
        const img = new Image();
        img.onload = function () {
          // Canvas fuente: se reduce la imagen a la resolución de la grilla.
          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;
          // Canvas de salida: se escala para ocupar el área de trabajo.
          outputCanvas.width = pixelWidth * basePixelSize;
          outputCanvas.height = pixelHeight * basePixelSize;
          sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

          // Dibujar la imagen reducida en el canvas fuente.
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

          // Recorrer cada "píxel" y dibujarlo ampliado en el canvas de salida.
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              outputCtx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              outputCtx.fillRect(x * basePixelSize, y * basePixelSize, basePixelSize, basePixelSize);
            }
          }
        };
        img.src = imgSrc;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, frameData, pixelWidth, pixelHeight, basePixelSize]);

  // Función para dibujar un cuadrado (píxel) en el canvas
  const drawSquare = (ctx, x, y, color, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * basePixelSize, y * basePixelSize, basePixelSize * size, basePixelSize * size);
  };

  // Función para borrar un cuadrado (píxel)
  const clearSquare = (ctx, x, y, size) => {
    ctx.clearRect(x * basePixelSize, y * basePixelSize, basePixelSize * size, basePixelSize * size);
  };

  // Se obtienen las coordenadas de la grilla a partir de la posición en pantalla
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      // Inicia el pan (arrastre) al presionar Ctrl
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line') {
      // Inicia el trazo de línea
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      setLineStart({ x, y });
    } else {
      // Inicia el dibujo (pincel o borrador)
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
      {/* Contenedor para el canvas: ocupa toda la ventana y centra el área de trabajo */}
      <div
        className="canvas-container"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas oculto para procesar la imagen fuente */}
        <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
        {/* Canvas de salida con la imagen pixelada */}
        <canvas
          ref={outputCanvasRef}
          id="output-canvas"
          style={{
            /* El ancho y alto del canvas se basan en la grilla y en basePixelSize */
            width: `${pixelWidth * basePixelSize}px`,
            height: `${pixelHeight * basePixelSize}px`,
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'top left',
            border: '1px solid #ccc',
            imageRendering: 'pixelated'
          }}
        ></canvas>
      </div>
    </div>
  );
}

export default PixelatedImage;
