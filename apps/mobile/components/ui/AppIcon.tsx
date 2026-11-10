import { AltArrowDown as AltArrowDownLinear } from '@solar-icons/react-native/category/arrows/Linear/AltArrowDown';
import { AltArrowLeft as AltArrowLeftLinear } from '@solar-icons/react-native/category/arrows/Linear/AltArrowLeft';
import { AltArrowRight as AltArrowRightLinear } from '@solar-icons/react-native/category/arrows/Linear/AltArrowRight';
import { ArrowRight as ArrowRightLinear } from '@solar-icons/react-native/category/arrows/Linear/ArrowRight';
import { Restart as RestartLinear } from '@solar-icons/react-native/category/arrows/Linear/Restart';
import { DownloadMinimalistic as DownloadLinear } from '@solar-icons/react-native/category/arrows-action/Linear/DownloadMinimalistic';
import { UndoLeft as UndoLeftLinear } from '@solar-icons/react-native/category/arrows-action/Linear/UndoLeft';
import { Heart as HeartLinear } from '@solar-icons/react-native/category/like/Linear/Heart';
import { List as ListBold } from '@solar-icons/react-native/category/list/Bold/List';
import { List as ListLinear } from '@solar-icons/react-native/category/list/Linear/List';
import { Playlist as PlaylistLinear } from '@solar-icons/react-native/category/list/Linear/Playlist';
import { Global as GlobeLinear } from '@solar-icons/react-native/category/map/Linear/Global';
import { Letter as LetterLinear } from '@solar-icons/react-native/category/messages/Linear/Letter';
import { Pen as PenLinear } from '@solar-icons/react-native/category/messages/Linear/Pen';
import { DocumentText as DocumentTextLinear } from '@solar-icons/react-native/category/notes/Linear/DocumentText';
import { Magnifier as MagnifierBold } from '@solar-icons/react-native/category/search/Bold/Magnifier';
import { Magnifier as MagnifierLinear } from '@solar-icons/react-native/category/search/Linear/Magnifier';
import { Eye as EyeLinear } from '@solar-icons/react-native/category/security/Linear/Eye';
import { EyeClosed as EyeClosedLinear } from '@solar-icons/react-native/category/security/Linear/EyeClosed';
import { Key as KeyLinear } from '@solar-icons/react-native/category/security/Linear/Key';
import { Lock as LockLinear } from '@solar-icons/react-native/category/security/Linear/Lock';
import { Settings as SettingsLinear } from '@solar-icons/react-native/category/settings/Linear/Settings';
import { Stopwatch as StopwatchLinear } from '@solar-icons/react-native/category/time/Linear/Stopwatch';
import { Palette as PaletteLinear } from '@solar-icons/react-native/category/tools/Linear/Palette';
import { Home as HomeBold } from '@solar-icons/react-native/category/ui/Bold/Home';
import { InfoCircle as InfoCircleBroken } from '@solar-icons/react-native/category/ui/Broken/InfoCircle';
import { AddCircle as AddCircleLinear } from '@solar-icons/react-native/category/ui/Linear/AddCircle';
import { CheckCircle as CheckCircleLinear } from '@solar-icons/react-native/category/ui/Linear/CheckCircle';
import { CloseCircle as CloseCircleLinear } from '@solar-icons/react-native/category/ui/Linear/CloseCircle';
import { Home as HomeLinear } from '@solar-icons/react-native/category/ui/Linear/Home';
import { TrashBinTrash as TrashLinear } from '@solar-icons/react-native/category/ui/Linear/TrashBinTrash';
import { User as UserLinear } from '@solar-icons/react-native/category/users/Linear/User';
import { UserId as UserIdLinear } from '@solar-icons/react-native/category/users/Linear/UserId';
import { Pause as PauseBold } from '@solar-icons/react-native/category/video/Bold/Pause';
import { Play as PlayBold } from '@solar-icons/react-native/category/video/Bold/Play';
import { SkipNext as SkipNextBold } from '@solar-icons/react-native/category/video/Bold/SkipNext';
import { SkipPrevious as SkipPreviousBold } from '@solar-icons/react-native/category/video/Bold/SkipPrevious';
import { Pause as PauseBroken } from '@solar-icons/react-native/category/video/Broken/Pause';
import { Play as PlayBroken } from '@solar-icons/react-native/category/video/Broken/Play';
import { MusicNote as MusicNoteLinear } from '@solar-icons/react-native/category/video/Linear/MusicNote';
import { MusicNotes as MusicNotesLinear } from '@solar-icons/react-native/category/video/Linear/MusicNotes';
import { Repeat as RepeatLinear } from '@solar-icons/react-native/category/video/Linear/Repeat';
import { RepeatOne as RepeatOneLinear } from '@solar-icons/react-native/category/video/Linear/RepeatOne';
import { Shuffle as ShuffleLinear } from '@solar-icons/react-native/category/video/Linear/Shuffle';
import { SkipNext as SkipNextLinear } from '@solar-icons/react-native/category/video/Linear/SkipNext';
import { SkipPrevious as SkipPreviousLinear } from '@solar-icons/react-native/category/video/Linear/SkipPrevious';
import { Soundwave as SoundwaveLinear } from '@solar-icons/react-native/category/video/Linear/Soundwave';
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
  | 'play-solid'
  | 'pause-solid'
  | 'next-solid'
  | 'previous-solid'
  | 'home-solid'
  | 'search-solid'
  | 'library-solid'
  | 'pause'
  | 'next'
  | 'previous'
  | 'heart'
  | 'settings'
  | 'close'
  | 'trash'
  | 'globe'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'shuffle'
  | 'music'
  | 'music-notes'
  | 'repeat'
  | 'repeat-one'
  | 'lyrics'
  | 'palette'
  | 'info'
  | 'queue'
  | 'fx'
  | 'arrow-right'
  | 'mail'
  | 'lock'
  | 'key'
  | 'eye'
  | 'eye-closed'
  | 'id'
  | 'plus'
  | 'edit'
  | 'undo'
  | 'restart'
  | 'stopwatch';

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
  'play-solid': PlayBold,
  'pause-solid': PauseBold,
  'next-solid': SkipNextBold,
  'previous-solid': SkipPreviousBold,
  'home-solid': HomeBold,
  'search-solid': MagnifierBold,
  'library-solid': ListBold,
  trash: TrashLinear,
  globe: GlobeLinear,
  check: CheckCircleLinear,
  'chevron-left': AltArrowLeftLinear,
  'chevron-right': AltArrowRightLinear,
  'chevron-down': AltArrowDownLinear,
  shuffle: ShuffleLinear,
  music: MusicNoteLinear,
  'music-notes': MusicNotesLinear,
  repeat: RepeatLinear,
  'repeat-one': RepeatOneLinear,
  lyrics: DocumentTextLinear,
  palette: PaletteLinear,
  info: InfoCircleBroken,
  queue: PlaylistLinear,
  fx: SoundwaveLinear,
  'arrow-right': ArrowRightLinear,
  mail: LetterLinear,
  lock: LockLinear,
  key: KeyLinear,
  eye: EyeLinear,
  'eye-closed': EyeClosedLinear,
  id: UserIdLinear,
  plus: AddCircleLinear,
  edit: PenLinear,
  undo: UndoLeftLinear,
  restart: RestartLinear,
  stopwatch: StopwatchLinear,
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
