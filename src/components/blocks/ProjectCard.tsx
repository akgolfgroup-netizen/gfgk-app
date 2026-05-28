import Link from 'next/link'
import { AvatarStack, type AvatarStackUser } from '@/components/ui/AvatarStack'
import { Pill, statusTone } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'

export interface ProjectCardData {
  id: string
  name: string
  status: 'aktiv' | 'fullfort' | 'pause' | 'arkivert'
  coverColor: 'gold' | 'teal' | 'red' | 'black'
  deadline: string | null
  taskCount: number
  doneCount: number
  members: AvatarStackUser[]
}

const STATUS_LABEL: Record<ProjectCardData['status'], string> = {
  aktiv: 'Aktiv',
  fullfort: 'Fullført',
  pause: 'Pause',
  arkivert: 'Arkivert',
}

const COVER_BG: Record<ProjectCardData['coverColor'], string> = {
  gold: 'bg-gfgk-gold',
  teal: 'bg-gfgk-teal',
  red: 'bg-gfgk-red',
  black: 'bg-gfgk-black',
}

const COVER_TEXT: Record<ProjectCardData['coverColor'], string> = {
  gold: 'text-gfgk-black',
  teal: 'text-white',
  red: 'text-white',
  black: 'text-gfgk-gold',
}

function formatDeadline(deadline: string): { label: string; overdue: boolean } {
  const d = new Date(deadline + 'T23:59:59')
  const now = new Date()
  return {
    label: new Date(deadline + 'T00:00:00').toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    overdue: d < now,
  }
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const pct =
    project.taskCount === 0 ? 0 : Math.round((project.doneCount / project.taskCount) * 100)
  const deadline = project.deadline ? formatDeadline(project.deadline) : null

  return (
    <Link
      href={`/prosjekter/${project.id}`}
      className="block overflow-hidden rounded-xl border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          COVER_BG[project.coverColor],
        )}
      >
        <h3
          className={cn(
            'truncate text-sm font-extrabold tracking-tight',
            COVER_TEXT[project.coverColor],
          )}
        >
          {project.name}
        </h3>
        <Pill tone={statusTone(project.status)} size="sm">
          {STATUS_LABEL[project.status]}
        </Pill>
      </div>

      <div className="space-y-3 bg-white px-4 py-3">
        {project.taskCount > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-gfgk-text-2">
              <span>
                {project.doneCount} av {project.taskCount} oppgaver
              </span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gfgk-cream-deep">
              <div
                className="h-full rounded-full bg-gfgk-gold transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {deadline ? (
            <span
              className={cn(
                'text-xs',
                deadline.overdue ? 'font-semibold text-gfgk-red-deep' : 'text-gfgk-text-2',
              )}
            >
              {deadline.overdue ? 'Forfalt: ' : 'Frist: '}
              {deadline.label}
            </span>
          ) : (
            <span className="text-xs text-gfgk-text-3">Ingen frist</span>
          )}
          {project.members.length > 0 && (
            <AvatarStack users={project.members} max={4} size="sm" />
          )}
        </div>
      </div>
    </Link>
  )
}
