import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import type { WisdomEvent } from '../types';

export const EventFeed: React.FC = () => {
  const [events, setEvents] = useState<WisdomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [timelineFilter, setTimelineFilter] = useState<'upcoming' | 'past'>('upcoming');

  const categories = ['All', 'Class', 'Youth Event', 'Lecture', 'Community'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch published events, order by start date
      const { data, error: fetchErr } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (fetchErr) throw fetchErr;

      setEvents((data as WisdomEvent[]) || []);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on active filters
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;

    const eventDate = new Date(event.start_date);
    const now = new Date();
    const isUpcoming = eventDate >= now || (event.end_date && new Date(event.end_date) >= now);
    const matchesTimeline = timelineFilter === 'upcoming' ? isUpcoming : !isUpcoming;

    return matchesSearch && matchesCategory && matchesTimeline;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="event-feed-page container premium-glow">
      {/* Hero Intro */}
      <section className="feed-hero">
        <h1 className="hero-title">Wisdom Events Hub</h1>
        <p className="hero-subtitle">
          Explore and register for our upcoming Islamic classes, youth activities, and community programs. 
          Everything is organized for easy access in one place.
        </p>
      </section>

      {/* Search & Filter Panel */}
      <div className="filter-controls-panel glass-card">
        {/* Search */}
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search classes, events or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>

        {/* Timeline selection */}
        <div className="timeline-tabs">
          <button
            onClick={() => setTimelineFilter('upcoming')}
            className={`timeline-tab-btn ${timelineFilter === 'upcoming' ? 'active' : ''}`}
          >
            Upcoming & Ongoing
          </button>
          <button
            onClick={() => setTimelineFilter('past')}
            className={`timeline-tab-btn ${timelineFilter === 'past' ? 'active' : ''}`}
          >
            Past Activities
          </button>
        </div>

        {/* Category Tabs */}
        <div className="category-scroll-container">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-tab-btn ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid Workspace */}
      {loading ? (
        <div className="feed-state-msg flex-center">
          <Loader2 size={32} className="spinner-icon animate-spin" />
          <p>Loading Wisdom events...</p>
        </div>
      ) : error ? (
        <div className="feed-state-msg error-state glass-card">
          <p>{error}</p>
          <button onClick={fetchEvents} className="btn btn-secondary">
            Retry Loading
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No Events Found</h3>
          <p>We couldn't find any events matching your selected criteria. Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <article key={event.id} className="event-card glass-card">
              {/* Flyer Cover Section */}
              <div className="card-cover">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="cover-img" loading="lazy" />
                ) : (
                  <div className="cover-placeholder flex-center">
                    <div className="placeholder-ornament">
                      <span className="ornament-text">WISDOM</span>
                    </div>
                  </div>
                )}
                <span className="card-badge badge badge-accent">{event.category}</span>
              </div>

              {/* Event Card Content */}
              <div className="card-body">
                <h3 className="card-title">{event.title}</h3>
                
                <div className="card-meta-list">
                  <div className="meta-item flex-center">
                    <Calendar size={15} />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="meta-item flex-center">
                    <MapPin size={15} />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <p className="card-description truncate-line-2">{event.description}</p>
                
                <Link to={`/event/${event.slug}`} className="btn btn-primary card-action-btn btn-mobile-full">
                  <span>View & Register</span> <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .event-feed-page {
          padding-bottom: 60px;
        }
        .feed-hero {
          text-align: center;
          margin-bottom: 36px;
        }
        .hero-title {
          font-size: 2.5rem;
          color: var(--primary);
          margin-bottom: 12px;
          text-shadow: 0 2px 10px var(--primary-glow);
        }
        .hero-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 700px;
          margin: 0 auto;
        }
        .filter-controls-panel {
          padding: 20px;
          margin-bottom: 36px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-color: var(--border);
        }
        .filter-controls-panel:hover {
          transform: none;
        }
        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }
        .search-input {
          padding-left: 48px;
        }
        .timeline-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .timeline-tab-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .timeline-tab-btn:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .timeline-tab-btn.active {
          color: var(--primary);
          background-color: var(--primary-light);
          box-shadow: inset 0 -2px 0 var(--primary);
        }
        .category-scroll-container {
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
        }
        .category-scroll-container::-webkit-scrollbar {
          display: none; /* Safari & Chrome */
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          width: max-content;
        }
        .category-tab-btn {
          background: var(--bg-main);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .category-tab-btn:hover, .category-tab-btn.active {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .feed-state-msg {
          flex-direction: column;
          gap: 16px;
          padding: 60px 24px;
          color: var(--text-muted);
        }
        .error-state {
          border-color: var(--error);
          text-align: center;
        }
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }
        .event-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .card-cover {
          position: relative;
          height: 200px;
          overflow: hidden;
          background: var(--primary-light);
        }
        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition);
        }
        .event-card:hover .cover-img {
          transform: scale(1.04);
        }
        .cover-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        }
        .placeholder-ornament {
          border: 2px solid rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 4px;
        }
        .ornament-text {
          font-family: var(--font-display);
          color: #ffffff;
          font-weight: 800;
          letter-spacing: 2px;
          font-size: 1.1rem;
        }
        .card-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .card-title {
          font-size: 1.25rem;
          color: var(--text-main);
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .card-meta-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .meta-item {
          justify-content: flex-start;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .card-description {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 20px;
          flex-grow: 1;
        }
        .truncate-line-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .card-action-btn {
          margin-top: auto;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }
          .hero-subtitle {
            font-size: 0.95rem;
          }
          .events-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};
