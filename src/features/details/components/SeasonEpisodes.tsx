import { useMemo, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useI18n } from '@/contexts/i18n/useI18n';
import {
  useSeasonEpisodes,
  useWarmAlternateLanguageSeasonEpisodes,
} from '../api/queries';
import type { TmdbSeasonSummary } from '@/types/tmdb';

const LOADING_ROWS = 6;

interface SeasonEpisodesProps {
  tvId: number;
  seasons: TmdbSeasonSummary[];
}

function formatEpisodeLabel(
  episodeLabel: string,
  episodeNumber: number,
  episodeName: string,
) {
  const prefix = `${episodeLabel} ${episodeNumber}`;
  const name = episodeName.trim();

  if (!name) return prefix;

  return name.toLocaleLowerCase() === prefix.toLocaleLowerCase()
    ? prefix
    : `${prefix} — ${name}`;
}

/**
 * Lista de episódios em estilo FAQ: seletor de temporada + acordeão.
 * O cabeçalho de cada item é "Episódio N — Título"; expandir mostra a
 * sinopse. Episódios sem sinopse viram linha fixa, sem expansão.
 */
export function SeasonEpisodes({ tvId, seasons }: SeasonEpisodesProps) {
  const { t } = useI18n();

  // "Especiais" (season 0) e temporadas ainda sem episódios ficam de fora.
  const selectableSeasons = useMemo(
    () =>
      seasons
        .filter((season) => season.season_number > 0 && season.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number),
    [seasons],
  );

  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    selectableSeasons[0]?.season_number ?? null,
  );

  const episodes = useSeasonEpisodes(tvId, selectedSeason);
  useWarmAlternateLanguageSeasonEpisodes(tvId, selectedSeason);

  if (selectableSeasons.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-4 tablet:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t.details.episodes}</h2>

        <FormControl size="small" className="w-full min-w-0 tablet:w-auto tablet:min-w-[200px]">
          <InputLabel id="season-label">{t.details.seasonLabel}</InputLabel>
          <Select
            labelId="season-label"
            label={t.details.seasonLabel}
            value={selectedSeason ?? ''}
            onChange={(event) => setSelectedSeason(Number(event.target.value))}
          >
            {selectableSeasons.map((season) => (
              <MenuItem key={season.id} value={season.season_number}>
                {season.name || `${t.details.seasonLabel} ${season.season_number}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {episodes.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: LOADING_ROWS }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={48} />
          ))}
        </div>
      )}

      {episodes.isError && (
        <ErrorState
          message={episodes.error?.message}
          onRetry={() => episodes.refetch()}
        />
      )}

      {episodes.data && (
        <div className="flex flex-col gap-1">
          {episodes.data.map((episode) => {
            const label = formatEpisodeLabel(
              t.details.episode,
              episode.episode_number,
              episode.name,
            );
            const hasOverview = episode.overview.trim().length > 0;

            if (!hasOverview) {
              return (
                <div
                  key={episode.id}
                  className="rounded-md bg-black/5 px-4 py-3 text-sm font-medium opacity-70 dark:bg-white/5"
                >
                  {label}
                </div>
              );
            }

            return (
              <Accordion key={episode.id} disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <span className="text-sm font-medium">{label}</span>
                </AccordionSummary>
                <AccordionDetails>
                  <p className="max-w-3xl text-sm leading-relaxed opacity-80">
                    {episode.overview}
                  </p>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
      )}
    </section>
  );
}
