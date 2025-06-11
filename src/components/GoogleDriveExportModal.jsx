import React, { useState } from 'react';
import { X, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function GoogleDriveExportModal({ onExport, onCancel }) {
  const [lookbackHours, setLookbackHours] = useState(36);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lookbackHours && lookbackHours > 0) {
      setIsExporting(true);
      setExportResult(null);
      setExportError(null);
      
      try {
        const result = await onExport(lookbackHours);
        setExportResult(result);
        setIsExporting(false);
      } catch (error) {
        console.error('Export failed:', error);
        setExportError(error.message || 'Export failed. Please try again.');
        setIsExporting(false);
      }
    }
  };

  const handleClose = () => {
    setExportResult(null);
    setExportError(null);
    onCancel();
  };

  const presetOptions = [
    { label: '6 hours', value: 6 },
    { label: '12 hours', value: 12 },
    { label: '24 hours', value: 24 },
    { label: '36 hours (default)', value: 36 },
    { label: '48 hours', value: 48 },
    { label: '72 hours (3 days)', value: 72 },
    { label: '168 hours (1 week)', value: 168 }
  ];

  return (
    <div className="modal-overlay" onClick={exportResult || exportError ? handleClose : onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Google Drive History</h2>
          <button className="modal-close" onClick={handleClose}><X size={18} /></button>
        </div>
        
        {/* Export Results Display */}
        {exportResult && (
          <div className="modal-body">
            <div className="export-success">
              <div className="export-success-header">
                <CheckCircle size={24} className="success-icon" />
                <h3>Export Completed Successfully!</h3>
              </div>
              
              <div className="export-stats">
                <div className="stat-row">
                  <span className="stat-label">Lookback Period:</span>
                  <span className="stat-value">{lookbackHours} hours</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total Changes:</span>
                  <span className="stat-value">{exportResult.changesDetected}</span>
                </div>
                {exportResult.changesDetected > 0 && (
                  <>
                    <div className="stat-row">
                      <span className="stat-label">• Added:</span>
                      <span className="stat-value">{exportResult.changes?.added?.length || 0} files</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">• Modified:</span>
                      <span className="stat-value">{exportResult.changes?.modified?.length || 0} files</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">• Deleted:</span>
                      <span className="stat-value">{exportResult.changes?.deleted?.length || 0} files</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="export-message">
                <p>📁 <strong>Export file download started!</strong></p>
                <p>You can now upload this file to Claude AI for analysis.</p>
              </div>
            </div>
          </div>
        )}

        {/* Export Error Display */}
        {exportError && (
          <div className="modal-body">
            <div className="export-error">
              <div className="export-error-header">
                <AlertCircle size={24} className="error-icon" />
                <h3>Export Failed</h3>
              </div>
              <p className="error-message">{exportError}</p>
              <p className="error-hint">Please ensure the Google Drive service is properly configured and try again.</p>
            </div>
          </div>
        )}

        {/* Export Form - hidden when showing results */}
        {!exportResult && !exportError && (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="lookbackHours">
                <Clock size={16} style={{ marginRight: '8px' }} />
                Lookback Period (hours)
              </label>
              <input
                type="number"
                id="lookbackHours"
                value={lookbackHours}
                onChange={(e) => setLookbackHours(parseInt(e.target.value) || 0)}
                min="1"
                max="8760"
                required
                disabled={isExporting}
              />
              <small className="form-hint">
                Export files modified within the last {lookbackHours} hours
              </small>
            </div>

            <div className="form-group">
              <label>Quick Presets</label>
              <div className="preset-buttons">
                {presetOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`preset-btn ${lookbackHours === option.value ? 'active' : ''}`}
                    onClick={() => setLookbackHours(option.value)}
                    disabled={isExporting}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={handleClose} disabled={isExporting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isExporting || !lookbackHours || lookbackHours <= 0}>
                {isExporting ? (
                  <>
                    <div className="spinner-small"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export & Download
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer for results view */}
        {(exportResult || exportError) && (
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn-primary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleDriveExportModal;