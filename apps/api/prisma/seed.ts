// Initial rows for HeroSlide/DestinationCard - without this, a freshly
// migrated database has zero rows and the homepage would render blank
// carousel/card sections until an owner manually adds content via
// /admin/hero-slides and /admin/destination-cards. Content here is copied
// from the hardcoded arrays these two tables replaced (see git history of
// apps/web/components/hero-carousel.tsx and category-cards.tsx) - the owner
// is expected to edit/replace it from the admin panel afterwards.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function searchLinkFor(destination: string): string {
  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 30);
  const iso = departureDate.toISOString().slice(0, 10);
  return `/search?origin=MAD&destination=${destination}&departureDate=${iso}&adults=1&cabinClass=ECONOMY`;
}

const HERO_SLIDES = [
  {
    titleEs: 'Conectando contigo con lo que más importa',
    titleEn: 'Connecting you to what matters most',
    subtitleEs:
      'Vuelos a casa, a la peregrinación y a destinos de todo el mundo. La confianza de miles de familias en España.',
    subtitleEn:
      'Flights to home, pilgrimage, and global destinations. Trusted by thousands of families in Spain.',
    imageUrl: 'https://images.unsplash.com/photo-1687992176093-6417a93fa3d0',
    linkUrl: '/#search',
    sortOrder: 0,
  },
  {
    titleEs: 'Hach y Umrah, tranquilidad en cada paso',
    titleEn: 'Hajj & Umrah, peace of mind every step of the way',
    subtitleEs: 'Vuelos a Yeda y Medina con el cuidado que tu peregrinación merece.',
    subtitleEn: 'Flights to Jeddah and Madinah, with the care your pilgrimage deserves.',
    imageUrl: 'https://images.unsplash.com/photo-1513072064285-240f87fa81e8',
    linkUrl: '/hajj-umrah',
    sortOrder: 1,
  },
  {
    titleEs: 'Vuela a Pakistán, India y Bangladés',
    titleEn: 'Fly to Pakistan, India & Bangladesh',
    subtitleEs: 'Las mejores tarifas para volver a casa y ver a los tuyos.',
    subtitleEn: 'The best fares to go home and see the people you love.',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
    linkUrl: searchLinkFor('LHE'),
    sortOrder: 2,
  },
  {
    titleEs: 'Vuela a Filipinas por menos',
    titleEn: 'Fly to the Philippines for less',
    subtitleEs: 'Conectamos Madrid con Manila para que tu familia esté más cerca.',
    subtitleEn: 'Connecting Madrid to Manila so your family feels closer.',
    imageUrl: 'https://images.unsplash.com/photo-1709486851809-ca174bfed7ed',
    linkUrl: searchLinkFor('MNL'),
    sortOrder: 3,
  },
];

const DESTINATION_CARDS = [
  {
    titleEs: 'Sur de Asia',
    titleEn: 'South Asia',
    subtitleEs: 'Pakistán, India, Bangladés y más',
    subtitleEn: 'Pakistan, India, Bangladesh & more',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
    linkUrl: searchLinkFor('LHE'),
    sortOrder: 0,
  },
  {
    titleEs: 'Filipinas',
    titleEn: 'Philippines',
    subtitleEs: 'Vuela a casa por menos',
    subtitleEn: 'Fly home to family for less',
    imageUrl: 'https://images.unsplash.com/photo-1709486851809-ca174bfed7ed',
    linkUrl: searchLinkFor('MNL'),
    sortOrder: 1,
  },
  {
    titleEs: 'Latinoamérica',
    titleEn: 'Latin America',
    subtitleEs: 'Conectando contigo lo que importa',
    subtitleEn: 'Connecting you to what matters',
    imageUrl: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e',
    linkUrl: searchLinkFor('GIG'),
    sortOrder: 2,
  },
  {
    titleEs: 'Hach y Umrah',
    titleEn: 'Hajj & Umrah',
    subtitleEs: 'Tranquilidad en cada paso',
    subtitleEn: 'Peace of mind, every step of the way',
    imageUrl: 'https://images.unsplash.com/photo-1513072064285-240f87fa81e8',
    linkUrl: '/hajj-umrah',
    sortOrder: 3,
  },
];

async function main() {
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    await prisma.heroSlide.createMany({ data: HERO_SLIDES });
    console.log(`Seeded ${HERO_SLIDES.length} hero slides.`);
  } else {
    console.log(`Skipping hero slide seed - ${existingSlides} row(s) already exist.`);
  }

  const existingCards = await prisma.destinationCard.count();
  if (existingCards === 0) {
    await prisma.destinationCard.createMany({ data: DESTINATION_CARDS });
    console.log(`Seeded ${DESTINATION_CARDS.length} destination cards.`);
  } else {
    console.log(`Skipping destination card seed - ${existingCards} row(s) already exist.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
