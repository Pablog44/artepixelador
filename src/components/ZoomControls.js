// components/ZoomControls.js
import React from 'react';

const ZoomControls = ({ handleZoomIn, handleZoomOut }) => {
  const buttonStyle = { margin: '0 8px' };

  return (
    <div className="controls-group">
      <button onClick={handleZoomIn} className="button" style={buttonStyle}>
        Zoom In
      </button>
      <button onClick={handleZoomOut} className="button" style={buttonStyle}>
        Zoom Out
      </button>
    </div>
  );
};

export default ZoomControls;
