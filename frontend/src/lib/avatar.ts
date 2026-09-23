import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
type Gender = 'female' | 'male';

const TOPS: Record<Gender, ('bob' | 'bun' | 'curly' | 'curvy' | 'frida' | 'longButNotTooLong' | 'miaWallace' | 'straight01' | 'straight02'
  | 'straightAndStrand' | 'bigHair' | 'shortCurly' | 'shortFlat' | 'shortRound' | 'shortWaved' | 'sides' | 'theCaesar'
  | 'theCaesarAndSidePart' | 'shaggy' | 'frizzle')[]> = {
  female: ['bob', 'bun', 'curly', 'curvy', 'frida', 'longButNotTooLong', 'miaWallace', 'straight01', 'straight02', 'straightAndStrand', 'bigHair'],
  male: ['shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart', 'shaggy', 'frizzle'],
};

/** A stable tint (degrees of hue rotation) per contractor, so each glass figure glows in its own colour. */
export function avatarHue(id: string): number {
  let value = 0;
  for (let index = 0; index < id.length; index++) value = (value * 31 + id.charCodeAt(index)) % 360;
  return value;
}

const cache = new Map<string, string>();

/** A transparent-background illustrated portrait (SVG data URI), generated locally and deterministically. */
export function avatarUri(id: string, gender: Gender): string {
  const key = `${id}:${gender}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const uri = createAvatar(avataaars, {
    seed: id,
    top: TOPS[gender],
    topProbability: 100,
    facialHair: ['beardLight', 'beardMedium', 'moustacheFancy'],
    facialHairProbability: gender === 'male' ? 35 : 0,
    accessories: ['prescription01', 'prescription02', 'round'],
    accessoriesProbability: 15,
    clothing: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
    clothesColor: ['ff385c', '222222', '3c4f5c', '65c9ff', 'e6e6e6', 'a7ffc4', 'ffafb9'],
    eyes: ['default', 'happy', 'squint'],
    eyebrows: ['default', 'defaultNatural', 'raisedExcitedNatural'],
    mouth: ['smile', 'default', 'twinkle'],
  }).toDataUri();
  cache.set(key, uri);
  return uri;
}
