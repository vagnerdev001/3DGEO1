import React, { useState, useEffect } from 'react';
import { buildingService } from '../services/supabase';
import './DataFormModal.css';

const DataFormModal = ({ buildingId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    wkt: '',
    full_addres_q: '',
    street_cod: '',
    bldg_num: '',
    bldg_type: '',
    num_floors: '',
    street_c_1: '',
    bldg_num_2: '',
    street_is_tama: '',
    no_floors: '',
    no_apt: '',
    st_code: '',
    street_1: '',
    color: '',
    מיון_2: '',
    masadcolor2: '',
    color_sofi: '',
    full_addresse: '',
    mi_address: '',
    codeapp: '',
    height: '',
    ai_command: '',
    floor_colors: [],
    הערכת_מחיר_שמאי: '',
    ערך_משוער_לפי_מאפייני_סביבה: '',
    מחיר_ממוצע_למטר: '',
    צרכים_ציבוריים: '',
    שיוך_לרשות: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (buildingId) {
      loadBuildingData();
    }
  }, [buildingId]);

  const loadBuildingData = async () => {
    setLoading(true);
    try {
      const result = await buildingService.getBuilding(buildingId);
      if (result.success && result.data) {
        setFormData(result.data);
      }
    } catch (error) {
      console.error('Error loading building data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFloorColorChange = (floorIndex, newColor) => {
    const newColors = [...(formData.floor_colors || [])];
    newColors[floorIndex] = newColor;
    setFormData(prev => ({
      ...prev,
      floor_colors: newColors
    }));
  };

  const generateGradientColors = () => {
    const numFloors = formData.floor_colors?.length || 0;
    if (numFloors === 0) return;
    
    const newColors = [];
    for (let i = 0; i < numFloors; i++) {
      const ratio = i / Math.max(1, numFloors - 1);
      
      // Create a gradient from warm colors (bottom) to cool colors (top)
      const hue = 0.15 - (ratio * 0.4); // From yellow-orange to blue-purple
      const saturation = 0.7 - (ratio * 0.3); // Slightly less saturated at top
      const brightness = 0.8 + (ratio * 0.2); // Slightly brighter at top
      
      // Convert HSL to RGB to HEX
      const rgb = hslToRgb(hue, saturation, brightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      newColors.push(hex);
    }
    
    setFormData(prev => ({
      ...prev,
      floor_colors: newColors
    }));
  };

  const resetToDefaultColors = () => {
    const numFloors = formData.floor_colors?.length || 0;
    if (numFloors === 0) return;
    
    const defaultColors = Array(numFloors).fill('#4CAF50');
    setFormData(prev => ({
      ...prev,
      floor_colors: defaultColors
    }));
  };

  // Helper functions for color conversion
  const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await buildingService.saveBuilding(
        buildingId, 
        formData, 
        formData.geometry_points, 
        formData.ai_command, 
        parseFloat(formData.height) || 0,
        formData.floor_colors
      );
      if (result.success) {
        onSave && onSave('Building data saved successfully!');
        onClose();
      } else {
        console.error('Error saving building:', result.error);
        onSave && onSave('Error saving building data.');
      }
    } catch (error) {
      console.error('Error saving building data:', error);
      onSave && onSave('Error saving building data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="data-form-modal">
      <h3>Building Information</h3>
      <div id="data-form-container">
        <form id="building-data-form">
          <div className="form-grid">
            <div><label htmlFor="wkt">WKT</label><input type="text" id="wkt" name="wkt" value={formData.wkt} onChange={handleInputChange} /></div>
            <div><label htmlFor="full_addres_q">Full Address</label><input type="text" id="full_addres_q" name="full_addres_q" value={formData.full_addres_q} onChange={handleInputChange} /></div>
            <div><label htmlFor="street_cod">street_cod</label><input type="text" id="street_cod" name="street_cod" value={formData.street_cod} onChange={handleInputChange} /></div>
            <div><label htmlFor="bldg_num">bldg_num</label><input type="text" id="bldg_num" name="bldg_num" value={formData.bldg_num} onChange={handleInputChange} /></div>
            <div><label htmlFor="bldg_type">bldg_type</label><input type="text" id="bldg_type" name="bldg_type" value={formData.bldg_type} onChange={handleInputChange} /></div>
            <div><label htmlFor="num_floors">num_floors</label><input type="text" id="num_floors" name="num_floors" value={formData.num_floors} onChange={handleInputChange} /></div>
            <div><label htmlFor="street_c_1">street_c_1</label><input type="text" id="street_c_1" name="street_c_1" value={formData.street_c_1} onChange={handleInputChange} /></div>
            <div><label htmlFor="bldg_num_2">bldg_num_2</label><input type="text" id="bldg_num_2" name="bldg_num_2" value={formData.bldg_num_2} onChange={handleInputChange} /></div>
            <div><label htmlFor="street_is_tama">street_is_tama</label><input type="text" id="street_is_tama" name="street_is_tama" value={formData.street_is_tama} onChange={handleInputChange} /></div>
            <div><label htmlFor="no_floors">no_floors</label><input type="text" id="no_floors" name="no_floors" value={formData.no_floors} onChange={handleInputChange} /></div>
            <div><label htmlFor="no_apt">no_apt</label><input type="text" id="no_apt" name="no_apt" value={formData.no_apt} onChange={handleInputChange} /></div>
            <div><label htmlFor="st_code">st_code</label><input type="text" id="st_code" name="st_code" value={formData.st_code} onChange={handleInputChange} /></div>
            <div><label htmlFor="street_1">street_1</label><input type="text" id="street_1" name="street_1" value={formData.street_1} onChange={handleInputChange} /></div>
            <div><label htmlFor="color">color</label><input type="text" id="color" name="color" value={formData.color} onChange={handleInputChange} /></div>
            <div><label htmlFor="מיון_2">מיון_2</label><input type="text" id="מיון_2" name="מיון_2" value={formData.מיון_2} onChange={handleInputChange} /></div>
            <div><label htmlFor="masadcolor2">masadcolor2</label><input type="text" id="masadcolor2" name="masadcolor2" value={formData.masadcolor2} onChange={handleInputChange} /></div>
            <div><label htmlFor="color_sofi">color_sofi</label><input type="text" id="color_sofi" name="color_sofi" value={formData.color_sofi} onChange={handleInputChange} /></div>
            <div><label htmlFor="full_addresse">full_addresse</label><input type="text" id="full_addresse" name="full_addresse" value={formData.full_addresse} onChange={handleInputChange} /></div>
            <div><label htmlFor="mi_address">mi_address</label><input type="text" id="mi_address" name="mi_address" value={formData.mi_address} onChange={handleInputChange} /></div>
            <div><label htmlFor="codeapp">codeapp</label><input type="text" id="codeapp" name="codeapp" value={formData.codeapp} onChange={handleInputChange} /></div>
            <div><label htmlFor="height">Height (m)</label><input type="number" id="height" name="height" value={formData.height} onChange={handleInputChange} /></div>
            <div><label htmlFor="ai_command">AI Command</label><input type="text" id="ai_command" name="ai_command" value={formData.ai_command} onChange={handleInputChange} /></div>
            <div><label htmlFor="הערכת_מחיר_שמאי">הערכת מחיר שמאי</label><input type="text" id="הערכת_מחיר_שמאי" name="הערכת_מחיר_שמאי" value={formData.הערכת_מחיר_שמאי} onChange={handleInputChange} /></div>
            <div><label htmlFor="ערך_משוער_לפי_מאפייני_סביבה">ערך משוער לפי מאפייני סביבה</label><input type="text" id="ערך_משוער_לפי_מאפייני_סביבה" name="ערך_משוער_לפי_מאפייני_סביבה" value={formData.ערך_משוער_לפי_מאפייני_סביבה} onChange={handleInputChange} /></div>
            <div><label htmlFor="מחיר_ממוצע_למטר">מחיר ממוצע למטר</label><input type="text" id="מחיר_ממוצע_למטר" name="מחיר_ממוצע_למטר" value={formData.מחיר_ממוצע_למטר} onChange={handleInputChange} /></div>
            <div><label htmlFor="צרכים_ציבוריים">צרכים ציבוריים</label><input type="text" id="צרכים_ציבוריים" name="צרכים_ציבוריים" value={formData.צרכים_ציבוריים} onChange={handleInputChange} /></div>
            <div><label htmlFor="שיוך_לרשות">שיוך לרשות</label><input type="text" id="שיוך_לרשות" name="שיוך_לרשות" value={formData.שיוך_לרשות} onChange={handleInputChange} /></div>
            <div style={{gridColumn: '1 / -1'}}>
              <label>Floor Colors</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                {formData.floor_colors && formData.floor_colors.map((color, index) => (
                  <div key={index} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <span style={{fontSize: '12px', color: '#bbb'}}>Floor {index + 1}:</span>
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => {
                        const newColors = [...formData.floor_colors];
                        newColors[index] = e.target.value;
                        setFormData(prev => ({...prev, floor_colors: newColors}));
                      }}
                      style={{width: '40px', height: '30px', border: 'none', borderRadius: '4px'}}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
      <div id="data-form-buttons">
        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Data'}
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DataFormModal;