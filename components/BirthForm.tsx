'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BirthInput, GeoResult, ResolvedBirth, NatalChart } from '@/lib/astro/types';

type Props = {
  onResolved: (birth: ResolvedBirth, chart: NatalChart) => void;
};

const EMPTY_FORM: BirthInput = {
  name: '',
  date: '',
  time: '',
  city: '',
  region: '',
  country: '',
};

export default function BirthForm({ onResolved }: Props) {
  const [form, setForm] = useState<BirthInput>(EMPTY_FORM);
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const canCast = form.date && form.time && selectedGeo;

  // Debounced geocode lookup
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data: GeoResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    fetchSuggestions(cityQuery);
  }, [cityQuery, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectGeo(geo: GeoResult) {
    setSelectedGeo(geo);
    setCityQuery(geo.city || geo.displayName.split(',')[0]);
    setForm((f) => ({ ...f, city: geo.city, region: geo.region, country: geo.country }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleCast(e: React.FormEvent) {
    e.preventDefault();
    if (!canCast) return;
    setSubmitting(true);
    setError(null);

    try {
      const tzRes = await fetch('/api/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: selectedGeo!.lat,
          lng: selectedGeo!.lng,
          date: form.date,
          time: form.time,
        }),
      });

      if (!tzRes.ok) {
        const { error: msg } = await tzRes.json();
        throw new Error(msg ?? 'Timezone resolution failed');
      }

      const { timezone, utc, julianDayUT } = await tzRes.json();

      const resolved: ResolvedBirth = {
        ...form,
        lat: selectedGeo!.lat,
        lng: selectedGeo!.lng,
        timezone,
        utc,
        julianDayUT,
      };

      const chartRes = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved),
      });

      if (!chartRes.ok) {
        const { error: msg } = await chartRes.json();
        throw new Error(msg ?? 'Chart calculation failed');
      }

      const chart: NatalChart = await chartRes.json();
      console.log('[Natal Matrix] ResolvedBirth:', resolved);
      console.log('[Natal Matrix] NatalChart:', chart);
      onResolved(resolved, chart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = `
    w-full bg-transparent border px-3 py-2 text-sm outline-none
    transition-colors placeholder:text-[var(--fg-dim)]
    focus:border-[var(--accent)]
  `;
  const labelClass = 'block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1';

  return (
    <form onSubmit={handleCast} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Name */}
        <div>
          <label className={labelClass}>Name <span className="normal-case text-[var(--fg-dim)]">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Amy Zheng"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)' }}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>Date <span className="text-[var(--aspect-dynamic)]">*</span></label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)', colorScheme: 'dark' }}
          />
        </div>

        {/* Time */}
        <div>
          <label className={labelClass}>
            Time <span className="text-[var(--aspect-dynamic)]">*</span>
            <span
              className="ml-2 normal-case text-[var(--fg-dim)] cursor-help"
              title="Required — even a 10-minute difference can change the Ascendant by 2.5°. If you don't know your time, you cannot get an accurate chart."
            >(?)</span>
          </label>
          <input
            type="time"
            required
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)', colorScheme: 'dark' }}
          />
        </div>

        {/* City autocomplete */}
        <div className="relative">
          <label className={labelClass}>City <span className="text-[var(--aspect-dynamic)]">*</span></label>
          <input
            type="text"
            placeholder="e.g. Santa Monica"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setSelectedGeo(null);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)' }}
          />
          {loadingSuggestions && (
            <div className="absolute right-3 top-8 text-[var(--fg-dim)] text-xs">…</div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderColor: 'var(--line)',
                borderRadius: 'var(--radius)',
              }}
            >
              {suggestions.map((geo, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--line)] transition-colors"
                    style={{ color: 'var(--fg)' }}
                    onClick={() => selectGeo(geo)}
                  >
                    <span>{geo.city || geo.displayName.split(',')[0]}</span>
                    {(geo.region || geo.country) && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
                        {[geo.region, geo.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Region */}
        <div>
          <label className={labelClass}>State / Region <span className="text-[var(--aspect-dynamic)]">*</span></label>
          <input
            type="text"
            placeholder="e.g. California"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)' }}
          />
        </div>

        {/* Country */}
        <div>
          <label className={labelClass}>Country <span className="text-[var(--aspect-dynamic)]">*</span></label>
          <input
            type="text"
            placeholder="e.g. United States"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className={inputClass}
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', color: 'var(--fg)' }}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm" style={{ color: 'var(--aspect-dynamic)' }}>{error}</p>
      )}

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={!canCast || submitting}
          className="px-6 py-2 text-sm uppercase tracking-widest transition-opacity disabled:opacity-30"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {submitting ? 'Casting…' : 'Cast Chart'}
        </button>
        {!form.time && (
          <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>
            Birth time required to cast
          </span>
        )}
        {form.time && !selectedGeo && cityQuery && (
          <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>
            Select a city from the dropdown
          </span>
        )}
      </div>
    </form>
  );
}
