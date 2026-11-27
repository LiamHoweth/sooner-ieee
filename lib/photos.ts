import antennaBuild from '@/assets/photos/chapter/antenna-build-2026.webp';
import antennaDrill from '@/assets/photos/chapter/antenna-drill-2026.webp';
import antennaGroup from '@/assets/photos/chapter/antenna-group-2026.webp';
import boardGameNight from '@/assets/photos/chapter/board-game-night-2026.webp';
import gbmGettingInvolved from '@/assets/photos/chapter/gbm-getting-involved-2026.webp';
import gbmOfficersPresenting from '@/assets/photos/chapter/gbm-officers-presenting-2026.webp';
import ledTreeGbm from '@/assets/photos/chapter/led-tree-gbm-2026.webp';
import microwaveNight from '@/assets/photos/chapter/microwave-night-2026.webp';
import officers from '@/assets/photos/chapter/officers-2026.webp';
import ouFlagTeam from '@/assets/photos/chapter/ou-flag-team-2024.webp';
import region5Team from '@/assets/photos/chapter/region5-team-2026.webp';
import solderingGbm from '@/assets/photos/chapter/soldering-gbm-2025.webp';
import soundWorkshopDemo from '@/assets/photos/chapter/sound-workshop-demo-2026.webp';
import soundWorkshopRoom from '@/assets/photos/chapter/sound-workshop-room-2026.webp';
import studyNight from '@/assets/photos/chapter/study-night-2026.webp';
import lightningNorman from '@/assets/photos/lightning-norman.webp';

export type PhotoCredit = { title: string; creator: string; license: string; licenseUrl: string; page: string };

export type Photo = {
  image: { src: string; width: number; height: number };
  alt: string;
  /** Openly licensed photos only. Chapter photos are the branch's own and need no credit line. */
  credit?: PhotoCredit;
  /** CSS object-position when the photo is cropped, e.g. "50% 20%" to keep faces in a tall shot. */
  position?: string;
};

// Keeps each key while typing every entry as a Photo (so optional fields like `position` read cleanly).
const photoSet = <K extends string>(set: Record<K, Photo>) => set;

type LicensedPhoto = Photo & { credit: PhotoCredit };

// The chapter's own event photos, from the officers' shared Drive (2024–25 to 2026–27),
// published with the chapter's OK. Originals stay in Drive; these copies were made with
// scripts/prepare-photo.mjs, which strips all metadata (including GPS location).
export const chapterPhotos = photoSet({
  gbmGettingInvolved: {
    image: gbmGettingInvolved,
    alt: 'A packed room of students at round tables during the IEEE Sooners “Getting Involved” general meeting, September 2026',
  },
  gbmOfficersPresenting: {
    image: gbmOfficersPresenting,
    alt: 'Two IEEE Sooners officers presenting at the front of the room during a September 2026 general meeting',
  },
  antennaBuild: {
    image: antennaBuild,
    alt: 'A student smiles while assembling a Yagi antenna from measuring-tape elements at the November 2026 antenna build',
    // Tall shot in a wide tile: top of the frame keeps his face and the antenna in his hands.
    position: '50% 6%',
  },
  antennaDrill: {
    image: antennaDrill,
    alt: 'A member drilling an antenna boom at a lab bench during the November 2026 antenna build',
    position: '50% 4%',
  },
  antennaGroup: {
    image: antennaGroup,
    alt: 'Members holding up the Yagi antennas they built at the November 2026 antenna workshop',
  },
  solderingGbm: {
    image: solderingGbm,
    alt: 'Two members soldering a circuit and checking it with a multimeter at a September 2025 general meeting',
    // Wide tiles can't fit both faces and the circuit; keep both faces in frame.
    position: '50% 20%',
  },
  ledTreeGbm: {
    image: ledTreeGbm,
    alt: 'Members building LED Christmas trees at round tables during the November 2026 general meeting',
  },
  microwaveNight: {
    image: microwaveNight,
    alt: 'Two members grinning beside the microwave at the October 2026 “Stuff in a Microwave” night',
  },
  officers: {
    image: officers,
    alt: 'The 2026–27 IEEE Sooners officers in an OU electrical and computer engineering lab',
    // Pre-cropped to the 4:3 page-hero frame, tight on the group (no ceiling or empty bench).
    // From _DSC3656.JPG: crop 0.162,0.217,0.624,0.702, 1320px wide.
  },
  ouFlagTeam: {
    image: ouFlagTeam,
    alt: 'Six IEEE Sooners members in matching polos holding an OU flag, 2025',
  },
  region5Team: {
    image: region5Team,
    alt: 'OU students in crimson shirts with their competition robot at the 2026 IEEE Region 5 Conference',
  },
  // Club-only replacements (Nov 2026) for the slots that showed company speakers or
  // company events; the site shows only the chapter's own events.
  soundWorkshopRoom: {
    image: soundWorkshopRoom,
    alt: 'A packed room of students at tables during the October 2026 “Build Your Own Sound” general meeting',
    // Pre-cropped to the 4:3 page-hero frame. From IMG_8568.JPG: crop 0.04,0.2,0.8,0.8.
  },
  soundWorkshopDemo: {
    image: soundWorkshopDemo,
    alt: 'Members presenting a breadboard circuit on screen to a room of students at the October 2026 “Build Your Own Sound” general meeting',
    // Pre-cropped to the 4:3 page-hero frame. From 20261014_184520.jpg: crop 0.02,0.05,0.9,0.9.
  },
  boardGameNight: {
    image: boardGameNight,
    alt: 'Members sharing pizza along a long table at the September 2026 board game night',
    // 4:3 from a tall shot (20260903_192816.jpg: crop 0,0.38,1,0.5625); wide tiles keep the faces.
    position: '50% 35%',
  },
  studyNight: {
    image: studyNight,
    alt: 'Members studying together on laptops at the October 2026 IEEE Sooners study night',
    // 4:3 from a tall shot (20261001_193210.jpg: crop 0,0.4,1,0.5625); wide tiles keep the faces.
    position: '50% 40%',
  },
});

// Openly licensed pictures of the chapter's world (Norman's storms). They are never
// presented as the chapter's own members or events. Sources and licences are mirrored
// in assets/photos/credits.json and credited in the footer.
export const photos = {
  lightningNorman: {
    image: lightningNorman,
    alt: 'A lightning bolt striking beneath a storm cloud near Norman, Oklahoma',
    credit: {
      title: 'Lightning Near Norman Oklahoma, 1980',
      creator: 'NOAA Photo Library / NSSL',
      license: 'Public domain',
      licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
      page: 'https://commons.wikimedia.org/wiki/File:Lightning_Near_Norman_Oklahoma_by_Official_Photographer,_1980_(NOAA)_(426174574).jpg',
    },
  },
} satisfies Record<string, LicensedPhoto>;

/** Licensed photos that need a footer credit. */
export const photoList: LicensedPhoto[] = Object.values(photos);
