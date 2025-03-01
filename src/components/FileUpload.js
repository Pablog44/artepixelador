// components/FileUpload.js
import React from 'react';

const FileUpload = ({ handleFileChange }) => {
  const buttonStyle = { margin: '0 8px' };

  return (
    <div className="controls-group">
      <input
        type="file"
        id="image-upload"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="image-upload" className="button" style={buttonStyle}>
        Cargar Imagen
      </label>
    </div>
  );
};

export default FileUpload;
