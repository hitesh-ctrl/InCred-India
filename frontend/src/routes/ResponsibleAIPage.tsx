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

  if (error) return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">{error}</div>;
  if (!meta) return <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>;

  const { notes, features } = meta;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Privacy &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-vivid-600">Responsible AI</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Our commitment to building fair, transparent, and privacy-preserving credit scoring systems.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Data Minimization" body={notes.data_minimization} icon="🛡️" delay={0} />
        <InfoCard title="Consent-First Architecture" body={notes.consent_first} icon="✅" delay={100} />
        <InfoCard title="Explainable AI" body={notes.explainability} icon="💡" delay={200} />
        <InfoCard title="No Sensitive Attributes" body={notes.no_sensitive_attributes} icon="🚫" delay={300} />
      </section>

      <section className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-glass border border-white/50 p-8">
        <div className="mb-8 pb-4 border-b border-slate-200/50">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            Behavioral Features
            <div className="h-px bg-slate-200 flex-1 ml-4"></div>
          </h2>
          <p className="text-slate-500 max-w-3xl">
            We strictly limit our data collection to alternative behavioral attributes. Protected attributes (e.g., gender, race, age) are never collected or inferred.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.key}
              className="group rounded-xl border border-white/60 bg-white/40 p-5 hover:bg-white hover:shadow-glass hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{f.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 px-2 py-1 rounded-full">{f.category}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-700">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard(props: { title: string; body: string; icon: string; delay: number }) {
  const { title, body, icon, delay } = props;
  return (
    <div
      className="rounded-2xl bg-white/70 backdrop-blur-md p-6 shadow-glass border border-white/50 card-hover flex gap-5 group items-start"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl shrink-0 bg-white shadow-sm border border-slate-100 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:text-primary transition-all duration-300">
        {icon}
      </div>
      <div>
        <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{title}</h2>
        <p className="text-slate-600 leading-relaxed text-sm">{body}</p>
      </div>
    </div>
  );
}
