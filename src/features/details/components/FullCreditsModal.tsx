import { useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { profileUrl } from '@/lib/tmdb/images';
import { useI18n } from '@/contexts/i18n/useI18n';
import type { Language } from '@/contexts/i18n/translations';
import type { CastMember, Credits, CrewMember } from '@/types/tmdb';

interface FullCreditsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  credits: Credits;
}

// Departamentos da TMDB vêm em inglês. Traduzo os mais comuns; o que não estiver
// no mapa cai no rótulo original.
const DEPARTMENT_PT: Record<string, string> = {
  Directing: 'Direção',
  Writing: 'Roteiro',
  Production: 'Produção',
  Sound: 'Som',
  Camera: 'Fotografia',
  Editing: 'Edição',
  Art: 'Arte',
  'Costume & Make-Up': 'Figurino e Maquiagem',
  'Visual Effects': 'Efeitos Visuais',
  Lighting: 'Iluminação',
  Crew: 'Equipe',
};

function departmentLabel(department: string, language: Language) {
  return language === 'pt-BR' ? DEPARTMENT_PT[department] ?? department : department;
}

/** Avatar modal full cast */
function Avatar({ path, name }: { path: string | null; name: string }) {
  const photo = profileUrl(path, 'w185');
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-700 ring-1 ring-white/10">
      {photo ? (
        <img src={photo} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/30">
          <PersonIcon fontSize="small" />
        </div>
      )}
    </div>
  );
}

/**
 * Modal full cast
 * aqui ja reaproveita dados da request que fizemos nos detalhes.
 */
export function FullCreditsModal({ open, onClose, title, credits }: FullCreditsModalProps) {
  const { t, language } = useI18n();

  // Agrupa a equipe por departamento.
  const crewByDepartment = useMemo(() => {
    const groups = new Map<string, CrewMember[]>();
    for (const member of credits.crew) {
      const list = groups.get(member.department) ?? [];
      list.push(member);
      groups.set(member.department, list);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [credits.crew]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        className:
          '!rounded-2xl !bg-surface-900 !text-white ring-1 ring-white/10 !max-h-[85vh]',
      }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-surface-900/95 px-5 py-4 backdrop-blur">
        <div>
          <h2 className="text-lg font-bold">{t.details.fullCredits}</h2>
          <p className="text-xs opacity-60">{title}</p>
        </div>
        <IconButton onClick={onClose} aria-label={t.common.close} color="inherit">
          <CloseIcon />
        </IconButton>
      </div>

      <div className="space-y-8 px-5 py-6">
        {/* Elenco */}
        {credits.cast.length > 0 && (
          <section>
            <h3 className="mb-4 text-base font-bold text-brand">
              {t.details.castLabel}{' '}
              <span className="opacity-50">({credits.cast.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 tablet:grid-cols-2">
              {credits.cast.map((member: CastMember) => (
                <div key={`${member.id}-${member.order}`} className="flex items-center gap-3">
                  <Avatar path={member.profile_path} name={member.name} />
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{member.name}</p>
                    <p className="line-clamp-1 text-xs opacity-60">{member.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equipe, por departamento */}
        {crewByDepartment.map(([department, members]) => (
          <section key={department}>
            <h3 className="mb-4 text-base font-bold text-brand">
              {departmentLabel(department, language)}{' '}
              <span className="opacity-50">({members.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 tablet:grid-cols-2">
              {members.map((member) => (
                <div key={`${member.id}-${member.job}`} className="flex items-center gap-3">
                  <Avatar path={member.profile_path} name={member.name} />
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{member.name}</p>
                    <p className="line-clamp-1 text-xs opacity-60">{member.job}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
