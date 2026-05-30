/**
 * Server-trygg modul for Notion-stil oppgavevisninger. Holder type + parser
 * utenfor 'use client'-grensen slik at server-komponenter (f.eks. /oppgaver)
 * kan kalle parseTaskView() direkte.
 */

export type TaskView = 'liste' | 'tavle' | 'tabell' | 'kalender'

export const TASK_VIEWS: TaskView[] = ['liste', 'tavle', 'tabell', 'kalender']

/**
 * Parser en ukjent param-verdi trygt til en gyldig TaskView. Default 'liste'.
 */
export function parseTaskView(value: string | null | undefined): TaskView {
  return TASK_VIEWS.includes(value as TaskView) ? (value as TaskView) : 'liste'
}
