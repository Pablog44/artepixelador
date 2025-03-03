import React, { useEffect, useRef, useState, useCallback } from 'react';

function Rejilla({ 
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
  brushShape
}) {
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Estados para panning y para el trazo de línea/rectángulo/elipse
  const [isPanning, setIsPanning] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [lineStart, setLineStart] = useState(null);
  
  // Calcula el tamaño base de cada “píxel” para que el canvas ocupe aproximadamente el 90% de la ventana.
  const basePixelSize = Math.floor(
    Math.min(
      (window.innerWidth * 0.9) / pixelWidth,
      (window.innerHeight * 0.9) / pixelHeight
    )
  );
  
  // Función para dibujar un “píxel” según la forma (cuadrado o círculo)
  const drawPixel = useCallback((ctx, x, y, color, size = 1, shape = 'square') => {
    ctx.fillStyle = color;
    if (shape === 'circle') {
      ctx.beginPath();
      const centerX = x * basePixelSize + (basePixelSize * size) / 2;
      const centerY = y * basePixelSize + (basePixelSize * size) / 2;
      const radius = (basePixelSize * size) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size - 1,
        basePixelSize * size - 1
      );
    }
  }, [basePixelSize]);
  
  // Función para borrar un “píxel” con soporte para forma
  const clearPixel = (ctx, x, y, size = 1, shape = 'square') => {
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
        basePixelSize * size - 1,
        basePixelSize * size - 1
      );
    }
  };
  
  // Función para dibujar una línea usando el algoritmo de Bresenham.
  // Ahora, si brushSize > 1 se recorre cada celda del bloque para dibujar la rejilla negra.
  const drawLine = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      // Dibuja el bloque con el tamaño indicado
      drawPixel(ctx, x0, y0, color, size, brushShape);
      // Para cada celda dentro del bloque se dibuja la rejilla negra
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            (x0 + i) * basePixelSize + 0.5,
            (y0 + j) * basePixelSize + 0.5,
            basePixelSize - 1,
            basePixelSize - 1
          );
        }
      }
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
  
  // Función para dibujar un rectángulo "hueco" (solo el borde) con grosor = brushSize
  const drawRectangle = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const topBorder = (py < minY + size); 
        const bottomBorder = (py > maxY - size);
        const leftBorder = (px < minX + size);
        const rightBorder = (px > maxX - size);
        if (topBorder || bottomBorder || leftBorder || rightBorder) {
          drawPixel(ctx, px, py, color, 1, 'square');
          // Se dibuja la cuadrícula negra para cada celda involucrada
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            px * basePixelSize + 0.5,
            py * basePixelSize + 0.5,
            basePixelSize - 1,
            basePixelSize - 1
          );
        }
      }
    }
  };
  
  // Función para dibujar una elipse (círculo hueco) usando un anillo
  const drawEllipse = (x0, y0, x1, y1, color, size) => {
    const ctx = outputCanvasRef.current.getContext('2d');
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;
    const rxInner = rx - size;
    const ryInner = ry - size;
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = px - centerX;
        const dy = py - centerY;
        const outerEq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (outerEq <= 1) {
          if (rxInner > 0 && ryInner > 0) {
            const innerEq = (dx * dx) / (rxInner * rxInner) + (dy * dy) / (ryInner * ryInner);
            if (innerEq > 1) {
              drawPixel(ctx, px, py, color, 1, 'square');
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 1;
              ctx.strokeRect(
                px * basePixelSize + 0.5,
                py * basePixelSize + 0.5,
                basePixelSize - 1,
                basePixelSize - 1
              );
            }
          } else {
            drawPixel(ctx, px, py, color, 1, 'square');
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(
              px * basePixelSize + 0.5,
              py * basePixelSize + 0.5,
              basePixelSize - 1,
              basePixelSize - 1
            );
          }
        }
      }
    }
  };
  
  // Convierte las coordenadas de pantalla a coordenadas de la grilla.
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };
  
  // Efecto para cargar la imagen base: si existe frameData se carga ese frame,
  // de lo contrario se usa imageFile. Si no hay ninguna imagen, se inicializan
  // los canvas con las dimensiones correctas para evitar píxeles rectangulares.
  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.imageSmoothingEnabled = false;
    
    if (frameData) {
      // Si se está editando un frame guardado, se asume que ya es una imagen pixelada.
      sourceCanvas.width = pixelWidth * basePixelSize;
      sourceCanvas.height = pixelHeight * basePixelSize;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  
      const img = new Image();
      img.onload = () => {
        outputCtx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);
        // Dibuja la cuadrícula sobre toda la imagen.
        for (let y = 0; y < pixelHeight; y++) {
          for (let x = 0; x < pixelWidth; x++) {
            outputCtx.strokeStyle = 'black';
            outputCtx.lineWidth = 1;
            outputCtx.strokeRect(
              x * basePixelSize + 0.5,
              y * basePixelSize + 0.5,
              basePixelSize - 1,
              basePixelSize - 1
            );
          }
        }
      };
      img.src = frameData;
    } else if (imageFile) {
      // Al cargar una imagen se crea el efecto pixelado.
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = () => {
          // Canvas fuente: se reduce la imagen a la resolución de la grilla.
          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;
          // Canvas de salida: se escala para ocupar el área de trabajo.
          outputCanvas.width = pixelWidth * basePixelSize;
          outputCanvas.height = pixelHeight * basePixelSize;
          sourceCtx.imageSmoothingEnabled = false;
          outputCtx.imageSmoothingEnabled = false;
          sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  
          // Se dibuja la imagen reducida en el canvas fuente.
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  
          // Recorremos cada “píxel” y lo dibujamos ampliado en el canvas de salida.
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              drawPixel(outputCtx, x, y, color, 1, brushShape);
              // Dibuja la cuadrícula en cada celda.
              outputCtx.strokeStyle = 'black';
              outputCtx.lineWidth = 1;
              outputCtx.strokeRect(
                x * basePixelSize + 0.5,
                y * basePixelSize + 0.5,
                basePixelSize - 1,
                basePixelSize - 1
              );
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    } else {
      // Cuando no hay imagen cargada, se asegura que el canvas tenga las dimensiones correctas.
      sourceCanvas.width = pixelWidth;
      sourceCanvas.height = pixelHeight;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
  }, [imageFile, frameData, pixelWidth, pixelHeight, basePixelSize, brushShape, drawPixel]);
  
  // Función que procesa el clic (o arrastre) sobre el canvas para pintar o borrar.
  // Se mantiene la funcionalidad de la cuadrícula negra, pero si se usa el borrador (eraser)
  // se borra por completo la celda sin volver a dibujar el borde.
  const handleCanvasClick = (e) => {
    if (e.ctrlKey || isPanning) return;
    const { x: gridX, y: gridY } = getCanvasCoordinates(e.clientX, e.clientY);
    const ctx = outputCanvasRef.current.getContext('2d');
  
    for (let i = 0; i < brushSize; i++) {
      for (let j = 0; j < brushSize; j++) {
        const px = gridX + i;
        const py = gridY + j;
  
        if (tool === 'eraser') {
          clearPixel(ctx, px, py, 1, brushShape);
          // En modo borrador no se redibuja la cuadrícula, borrándolo todo.
        } else if (tool === 'brush') {
          drawPixel(ctx, px, py, selectedColor, 1, brushShape);
          // Redibuja la cuadrícula negra en el área modificada.
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            px * basePixelSize + 0.5,
            py * basePixelSize + 0.5,
            basePixelSize - 1,
            basePixelSize - 1
          );
        }
      }
    }
  };
  
  // Eventos del mouse y táctiles para panning y dibujo.
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      setIsPanning(true);
      setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      setLineStart({ x, y });
    } else {
      handleCanvasClick(e);
    }
  };
  
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - startCoords.x,
        y: e.clientY - startCoords.y,
      });
    } else if (e.buttons) {
      if (!(tool === 'line' || tool === 'rectangle' || tool === 'ellipse')) {
        handleCanvasClick(e);
      }
    }
  };
  
  const handleMouseUp = (e) => {
    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      if (lineStart) {
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
    }
    setIsPanning(false);
  };
  
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
      setLineStart({ x, y });
    } else {
      handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, ctrlKey: e.ctrlKey });
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length && !(tool === 'line' || tool === 'rectangle' || tool === 'ellipse')) {
      const touch = e.touches[0];
      handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, ctrlKey: e.ctrlKey });
    }
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      if (lineStart) {
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
    }
    setIsPanning(false);
  };
  
  return (
    <div>
      <div
        className="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        {/* Canvas oculto para procesar la imagen fuente */}
        <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
        {/*
          Se añade "key" al canvas para forzar su re-montaje cuando cambie frameData o imageFile.
          Así, al seleccionar un frame nuevo, se reinicializa el canvas con la imagen correspondiente.
        */}
        <canvas
          ref={outputCanvasRef}
          key={frameData || imageFile}
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

export default Rejilla;
