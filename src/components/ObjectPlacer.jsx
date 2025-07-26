import React, { useState, useEffect } from 'react';
import { objectsService } from '../services/objectsService';
import './ObjectPlacer.css';

const ObjectPlacer = ({ 
  isPlacing, 
  onStartPlacing, 
  onCancelPlacing, 
  onObjectPlace,
  selectedPosition 
}) => {
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [objectName, setObjectName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadModelsByCategory(selectedCategory);
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await objectsService.getCategories();
      if (result.success) {
        setCategories(result.data);
      } else {
        console.error('Failed to load categories:', result.error);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelsByCategory = async (categoryId) => {
    setLoading(true);
    try {
      const result = await objectsService.getModelsByCategory(categoryId);
      if (result.success) {
        setModels(result.data);
      } else {
        console.error('Failed to load models:', result.error);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlacing = () => {
    if (!selectedModel) {
      alert('אנא בחר דגם לפני תחילת המיקום');
      return;
    }
    onStartPlacing();
  };

  const handlePlaceObject = () => {
    if (!selectedModel || !selectedPosition) {
      alert('אנא בחר דגם ומיקום');
      return;
    }

    const selectedModelData = models.find(m => m.id === selectedModel);
    if (!selectedModelData) {
      alert('דגם לא נמצא');
      return;
    }

    const objectData = {
      model_id: selectedModel,
      name: objectName || selectedModelData.name_he,
      position: selectedPosition,
      scale: typeof selectedModelData.scale === 'string' ? 
        JSON.parse(selectedModelData.scale) : 
        (selectedModelData.scale || { x: 1, y: 1, z: 1 }),
      rotation: typeof selectedModelData.rotation === 'string' ? 
        JSON.parse(selectedModelData.rotation) : 
        (selectedModelData.rotation || { x: 0, y: 0, z: 0 }),
      properties: {}
    };

    onObjectPlace(objectData, selectedModelData);
    
    // Reset form
    setObjectName('');
    setSelectedModel('');
    setSelectedCategory('');
  };

  return (
    <div className="object-placer">
      <h3>🏗️ מציב אובייקטים</h3>
      
      <div className="form-group">
        <label>קטגוריה:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading}
        >
          <option value="">בחר קטגוריה...</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name_he}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div className="form-group">
          <label>דגם:</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading}
          >
            <option value="">בחר דגם...</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name_he}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedModel && (
        <div className="form-group">
          <label>שם מותאם אישית (אופציונלי):</label>
          <input 
            type="text" 
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            placeholder="הכנס שם מותאם אישית..."
          />
        </div>
      )}

      <div className="button-group">
        {!isPlacing ? (
          <button 
            className="start-placing-btn"
            onClick={handleStartPlacing}
            disabled={!selectedModel || loading}
          >
            📍 התחל מיקום
          </button>
        ) : (
          <>
            <button 
              className="place-object-btn"
              onClick={handlePlaceObject}
              disabled={!selectedPosition}
            >
              ✅ מקם אובייקט
            </button>
            <button 
              className="cancel-placing-btn"
              onClick={onCancelPlacing}
            >
              ❌ בטל
            </button>
          </>
        )}
      </div>

      {isPlacing && (
        <div className="placing-status">
          {selectedPosition ? 
            '✅ מיקום נבחר - לחץ "מקם אובייקט"' : 
            '📍 לחץ על המפה לבחירת מיקום'
          }
        </div>
      )}

      {loading && <div className="loading">טוען...</div>}
    </div>
  );
};

export default ObjectPlacer;