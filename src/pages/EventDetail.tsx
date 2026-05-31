import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { FormRenderer } from '../components/FormRenderer';
import type { WisdomEvent } from '../types';

export const EventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<WisdomEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccessfully, setRegisteredSuccessfully] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const fetchEventDetails = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (fetchErr) throw fetchErr;

      setEvent(data as WisdomEvent);
    } catch (err: any) {
      console.error('Error loading event details:', err);
      setError('Event not found or has been archived.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async (responses: Record<string, string | string[]>) => {
    if (!event) return;

    try {
      // Save response to 'registrations' table
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          form_responses: responses,
        });

      if (insertError) throw insertError;

      // Transition to success layout
      setRegisteredSuccessfully(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert('We could not save your registration. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="detail-loading-container flex-center container">
        <Loader2 size={36} className="spinner-icon animate-spin" />
        <p>Loading event information...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container detail-error-container">
        <div className="glass-card error-details">
          <ShieldAlert size={48} className="error-icon" />
          <h2>Event Not Found</h2>
          <p>{error || 'The requested event is not available.'}</p>
          <Link to="/" className="btn btn-primary">
            Back to All Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page container premium-glow">
      <Link to="/" className="btn btn-secondary back-link flex-center">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      {registeredSuccessfully ? (
        /* GORGEOUS SUCCESS RECEIPT CARD */
        <div className="success-receipt-card glass-card">
          <div className="success-header flex-center">
            <CheckCircle2 size={64} className="success-tick-icon" />
            <h2 className="success-title">Registration Confirmed!</h2>
            <p className="success-message">
              Alhamdulillah, your registration for <strong>{event.title}</strong> has been successfully received.
            </p>
          </div>

          <div className="receipt-details">
            <div className="receipt-section-title">Event Information</div>
            <div className="receipt-info-row">
              <span className="info-label">Title:</span>
              <span className="info-value">{event.title}</span>
            </div>
            <div className="receipt-info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">{formatDate(event.start_date)}</span>
            </div>
            <div className="receipt-info-row">
              <span className="info-label">Time:</span>
              <span className="info-value">
                {formatTime(event.start_date)}
                {event.end_date ? ` - ${formatTime(event.end_date)}` : ''}
              </span>
            </div>
            <div className="receipt-info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">{event.location}</span>
            </div>
          </div>

          <div className="success-action-block">
            <p className="screenshot-tip">💡 Tip: Take a screenshot of this receipt for your reference.</p>
            <Link to="/" className="btn btn-primary btn-mobile-full">
              Back to Events Home
            </Link>
          </div>
        </div>
      ) : (
        /* FULL DETAIL & REGISTRATION DISPLAY */
        <div className="detail-layout">
          {/* Main info, Flyer & Details */}
          <div className="detail-info-pane">
            <h1 className="event-title-display">{event.title}</h1>
            <span className="badge badge-accent category-badge">{event.category}</span>

            {/* Flyer Image Container */}
            <div className="flyer-display-frame glass-card">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="detail-flyer-img" />
              ) : (
                <div className="detail-flyer-placeholder flex-center">
                  <div className="placeholder-brand">WISDOM</div>
                </div>
              )}
            </div>

            {/* Event Logistics Metadata */}
            <div className="logistics-grid glass-card">
              <div className="logistics-item">
                <Calendar className="logistics-icon" />
                <div className="logistics-text">
                  <span className="logistics-label">Date & Time</span>
                  <span className="logistics-val">{formatDate(event.start_date)}</span>
                  <span className="logistics-subval">
                    {formatTime(event.start_date)}
                    {event.end_date ? ` - ${formatTime(event.end_date)}` : ''}
                  </span>
                </div>
              </div>
              <div className="logistics-item">
                <MapPin className="logistics-icon" />
                <div className="logistics-text">
                  <span className="logistics-label">Location</span>
                  <span className="logistics-val">{event.location}</span>
                </div>
              </div>
            </div>

            {/* Rich Description */}
            <div className="event-description-block glass-card">
              <h3 className="section-title">About the Event</h3>
              <p className="description-text">{event.description}</p>
            </div>
          </div>

          {/* Form registration container */}
          <div className="detail-form-pane">
            <div className="registration-form-box glass-card">
              <h3 className="registration-form-title">Submit Registration</h3>
              <p className="registration-form-subtitle">
                Fill out the required information below to reserve your place. No account needed.
              </p>
              
              <FormRenderer 
                fields={event.form_config} 
                onSubmit={handleRegistrationSubmit} 
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .event-detail-page {
          padding-bottom: 80px;
        }
        .back-link {
          align-self: flex-start;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .detail-loading-container {
          flex-direction: column;
          gap: 16px;
          min-height: 50vh;
          color: var(--text-muted);
        }
        .detail-error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }
        .error-details {
          max-width: 500px;
          width: 100%;
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          border-color: var(--error);
        }
        .error-icon {
          color: var(--error);
        }
        
        /* Layout Grid */
        .detail-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 36px;
          align-items: start;
        }

        .event-title-display {
          font-size: 2.2rem;
          color: var(--primary);
          line-height: 1.25;
          margin-bottom: 8px;
        }
        .category-badge {
          margin-bottom: 20px;
        }
        .flyer-display-frame {
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: var(--shadow);
        }
        .flyer-display-frame:hover {
          transform: none; /* Disable card hover lift on flyers */
        }
        .detail-flyer-img {
          width: 100%;
          max-height: 480px;
          object-fit: contain;
          display: block;
        }
        .detail-flyer-placeholder {
          width: 100%;
          height: 300px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        }
        .placeholder-brand {
          font-family: var(--font-display);
          color: #ffffff;
          font-weight: 800;
          letter-spacing: 4px;
          font-size: 2rem;
        }
        .logistics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px;
          margin-bottom: 24px;
          background-color: var(--bg-card);
        }
        .logistics-grid:hover {
          transform: none;
        }
        .logistics-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .logistics-icon {
          color: var(--primary);
          width: 24px;
          height: 24px;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .logistics-text {
          display: flex;
          flex-direction: column;
        }
        .logistics-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .logistics-val {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
          margin-top: 2px;
        }
        .logistics-subval {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .event-description-block {
          padding: 24px;
          background-color: var(--bg-card);
        }
        .event-description-block:hover {
          transform: none;
        }
        .section-title {
          font-size: 1.15rem;
          color: var(--primary);
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .description-text {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.7;
          white-space: pre-wrap;
        }

        /* Form Registration box */
        .registration-form-box {
          padding: 28px;
          background-color: var(--bg-card);
          border-color: var(--primary);
          position: sticky;
          top: 86px;
        }
        .registration-form-box:hover {
          transform: none;
          box-shadow: var(--shadow);
        }
        .registration-form-title {
          font-size: 1.25rem;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .registration-form-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        /* SUCCESS RECEIPT CARD STYLES */
        .success-receipt-card {
          max-width: 600px;
          margin: 40px auto 0;
          padding: 40px 32px;
          text-align: center;
          border-color: var(--success);
          background-color: var(--bg-card);
        }
        .success-receipt-card:hover {
          transform: none;
        }
        .success-header {
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }
        .success-tick-icon {
          color: var(--success);
          filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.2));
        }
        .success-title {
          font-size: 1.8rem;
          color: var(--success);
        }
        .success-message {
          font-size: 1rem;
          color: var(--text-muted);
        }
        .receipt-details {
          text-align: left;
          background-color: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          margin-bottom: 28px;
        }
        .receipt-section-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: var(--primary);
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
          margin-bottom: 14px;
        }
        .receipt-info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed var(--border);
          font-size: 0.9rem;
        }
        .receipt-info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: var(--text-muted);
        }
        .info-value {
          font-weight: 700;
          color: var(--text-main);
          text-align: right;
        }
        .success-action-block {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }
        .screenshot-tip {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--primary);
        }

        @media (max-width: 1024px) {
          .detail-layout {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .registration-form-box {
            position: static;
          }
        }
        @media (max-width: 768px) {
          .event-title-display {
            font-size: 1.7rem;
          }
          .logistics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .success-receipt-card {
            padding: 24px 16px;
          }
          .success-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
