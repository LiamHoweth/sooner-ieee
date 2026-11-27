import antennaBuild from '@/assets/photos/chapter/antenna-build-2026.webp';
import antennaDrill from '@/assets/photos/chapter/antenna-drill-2026.webp';
import antennaGroup from '@/assets/photos/chapter/antenna-group-2026.webp';
import gbmGettingInvolved from '@/assets/photos/chapter/gbm-getting-involved-2026.webp';
import gbmOfficersPresenting from '@/assets/photos/chapter/gbm-officers-presenting-2026.webp';
import ledTreeGbm from '@/assets/photos/chapter/led-tree-gbm-2026.webp';
import lumenTalk from '@/assets/photos/chapter/lumen-talk-2026.webp';
import microwaveNight from '@/assets/photos/chapter/microwave-night-2026.webp';
import niTalk from '@/assets/photos/chapter/ni-talk-2026.webp';
import officers from '@/assets/photos/chapter/officers-2026.webp';
import ouFlagTeam from '@/assets/photos/chapter/ou-flag-team-2024.webp';
import region5Team from '@/assets/photos/chapter/region5-team-2026.webp';
import solderingGbm from '@/assets/photos/chapter/soldering-gbm-2025.webp';
import tiMockInterview from '@/assets/photos/chapter/ti-mock-interview-2026.webp';
import williamsTalk from '@/assets/photos/chapter/williams-talk-2026.webp';
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
  williamsTalk: {
    image: williamsTalk,
    alt: 'A full lecture hall of students at the October 2026 Williams speaker event',
  },
  lumenTalk: {
    image: lumenTalk,
    alt: 'Dozens of students pose with the speakers after the Lumen Technologies tech talk, March 2026',
  },
  tiMockInterview: {
    image: tiMockInterview,
    alt: 'A visiting engineer runs a one-on-one mock interview with a student at the Texas Instruments career prep event, September 2026',
    position: '50% 45%',
  },
  niTalk: {
    image: niTalk,
    alt: 'Members stand with the NI speaker after the “Engineering Your Future” talk, November 2026',
    // Wide tiles trim the empty wall above them, not their feet.
    position: '50% 80%',
  },
  microwaveNight: {
    image: microwaveNight,
    alt: 'Two members grinning beside the microwave at the October 2026 “Stuff in a Microwave” night',
  },
  officers: {
    image: officers,
    alt: 'The 2026–27 IEEE Sooners officers in an OU electrical and computer engineering lab',
    // Pre-cropped to the 4:3 page-hero frame (less ceiling): crop 0.162,0.15,0.756,0.85.
  },
  ouFlagTeam: {
    image: ouFlagTeam,
    alt: 'Six IEEE Sooners members in matching polos holding an OU flag, 2025',
  },
  region5Team: {
    image: region5Team,
    alt: 'OU students in crimson shirts with their competition robot at the 2026 IEEE Region 5 Conference',
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
