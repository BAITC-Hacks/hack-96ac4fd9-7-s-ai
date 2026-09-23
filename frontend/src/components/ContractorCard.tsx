import { Aperture, Building2, Drum, Gift, Guitar, Hotel, Music, PartyPopper, Sparkles, Trees, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContractorCard as ContractorCardData } from '../../../shared/types';
import { formatMoney } from '../lib/format';
import { catalogLabel } from '../lib/catalogLabels';
import type { CSSProperties } from 'react';
import { avatarHue, avatarUri } from '../lib/avatar';
import { useLocale } from './LocaleProvider';
import FlipCard from './FlipCard';
import ProfileCard from './ProfileCard';

interface Props {
  card: ContractorCardData;
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
}

/** Venues, groups and shops get an illustration of the category rather than a person. */
const PLACE_ICONS: Record<string, LucideIcon> = {
  'Банкетный зал': PartyPopper, 'Ресторан': UtensilsCrossed, 'Отель': Hotel, 'Загородная площадка': Trees,
  'Лайв-бэнд': Guitar, 'Национальный ансамбль': Drum, 'Танцевальный коллектив': Music, 'Шоу-программа': Sparkles,
  'Фото и видеобудки': Aperture, 'Подарки и сувениры': Gift,
};

const FlipIcon = () => <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-base">↻</span>;

function Media({ card }: { card: ContractorCardData }) {
  const hue = { '--glass-hue': `${avatarHue(card.id)}deg` } as CSSProperties;
  if (card.kind === 'person' && card.gender) {
    const uri = avatarUri(card.id, card.gender);
    // The portrait's silhouette masks a frosted-glass fill; its drawing stays only as faint etched lines.
    const mask = { WebkitMaskImage: `url("${uri}")`, maskImage: `url("${uri}")` } as CSSProperties;
    // The colour blob lives inside the figure: its drop-shadow filter makes it the backdrop root for the glass blur.
    return <div className="pc-glass" style={hue} aria-hidden="true">
      <div className="pc-glass-figure">
        <span className="pc-glass-blob" />
        <div className="pc-glass-body" style={mask} />
        <img className="pc-glass-etch" src={uri} alt="" draggable={false} />
        <div className="pc-glass-shine" style={mask} />
      </div>
    </div>;
  }
  const Icon = PLACE_ICONS[card.category] ?? Building2;
  return <div className="pc-glass" style={hue} aria-hidden="true">
    <span className="pc-glass-blob" />
    <div className="pc-glass-disc">
      <Icon className="pc-glass-icon" strokeWidth={1.3} />
      <span className="pc-glass-gloss" />
    </div>
  </div>;
}

export default function ContractorCard({ card, flipped, onFlipChange }: Props) {
  const { locale, t } = useLocale();

  const front = <ProfileCard
    header={<>
      <h3 className="truncate text-xl font-bold">{card.name}</h3>
      <p className="mt-0.5 text-sm text-muted">{catalogLabel(card.category, locale)} · {catalogLabel(card.city, locale)}</p>
      {card.dataFlags.length > 0 && <ul aria-label={t('dataNotes')} className="mt-2 flex flex-wrap justify-center gap-1.5">
        {card.dataFlags.map((flag) => <li key={flag} className="badge">{t(flag)}</li>)}
      </ul>}
    </>}
    media={<Media card={card} />}
    footer={<div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted">{t('startingPrice')}</p>
        <p className="truncate text-lg font-bold">{t('fromPrice', { amount: formatMoney(card.priceFromKzt, locale) })}</p>
      </div>
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-body">{t('flipHint')}<FlipIcon /></span>
    </div>}
  />;

  const back = <div className="flex h-full flex-col rounded-[inherit] border border-hairline p-6">
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
      <p className="micro-label">{t('why')}</p>
    </div>
    <p className="mt-1 truncate text-sm text-muted">{card.name}</p>
    <p className="mt-4 min-h-0 flex-1 overflow-y-auto whitespace-pre-line pr-1 text-sm leading-6 text-body">{card.explanation}</p>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-4 text-sm font-semibold">
      <span>{t('flipBack')}</span><FlipIcon />
    </div>
  </div>;

  return <article>
    <FlipCard
      front={front}
      back={back}
      {...(flipped === undefined ? {} : { flipped })}
      {...(onFlipChange ? { onFlipChange } : {})}
      ariaLabel={t('flipAria', { name: card.name })}
      axis="y"
      flipOnClick
      draggable
      tilt={false}
      glare={false}
      hoverScale={1}
      perspective={1100}
      stiffness={170}
      damping={20}
      height={440}
      radius={14}
      background="#ffffff"
      color="#222222"
      shadow={false}
    />
  </article>;
}
