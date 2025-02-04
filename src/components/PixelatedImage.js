import React, { useEffect, useRef, useState, useCallback } from 'react';

function PixelatedImage({ 
  imageFile, 
  frameData,
  pixelWidth, 
  pixelHeight, 
  selectedColor, 
  scale, 
  position, 
  setPosition,
  tool,
  brushSize,
  brushShape // 'square' o 'circle'
}) {
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Estados internos para pan y dibujo
  const [isPanning, setIsPanning] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [lineStart, setLineStart] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Calcula el tamaño base de cada "píxel" para que el canvas ocupe ~90% de la ventana.
  const basePixelSize = Math.floor(
    Math.min(
      (window.innerWidth * 0.9) / pixelWidth,
      (window.innerHeight * 0.9) / pixelHeight
    )
  );

  // Función para dibujar un "píxel" según la forma elegida
  const drawPixel = useCallback((ctx, x, y, color, size, shape) => {
    ctx.fillStyle = color;
    if (shape === 'circle') {
      ctx.beginPath();
      const centerX = x * basePixelSize + (basePixelSize * size) / 2;
      const centerY = y * basePixelSize + (basePixelSize * size) / 2;
      const radius = (basePixelSize * size) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Por defecto, forma cuadrada
      ctx.fillRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size,
        basePixelSize * size
      );
    }
  }, [basePixelSize]);

  // Función para borrar un "píxel" según la forma (usa clearRect o destination‐out para círculo)
  const clearPixel = (ctx, x, y, size, shape) => {
    if (shape === 'circle') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      const centerX = x * basePixelSize + (basePixelSize * size) / 2;
      const centerY = y * basePixelSize + (basePixelSize * size) / 2;
      const radius = (basePixelSize * size) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.clearRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size,
        basePixelSize * size
      );
    }
  };

  // Carga de imagen y repintado (o pixelado) del frame
  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');

    // Desactivar el suavizado para efecto pixelado
    sourceCtx.imageSmoothingEnabled = false;
    outputCtx.imageSmoothingEnabled = false;

    if (frameData) {
      // Si se edita un frame guardado, ya está pixelado
      sourceCanvas.width = pixelWidth * basePixelSize;
      sourceCanvas.height = pixelHeight * basePixelSize;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;

      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

      // Dibuja la imagen (frame) escalándola al tamaño del canvas
      const img = new Image();
      img.onload = function () {
        outputCtx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);
      };
      img.src = frameData;
    } else if (imageFile) {
      // Al cargar una imagen se crea el efecto pixelado
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgSrc = e.target.result;
        const img = new Image();
        img.onload = function () {
          // Canvas fuente: reduce la imagen a la resolución de la grilla
          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;

          // Canvas de salida: escala para ocupar el área de trabajo
          outputCanvas.width = pixelWidth * basePixelSize;
          outputCanvas.height = pixelHeight * basePixelSize;

          sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

          // Dibuja la imagen reducida en el canvas fuente
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

          // Recorre cada “píxel” y dibuja ampliado en el canvas de salida
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              drawPixel(outputCtx, x, y, color, 1, brushShape);
            }
          }
        };
        img.src = imgSrc;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, frameData, pixelWidth, pixelHeight, basePixelSize, brushShape, drawPixel]);

  // Obtiene las coordenadas de la grilla a partir de la posición del mouse/touch
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };

  // Dibuja o borra (según la herramienta) en la posición dada
  const paintOrErase = (clientX, clientY, toolType) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const { x, y } = getCanvasCoordinates(clientX, clientY);

    if (toolType === 'eraser') {
      clearPixel(ctx, x, y, brushSize, brushShape);
    } else if (toolType === 'brush') {
      drawPixel(ctx, x, y, selectedColor, brushSize, brushShape);
    }
  };

  // Dibuja una línea (algoritmo de Bresenham) usando la forma elegida para cada "píxel"
  const drawLine = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      drawPixel(ctx, x0, y0, color, size, brushShape);
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

  // Eventos de mouse
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      // Inicia pan (arrastre) si se presiona Ctrl + click
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line') {
      // Inicia el trazo de línea
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
        y: e.clientY - startCoords.y
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
