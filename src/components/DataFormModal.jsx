import { useState, useEffect } from 'react';
import { saveBuildingData, getBuildingData } from '../services/firebase';
import './DataFormModal.css';

const DataFormModal = ({ buildingId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    WKT: '',
    full_addres_Q: '',
    STREET_COD: '',
    BLDG_NUM: '',
    BLDG_TYPE: '',
    NUM_FLOORS: '',
    STREET_C_1: '',
    BLDG_NUM_2: '',
    StreetIs_Tama: '',
    No_Floors: '',
    no_apt: '',
    ST_Code: '',
    STREET_1: '',
    color: '',
    מיון_2: '',
    masadcolor2: '',
    color_sofi: '',
    full_addresse: '',
    mi_address: '',
    codeapp: ''
  });

  useEffect(() => {
    const loadBuildingData = async () => {
      if (buildingId) {
        const data = await getBuildingData(buildingId);
        if (data) {
          setFormData(data);
        }
      }
    };
    loadBuildingData();
  }, [buildingId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!buildingId) return;

    try {
      await saveBuildingData(buildingId, formData);
      onSave(`Data saved for building ${buildingId}`);
      onClose();
    } catch (error) {
      console.error("Error saving data: ", error);
      onSave('Error saving data.');
    }
  };

  const formFields = Object.keys(formData);

  return (
    <div id="data-form-modal">
      <h3>Building Information</h3>
      <div id="data-form-container">
        <form id="building-data-form">
          <div className="form-grid">
            {formFields.map(field => (
              <div key={field}>
                <label htmlFor={field}>{field}</label>
                <input
                  type="text"
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                />
              </div>
            ))}
          </div>
        </form>
      </div>
      <div id="data-form-buttons">
        <button id="save-data-button" onClick={handleSave}>
          Save Data
        </button>
        <button id="close-form-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default DataFormModal;