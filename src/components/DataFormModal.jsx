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
          </div>
          
          {/* Floor Colors Section */}
          <div style={{marginTop: '20px', borderTop: '1px solid #555', paddingTop: '15px'}}>
            <h4 style={{margin: '0 0 15px 0', color: '#fff'}}>Floor Colors ({formData.floor_colors?.length || 0} floors)</h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
              {formData.floor_colors && formData.floor_colors.length > 0 ? (
                formData.floor_colors.map((color, index) => (
                  <div key={index} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: '#333',
                    borderRadius: '6px',
                    border: '1px solid #555'
                  }}>
                    <span style={{fontSize: '13px', color: '#bbb', minWidth: '60px'}}>
                      Floor {index + 1}:
                    </span>
                    <input 
                      type="color" 
                      value={color || '#4CAF50'} 
                      onChange={(e) => handleFloorColorChange(index, e.target.value)}
                      style={{
                        width: '50px', 
                        height: '35px', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: '11px', 
                      color: '#888',
                      fontFamily: 'monospace',
                      backgroundColor: '#222',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}>
                      {color || '#4CAF50'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#888',
                  fontStyle: 'italic',
                  padding: '20px'
                }}>
                  No floor colors available. Create a building first to see floor colors.
                </div>
              )}
            </div>
            
            {/* Color Palette Actions */}
            {formData.floor_colors && formData.floor_colors.length > 0 && (
              <div style={{marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button 
                  type="button"
                  onClick={generateGradientColors}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🌈 Generate Gradient
                </button>
                <button 
                  type="button"
                  onClick={resetToDefaultColors}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Reset Colors
                </button>
              </div>
            )}
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