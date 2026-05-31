import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-left">
          <span className="footer-logo">WISDOM MANJERI</span>
          <p className="footer-tagline">
            Organizing high-quality Islamic learning, classes, and community events for all.
          </p>
        </div>
        
        <div className="footer-right">
          <p className="copyright-text">
            &copy; {currentYear} Wisdom Manjeri. All rights reserved.
          </p>
          <p className="attribution flex-center">
            Developed with <Heart size={12} className="heart-icon" /> for the community.
          </p>
        </div>
      </div>

      <style>{`
        .site-footer {
          background-color: var(--bg-card);
          border-top: 1px solid var(--border);
          padding: 32px 0;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: auto;
        }
        .footer-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .footer-left {
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
          color: var(--text-main);
        }
        .footer-tagline {
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .heart-icon {
          color: var(--error);
          fill: var(--error);
          margin: 0 4px;
          display: inline;
        }
        .attribution {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .footer-container {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            gap: 20px;
          }
          .footer-right {
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
};
