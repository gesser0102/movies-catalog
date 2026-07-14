import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { DetailsPageSkeleton } from '../components/DetailsPageSkeleton';
import { CastSlider } from '../components/CastSlider';
import { FullCreditsModal } from '../components/FullCreditsModal';
import { TrailerModal } from '../components/TrailerModal';
import { ContentRatingBadge } from '@/components/media/ContentRatingBadge';
import { MediaSlider } from '@/components/media/MediaSlider';
import { RatingBadge } from '@/components/media/RatingBadge';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  useCredits,
  useDetails,
  useSimilar,
  useWarmAlternateLanguageSimilar,
} from '../api/queries';
import {
  usePrefetchMediaDetails,
  useWarmAlternateLanguageMediaDetails,
} from '@/hooks/useMediaDetails';
import { useI18n } from '@/contexts/i18n/useI18n';
import { posterUrl, backdropUrl } from '@/lib/tmdb/images';
import { formatReleaseDate, formatRuntime } from '@/utils/format';
import type {
  MediaType,
  TmdbMovieDetails,
  TmdbTvDetails,
} from '@/types/tmdb';

// Limitador de quantos atores mostrar no carrousel da detalhes.
const MAX_CAST = 12;
const SIMILAR_PREFETCH_LIMIT = 10;

interface DetailsLocationState {
  fromDetails?: boolean;
}

