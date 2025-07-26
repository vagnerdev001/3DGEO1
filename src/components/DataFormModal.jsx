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
    floor_colors: []
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
        onSave && onSave(result.data || formData);
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