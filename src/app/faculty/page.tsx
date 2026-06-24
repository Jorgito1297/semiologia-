'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/services/supabase';
import {
  analyzeStudentAlerts,
  AcademicAlert,
  StudentMemoryStateExtended
} from '@/utils/academicAlerts';


// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'revision_needed';
type MemoryDomain = 'semantic' | 'procedural' | 'executive' | 'perceptual';
type RetrievalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface QueueItem {
  id: string;                    // chunk_review_queue row id
  chunk_id: string;
  review_status: ReviewStatus;
  assigned_to: string | null;
  pipeline_run_id: string | null;
  source_file: string | null;
  faculty_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  content_chunks: {
    id: string;
    topic: string;
    subtopic: string | null;
    week: number;
    block: string;
    content_type: string;
    memory_domain: MemoryDomain;
    cg_competencies: string[];
    chunk_text: string;
    source_book: string;
    source_chapter: string | null;
    source_pages: string | null;
    validated_by: string;
    token_count: number | null;
    retrieval_priority: RetrievalPriority;
  };
}

interface Stats {
  pending_review: number;
  approved: number;
  rejected: number;
  revision_needed: number;
  total: number;
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  role: string;
  cohort: string;
  completed_med224: boolean;
  med224_baseline_score: number | null;
  last_active: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  pending_review:   { label: 'Pendiente',          color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/30' },
  approved:         { label: 'Aprobado',            color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  rejected:         { label: 'Rechazado',           color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
  revision_needed:  { label: 'Revisión requerida',  color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/30' },
};

const DOMAIN_COLOR: Record<MemoryDomain, string> = {
  semantic:   'bg-blue-500/20 text-blue-300',
  procedural: 'bg-violet-500/20 text-violet-300',
  executive:  'bg-emerald-500/20 text-emerald-300',
  perceptual: 'bg-amber-500/20 text-amber-300',
};

const PRIORITY_CONFIG: Record<RetrievalPriority, { label: string; color: string }> = {
  HIGH:   { label: 'ALTA',  color: 'text-emerald-400' },
  MEDIUM: { label: 'MEDIA', color: 'text-amber-400' },
  LOW:    { label: 'BAJA',  color: 'text-slate-400' },
};

export default function FacultyDashboard() {
  const [activeTab, setActiveTab]   = useState<'validation' | 'analytics' | 'report'>('validation');
  const [items, setItems]           = useState<QueueItem[]>([]);
  const [students, setStudents]     = useState<StudentRecord[]>([]);
  const [alerts, setAlerts]         = useState<AcademicAlert[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  
  // Advanced filters for content chunks
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending_review');
  const [blockFilter, setBlockFilter]   = useState<string>('all');
  const [weekFilter, setWeekFilter]     = useState<string>('all');
  const [cgFilter, setCgFilter]         = useState<string>('all');

  const [selected, setSelected]     = useState<QueueItem | null>(null);
  const [reviewerName, setReviewerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reviewer_name') || 'Dr. Angel Augusto Tusen Madrigal';
    }
    return 'Dr. Angel Augusto Tusen Madrigal';
  });
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  // Stats on database coverage
  const [activeChunksCount, setActiveChunksCount] = useState(0);
  const [totalChunksCount, setTotalChunksCount]   = useState(0);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch review queue
      let query = supabaseClient
        .from('chunk_review_queue')
        .select(`
          id, chunk_id, review_status, assigned_to, pipeline_run_id,
          source_file, faculty_notes, reviewed_by, reviewed_at, created_at,
          content_chunks (
            id, topic, subtopic, week, block, content_type, memory_domain,
            cg_competencies, chunk_text, source_book, source_chapter,
            source_pages, validated_by, token_count, retrieval_priority
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }

      const { data: queueData, error: qErr } = await query;
      if (qErr) throw qErr;

      setItems((queueData as unknown as QueueItem[]) ?? []);

      // 2. Fetch queue items stats
      const { data: allRows, error: sErr } = await supabaseClient
        .from('chunk_review_queue')
        .select('review_status');
      if (!sErr && allRows) {
        const s: Stats = { pending_review: 0, approved: 0, rejected: 0, revision_needed: 0, total: allRows.length };
        allRows.forEach((r: { review_status: string }) => {
          const k = r.review_status as ReviewStatus;
          if (k in s) s[k]++;
        });
        setStats(s);
      }

      // 3. Fetch active and total chunks count
      const { count: actCount, error: actErr } = await supabaseClient
        .from('content_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: totCount, error: totErr } = await supabaseClient
        .from('content_chunks')
        .select('*', { count: 'exact', head: true });

      if (!actErr && actCount !== null) setActiveChunksCount(actCount);
      if (!totErr && totCount !== null) setTotalChunksCount(totCount);

      // 4. Fetch students data for analytics
      const { data: studentsData, error: studentsErr } = await supabaseClient
        .from('students')
        .select('id, full_name, email, role, cohort, completed_med224, med224_baseline_score, last_active')
        .order('full_name', { ascending: true });

      if (!studentsErr && studentsData) {
        setStudents(studentsData as StudentRecord[]);
        
        // 5. Fetch memory states to generate alerts
        const { data: statesData, error: statesErr } = await supabaseClient
          .from('student_memory_states')
          .select(`
            id,
            student_id,
            chunk_id,
            memory_domain,
            accuracy_pct,
            ease_factor,
            last_reviewed_at,
            content_chunks (
              topic,
              cg_competencies
            )
          `);

        if (!statesErr && statesData) {
          const castedStates: StudentMemoryStateExtended[] = (statesData as unknown as StudentMemoryStateExtended[]) ?? [];
          const allAlerts: AcademicAlert[] = [];
          
          studentsData.forEach((student: StudentRecord) => {
            const studentStates = castedStates.filter(s => s.student_id === student.id);
            const studentAlerts = analyzeStudentAlerts(
              {
                id: student.id,
                full_name: student.full_name,
                email: student.email,
                last_active: student.last_active,
                med224_baseline_score: student.med224_baseline_score ? Number(student.med224_baseline_score) : null,
                completed_med224: student.completed_med224
              },
              studentStates
            );
            allAlerts.push(...studentAlerts);
          });
          
          setAlerts(allAlerts);
        }
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de comunicación con Supabase');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchQueue();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchQueue]);

  // Persist reviewer name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('reviewer_name', reviewerName);
    }
  }, [reviewerName]);

  // ── Review actions ─────────────────────────────────────────────────────────
  const submitReview = async (newStatus: ReviewStatus) => {
    if (!selected) return;
    if (!reviewerName.trim()) {
      alert('Por favor ingresa tu nombre antes de enviar la revisión.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabaseClient
        .from('chunk_review_queue')
        .update({
          review_status: newStatus,
          reviewed_by: reviewerName.trim(),
          reviewed_at: new Date().toISOString(),
          faculty_notes: notes.trim() || null,
        })
        .eq('id', selected.id);

      if (updateErr) throw updateErr;

      setSelected(null);
      setNotes('');
      await fetchQueue();
    } catch (err: unknown) {
      alert(`Error al guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Advanced Batch Approval: Block 1 ───────────────────────────────────────
  const handleApproveBlock1Batch = async () => {
    if (!reviewerName.trim()) {
      alert('Por favor ingresa tu nombre (revisor) antes de realizar la aprobación masiva.');
      return;
    }
    if (!confirm('⚠️ ¿Estás seguro de que deseas aprobar masivamente todos los chunks pendientes del Bloque 1? Esto activará inmediatamente el contenido para los repasos de los estudiantes.')) {
      return;
    }
    setSaving(true);
    try {
      // 1. Query pending block_1 rows
      const { data: pendingItems, error: getErr } = await supabaseClient
        .from('chunk_review_queue')
        .select(`
          id,
          content_chunks!inner (
            id, block
          )
        `)
        .eq('review_status', 'pending_review')
        .eq('content_chunks.block', 'block_1');

      if (getErr) throw getErr;

      if (!pendingItems || pendingItems.length === 0) {
        alert('No hay chunks pendientes de aprobación en el Bloque 1.');
        setSaving(false);
        return;
      }

      const idsToUpdate = pendingItems.map(item => item.id);

      // 2. Perform bulk update
      const { error: updateErr } = await supabaseClient
        .from('chunk_review_queue')
        .update({
          review_status: 'approved',
          reviewed_by: reviewerName.trim(),
          reviewed_at: new Date().toISOString(),
          faculty_notes: 'Aprobación masiva de lote de acreditación UCE (Bloque 1)'
        })
        .in('id', idsToUpdate);

      if (updateErr) throw updateErr;

      alert(`🎉 ¡Lote aprobado! Se han activado ${idsToUpdate.length} chunks del Bloque 1.`);
      await fetchQueue();
    } catch (err) {
      alert(`Error en aprobación masiva: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Printing handler (Accreditation PDF) ─────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // Client-side advanced filtration
  const filteredItems = items.filter(item => {
    const chunk = item.content_chunks;
    if (!chunk) return false;
    
    const matchesBlock = blockFilter === 'all' || chunk.block === blockFilter;
    const matchesWeek = weekFilter === 'all' || String(chunk.week) === weekFilter;
    const matchesCG = cgFilter === 'all' || chunk.cg_competencies.includes(cgFilter);
    
    return matchesBlock && matchesWeek && matchesCG;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans print:bg-white print:text-black">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🩺</span> Panel de Acreditación y Validación Docente
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              MED-228 — Semiología Médica | Universidad Central del Este (UCE)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab Selector */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'validation' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Validación
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Cohortes
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'report' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Acreditación PDF
              </button>
            </div>
            {loading && (
              <span className="text-[10px] text-blue-400 font-bold font-mono animate-pulse mr-2">
                Sincronizando...
              </span>
            )}
            {error && (
              <span className="text-[10px] text-red-400 font-bold font-mono mr-2" title={error}>
                ⚠️ Error de red
              </span>
            )}
            <button
              onClick={fetchQueue}
              className="px-3 py-2 text-xs bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl transition-all cursor-pointer font-bold"
            >
              ↻
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* PROGRESS COVERAGE HEADER CARD */}
        <div className="glass border border-blue-500/20 rounded-3xl p-6 shadow-2xl mb-8 relative overflow-hidden print:hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-lg font-bold text-gray-200">Cobertura de Contenido Validado</h2>
              <p className="text-xs text-gray-400">Progreso general de aprobación de los 2,215 chunks vectoriales del currículo oficial.</p>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-300 font-mono font-bold mb-1.5">
                  <span>ACTIVADOS: {activeChunksCount} CHUNKS</span>
                  <span>TOTAL: {totalChunksCount} CHUNKS</span>
                </div>
                <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-900">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${totalChunksCount > 0 ? (activeChunksCount / totalChunksCount) * 100 : 0}%` }}
                  ></div>
                </div>
                {stats && (
                  <div className="grid grid-cols-4 gap-2 mt-4 text-[9px] font-mono text-center">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-1.5 text-amber-400 font-semibold">
                      PENDIENTES: {stats.pending_review}
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 text-emerald-400 font-semibold">
                      APROBADOS: {stats.approved}
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-1.5 text-red-400 font-semibold">
                      RECHAZADOS: {stats.rejected}
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-1.5 text-orange-400 font-semibold">
                      REVISIÓN: {stats.revision_needed}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Nombre del Revisor</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  className="bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors w-full sm:w-60 font-semibold"
                />
              </div>
              
              {activeTab === 'validation' && (
                <button
                  onClick={handleApproveBlock1Batch}
                  className="sm:self-end px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  🚀 Aprobación Masiva: Bloque 1
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── TAB 1: VALIDATION WORKFLOW ────────────────────────────────────────── */}
        {activeTab === 'validation' && (
          <div className="space-y-6 print:hidden">
            {/* Filter controls */}
            <div className="glass border border-gray-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtros Avanzados Curriculares</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Status */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Estado de Revisión</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ReviewStatus | 'all')}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    <option value="pending_review">Pendiente</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="revision_needed">Revisión Requerida</option>
                  </select>
                </div>

                {/* Block */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Bloque Académico</label>
                  <select
                    value={blockFilter}
                    onChange={e => setBlockFilter(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Todos los Bloques</option>
                    <option value="block_1">Bloque 1 (Semanas 1-6)</option>
                    <option value="block_2">Bloque 2 (Semanas 7-11)</option>
                    <option value="block_3">Bloque 3 (Semanas 12-14)</option>
                    <option value="final">Evaluación Final</option>
                  </select>
                </div>

                {/* Week */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Semana del Syllabus</label>
                  <select
                    value={weekFilter}
                    onChange={e => setWeekFilter(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Todas las Semanas</option>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <option key={i} value={String(i + 1)}>Semana {i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* CG Competency */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Competencia Núcleo</label>
                  <select
                    value={cgFilter}
                    onChange={e => setCgFilter(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Todas las Competencias</option>
                    <option value="CG2">CG2: Comunicación Médica</option>
                    <option value="CG6">CG6: Historia Clínica Integral</option>
                    <option value="CG8">CG8: Procedimiento Diagnóstico</option>
                  </select>
                </div>

              </div>
            </div>

            {/* List and Queue */}
            {filteredItems.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center text-gray-400 border border-gray-850">
                <p className="text-lg font-bold">No se encontraron chunks con los filtros seleccionados.</p>
                <p className="text-xs text-gray-500 mt-1">Intenta ajustar los criterios de filtrado arriba.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 px-1 font-semibold">Mostrando {filteredItems.length} chunks en la cola:</p>
                
                <div className="grid grid-cols-1 gap-4">
                  {filteredItems.map(item => {
                    const chunk = item.content_chunks;
                    if (!chunk) return null;
                    const statusCfg = STATUS_CONFIG[item.review_status];
                    return (
                      <div
                        key={item.id}
                        onClick={() => { setSelected(item); setNotes(item.faculty_notes ?? ''); }}
                        className="glass border border-gray-850 hover:border-gray-700/80 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.005] group"
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                          <div className="flex-1 min-w-0">
                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border border-gray-850 font-semibold uppercase ${DOMAIN_COLOR[chunk.memory_domain]}`}>
                                {chunk.memory_domain}
                              </span>
                              {chunk.cg_competencies.map(cg => (
                                <span key={cg} className="text-[10px] px-2 py-0.5 bg-gray-900 border border-gray-800 rounded-full text-gray-400 font-semibold uppercase">
                                  {cg}
                                </span>
                              ))}
                              <span className={`text-[10px] font-bold ${PRIORITY_CONFIG[chunk.retrieval_priority]?.color ?? 'text-slate-400'}`}>
                                Prioridad: {PRIORITY_CONFIG[chunk.retrieval_priority]?.label ?? chunk.retrieval_priority}
                              </span>
                            </div>

                            <h3 className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                              {chunk.topic}
                            </h3>
                            {chunk.subtopic && (
                              <p className="text-xs text-gray-400 mt-0.5 font-medium">{chunk.subtopic}</p>
                            )}

                            {/* Text preview */}
                            <p className="mt-3 text-xs text-gray-400 line-clamp-2 leading-relaxed font-light">
                              {chunk.chunk_text}
                            </p>

                            {/* Details row */}
                            <div className="flex gap-4 mt-3 text-[10px] text-gray-500 font-mono">
                              <span>Semana {chunk.week} ({chunk.block.replace('_', ' ').toUpperCase()})</span>
                              <span>•</span>
                              <span>{chunk.source_book}</span>
                              {chunk.source_pages && chunk.source_pages !== 'N/A' && (
                                <>
                                  <span>•</span>
                                  <span>Pág. {chunk.source_pages}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{chunk.token_count ?? '?'} tokens</span>
                            </div>
                          </div>

                          <div className="text-gray-500 text-xs font-mono shrink-0 select-none">
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>

                        {item.faculty_notes && (
                          <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400 font-medium">
                            📝 Nota del docente: <span className="italic text-gray-300">{item.faculty_notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: COHORT ANALYTICS ───────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 print:hidden animate-fade-slide">
            
            {/* Analytics overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="glass border border-gray-850 p-5 rounded-3xl text-center space-y-1">
                <span className="text-3xl">👥</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Estudiantes Registrados</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">{students.length}</p>
              </div>

              <div className="glass border border-gray-850 p-5 rounded-3xl text-center space-y-1">
                <span className="text-3xl">🎓</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Onboarding Completado</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {students.filter(s => s.completed_med224).length} 
                  <span className="text-xs text-gray-500 ml-1">({Math.round((students.filter(s => s.completed_med224).length / (students.length || 1)) * 100)}%)</span>
                </p>
              </div>

              <div className="glass border border-gray-850 p-5 rounded-3xl text-center space-y-1">
                <span className="text-3xl">📊</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Promedio Diagnóstico</p>
                <p className="text-2xl font-bold text-indigo-400 font-mono">
                  {Math.round(students.reduce((acc, s) => acc + (s.med224_baseline_score || 0), 0) / (students.filter(s => s.med224_baseline_score !== null).length || 1))}
                  <span className="text-xs text-gray-500 ml-1">/100</span>
                </p>
              </div>

              <div className="glass border border-gray-850 p-5 rounded-3xl text-center space-y-1">
                <span className="text-3xl">🛡️</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Alertas Curriculares</p>
                <p className="text-2xl font-bold text-red-400 font-mono">
                  {alerts.length}
                </p>
              </div>

            </div>

            {/* Academic Alerts Panel */}
            {alerts.length > 0 && (
              <div className="glass border border-red-500/20 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                  <span>⚠️</span> Alertas Académicas y Riesgos Curriculares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase">{alert.studentName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          alert.severity === 'CRITICA' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium">{alert.description}</p>
                      <div className="bg-black/25 rounded-lg p-2.5 text-[11px] text-slate-400 border border-white/5">
                        <span className="font-bold text-slate-300 block mb-0.5">Acción recomendada:</span>
                        {alert.recommendedAction}
                      </div>
                      {alert.details && (
                        <p className="text-[10px] text-slate-500 font-mono text-right">{alert.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student list */}
            <div className="glass border border-gray-850 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-200">Listado de Cohorte y Progreso Emocional</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Cohorte</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4 text-center">Diagnóstico</th>
                      <th className="py-3 px-4 text-center">Alertas</th>
                      <th className="py-3 px-4 text-center">Onboarding</th>
                      <th className="py-3 px-4 text-right">Último Acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const studentAlerts = alerts.filter(a => a.studentId === s.id);
                      return (
                        <tr key={s.id} className="border-b border-gray-850 hover:bg-gray-900/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-200">{s.full_name}</td>
                          <td className="py-3.5 px-4 text-gray-400 font-mono">{s.email}</td>
                          <td className="py-3.5 px-4 text-gray-400">{s.cohort}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              s.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              s.role === 'validator' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {s.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400">
                            {s.med224_baseline_score !== null ? `${s.med224_baseline_score}/100` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {studentAlerts.length === 0 ? (
                              <span className="text-xs text-gray-500">—</span>
                            ) : (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                studentAlerts.some(a => a.severity === 'CRITICA')
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {studentAlerts.length} Alerta{studentAlerts.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.completed_med224 ? 'bg-green-500' : 'bg-gray-800'}`} />
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-500 font-mono">
                            {s.last_active ? new Date(s.last_active).toLocaleString('es-ES') : 'Nunca'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 3: ACCREDITATION REPORT ─────────────────────────────────────── */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            
            {/* Print trigger card */}
            <div className="glass border border-gray-850 p-6 rounded-3xl flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-sm font-bold text-gray-200">Reporte de Acreditación Curricular UCE</h3>
                <p className="text-xs text-gray-400 mt-1">Este informe consolida las estadísticas de la cátedra de Semiología para auditorías universitarias.</p>
              </div>
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer flex items-center gap-2"
              >
                🖨️ Guardar o Imprimir Reporte
              </button>
            </div>

            {/* Clean Medical Layout for Printing */}
            <div className="bg-slate-900/10 border border-slate-800 rounded-3xl p-8 md:p-12 space-y-8 text-slate-300 print:border-none print:bg-white print:text-black print:p-0">
              
              {/* Institutional Header */}
              <div className="text-center pb-6 border-b border-gray-800 print:border-gray-300 flex flex-col items-center">
                <span className="text-4xl mb-2 select-none print:opacity-80">🎓</span>
                <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">UNIVERSIDAD CENTRAL DEL ESTE</h1>
                <p className="text-xs text-slate-400 print:text-gray-500 uppercase tracking-widest mt-1">Facultad de Ciencias de la Salud • Escuela de Medicina</p>
                <p className="text-sm font-bold text-blue-400 print:text-blue-600 mt-3">Reporte de Validación de Material Académico - Cátedra de Semiología</p>
              </div>

              {/* metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium bg-gray-950/40 p-5 rounded-2xl print:bg-gray-100 print:text-black">
                <div>
                  <p className="text-slate-500">Materia:</p>
                  <p className="font-bold text-white print:text-black">Propedéutica Clínica y Semiología Médica (MED-228)</p>
                </div>
                <div>
                  <p className="text-slate-500">Periodo Académico:</p>
                  <p className="font-bold text-white print:text-black">Mayo - Agosto 2026</p>
                </div>
                <div>
                  <p className="text-slate-500">Coordinador de Cátedra:</p>
                  <p className="font-bold text-white print:text-black">Dr. Angel Augusto Tusen Madrigal</p>
                </div>
                <div>
                  <p className="text-slate-500">Fecha del Reporte:</p>
                  <p className="font-bold text-white print:text-black">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white print:text-black border-b border-gray-800 pb-2 print:border-gray-300">I. Estado de la Base Curricular RAG</h3>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-gray-950/20 p-4 rounded-xl border border-gray-850 print:border-gray-200">
                    <p className="text-xs text-slate-500">Total Chunks</p>
                    <p className="text-2xl font-bold font-mono text-white print:text-black">{totalChunksCount}</p>
                  </div>
                  <div className="bg-gray-950/20 p-4 rounded-xl border border-gray-850 print:border-gray-200">
                    <p className="text-xs text-slate-500">Validados y Activos</p>
                    <p className="text-2xl font-bold font-mono text-green-400 print:text-green-600">{activeChunksCount}</p>
                  </div>
                  <div className="bg-gray-950/20 p-4 rounded-xl border border-gray-850 print:border-gray-200">
                    <p className="text-xs text-slate-500">Cobertura Validada</p>
                    <p className="text-2xl font-bold font-mono text-blue-400 print:text-blue-600">
                      {totalChunksCount > 0 ? Math.round((activeChunksCount / totalChunksCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Student progress */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white print:text-black border-b border-gray-800 pb-2 print:border-gray-300">II. Desempeño General de la Cohorte</h3>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="bg-gray-950/20 p-4 rounded-xl border border-gray-850 print:border-gray-200">
                    <p className="text-xs text-slate-500">Onboarding Completados</p>
                    <p className="text-2xl font-bold font-mono text-white print:text-black">
                      {students.filter(s => s.completed_med224).length} / {students.length}
                    </p>
                  </div>
                  <div className="bg-gray-950/20 p-4 rounded-xl border border-gray-850 print:border-gray-200">
                    <p className="text-xs text-slate-500">Promedio Calificación Diagnóstica</p>
                    <p className="text-2xl font-bold font-mono text-indigo-400 print:text-indigo-600">
                      {Math.round(students.reduce((acc, s) => acc + (s.med224_baseline_score || 0), 0) / (students.filter(s => s.med224_baseline_score !== null).length || 1))}/100
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-48 border-b border-gray-800 print:border-gray-400 h-10 mb-2"></div>
                  <p className="font-bold text-white print:text-black">{reviewerName}</p>
                  <p className="text-slate-500">Coordinador de Semiología UCE</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-48 border-b border-gray-800 print:border-gray-400 h-10 mb-2"></div>
                  <p className="font-bold text-white print:text-black">Dirección de Acreditación Médica</p>
                  <p className="text-slate-500">Facultad de Ciencias de la Salud UCE</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ── Review Modal ─────────────────────────────────────────────────────── */}
      {selected && selected.content_chunks && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-[#141824] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh]
                          overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.content_chunks.topic}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {selected.content_chunks.source_book} · Semana {selected.content_chunks.week}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-white text-xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Memory Domain', selected.content_chunks.memory_domain],
                  ['Content Type', selected.content_chunks.content_type],
                  ['Block', selected.content_chunks.block.replace('_', ' ')],
                  ['Week', String(selected.content_chunks.week)],
                  ['Validated by', selected.content_chunks.validated_by],
                  ['Pages', selected.content_chunks.source_pages ?? 'N/A'],
                  ['Tokens', String(selected.content_chunks.token_count ?? '?')],
                  ['Pipeline Run', selected.pipeline_run_id ?? 'manual'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="text-white font-medium mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Competencies */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Competencias CG</div>
                <div className="flex gap-2 flex-wrap">
                  {selected.content_chunks.cg_competencies.map(cg => (
                    <span key={cg} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      {cg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chunk text */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Contenido del chunk</div>
                <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed
                               max-h-48 overflow-y-auto font-light whitespace-pre-wrap">
                  {selected.content_chunks.chunk_text}
                </div>
              </div>

              {/* Faculty inputs */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tu nombre (revisor)</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  placeholder="Dr. Rivas / Coord. Académico UCE"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                             text-sm text-white placeholder:text-slate-600 focus:outline-none
                             focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Notas de revisión <span className="text-slate-600">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Correcciones, cambios de dominio, observaciones..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                             text-sm text-white placeholder:text-slate-600 focus:outline-none
                             focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap pt-2">
                <button
                  onClick={() => submitReview('approved')}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50
                             rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => submitReview('revision_needed')}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-50
                             rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  ✏️ Revisión
                </button>
                <button
                  onClick={() => submitReview('rejected')}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-red-700/80 hover:bg-red-700 disabled:opacity-50
                             rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
