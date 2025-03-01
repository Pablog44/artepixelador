// components/CanvasWrapper.js
import React from 'react';
import PixelatedImage from './PixelatedImage';
import Rejilla from './Rejilla';
import usePinchZoom from '../hooks/usePinchZoom';

const CanvasWrapper = ({
  page,
  imageFile,
  frameData,
  pixelWidth,
  pixelHeight,
  selectedColor,
  scale,
  setScale,
  position,
  setPosition,
  tool,
  brushSize,
  brushShape,
}) => {
  // Integra el hook para actualizar la escala
  usePinchZoom((scaleChange) => {
    // Por ejemplo, podrías actualizar la escala de forma acumulativa o establecer un nuevo valor basado en scaleChange
    setScale((prevScale) => {
      const newScale = prevScale * scaleChange;
      // Limitar el zoom entre 0.5 y 5
      return Math.max(0.5, Math.min(newScale, 5));
    });
  });

  if (page === 'rejilla') {
    return (
      <Rejilla
        imageFile={imageFile}
        frameData={frameData}
        pixelWidth={pixelWidth}
        pixelHeight={pixelHeight}
        selectedColor={selectedColor}
        scale={scale}
        position={position}
        setPosition={setPosition}
        tool={tool}
        brushSize={brushSize}
        brushShape={brushShape}
      />
    );
  } else {
    return (
      <PixelatedImage
        imageFile={imageFile}
        frameData={frameData}
        pixelWidth={pixelWidth}
        pixelHeight={pixelHeight}
        selectedColor={selectedColor}
        scale={scale}
        position={position}
        setPosition={setPosition}
        tool={tool}
        brushSize={brushSize}
        brushShape={brushShape}
      />
    );
  }
};

export default CanvasWrapper;
