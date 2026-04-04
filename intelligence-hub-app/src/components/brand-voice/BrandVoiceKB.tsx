'use client';

import { useState } from 'react';
import { BrandVoice } from '@/lib/types';
import { Save, Lock, Unlock, MessageSquare, Users, BookOpen } from 'lucide-react';

interface Props {
  data: BrandVoice;
  onSave: (data: Partial<BrandVoice>) => Promise<void>;
  readOnly?: boolean;
}

type Topic = BrandVoice['topics'][number];
type Contact = BrandVoice['contacts'][number];
type Narrative = BrandVoice['narratives'][number];

export default function BrandVoiceKB({ data, onSave, readOnly = false }: Props) {
  const [topics, setTopics] = useState<Topic[]>(data.topics || []);
  const [contacts, setContacts] = useState<Contact[]>(data.contacts || []);
  const [narratives, setNarratives] = useState<Narrative[]>(data.narratives || []);
  const [recurringTopics, setRecurringTopics] = useState<string[]>(data.recurringTopics || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ topics, contacts, narratives, recurringTopics });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggleTopicLock = (idx: number) => {
    setTopics((prev) => prev.map((t, i) => i === idx ? { ...t, locked: !t.locked } : t));
    setSaved(false);
  };

  const toggleContactLock = (idx: number) => {
    setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, locked: !c.locked } : c));
    setSaved(false);
  };

  const toggleNarrativeLock = (idx: number) => {
    setNarratives((prev) => prev.map((n, i) => i === idx ? { ...n, locked: !n.locked } : n));
    setSaved(false);
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'activo': return 'bg-green-100 text-green-700';
      case 'emerging': case 'emergente': return 'bg-blue-100 text-blue-700';
      case 'declining': case 'en declive': return 'bg-orange-100 text-orange-700';
      case 'completed': case 'completada': return 'bg-horse-gray-100 text-horse-gray-500';
      default: return 'bg-horse-gray-100 text-horse-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Recurring Topics */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <label className="block text-sm font-semibold text-horse-black mb-2">Temas Recurrentes (uno por linea)</label>
        <textarea
          value={recurringTopics.join('\n')}
          onChange={(e) => {
            setRecurringTopics(e.target.value.split('\n').filter(Boolean));
            setSaved(false);
          }}
          disabled={readOnly}
          rows={5}
          className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Topics */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-horse-gray-400" />
          <h3 className="text-sm font-semibold text-horse-black">Topics</h3>
          <span className="text-xs text-horse-gray-400">({topics.length})</span>
        </div>
        {topics.length === 0 ? (
          <p className="text-sm text-horse-gray-400 italic">No hay topics registrados aun.</p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, idx) => (
              <div key={idx} className="bg-white border border-horse-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-horse-black">{topic.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(topic.status)}`}>
                        {topic.status}
                      </span>
                    </div>
                    {topic.position && (
                      <p className="text-xs text-horse-gray-500 mb-1"><span className="font-medium">Posicion:</span> {topic.position}</p>
                    )}
                    {topic.evidence && (
                      <p className="text-xs text-horse-gray-400">{topic.evidence}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => toggleTopicLock(idx)}
                      className="p-1.5 rounded-md hover:bg-horse-gray-100 transition-colors"
                      title={topic.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {topic.locked
                        ? <Lock size={14} className="text-amber-500" />
                        : <Unlock size={14} className="text-horse-gray-300" />
                      }
                    </button>
                  )}
                  {readOnly && topic.locked && (
                    <Lock size={14} className="text-amber-500 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contacts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-horse-gray-400" />
          <h3 className="text-sm font-semibold text-horse-black">Contactos</h3>
          <span className="text-xs text-horse-gray-400">({contacts.length})</span>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-horse-gray-400 italic">No hay contactos registrados aun.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, idx) => (
              <div key={idx} className="bg-white border border-horse-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-horse-black">{contact.name}</span>
                      {contact.company && (
                        <span className="text-xs text-horse-gray-400">{contact.company}</span>
                      )}
                    </div>
                    {contact.context && (
                      <p className="text-xs text-horse-gray-500 mb-1">{contact.context}</p>
                    )}
                    {contact.frequency && (
                      <p className="text-xs text-horse-gray-400">Frecuencia: {contact.frequency}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => toggleContactLock(idx)}
                      className="p-1.5 rounded-md hover:bg-horse-gray-100 transition-colors"
                      title={contact.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {contact.locked
                        ? <Lock size={14} className="text-amber-500" />
                        : <Unlock size={14} className="text-horse-gray-300" />
                      }
                    </button>
                  )}
                  {readOnly && contact.locked && (
                    <Lock size={14} className="text-amber-500 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Narratives */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-horse-gray-400" />
          <h3 className="text-sm font-semibold text-horse-black">Narrativas</h3>
          <span className="text-xs text-horse-gray-400">({narratives.length})</span>
        </div>
        {narratives.length === 0 ? (
          <p className="text-sm text-horse-gray-400 italic">No hay narrativas registradas aun.</p>
        ) : (
          <div className="space-y-3">
            {narratives.map((narrative, idx) => (
              <div key={idx} className="bg-white border border-horse-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-horse-black">{narrative.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(narrative.status)}`}>
                        {narrative.status}
                      </span>
                    </div>
                    {narrative.context && (
                      <p className="text-xs text-horse-gray-500 mb-1">{narrative.context}</p>
                    )}
                    {narrative.startedWeek && (
                      <p className="text-xs text-horse-gray-400">Inicio: semana {narrative.startedWeek}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => toggleNarrativeLock(idx)}
                      className="p-1.5 rounded-md hover:bg-horse-gray-100 transition-colors"
                      title={narrative.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {narrative.locked
                        ? <Lock size={14} className="text-amber-500" />
                        : <Unlock size={14} className="text-horse-gray-300" />
                      }
                    </button>
                  )}
                  {readOnly && narrative.locked && (
                    <Lock size={14} className="text-amber-500 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  );
}
