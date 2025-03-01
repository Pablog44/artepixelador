// components/CanvasWrapper.js
import React from 'react';
import PixelatedImage from './PixelatedImage';
import Rejilla from './Rejilla';

const CanvasWrapper = ({
  page,
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
  brushShape,
}) => {
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
