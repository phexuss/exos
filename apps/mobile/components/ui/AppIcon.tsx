import { AltArrowDown as AltArrowDownLinear } from '@solar-icons/react-native/category/arrows/Linear/AltArrowDown';
import { AltArrowRight as AltArrowRightLinear } from '@solar-icons/react-native/category/arrows/Linear/AltArrowRight';
import { DownloadMinimalistic as DownloadLinear } from '@solar-icons/react-native/category/arrows-action/Linear/DownloadMinimalistic';
import { Heart as HeartLinear } from '@solar-icons/react-native/category/like/Linear/Heart';
import { List as ListLinear } from '@solar-icons/react-native/category/list/Linear/List';
import { Playlist as PlaylistLinear } from '@solar-icons/react-native/category/list/Linear/Playlist';
import { Global as GlobeLinear } from '@solar-icons/react-native/category/map/Linear/Global';
import { Magnifier as MagnifierLinear } from '@solar-icons/react-native/category/search/Linear/Magnifier';
import { DocumentText as DocumentTextLinear } from '@solar-icons/react-native/category/notes/Linear/DocumentText';
import { Settings as SettingsLinear } from '@solar-icons/react-native/category/settings/Linear/Settings';
import { Palette as PaletteLinear } from '@solar-icons/react-native/category/tools/Linear/Palette';
import { CheckCircle as CheckCircleLinear } from '@solar-icons/react-native/category/ui/Linear/CheckCircle';
import { CloseCircle as CloseCircleLinear } from '@solar-icons/react-native/category/ui/Linear/CloseCircle';
import { Home as HomeLinear } from '@solar-icons/react-native/category/ui/Linear/Home';
import { User as UserLinear } from '@solar-icons/react-native/category/users/Linear/User';
import { MusicNote as MusicNoteLinear } from '@solar-icons/react-native/category/video/Linear/MusicNote';
import { MusicNotes as MusicNotesLinear } from '@solar-icons/react-native/category/video/Linear/MusicNotes';
import { Pause as PauseBroken } from '@solar-icons/react-native/category/video/Broken/Pause';
import { Play as PlayBroken } from '@solar-icons/react-native/category/video/Broken/Play';
import { Repeat as RepeatLinear } from '@solar-icons/react-native/category/video/Linear/Repeat';
import { RepeatOne as RepeatOneLinear } from '@solar-icons/react-native/category/video/Linear/RepeatOne';
import { Shuffle as ShuffleLinear } from '@solar-icons/react-native/category/video/Linear/Shuffle';
import { SkipNext as SkipNextLinear } from '@solar-icons/react-native/category/video/Linear/SkipNext';
import { SkipPrevious as SkipPreviousLinear } from '@solar-icons/react-native/category/video/Linear/SkipPrevious';
import type { IconProps } from '@solar-icons/react-native/lib/index';
import type { ComponentType } from 'react';

export type IconName =
  | 'home'
  | 'search'
  | 'profile'
  | 'library'
  | 'playlist'
  | 'download'
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'heart'
  | 'settings'
  | 'close'
  | 'globe'
  | 'check'
  | 'chevron-right'
  | 'chevron-down'
  | 'shuffle'
  | 'music'
  | 'music-notes'
  | 'repeat'
  | 'repeat-one'
  | 'lyrics'
  | 'palette'
  | 'queue';

const ICON_MAP: Record<IconName, ComponentType<IconProps>> = {
  home: HomeLinear,
  search: MagnifierLinear,
  profile: UserLinear,
  library: ListLinear,
  playlist: PlaylistLinear,
  download: DownloadLinear,
  play: PlayBroken,
  pause: PauseBroken,
  next: SkipNextLinear,
  previous: SkipPreviousLinear,
  heart: HeartLinear,
  settings: SettingsLinear,
  close: CloseCircleLinear,
  globe: GlobeLinear,
  check: CheckCircleLinear,
  'chevron-right': AltArrowRightLinear,
  'chevron-down': AltArrowDownLinear,
  shuffle: ShuffleLinear,
  music: MusicNoteLinear,
  'music-notes': MusicNotesLinear,
  repeat: RepeatLinear,
  'repeat-one': RepeatOneLinear,
  lyrics: DocumentTextLinear,
  palette: PaletteLinear,
  queue: PlaylistLinear,
};

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 20, color }: AppIconProps) {
  const Icon = ICON_MAP[name];
  return <Icon size={size} color={color} />;
}
