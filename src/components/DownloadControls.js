// components/DownloadControls.js
import React from 'react';

const DownloadControls = ({ handleDownloadPng, handleDownloadGif }) => {
  const buttonStyle = { margin: '0 8px' };

  return (
    <div className="controls-group">
      <button className="button" onClick={handleDownloadPng} style={buttonStyle}>
        Descargar PNG
      </button>
      <button className="button" onClick={handleDownloadGif} style={buttonStyle}>
        Descargar GIF
      </button>
    </div>
  );
};

export default DownloadControls;
