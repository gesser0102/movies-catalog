import PersonIcon from '@mui/icons-material/Person';
import { profileUrl } from '@/lib/tmdb/images';
import type { CastMember } from '@/types/tmdb';

export function CastCard({ member }: { member: CastMember }) {
  const photo = profileUrl(member.profile_path, 'w185');

  return (
    <div className="group w-[132px] shrink-0 tablet:w-[150px] desktop:w-[160px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-800 shadow-card ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-brand/70">
        {photo ? (
          <img
            src={photo}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <PersonIcon style={{ fontSize: 48 }} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pb-3 pt-14 text-white">
          <p className="line-clamp-2 text-sm font-bold leading-tight drop-shadow">
            {member.name}
          </p>
          {member.character && (
            <p className="mt-1 line-clamp-1 text-xs font-medium text-white/70 drop-shadow">
              {member.character}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
