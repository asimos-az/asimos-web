import React from 'react';
import { Col, Row } from 'antd';

const JobDetail = ({ job, onClose, mode = 'modal' }) => {
  if (!job) return null;

  const isPage = mode === 'page';

  const lat = job.location?.lat;
  const lng = job.location?.lng;
  const hasLocation = lat && lng;

  const mapSrc = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : "";

  const renderContact = () => {
    if (job.link) {
      return <a href={job.link} target="_blank" rel="noopener noreferrer">{job.link}</a>;
    }
    if (job.whatsapp) {
      return <a href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{job.whatsapp}</a>;
    }
    if (job.phone) {
      return <a href={`tel:${job.phone}`}>{job.phone}</a>;
    }
    return 'Qeyd edilməyib';
  };

  return (
    <div className={isPage ? 'job-detail-page' : 'job-detail-backdrop'} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? 'job-detail-page-container' : 'job-detail-container'} onClick={isPage ? undefined : (e) => e.stopPropagation()}>
        <div className="job-detail-header">
          <div className="job-detail-header-main">
            <div className="job-detail-logo">
              {(job.companyName || job.company_name || 'A')[0].toUpperCase()}
            </div>
            <div className="job-detail-title-section">
              <h2 className="job-detail-title">{job.title}</h2>
              <p className="job-detail-company">{job.companyName || job.company_name}</p>
            </div>
          </div>
          {!isPage ? (
            <button className="job-detail-close" onClick={onClose}>
              &times;
            </button>
          ) : null}
        </div>

        <Row className="job-detail-body" gutter={[32, 32]}>
          <Col xs={24} lg={14} className="job-detail-main-content">
            <h3 className="job-detail-section-title">İş haqqında məlumat</h3>
            <p className="job-detail-description">{job.description}</p>

            <div className="job-detail-info-grid">
              <div className="info-item">
                <span className="info-label">Maaş</span>
                <span className="info-value">{job.wage || 'Razılaşma ilə'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Kateqoriya</span>
                <span className="info-value">{job.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">İş növü</span>
                <span className="info-value">{job.jobType === 'permanent' ? 'Daimi' : 'Müvəqqəti'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">İş qrafiki</span>
                <span className="info-value">{job.work_type || 'Tam ştat'}</span>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={10} className="job-detail-sidebar">
            {hasLocation ? (
              <div className="job-detail-map-card">
                <h3 className="job-detail-section-title">Xəritədə ünvan</h3>
                <iframe
                  className="job-detail-map-frame"
                  width="100%"
                  height="320"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={mapSrc}
                ></iframe>
              </div>
            ) : null}
            <div className="job-detail-meta">
              <h4 className="meta-title">Əlavə məlumat</h4>
              <div className="meta-item">
                <span className="meta-label">Əlaqə</span>
                <span className="meta-value">{renderContact()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Ünvan</span>
                <span className="meta-value">{job.location?.address || 'Qeyd edilməyib'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Elan tarixi</span>
                <span className="meta-value">
                  {new Date(job.createdAt).toLocaleDateString('az-AZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default JobDetail;
