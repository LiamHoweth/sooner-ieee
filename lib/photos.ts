import bizzellLibrary from '@/assets/photos/bizzell-library.webp';
import campusAerial from '@/assets/photos/campus-aerial.webp';
import electronicsBench from '@/assets/photos/electronics-bench.webp';
import lightningNorman from '@/assets/photos/lightning-norman.webp';
import oscilloscope from '@/assets/photos/oscilloscope.webp';
import stormRadar from '@/assets/photos/storm-radar.webp';
import weatherCenter from '@/assets/photos/weather-center.webp';

export type Photo = {
  image: { src: string; width: number; height: number };
  alt: string;
  credit: { title: string; creator: string; license: string; licenseUrl: string; page: string };
};

// Openly licensed pictures of the chapter's world (campus, Norman's storms, lab
// equipment). They are never presented as the chapter's own members or events.
// Sources and licences are mirrored in assets/photos/credits.json.
export const photos = {
  stormRadar: {
    image: stormRadar,
    alt: 'The University of Oklahoma RaXPol radar truck scanning a severe thunderstorm on the Oklahoma plains',
    credit: {
      title: 'RaXPol scanning a severe thunderstorm in Oklahoma May 18, 2013',
      creator: 'Ks0stm',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      page: 'https://commons.wikimedia.org/wiki/File:RaXPol_scanning_a_severe_thunderstorm_in_Oklahoma_May_18,_2013.JPG',
    },
  },
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
  bizzellLibrary: {
    image: bizzellLibrary,
    alt: 'Bizzell Memorial Library on the University of Oklahoma campus in Norman',
    credit: {
      title: 'University of Oklahoma - Bizzell Memorial Library',
      creator: 'MARELBU',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
      page: 'https://commons.wikimedia.org/w/index.php?curid=54876567',
    },
  },
  campusAerial: {
    image: campusAerial,
    alt: 'Aerial view of the University of Oklahoma campus, with the Memorial Union and Evans Hall towers',
    credit: {
      title: 'OU-Union-Evans-Bizzell',
      creator: 'Nicholas Benson',
      license: 'CC BY 2.5',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
      page: 'https://commons.wikimedia.org/w/index.php?curid=838856',
    },
  },
  electronicsBench: {
    image: electronicsBench,
    alt: 'A development board wired to test equipment beside a laptop',
    credit: {
      title: 'Electronics equipment for demo at Par Lab retreat',
      creator: 'Chiara Coetzee',
      license: 'CC0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.en/',
      page: 'https://commons.wikimedia.org/w/index.php?curid=183422223',
    },
  },
  weatherCenter: {
    image: weatherCenter,
    alt: 'The National Weather Center building on the University of Oklahoma research campus',
    credit: {
      title: 'National Weather Center 6-20-2006',
      creator: 'Tyler Arbogast',
      license: 'CC BY 2.5',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.5',
      page: 'https://commons.wikimedia.org/wiki/File:National_Weather_Center_6-20-2006_3-48-27_PM.jpg',
    },
  },
  oscilloscope: {
    image: oscilloscope,
    alt: 'An analog oscilloscope tracing a green Lissajous ellipse on a lab bench',
    credit: {
      title: 'LissajousTechnion',
      creator: 'snamepi',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:LissajousTechnion.png',
    },
  },
} satisfies Record<string, Photo>;

export const photoList: Photo[] = Object.values(photos);
