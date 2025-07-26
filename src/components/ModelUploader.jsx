import React, { useState, useEffect } from 'react';
import { objectsService } from '../services/objectsService';
import './ModelUploader.css';

const ModelUploader = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    name_he: '',
    description: '',
    category_id: '',
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  const [modelFile, setModelFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await objectsService.getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'model') {
      setModelFile(file);
    } else if (type === 'thumbnail') {
      setThumbnailFile(file);
    }
  };

  const validateFiles = () => {
    if (!modelFile) {
      alert('אנא בחר קובץ דגם 3D');
      return false;
    }

    const modelExtension = modelFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['glb', 'gltf', 'obj', 'fbx', '3ds', 'dae'];
    
    if (!allowedExtensions.includes(modelExtension)) {
      alert('סוג קובץ לא נתמך. אנא השתמש ב: GLB, GLTF, OBJ, FBX, 3DS, DAE');
      return false;
    }

    if (modelFile.size > 50 * 1024 * 1024) { // 50MB
      alert('קובץ הדגם גדול מדי (מקסימום 50MB)');
      return false;
    }

    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024) { // 5MB
      alert('קובץ התמונה גדול מדי (מקסימום 5MB)');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateFiles()) return;
    
    if (!formData.name || !formData.name_he || !formData.category_id) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setUploading(true);
    setUploadProgress('מעלה קובץ דגם...');

    try {
      // Upload model file
      const modelFileName = `${Date.now()}_${modelFile.name}`;
      const modelUploadResult = await objectsService.uploadModel(modelFile, modelFileName);
      
      if (!modelUploadResult.success) {
        throw new Error(`שגיאה בהעלאת הדגם: ${modelUploadResult.error}`);
      }

      let thumbnailUrl = '';
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        setUploadProgress('מעלה תמונה...');
        const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;
        const thumbnailUploadResult = await objectsService.uploadThumbnail(thumbnailFile, thumbnailFileName);
        
        if (thumbnailUploadResult.success) {
          thumbnailUrl = thumbnailUploadResult.data.publicUrl;
        } else {
          console.warn('Failed to upload thumbnail:', thumbnailUploadResult.error);
        }
      }

      // Create model record in database
      setUploadProgress('שומר פרטי דגם...');
      const modelData = {
        ...formData,
        file_url: modelUploadResult.data.publicUrl,
        thumbnail_url: thumbnailUrl,
        file_type: modelFile.name.toLowerCase().split('.').pop().toUpperCase(),
        file_size: modelFile.size,
        scale: JSON.stringify(formData.scale),
        rotation: JSON.stringify(formData.rotation)
      };

      const createResult = await objectsService.createModel(modelData);
      
      if (!createResult.success) {
        throw new Error(`שגיאה בשמירת פרטי הדגם: ${createResult.error}`);
      }

      setUploadProgress('הדגם הועלה בהצלחה! ✅');
      
      // Reset form
      setFormData({
        name: '',
        name_he: '',
        description: '',
        category_id: '',
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 }
      });
      setModelFile(null);
      setThumbnailFile(null);
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`שגיאה: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="model-uploader-overlay">
      <div className="model-uploader">
        <div className="uploader-header">
          <h3>📦 העלאת דגם 3D</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="uploader-content">
          <div className="form-row">
            <div className="form-group">
              <label>שם באנגלית *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Playground Slide"
                required
              />
            </div>
            <div className="form-group">
              <label>שם בעברית *</label>
              <input
                type="text"
                name="name_he"
                value={formData.name_he}
                onChange={handleInputChange}
                placeholder="מגלשה"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>קטגוריה *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              required
            >
              <option value="">בחר קטגוריה...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name_he}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>תיאור</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="תיאור הדגם..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>קנה מידה X</label>
              <input
                type="number"
                name="scale.x"
                value={formData.scale.x}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
              />
            </div>
            <div className="form-group">
              <label>קנה מידה Y</label>
              <input
                type="number"
                name="scale.y"
                value={formData.scale.y}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
              />
            </div>
            <div className="form-group">
              <label>קנה מידה Z</label>
              <input
                type="number"
                name="scale.z"
                value={formData.scale.z}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>סיבוב X (מעלות)</label>
              <input
                type="number"
                name="rotation.x"
                value={formData.rotation.x}
                onChange={handleInputChange}
                step="1"
                min="-360"
                max="360"
              />
            </div>
            <div className="form-group">
              <label>סיבוב Y (מעלות)</label>
              <input
                type="number"
                name="rotation.y"
                value={formData.rotation.y}
                onChange={handleInputChange}
                step="1"
                min="-360"
                max="360"
              />
            </div>
            <div className="form-group">
              <label>סיבוב Z (מעלות)</label>
              <input
                type="number"
                name="rotation.z"
                value={formData.rotation.z}
                onChange={handleInputChange}
                step="1"
                min="-360"
                max="360"
              />
            </div>
          </div>

          <div className="file-uploads">
            <div className="form-group">
              <label>קובץ דגם 3D * (GLB, GLTF, OBJ, FBX, 3DS, DAE)</label>
              <input
                type="file"
                accept=".glb,.gltf,.obj,.fbx,.3ds,.dae"
                onChange={(e) => handleFileChange(e, 'model')}
                required
              />
              {modelFile && (
                <div className="file-info">
                  📁 {modelFile.name} ({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="form-group">
              <label>תמונה (אופציונלי)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
              />
              {thumbnailFile && (
                <div className="file-info">
                  🖼️ {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          </div>

          {uploadProgress && (
            <div className="upload-progress">
              {uploadProgress}
            </div>
          )}

          <div className="uploader-actions">
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={uploading || !modelFile}
            >
              {uploading ? '⏳ מעלה...' : '📤 העלה דגם'}
            </button>
            <button className="cancel-btn" onClick={onClose}>
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelUploader;