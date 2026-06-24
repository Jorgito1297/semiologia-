'use client';

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/services/supabase';

interface Assignment {
  id: string;
  name: string;
  duedate: string | null;
  submitted: boolean;
  moodle_courses: { shortname: string } | null;
}

export default function MoodleWidget() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        // Obtiene las próximas 5 tareas pendientes ordenadas por fecha de vencimiento
        // Usa un JOIN implícito con moodle_courses para mostrar el código de la materia
        const { data, error: fetchErr } = await supabaseClient
          .from('moodle_assignments')
          .select('id, name, duedate, submitted, moodle_courses(shortname)')
          .order('duedate', { ascending: true, nullsFirst: false })
          .limit(5);

        if (fetchErr) throw fetchErr;
        setAssignments((data as unknown as Assignment[]) || []);
      } catch (err) {
        console.error('Error al cargar tareas de Moodle:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  if (loading) {
    return <div className="glass p-5 rounded-2xl border border-gray-800 text-gray-400 text-sm animate-pulse">Cargando tareas de Moodle...</div>;
  }

  return (
    <div className="glass p-5 rounded-3xl border border-gray-850 shadow-lg">
      <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
        <span>📚</span> Tareas y Deberes (Moodle)
      </h3>
      
      {error && <p className="text-xs text-red-400 mb-3">⚠️ No se pudieron cargar las tareas.</p>}
      
      {assignments.length === 0 && !error ? (
        <p className="text-xs text-gray-500 font-medium">No tienes tareas pendientes en el campus virtual.</p>
      ) : (
        <ul className="space-y-3">
          {assignments.map(task => (
            <li key={task.id} className="bg-gray-950/50 p-4 rounded-2xl border border-gray-800 hover:border-blue-500/30 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    {task.moodle_courses?.shortname || 'ASIGNATURA'}
                  </span>
                  <p className="text-xs font-semibold text-gray-200 mt-1.5 leading-snug">{task.name}</p>
                </div>
                {task.submitted ? (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20 font-bold uppercase shrink-0">
                    Entregada
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20 font-bold uppercase shrink-0">
                    Pendiente
                  </span>
                )}
              </div>
              {task.duedate && (
                <p className="text-[10px] text-gray-500 mt-3 font-mono flex items-center gap-1.5">
                  <span>⏳</span> 
                  Vence: {new Date(task.duedate).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}