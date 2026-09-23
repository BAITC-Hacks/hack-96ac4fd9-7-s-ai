import type { CSSProperties } from 'react';
import { avatarHue, avatarUri } from '../lib/avatar';

/** A person made of frosted glass: the portrait's silhouette masks a translucent fill; its drawing stays as etched lines. */
export default function GlassAvatar({ id, gender }: { id: string; gender: 'female' | 'male' }) {
  const uri = avatarUri(id, gender);
  const mask = { WebkitMaskImage: `url("${uri}")`, maskImage: `url("${uri}")` } as CSSProperties;
  const hue = { '--glass-hue': `${avatarHue(id)}deg` } as CSSProperties;
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
