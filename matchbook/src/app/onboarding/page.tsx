'use client';

import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  { number: 1, name: 'Profile Info' },
  { number: 2, name: 'Connect Calendly' },
  { number: 3, name: 'Connect Stripe' },
  { number: 4, name: 'Review & Submit' },
];

interface EventType {
  uri: string;
  name: string;
  duration: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Profile Info
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');
  const [pastRoles, setPastRoles] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  // Step 2: Calendly
  const [calendlyConnected, setCalendlyConnected] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [loadingCalendly, setLoadingCalendly] = useState(false);

  // Step 3: Stripe
  const [stripeConnected, setStripeConnected] = useState(false);

  useEffect(() => {
    // Check Calendly and Stripe connection status
    checkConnectionStatus();
  }, []);

  async function checkConnectionStatus() {
    try {
      const res = await fetch('/api/experts/profile/me');
      if (res.ok) {
        const { profile } = await res.json();
        if (profile) {
          if (profile.calendly_access_token) {
            setCalendlyConnected(true);
            fetchEventTypes();
          }
          if (profile.stripe_onboarding_complete) {
            setStripeConnected(true);
          }
          // Pre-fill fields if profile exists
          if (profile.name) setName(profile.name);
          if (profile.bio) setBio(profile.bio);
          if (profile.credentials) setCredentials(profile.credentials);
          if (profile.past_roles) setPastRoles(profile.past_roles);
          if (profile.tags) setTags(profile.tags);
          if (profile.rate_per_hour) setRatePerHour(String(profile.rate_per_hour));
          if (profile.headshot_url) setHeadshotPreview(profile.headshot_url);
          if (profile.calendly_event_type_uri) setSelectedEventType(profile.calendly_event_type_uri);
        }
      }
    } catch {
      // Profile may not exist yet, that's fine
    }
  }

  async function fetchEventTypes() {
    setLoadingCalendly(true);
    try {
      const res = await fetch('/api/calendly/event-types');
      if (res.ok) {
        const data = await res.json();
        setEventTypes(data.eventTypes || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingCalendly(false);
    }
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags();
    }
  }

  function addTags() {
    const newTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleHeadshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setHeadshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function canAdvance(): boolean {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && bio.trim().length > 0 && ratePerHour.trim().length > 0;
      case 2:
        return true; // Calendly is optional to proceed, but recommended
      case 3:
        return true; // Stripe is optional to proceed, but recommended
      default:
        return true;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Upload headshot if provided
      let headshotUrl = headshotPreview;
      if (headshotFile) {
        const formData = new FormData();
        formData.append('file', headshotFile);
        const uploadRes = await fetch('/api/upload/headshot', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          headshotUrl = url;
        }
      }

      const body = {
        name,
        bio,
        credentials: credentials || null,
        past_roles: pastRoles || null,
        tags,
        rate_per_hour: parseFloat(ratePerHour),
        headshot_url: headshotUrl,
        calendly_event_type_uri: selectedEventType || null,
      };

      const res = await fetch('/api/experts/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      router.push('/expert/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Expert Onboarding</h1>
          <p className="mt-2 text-sm text-gray-500">
            Set up your profile to start receiving bookings
          </p>
        </div>

        {/* Step Indicator */}
        <nav className="mb-10">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <li key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      currentStep > step.number
                        ? 'bg-brand-700 text-white'
                        : currentStep === step.number
                          ? 'bg-brand-700 text-white ring-4 ring-brand-100'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.number ? 'text-brand-700' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-12 sm:w-20 ${
                      currentStep > step.number ? 'bg-brand-700' : 'bg-gray-200'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="card">
          {/* Step 1: Profile Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

              <div>
                <label htmlFor="name" className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="bio" className="label">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about your experience and what you can help with..."
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="credentials" className="label">
                  Credentials
                </label>
                <input
                  id="credentials"
                  type="text"
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder="e.g., MBA, CFA, PhD in Economics"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="pastRoles" className="label">
                  Past Roles / Companies
                </label>
                <input
                  id="pastRoles"
                  type="text"
                  value={pastRoles}
                  onChange={(e) => setPastRoles(e.target.value)}
                  placeholder="e.g., VP Engineering at Acme Corp, Lead PM at Initech"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="tags" className="label">
                  Expertise Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge-blue flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 text-blue-500 hover:text-blue-700"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTags}
                  placeholder="Type a tag and press Enter or comma to add"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="rate" className="label">
                  Hourly Rate ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    id="rate"
                    type="number"
                    min="0"
                    step="1"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(e.target.value)}
                    placeholder="150"
                    className="input pl-7"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="headshot" className="label">
                  Headshot
                </label>
                <div className="flex items-center gap-4">
                  {headshotPreview && (
                    <img
                      src={headshotPreview}
                      alt="Headshot preview"
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
                    />
                  )}
                  <input
                    id="headshot"
                    type="file"
                    accept="image/*"
                    onChange={handleHeadshotChange}
                    className="text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Connect Calendly */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Connect Calendly</h2>
              <p className="text-sm text-gray-500">
                Connect your Calendly account so clients can book sessions with you.
              </p>

              {calendlyConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Calendly account connected
                    </span>
                  </div>

                  <div>
                    <label htmlFor="eventType" className="label">
                      Select Event Type
                    </label>
                    {loadingCalendly ? (
                      <p className="text-sm text-gray-400">Loading event types...</p>
                    ) : (
                      <select
                        id="eventType"
                        value={selectedEventType}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                        className="input"
                      >
                        <option value="">Choose an event type...</option>
                        {eventTypes.map((et) => (
                          <option key={et.uri} value={et.uri}>
                            {et.name} ({et.duration} min)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => (window.location.href = '/api/calendly/auth')}
                  className="btn-primary"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Connect your Calendly account
                </button>
              )}
            </div>
          )}

          {/* Step 3: Connect Stripe */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Connect Stripe</h2>
              <p className="text-sm text-gray-500">
                Set up your Stripe account to receive payouts for completed sessions.
              </p>

              {stripeConnected ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    Stripe payouts connected
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => (window.location.href = '/api/stripe/connect/create-account')}
                  className="btn-primary"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Set up payouts
                </button>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
              <p className="text-sm text-gray-500">
                Review your profile before submitting for approval.
              </p>

              <div className="divide-y divide-gray-100 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <span className="text-sm text-gray-900">{name}</span>
                </div>
                <div className="py-3">
                  <span className="text-sm font-medium text-gray-500">Bio</span>
                  <p className="mt-1 text-sm text-gray-900">{bio}</p>
                </div>
                {credentials && (
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-gray-500">Credentials</span>
                    <span className="text-sm text-gray-900">{credentials}</span>
                  </div>
                )}
                {pastRoles && (
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-gray-500">Past Roles</span>
                    <span className="text-sm text-gray-900">{pastRoles}</span>
                  </div>
                )}
                <div className="py-3">
                  <span className="text-sm font-medium text-gray-500">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="badge-blue">{tag}</span>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-sm text-gray-400">No tags added</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Hourly Rate</span>
                  <span className="text-sm text-gray-900">${ratePerHour}/hr</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Calendly</span>
                  <span className={`text-sm ${calendlyConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {calendlyConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Stripe</span>
                  <span className={`text-sm ${stripeConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {stripeConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canAdvance()}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
