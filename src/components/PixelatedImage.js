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
  brushShape, // 'square' o 'circle'
  // Nueva prop para notificar coordenadas de mouse
  onCoordinatesChange
}) {
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Estados internos para pan y dibujo
  const [isPanning, setIsPanning] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [lineStart, setLineStart] = useState(null);  // Para línea, rectángulo y elipse
  const [isDrawing, setIsDrawing] = useState(false);

  // Calcula el tamaño base de cada "píxel" para que el canvas ocupe ~90% de la ventana.
  const basePixelSize = Math.floor(
    Math.min(
      (window.innerWidth * 0.9) / pixelWidth,
      (window.innerHeight * 0.9) / pixelHeight
    )
  );

  // Función para dibujar UN "píxel" según la forma elegida (brushShape)
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
      // Forma cuadrada
      ctx.fillRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size,
        basePixelSize * size
      );
    }
  }, [basePixelSize]);

  // Función para borrar UN "píxel"
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
      // Si es un frame existente, ya está "pixelado"
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

          // Recorre cada píxel y lo "amplía" en el outputCanvas
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
    } else {
      // Sin imagen: solo aseguramos las dimensiones
      sourceCanvas.width = pixelWidth;
      sourceCanvas.height = pixelHeight;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
  }, [imageFile, frameData, pixelWidth, pixelHeight, basePixelSize, brushShape, drawPixel]);

  // Obtener coordenadas de la grilla según el mouse/touch
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };

  // Dibuja o borra (brush o eraser) un pixel
  const paintOrErase = (clientX, clientY, toolType) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const { x, y } = getCanvasCoordinates(clientX, clientY);

    if (toolType === 'eraser') {
      clearPixel(ctx, x, y, brushSize, brushShape);
    } else if (toolType === 'brush') {
      drawPixel(ctx, x, y, selectedColor, brushSize, brushShape);
    }
  };

  // Línea con Bresenham (píxel a píxel)
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

  // Rectángulo "hueco" (solo borde) con grosor = brushSize
  const drawRectangle = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    // Recorremos la zona total, y solo pintamos el borde
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const topBorder = (py < minY + size);
        const bottomBorder = (py > maxY - size);
        const leftBorder = (px < minX + size);
        const rightBorder = (px > maxX - size);

        // Si está en alguno de los bordes
        if (topBorder || bottomBorder || leftBorder || rightBorder) {
          drawPixel(ctx, px, py, color, 1, 'square');
        }
      }
    }
  };

  // Elipse / Círculo "hueco" (solo borde) usando anillo
  const drawEllipse = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    // Centro y radios
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;

    // Radios “internos” para dejar hueco
    const rxInner = rx - size;
    const ryInner = ry - size;

    // Recorremos toda la caja delimitadora
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        // Ecuación de la elipse exterior
        const dx = px - centerX;
        const dy = py - centerY;
        const outerEq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

        if (outerEq <= 1) {
          // Está dentro (o sobre) la elipse grande
          if (rxInner > 0 && ryInner > 0) {
            // Ecuación de la elipse interior
            const innerEq = (dx * dx) / (rxInner * rxInner) + (dy * dy) / (ryInner * ryInner);
            // Pintamos si está fuera de la elipse interior (crea un anillo)
            if (innerEq > 1) {
              drawPixel(ctx, px, py, color, 1, 'square');
            }
          } else {
            // Si la elipse interior es <= 0,
            // significa que el brushSize es tan grande que no hay hueco,
            // pintamos toda la elipse
            drawPixel(ctx, px, py, color, 1, 'square');
          }
        }
      }
    }
  };

  // Eventos de mouse
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      // Pan (mover) si se hace Ctrl+click
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      // Inicia el trazo de línea/rectángulo/elipse
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      setLineStart({ x, y });
    } else {
      // Pincel o borrador
      setIsDrawing(true);
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseMove = (e) => {
    // Notificamos siempre las coordenadas
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    if (onCoordinatesChange) {
      // Sumamos 1 para que el (0,0) "real" se muestre como (1,1)
      onCoordinatesChange({ x: x + 1, y: y + 1 });
    }

    if (isPanning) {
      setPosition({
        x: e.clientX - startCoords.x,
        y: e.clientY - startCoords.y
      });
    } else if (
      tool !== 'line' && 
      tool !== 'rectangle' && 
      tool !== 'ellipse' && 
      isDrawing
    ) {
      paintOrErase(e.clientX, e.clientY, tool);
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    setIsDrawing(false);

    // Si es línea, rectángulo o elipse
    if ((tool === 'line' || tool === 'rectangle' || tool === 'ellipse') && lineStart) {
      const { x: endX, y: endY } = getCanvasCoordinates(e.clientX, e.clientY);

      if (tool === 'line') {
        drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      } else if (tool === 'rectangle') {
        drawRectangle(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      } else if (tool === 'ellipse') {
        drawEllipse(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      }
      setLineStart(null);
    }
  };

  // Eventos táctiles (para móvil)
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
      setLineStart({ x, y });
    } else {
      setIsDrawing(true);
      paintOrErase(touch.clientX, touch.clientY, tool);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];

    // Notificamos las coordenadas en evento táctil
    const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
    if (onCoordinatesChange) {
      onCoordinatesChange({ x: x + 1, y: y + 1 });
    }

    if (
      isDrawing && 
      tool !== 'line' && 
      tool !== 'rectangle' && 
      tool !== 'ellipse'
    ) {
      paintOrErase(touch.clientX, touch.clientY, tool);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);

    if ((tool === 'line' || tool === 'rectangle' || tool === 'ellipse') && lineStart) {
      const touch = e.changedTouches[0];
      const { x: endX, y: endY } = getCanvasCoordinates(touch.clientX, touch.clientY);

      if (tool === 'line') {
        drawLine(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      } else if (tool === 'rectangle') {
        drawRectangle(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      } else if (tool === 'ellipse') {
        drawEllipse(lineStart.x, lineStart.y, endX, endY, selectedColor, brushSize);
      }
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