// Tela de detalhes de um título (filme ou série).
export function DetailsPage({ mediaType }: { mediaType: MediaType }) {
  const { id } = useParams();
  const numericId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useI18n();

  const details = useDetails(mediaType, numericId);
  const credits = useCredits(mediaType, numericId);
  const similar = useSimilar(mediaType, numericId);
  const prefetchDetails = usePrefetchMediaDetails();
  const hasValidId = Number.isFinite(numericId) && numericId > 0;
  const cameFromDetails = Boolean(
    (location.state as DetailsLocationState | null)?.fromDetails,
  );
  const homePath = mediaType === 'movie' ? '/movies' : '/series';
  const homeLabel =
    mediaType === 'movie' ? t.details.moviesHome : t.details.seriesHome;

  useWarmAlternateLanguageMediaDetails(mediaType, numericId, hasValidId);
  useWarmAlternateLanguageSimilar(mediaType, numericId, hasValidId);

  // Controle do modal de elenco/equipe completos.
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    const items = similar.data?.slice(0, SIMILAR_PREFETCH_LIMIT) ?? [];
    for (const item of items) {
      prefetchDetails(item.mediaType, item.id);
    }
  }, [prefetchDetails, similar.data]);

  if (details.isLoading) return <DetailsPageSkeleton />;
  if (details.isError || !details.data) {
    return (
      <ErrorState message={details.error?.message} onRetry={() => details.refetch()} />
    );
  }

  const data = details.data;
  const trailer = data.trailer ?? null;

  // Campos normalizados (resolvem a diferença filme x série num só lugar)
  const isMovie = mediaType === 'movie';
  const title = isMovie
    ? (data as TmdbMovieDetails).title
    : (data as TmdbTvDetails).name;
  const releaseIso = isMovie
    ? (data as TmdbMovieDetails).release_date
    : (data as TmdbTvDetails).first_air_date;
  const runtimeMin = isMovie
    ? (data as TmdbMovieDetails).runtime
    : (data as TmdbTvDetails).episode_run_time?.[0] ?? null;

  const releaseDate = formatReleaseDate(releaseIso, language);
  const runtime = formatRuntime(runtimeMin);

  // Diretor (filmes) sai do array de equipe técnica dos créditos.
  const director = credits.data?.crew.find((person) => person.job === 'Director');
  const cast = credits.data?.cast.slice(0, MAX_CAST) ?? [];

  const backdrop = backdropUrl(data.backdrop_path, 'w1280');
  const poster = posterUrl(data.poster_path, 'w500');

  return (
    <div>
      {/* Backdrop de fundo com gradiente pra leitura */}
      <div className="relative">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-950" />

        <div className="relative mx-auto max-w-[1400px] px-4 py-6 tablet:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              className="!text-white"
            >
              {t.common.back}
            </Button>

            {cameFromDetails && (
              <Button
                component={Link}
                to={homePath}
                startIcon={<HomeIcon />}
                variant="outlined"
                className="!rounded-full !border-white/25 !px-4 !font-bold !text-white hover:!border-brand hover:!text-brand"
              >
                {homeLabel}
              </Button>
            )}
          </div>

          {/* Pôster + informações principais. Empilha no mobile, lado a lado no
              tablet+ (o pôster fica com largura fixa e o texto flui ao lado). */}
          <div className="flex flex-col gap-6 tablet:flex-row">
            <div className="mx-auto w-[220px] shrink-0 tablet:mx-0 tablet:w-[280px]">
              {poster ? (
                <img
                  src={poster}
                  alt={title}
                  fetchPriority="high"
                  className="w-full rounded-xl shadow-2xl ring-1 ring-white/10"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-surface-800 text-white/40">
                  {title}
                </div>
              )}
            </div>

            <div className="flex-1 text-white">
              <h1 className="text-3xl font-extrabold tablet:text-4xl">{title}</h1>
              {data.tagline && (
                <p className="mt-1 text-base italic opacity-70">{data.tagline}</p>
              )}

              {/* Metadados: nota, data, duração */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="inline-flex items-center gap-2">
                  <RatingBadge rating={data.vote_average} size="md" />
                  <span className="max-w-[92px] text-sm font-bold leading-tight">
                    {t.details.userRating}
                  </span>
                </div>
                {data.content_rating && (
                  <span className="inline-flex items-center gap-2">
                    <ContentRatingBadge rating={data.content_rating} size="md" />
                    <span className="max-w-[116px] text-sm font-bold leading-tight">
                      {t.details.ageRating}
                    </span>
                  </span>
                )}
                {releaseDate && (
                  <span className="inline-flex items-center gap-1 opacity-80">
                    <CalendarMonthIcon style={{ fontSize: 16 }} />
                    {releaseDate}
                  </span>
                )}
                {runtime && (
                  <span className="inline-flex items-center gap-1 opacity-80">
                    <ScheduleIcon style={{ fontSize: 16 }} />
                    {runtime}
                  </span>
                )}
                {!isMovie && (
                  <span className="opacity-80">
                    {(data as TmdbTvDetails).number_of_seasons} {t.details.seasons}
                  </span>
                )}
              </div>

              {/* Gêneros como chips */}
              {data.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.genres.map((genre) => (
                    <Chip
                      key={genre.id}
                      label={genre.name}
                      size="small"
                      variant="outlined"
                      className="!border-white/30 !text-white"
                    />
                  ))}
                </div>
              )}

              {trailer && (
                <div className="mt-5">
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<OndemandVideoIcon />}
                    onClick={() => setTrailerOpen(true)}
                    className="!rounded-full !bg-brand-gradient !px-5 !py-2 !font-bold !text-surface-950"
                  >
                    {t.details.viewTrailer}
                  </Button>
                </div>
              )}

              {/* Sinopse */}
              <section className="mt-6">
                <h2 className="mb-2 text-lg font-bold">{t.details.overview}</h2>
                <p className="max-w-3xl text-sm leading-relaxed opacity-90">
                  {data.overview || t.details.noOverview}
                </p>
              </section>

              {director && (
                <p className="mt-4 text-sm">
                  <span className="font-semibold">{t.details.director}: </span>
                  <span className="opacity-80">{director.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <CastSlider
          title={t.details.cast}
          members={cast}
          actionLabel={t.details.viewFullCredits}
          onAction={() => setCreditsOpen(true)}
        />
      )}

      {/* Similares — reaproveita o mesmo slider da Home */}
      {similar.data && similar.data.length > 0 && (
        <MediaSlider title={t.details.similar} items={similar.data} />
      )}

      {/* Modal de elenco + equipe completos (reaproveita os créditos já em cache) */}
      {credits.data && (
        <FullCreditsModal
          open={creditsOpen}
          onClose={() => setCreditsOpen(false)}
          title={title}
          credits={credits.data}
        />
      )}

      {trailer && (
        <TrailerModal
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          title={title}
          trailer={trailer}
        />
      )}
    </div>
  );
}
