import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Plus, Edit3, Eye, Trash2, 
  Download, LogOut, Loader2, ListChecks, FileText, 
  Image, Search
} from 'lucide-react';
import { supabase, uploadEventFlyer } from '../utils/supabaseClient';
import { FormBuilder } from '../components/FormBuilder';
import type { WisdomEvent, Registration, FormField } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // Tab Routing: 'events' | 'editor' | 'registrations'
  const [activeTab, setActiveTab] = useState<'events' | 'editor' | 'registrations'>('events');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data lists
  const [events, setEvents] = useState<WisdomEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Event Creator/Editor State
  const [editingEventId, setEditingEventId] = useState<string | null>(null); // null = Creating new
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Class');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventStatus, setEventStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [eventImageUrl, setEventImageUrl] = useState<string>('');
  const [eventFormConfig, setEventFormConfig] = useState<FormField[]>([
    { id: 'q_name', label: 'Full Name', type: 'text', required: true },
    { id: 'q_phone', label: 'WhatsApp / Phone Number', type: 'text', required: true },
    { id: 'q_gender', label: 'Gender', type: 'radio', required: true, options: ['Male', 'Female'] }
  ]);

  // Uploading flyer state
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    // Authenticate Admin Session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/admin');
      } else {
        // Retrieve profile role to verify access
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
          await supabase.auth.signOut();
          navigate('/admin');
        } else {
          setAdminUser(session.user);
          fetchEvents();
        }
      }
    });

    // Listen for Auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        navigate('/admin');
      } else if (event === 'SIGNED_IN') {
        // Double check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
          await supabase.auth.signOut();
          navigate('/admin');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch registrations when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    } else {
      setRegistrations([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Admin sees ALL events (draft, published, archived)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetchedEvents = (data as WisdomEvent[]) || [];
      setEvents(fetchedEvents);
      
      // Auto select the first event if none is selected
      if (fetchedEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(fetchedEvents[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations((data as Registration[]) || []);
    } catch (err) {
      console.error('Error loading registrations:', err);
    }
  };

  // Convert ISO string to format suitable for datetime-local inputs (YYYY-MM-DDTHH:MM)
  const formatISODateToLocalInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Adjust to local timezone
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  // Switch to Editor to edit an existing event
  const handleEditEventClick = (event: WisdomEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventCategory(event.category);
    setEventLocation(event.location);
    setEventStartDate(formatISODateToLocalInput(event.start_date));
    setEventEndDate(event.end_date ? formatISODateToLocalInput(event.end_date) : '');
    setEventStatus(event.status);
    setEventImageUrl(event.image_url || '');
    setEventFormConfig(event.form_config);
    setActiveTab('editor');
  };

  // Setup state to create a brand new event
  const handleNewEventClick = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventCategory('Class');
    setEventLocation('');
    setEventStartDate('');
    setEventEndDate('');
    setEventStatus('draft');
    setEventImageUrl('');
    setEventFormConfig([
      { id: 'q_name', label: 'Full Name', type: 'text', required: true },
      { id: 'q_phone', label: 'WhatsApp / Phone Number', type: 'text', required: true },
      { id: 'q_gender', label: 'Gender', type: 'radio', required: true, options: ['Male', 'Female'] }
    ]);
    setActiveTab('editor');
  };

  // Handle Event Flyer image uploading
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const publicUrl = await uploadEventFlyer(file);
      if (publicUrl) {
        setEventImageUrl(publicUrl);
      } else {
        alert('Flyer upload failed. Ensure the storage bucket exists.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Create or Update Event Submit dispatcher
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!eventTitle || !eventStartDate || !eventLocation) {
      alert('Please fill in Event Title, Location, and Start Date.');
      setActionLoading(false);
      return;
    }

    // Slugify title
    const slug = eventTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const eventPayload = {
      title: eventTitle,
      slug: editingEventId ? undefined : slug, // Only generate slug on create
      description: eventDescription,
      category: eventCategory,
      location: eventLocation,
      start_date: new Date(eventStartDate).toISOString(),
      end_date: eventEndDate ? new Date(eventEndDate).toISOString() : null,
      status: eventStatus,
      image_url: eventImageUrl || null,
      form_config: eventFormConfig,
      created_by: adminUser?.id,
    };

    try {
      if (editingEventId) {
        // Update Action
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editingEventId);

        if (error) throw error;
        alert('Event updated successfully!');
      } else {
        // Create Action
        const { error } = await supabase
          .from('events')
          .insert(eventPayload);

        if (error) throw error;
        alert('Event published/created successfully!');
      }

      // Reload
      fetchEvents();
      setActiveTab('events');
    } catch (err: any) {
      console.error(err);
      alert('Error saving event: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete event and registrations
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('⚠️ Warning: Deleting this event will permanently delete all its registered attendee responses. Proceed?')) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEventId === id) setSelectedEventId('');
      alert('Event deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Error deleting event: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Toggle Event status (published <-> draft)
  const toggleEventStatus = async (event: WisdomEvent) => {
    try {
      const nextStatus = event.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('events')
        .update({ status: nextStatus })
        .eq('id', event.id);

      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: nextStatus } as WisdomEvent : e));
    } catch (err: any) {
      alert('Error changing status: ' + err.message);
    }
  };

  // SECURE LOGOUT DISPATCH
  const handleLogout = async () => {
    if (window.confirm('Confirm logout?')) {
      await supabase.auth.signOut();
      navigate('/admin');
    }
  };

  // IN-BROWSER EXCEL/CSV EXPORT ENGINE
  const handleExportCSV = () => {
    const activeEvent = events.find(e => e.id === selectedEventId);
    if (!activeEvent || registrations.length === 0) return;

    // Retrieve headers based on questions config
    const headers = ['Registration Date', ...activeEvent.form_config.map(f => f.label)];

    const rows = registrations.map(reg => {
      const date = new Date(reg.created_at).toLocaleDateString();
      
      const responses = activeEvent.form_config.map(field => {
        const val = reg.form_responses[field.id];
        if (!val) return '';
        
        if (Array.isArray(val)) {
          // If checkbox array, join with semicolons
          return `"${val.join('; ').replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [date, ...responses];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Trigger local download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Registrations_${activeEvent.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Registration Filtered List based on Search Query
  const filteredRegistrations = registrations.filter(reg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Search values of all response keys
    return Object.values(reg.form_responses).some(val => {
      if (Array.isArray(val)) {
        return val.some(v => String(v).toLowerCase().includes(query));
      }
      return String(val).toLowerCase().includes(query);
    });
  });

  const getActiveEventTitle = () => {
    return events.find(e => e.id === selectedEventId)?.title || 'Selected Event';
  };

  const getActiveEventFields = (): FormField[] => {
    return events.find(e => e.id === selectedEventId)?.form_config || [];
  };

  return (
    <div className="admin-dashboard-page container premium-glow">
      {/* Top Welcome Panel */}
      <section className="dashboard-hero-header glass-card flex-center" style={{ justifyContent: 'space-between', padding: '20px' }}>
        <div className="admin-profile-info">
          <h2>Admin Control panel</h2>
          <p className="admin-email">Logged in as: <strong>{adminUser?.email}</strong></p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary logout-btn flex-center">
          <LogOut size={16} /> Logout
        </button>
      </section>

      {/* Tab Navigation Workspace */}
      <div className="dashboard-navigation-tabs">
        <button
          onClick={() => setActiveTab('events')}
          className={`nav-tab-btn flex-center ${activeTab === 'events' ? 'active' : ''}`}
        >
          <FileText size={18} /> Manage Events
        </button>
        <button
          onClick={handleNewEventClick}
          className={`nav-tab-btn flex-center ${activeTab === 'editor' ? 'active' : ''}`}
        >
          <Plus size={18} /> {editingEventId ? 'Edit Event' : 'Create Event'}
        </button>
        <button
          onClick={() => {
            setActiveTab('registrations');
            if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
          }}
          className={`nav-tab-btn flex-center ${activeTab === 'registrations' ? 'active' : ''}`}
        >
          <ListChecks size={18} /> Registrations
        </button>
      </div>

      {loading ? (
        <div className="dashboard-state-msg flex-center">
          <Loader2 size={36} className="spinner-icon animate-spin" />
          <p>Fetching dashboard assets...</p>
        </div>
      ) : (
        <main className="dashboard-content-area">
          
          {/* ===================================================================
              TAB 1: EVENTS MANAGER WORKSPACE
              =================================================================== */}
          {activeTab === 'events' && (
            <div className="events-manager-tab">
              <div className="tab-actions-header">
                <h3>Wisdom Event Index ({events.length})</h3>
                <button onClick={handleNewEventClick} className="btn btn-primary flex-center">
                  <Plus size={16} /> New Class / Event
                </button>
              </div>

              {events.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>No events created yet</h3>
                  <p>Start by creating your first class, lecture, or youth event to generate registration forms.</p>
                  <button onClick={handleNewEventClick} className="btn btn-primary">
                    Create Event Now
                  </button>
                </div>
              ) : (
                <div className="admin-events-list">
                  {events.map(event => (
                    <div key={event.id} className="admin-event-row glass-card">
                      {/* Left: Info */}
                      <div className="event-row-info">
                        <div className="row-title-badge flex-center" style={{ justifyContent: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 className="row-event-title">{event.title}</h4>
                          <span className={`badge ${event.status === 'published' ? 'badge-success' : event.status === 'draft' ? 'badge-primary' : 'badge-danger'}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="row-meta-details">
                          <div className="meta-val flex-center">
                            <Calendar size={14} /> <span>{new Date(event.start_date).toLocaleDateString()}</span>
                          </div>
                          <div className="meta-val flex-center">
                            <MapPin size={14} /> <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Interactive Actions */}
                      <div className="event-row-actions">
                        <button
                          onClick={() => toggleEventStatus(event)}
                          className={`btn ${event.status === 'published' ? 'btn-secondary' : 'btn-primary'} btn-quick-toggle`}
                        >
                          {event.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => handleEditEventClick(event)} className="btn btn-secondary icon-btn-only" title="Edit Post">
                          <Edit3 size={16} />
                        </button>
                        <Link to={`/event/${event.slug}`} target="_blank" className="btn btn-secondary icon-btn-only" title="Preview Public Page">
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setActiveTab('registrations');
                          }}
                          className="btn btn-secondary icon-btn-only"
                          title="View Registrations"
                        >
                          <ListChecks size={16} />
                        </button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="btn btn-danger icon-btn-only" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 2: EVENT EDITOR WORKSPACE
              =================================================================== */}
          {activeTab === 'editor' && (
            <div className="event-editor-tab glass-card">
              <div className="editor-tab-header">
                <h3>{editingEventId ? `🔧 Edit Wisdom Event` : `📝 Create New Wisdom Event`}</h3>
                <p>Configure text content, logistics, banner image, and registration questions.</p>
              </div>

              <form onSubmit={handleSaveEvent} className="editor-form-grid">
                {/* Left Side: General Meta Data */}
                <div className="editor-fields-pane">
                  <div className="form-group">
                    <label className="form-label">Event/Class Title</label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Weekly Quran Study Circle"
                    />
                  </div>

                  <div className="form-double-group">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        value={eventCategory}
                        onChange={e => setEventCategory(e.target.value)}
                        className="form-select"
                      >
                        <option value="Class">Class</option>
                        <option value="Youth Event">Youth Event</option>
                        <option value="Lecture">Lecture</option>
                        <option value="Community">Community</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        required
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        className="form-input"
                        placeholder="e.g. Wisdom Center, Manjeri"
                      />
                    </div>
                  </div>

                  <div className="form-double-group">
                    <div className="form-group">
                      <label className="form-label">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={eventStartDate}
                        onChange={e => setEventStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date & Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={eventEndDate}
                        onChange={e => setEventEndDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={eventStatus}
                      onChange={e => setEventStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="draft">Draft (Hidden from public)</option>
                      <option value="published">Published (Live & open for registration)</option>
                      <option value="archived">Archived (Registration closed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Description / Content</label>
                    <textarea
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                      className="form-textarea"
                      placeholder="Explain what the class is about, who is the teacher/lecturer, etc."
                      style={{ minHeight: '140px' }}
                    />
                  </div>

                  {/* Flyer Upload Box */}
                  <div className="form-group">
                    <label className="form-label flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                      <Image size={18} /> Event Flyer Image
                    </label>
                    
                    <div className="flyer-upload-zone flex-center glass-card">
                      {eventImageUrl ? (
                        <div className="uploaded-flyer-preview">
                          <img src={eventImageUrl} alt="Uploaded Flyer" className="upload-preview-img" />
                          <button
                            type="button"
                            onClick={() => setEventImageUrl('')}
                            className="btn btn-danger btn-remove-img"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="upload-input-prompt flex-center">
                          {uploadingImage ? (
                            <div className="upload-busy flex-center" style={{ flexDirection: 'column', gap: '8px' }}>
                              <Loader2 className="spinner-icon animate-spin" />
                              <span>Uploading to Supabase...</span>
                            </div>
                          ) : (
                            <>
                              <p className="upload-guide">Drag & drop or click to upload flyer poster</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="upload-hidden-input"
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Form Configurator */}
                <div className="editor-form-builder-pane">
                  <FormBuilder 
                    fields={eventFormConfig} 
                    onChange={setEventFormConfig} 
                  />
                </div>

                {/* Save and Submit Action Block */}
                <div className="editor-actions-row">
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="btn btn-secondary btn-mobile-full"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-mobile-full"
                    disabled={actionLoading || uploadingImage}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="spinner-icon animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save & Apply changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================
              TAB 3: REGISTRATIONS VIEW WORKSPACE
              =================================================================== */}
          {activeTab === 'registrations' && (
            <div className="registrations-tab">
              {/* Event Select Header */}
              <div className="registrations-header-panel glass-card">
                <div className="form-group flex-event-select" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Event/Class:</label>
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="form-select event-select-dropdown"
                  >
                    {events.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.title} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEventId && registrations.length > 0 && (
                  <button onClick={handleExportCSV} className="btn btn-accent btn-export-csv flex-center btn-mobile-full">
                    <Download size={16} /> Export CSV List
                  </button>
                )}
              </div>

              {/* List Workstation */}
              {!selectedEventId ? (
                <div className="empty-state">
                  <ListChecks size={48} />
                  <h3>No Event Selected</h3>
                  <p>Please select or create an event to see attendee registration details.</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="empty-state">
                  <ListChecks size={48} />
                  <h3>No registrations yet</h3>
                  <p>Nobody has registered for <strong>{getActiveEventTitle()}</strong> yet.</p>
                </div>
              ) : (
                <div className="registrations-results-area">
                  {/* Search Attendee and metrics */}
                  <div className="registrations-meta-subbar">
                    <div className="metrics-chip flex-center">
                      Total Registered: <strong>{registrations.length}</strong>
                    </div>

                    <div className="search-bar-wrapper registration-search">
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name, phone or answers..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="form-input search-input"
                      />
                    </div>
                  </div>

                  {/* Mobile-Friendly Adaptive Layout */}
                  {/* 1. Large Screen Tabular view */}
                  <div className="registrations-table-wrapper glass-card">
                    <table className="registrations-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          {getActiveEventFields().map(field => (
                            <th key={field.id}>{field.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map(reg => (
                          <tr key={reg.id}>
                            <td className="date-cell">
                              {new Date(reg.created_at).toLocaleDateString()}
                            </td>
                            {getActiveEventFields().map(field => {
                              const ans = reg.form_responses[field.id];
                              return (
                                <td key={field.id}>
                                  {Array.isArray(ans) ? ans.join(', ') : ans || <span className="null-val">-</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Mobile Touch Cards view (displays automatically on small screens) */}
                  <div className="registrations-mobile-cards">
                    {filteredRegistrations.map(reg => (
                      <div key={reg.id} className="registration-mobile-card glass-card">
                        <div className="mobile-card-header">
                          <span className="badge badge-primary">
                            {new Date(reg.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mobile-card-body">
                          {getActiveEventFields().map(field => {
                            const ans = reg.form_responses[field.id];
                            return (
                              <div key={field.id} className="mobile-response-row">
                                <span className="mobile-response-label">{field.label}:</span>
                                <span className="mobile-response-val">
                                  {Array.isArray(ans) ? ans.join(', ') : ans || '-'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      <style>{`
        .admin-dashboard-page {
          padding-bottom: 60px;
        }
        .dashboard-hero-header {
          margin-bottom: 28px;
          border-color: var(--border);
          background-color: var(--bg-card);
        }
        .dashboard-hero-header:hover {
          transform: none;
        }
        .admin-profile-info h2 {
          font-size: 1.6rem;
          color: var(--primary);
        }
        .admin-email {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        
        /* Tab items styling */
        .dashboard-navigation-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1px;
          margin-bottom: 28px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .dashboard-navigation-tabs::-webkit-scrollbar {
          display: none;
        }
        .nav-tab-btn {
          background: transparent;
          border: none;
          padding: 12px 20px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
          border-top-left-radius: var(--radius-sm);
          border-top-right-radius: var(--radius-sm);
          gap: 8px;
          white-space: nowrap;
        }
        .nav-tab-btn:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .nav-tab-btn.active {
          color: var(--primary);
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-bottom-color: var(--bg-main);
          box-shadow: 0 4px 0 var(--bg-main);
          z-index: 2;
        }

        /* TAB 1: Events Manager List */
        .tab-actions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }
        .admin-events-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-event-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: var(--bg-card);
          gap: 20px;
        }
        .admin-event-row:hover {
          transform: none;
          border-color: var(--primary);
        }
        .event-row-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-grow: 1;
        }
        .row-event-title {
          font-size: 1.15rem;
          color: var(--text-main);
        }
        .row-meta-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .meta-val {
          font-size: 0.8rem;
          color: var(--text-muted);
          gap: 6px;
        }
        .event-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .btn-quick-toggle {
          padding: 8px 14px;
          font-size: 0.8rem;
        }
        .icon-btn-only {
          padding: 8px;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
        }

        /* TAB 2: Event Editor Grid styling */
        .event-editor-tab {
          padding: 28px;
          background-color: var(--bg-card);
        }
        .event-editor-tab:hover {
          transform: none;
        }
        .editor-tab-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .editor-tab-header h3 {
          color: var(--primary);
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .editor-tab-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .editor-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: start;
        }
        .form-double-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .editor-actions-row {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid var(--border);
          padding-top: 20px;
          margin-top: 10px;
        }

        /* Flyer Upload Zone Layout */
        .flyer-upload-zone {
          padding: 24px;
          border-style: dashed;
          background-color: var(--bg-main);
          min-height: 140px;
          position: relative;
        }
        .flyer-upload-zone:hover {
          transform: none;
          border-color: var(--primary);
        }
        .upload-input-prompt {
          text-align: center;
          width: 100%;
          cursor: pointer;
        }
        .upload-guide {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .upload-hidden-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .uploaded-flyer-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .upload-preview-img {
          max-height: 200px;
          max-width: 100%;
          object-fit: contain;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .btn-remove-img {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        /* TAB 3: Registrations viewer layouts */
        .registrations-header-panel {
          padding: 16px 20px;
          background-color: var(--bg-card);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .registrations-header-panel:hover {
          transform: none;
        }
        .flex-event-select {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-grow: 1;
          max-width: 500px;
        }
        .flex-event-select .form-label {
          white-space: nowrap;
        }
        .event-select-dropdown {
          padding: 8px 12px;
          font-size: 0.95rem;
        }
        .btn-export-csv {
          font-size: 0.9rem;
          padding: 10px 18px;
        }
        .registrations-meta-subbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .metrics-chip {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 500;
          font-family: var(--font-display);
        }
        .registration-search {
          max-width: 320px;
        }
        .registration-search .search-input {
          padding-top: 8px;
          padding-bottom: 8px;
          font-size: 0.9rem;
        }

        /* Tabular list */
        .registrations-table-wrapper {
          overflow-x: auto;
          background-color: var(--bg-card);
          border-radius: var(--radius-sm);
        }
        .registrations-table-wrapper:hover {
          transform: none;
        }
        .registrations-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .registrations-table th {
          background-color: var(--primary-light);
          color: var(--primary);
          font-family: var(--font-display);
          font-weight: 700;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
        }
        .registrations-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          color: var(--text-main);
          white-space: pre-line;
        }
        .registrations-table tr:last-child td {
          border-bottom: none;
        }
        .registrations-table tr:hover td {
          background-color: rgba(4, 120, 87, 0.02);
        }
        .date-cell {
          font-weight: 600;
          color: var(--text-muted);
        }
        .null-val {
          color: var(--text-muted);
          font-style: italic;
          opacity: 0.5;
        }

        /* Mobile registrations view cards (hidden on large desktop) */
        .registrations-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        .registration-mobile-card {
          padding: 16px;
          background-color: var(--bg-card);
        }
        .registration-mobile-card:hover {
          transform: none;
        }
        .mobile-card-header {
          display: flex;
          justify-content: flex-end;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .mobile-card-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mobile-response-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          gap: 12px;
        }
        .mobile-response-label {
          font-weight: 600;
          color: var(--text-muted);
        }
        .mobile-response-val {
          font-weight: 700;
          color: var(--text-main);
          text-align: right;
        }

        /* Responsiveness */
        @media (max-width: 1024px) {
          .editor-form-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .editor-actions-row {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .dashboard-hero-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .logout-btn {
            width: 100%;
          }
          .tab-actions-header {
            flex-direction: column;
            align-items: stretch;
          }
          .admin-event-row {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .event-row-actions {
            justify-content: space-between;
            width: 100%;
          }
          .flex-event-select {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            max-width: 100%;
          }
          .registrations-table-wrapper {
            display: none; /* Hide standard tables on mobile viewports */
          }
          .registrations-mobile-cards {
            display: flex; /* Force touch optimized list */
          }
          .registrations-meta-subbar {
            flex-direction: column;
            align-items: stretch;
          }
          .registration-search {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
