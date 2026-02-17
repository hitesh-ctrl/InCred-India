import { useEffect, useState } from 'react';
import { api } from '../api';

interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface FeatureMetadataResponse {
  features: FeatureMeta[];
  notes: {
    data_minimization: string;
    consent_first: string;
    explainability: string;
    no_sensitive_attributes: string;
  };
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LightBulbIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function NoSymbolIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

export default function ResponsibleAIPage() {
  const [meta, setMeta] = useState<FeatureMetadataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getFeatureMetadata();
        setMeta(data);
      } catch {
        setError('Failed to load metadata');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
        {error}
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-ink-tertiary">Loading...</p>
      </div>
    );
  }

  const { notes, features } = meta;

  const principles = [
    { title: 'Data Minimization', body: notes.data_minimization, icon: <ShieldIcon /> },
    { title: 'Consent-First Architecture', body: notes.consent_first, icon: <CheckCircleIcon /> },
    { title: 'Explainable AI', body: notes.explainability, icon: <LightBulbIcon /> },
    { title: 'No Sensitive Attributes', body: notes.no_sensitive_attributes, icon: <NoSymbolIcon /> },
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink text-balance">
          Privacy & Responsible AI
        </h1>
        <p className="text-ink-secondary max-w-xl mx-auto leading-relaxed text-balance">
          Our commitment to building fair, transparent, and privacy-preserving credit scoring systems.
        </p>
      </div>

      {/* Principles Grid */}
      <section className="grid gap-4 md:grid-cols-2">
        {principles.map((p) => (
          <div key={p.title} className="card-surface-hover rounded-card p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center shrink-0">
              {p.icon}
            </div>
            <div>
              <h2 className="font-semibold text-ink mb-1">{p.title}</h2>
              <p className="text-sm text-ink-secondary leading-relaxed">{p.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section className="card-surface rounded-card p-6">
        <div className="mb-6 pb-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-ink mb-1">Behavioral Features</h2>
          <p className="text-sm text-ink-secondary max-w-2xl">
            We strictly limit our data collection to alternative behavioral attributes. Protected attributes (e.g., gender, race, age) are never collected or inferred.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.key}
              className="rounded-lg border border-surface-border bg-surface-secondary p-4 hover:bg-surface hover:shadow-card hover:border-surface-border-hover transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="font-semibold text-sm text-ink">{f.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary bg-surface-tertiary px-2 py-0.5 rounded shrink-0">
                  {f.category}
                </span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
