export interface Airport {
  code: string;
  city: { es: string; en: string };
  country: { es: string; en: string };
  name: string;
}

/**
 * Curated list of major airports, weighted toward Spain (our home market),
 * the busiest European/global hubs, and — deliberately — Pakistan,
 * Bangladesh, the Philippines, and the Hajj/Umrah gateways (Jeddah,
 * Madinah), since this agency's core business is Spain-based South Asian/
 * Filipino diaspora travel plus pilgrimage travel, not generic tourism. Not
 * exhaustive — good enough for autocomplete on the routes this agency
 * actually sells. City/country names are bilingual (es/en) since Spanish is
 * the primary locale and several major cities have distinct Spanish names
 * (Londres, Múnich, Nueva York, El Cairo, Yeda, ...).
 */
export const airports: Airport[] = [
  // Spain
  { code: 'MAD', city: { es: 'Madrid', en: 'Madrid' }, country: { es: 'España', en: 'Spain' }, name: 'Adolfo Suárez Madrid–Barajas' },
  { code: 'BCN', city: { es: 'Barcelona', en: 'Barcelona' }, country: { es: 'España', en: 'Spain' }, name: 'Josep Tarradellas Barcelona–El Prat' },
  { code: 'PMI', city: { es: 'Palma de Mallorca', en: 'Palma de Mallorca' }, country: { es: 'España', en: 'Spain' }, name: 'Palma de Mallorca' },
  { code: 'AGP', city: { es: 'Málaga', en: 'Malaga' }, country: { es: 'España', en: 'Spain' }, name: 'Málaga–Costa del Sol' },
  { code: 'ALC', city: { es: 'Alicante', en: 'Alicante' }, country: { es: 'España', en: 'Spain' }, name: 'Alicante–Elche' },
  { code: 'VLC', city: { es: 'Valencia', en: 'Valencia' }, country: { es: 'España', en: 'Spain' }, name: 'Valencia' },
  { code: 'SVQ', city: { es: 'Sevilla', en: 'Seville' }, country: { es: 'España', en: 'Spain' }, name: 'Sevilla' },
  { code: 'BIO', city: { es: 'Bilbao', en: 'Bilbao' }, country: { es: 'España', en: 'Spain' }, name: 'Bilbao' },
  { code: 'LPA', city: { es: 'Gran Canaria', en: 'Gran Canaria' }, country: { es: 'España', en: 'Spain' }, name: 'Gran Canaria' },
  { code: 'TFS', city: { es: 'Tenerife Sur', en: 'Tenerife South' }, country: { es: 'España', en: 'Spain' }, name: 'Tenerife Sur' },
  { code: 'TFN', city: { es: 'Tenerife Norte', en: 'Tenerife North' }, country: { es: 'España', en: 'Spain' }, name: 'Tenerife Norte' },
  { code: 'IBZ', city: { es: 'Ibiza', en: 'Ibiza' }, country: { es: 'España', en: 'Spain' }, name: 'Ibiza' },
  { code: 'MAH', city: { es: 'Menorca', en: 'Menorca' }, country: { es: 'España', en: 'Spain' }, name: 'Menorca' },
  { code: 'LCG', city: { es: 'A Coruña', en: 'A Coruña' }, country: { es: 'España', en: 'Spain' }, name: 'A Coruña' },
  { code: 'SCQ', city: { es: 'Santiago de Compostela', en: 'Santiago de Compostela' }, country: { es: 'España', en: 'Spain' }, name: 'Santiago–Rosalía de Castro' },
  { code: 'VGO', city: { es: 'Vigo', en: 'Vigo' }, country: { es: 'España', en: 'Spain' }, name: 'Vigo' },
  { code: 'ZAZ', city: { es: 'Zaragoza', en: 'Zaragoza' }, country: { es: 'España', en: 'Spain' }, name: 'Zaragoza' },
  { code: 'GRO', city: { es: 'Girona', en: 'Girona' }, country: { es: 'España', en: 'Spain' }, name: 'Girona–Costa Brava' },
  { code: 'FUE', city: { es: 'Fuerteventura', en: 'Fuerteventura' }, country: { es: 'España', en: 'Spain' }, name: 'Fuerteventura' },
  { code: 'ACE', city: { es: 'Lanzarote', en: 'Lanzarote' }, country: { es: 'España', en: 'Spain' }, name: 'Lanzarote' },
  { code: 'XRY', city: { es: 'Jerez', en: 'Jerez' }, country: { es: 'España', en: 'Spain' }, name: 'Jerez' },
  { code: 'LEI', city: { es: 'Almería', en: 'Almeria' }, country: { es: 'España', en: 'Spain' }, name: 'Almería' },
  { code: 'SDR', city: { es: 'Santander', en: 'Santander' }, country: { es: 'España', en: 'Spain' }, name: 'Santander' },
  { code: 'OVD', city: { es: 'Asturias', en: 'Asturias' }, country: { es: 'España', en: 'Spain' }, name: 'Asturias' },
  { code: 'VLL', city: { es: 'Valladolid', en: 'Valladolid' }, country: { es: 'España', en: 'Spain' }, name: 'Valladolid' },
  { code: 'RMU', city: { es: 'Murcia', en: 'Murcia' }, country: { es: 'España', en: 'Spain' }, name: 'Región de Murcia' },
  { code: 'REU', city: { es: 'Reus', en: 'Reus' }, country: { es: 'España', en: 'Spain' }, name: 'Reus' },

  // Europe
  { code: 'LHR', city: { es: 'Londres', en: 'London' }, country: { es: 'Reino Unido', en: 'United Kingdom' }, name: 'London Heathrow' },
  { code: 'LGW', city: { es: 'Londres', en: 'London' }, country: { es: 'Reino Unido', en: 'United Kingdom' }, name: 'London Gatwick' },
  { code: 'STN', city: { es: 'Londres', en: 'London' }, country: { es: 'Reino Unido', en: 'United Kingdom' }, name: 'London Stansted' },
  { code: 'LTN', city: { es: 'Londres', en: 'London' }, country: { es: 'Reino Unido', en: 'United Kingdom' }, name: 'London Luton' },
  { code: 'MAN', city: { es: 'Mánchester', en: 'Manchester' }, country: { es: 'Reino Unido', en: 'United Kingdom' }, name: 'Manchester' },
  { code: 'CDG', city: { es: 'París', en: 'Paris' }, country: { es: 'Francia', en: 'France' }, name: 'Paris Charles de Gaulle' },
  { code: 'ORY', city: { es: 'París', en: 'Paris' }, country: { es: 'Francia', en: 'France' }, name: 'Paris Orly' },
  { code: 'NCE', city: { es: 'Niza', en: 'Nice' }, country: { es: 'Francia', en: 'France' }, name: 'Nice Côte d\'Azur' },
  { code: 'FRA', city: { es: 'Fráncfort', en: 'Frankfurt' }, country: { es: 'Alemania', en: 'Germany' }, name: 'Frankfurt am Main' },
  { code: 'MUC', city: { es: 'Múnich', en: 'Munich' }, country: { es: 'Alemania', en: 'Germany' }, name: 'Munich' },
  { code: 'BER', city: { es: 'Berlín', en: 'Berlin' }, country: { es: 'Alemania', en: 'Germany' }, name: 'Berlin Brandenburg' },
  { code: 'HAM', city: { es: 'Hamburgo', en: 'Hamburg' }, country: { es: 'Alemania', en: 'Germany' }, name: 'Hamburg' },
  { code: 'AMS', city: { es: 'Ámsterdam', en: 'Amsterdam' }, country: { es: 'Países Bajos', en: 'Netherlands' }, name: 'Amsterdam Schiphol' },
  { code: 'FCO', city: { es: 'Roma', en: 'Rome' }, country: { es: 'Italia', en: 'Italy' }, name: 'Rome Fiumicino' },
  { code: 'MXP', city: { es: 'Milán', en: 'Milan' }, country: { es: 'Italia', en: 'Italy' }, name: 'Milan Malpensa' },
  { code: 'VCE', city: { es: 'Venecia', en: 'Venice' }, country: { es: 'Italia', en: 'Italy' }, name: 'Venice Marco Polo' },
  { code: 'NAP', city: { es: 'Nápoles', en: 'Naples' }, country: { es: 'Italia', en: 'Italy' }, name: 'Naples' },
  { code: 'LIS', city: { es: 'Lisboa', en: 'Lisbon' }, country: { es: 'Portugal', en: 'Portugal' }, name: 'Lisbon Humberto Delgado' },
  { code: 'OPO', city: { es: 'Oporto', en: 'Porto' }, country: { es: 'Portugal', en: 'Portugal' }, name: 'Porto' },
  { code: 'BRU', city: { es: 'Bruselas', en: 'Brussels' }, country: { es: 'Bélgica', en: 'Belgium' }, name: 'Brussels' },
  { code: 'ZRH', city: { es: 'Zúrich', en: 'Zurich' }, country: { es: 'Suiza', en: 'Switzerland' }, name: 'Zurich' },
  { code: 'GVA', city: { es: 'Ginebra', en: 'Geneva' }, country: { es: 'Suiza', en: 'Switzerland' }, name: 'Geneva' },
  { code: 'VIE', city: { es: 'Viena', en: 'Vienna' }, country: { es: 'Austria', en: 'Austria' }, name: 'Vienna' },
  { code: 'CPH', city: { es: 'Copenhague', en: 'Copenhagen' }, country: { es: 'Dinamarca', en: 'Denmark' }, name: 'Copenhagen' },
  { code: 'ARN', city: { es: 'Estocolmo', en: 'Stockholm' }, country: { es: 'Suecia', en: 'Sweden' }, name: 'Stockholm Arlanda' },
  { code: 'OSL', city: { es: 'Oslo', en: 'Oslo' }, country: { es: 'Noruega', en: 'Norway' }, name: 'Oslo' },
  { code: 'HEL', city: { es: 'Helsinki', en: 'Helsinki' }, country: { es: 'Finlandia', en: 'Finland' }, name: 'Helsinki' },
  { code: 'DUB', city: { es: 'Dublín', en: 'Dublin' }, country: { es: 'Irlanda', en: 'Ireland' }, name: 'Dublin' },
  { code: 'ATH', city: { es: 'Atenas', en: 'Athens' }, country: { es: 'Grecia', en: 'Greece' }, name: 'Athens' },
  { code: 'IST', city: { es: 'Estambul', en: 'Istanbul' }, country: { es: 'Turquía', en: 'Turkey' }, name: 'Istanbul' },
  { code: 'WAW', city: { es: 'Varsovia', en: 'Warsaw' }, country: { es: 'Polonia', en: 'Poland' }, name: 'Warsaw Chopin' },
  { code: 'PRG', city: { es: 'Praga', en: 'Prague' }, country: { es: 'República Checa', en: 'Czech Republic' }, name: 'Prague' },
  { code: 'BUD', city: { es: 'Budapest', en: 'Budapest' }, country: { es: 'Hungría', en: 'Hungary' }, name: 'Budapest' },
  { code: 'SVO', city: { es: 'Moscú', en: 'Moscow' }, country: { es: 'Rusia', en: 'Russia' }, name: 'Moscow Sheremetyevo' },

  // North America
  { code: 'JFK', city: { es: 'Nueva York', en: 'New York' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'New York John F. Kennedy' },
  { code: 'EWR', city: { es: 'Nueva York', en: 'New York' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'Newark Liberty' },
  { code: 'LAX', city: { es: 'Los Ángeles', en: 'Los Angeles' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'Los Angeles' },
  { code: 'MIA', city: { es: 'Miami', en: 'Miami' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'Miami' },
  { code: 'ORD', city: { es: 'Chicago', en: 'Chicago' }, country: { es: 'Estados Unidos', en: 'United States' }, name: "Chicago O'Hare" },
  { code: 'SFO', city: { es: 'San Francisco', en: 'San Francisco' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'San Francisco' },
  { code: 'IAD', city: { es: 'Washington D.C.', en: 'Washington D.C.' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'Washington Dulles' },
  { code: 'BOS', city: { es: 'Boston', en: 'Boston' }, country: { es: 'Estados Unidos', en: 'United States' }, name: 'Boston Logan' },
  { code: 'YYZ', city: { es: 'Toronto', en: 'Toronto' }, country: { es: 'Canadá', en: 'Canada' }, name: 'Toronto Pearson' },
  { code: 'YUL', city: { es: 'Montreal', en: 'Montreal' }, country: { es: 'Canadá', en: 'Canada' }, name: 'Montréal–Trudeau' },
  { code: 'MEX', city: { es: 'Ciudad de México', en: 'Mexico City' }, country: { es: 'México', en: 'Mexico' }, name: 'Mexico City' },
  { code: 'CUN', city: { es: 'Cancún', en: 'Cancun' }, country: { es: 'México', en: 'Mexico' }, name: 'Cancún' },

  // Latin America
  { code: 'GRU', city: { es: 'São Paulo', en: 'São Paulo' }, country: { es: 'Brasil', en: 'Brazil' }, name: 'São Paulo–Guarulhos' },
  { code: 'GIG', city: { es: 'Río de Janeiro', en: 'Rio de Janeiro' }, country: { es: 'Brasil', en: 'Brazil' }, name: 'Rio de Janeiro–Galeão' },
  { code: 'EZE', city: { es: 'Buenos Aires', en: 'Buenos Aires' }, country: { es: 'Argentina', en: 'Argentina' }, name: 'Buenos Aires–Ezeiza' },
  { code: 'BOG', city: { es: 'Bogotá', en: 'Bogota' }, country: { es: 'Colombia', en: 'Colombia' }, name: 'Bogotá–El Dorado' },
  { code: 'LIM', city: { es: 'Lima', en: 'Lima' }, country: { es: 'Perú', en: 'Peru' }, name: 'Lima' },
  { code: 'SCL', city: { es: 'Santiago de Chile', en: 'Santiago' }, country: { es: 'Chile', en: 'Chile' }, name: 'Santiago' },
  { code: 'PTY', city: { es: 'Ciudad de Panamá', en: 'Panama City' }, country: { es: 'Panamá', en: 'Panama' }, name: 'Panama–Tocumen' },
  { code: 'UIO', city: { es: 'Quito', en: 'Quito' }, country: { es: 'Ecuador', en: 'Ecuador' }, name: 'Quito' },
  { code: 'MVD', city: { es: 'Montevideo', en: 'Montevideo' }, country: { es: 'Uruguay', en: 'Uruguay' }, name: 'Montevideo' },
  { code: 'HAV', city: { es: 'La Habana', en: 'Havana' }, country: { es: 'Cuba', en: 'Cuba' }, name: 'Havana' },
  { code: 'SDQ', city: { es: 'Santo Domingo', en: 'Santo Domingo' }, country: { es: 'República Dominicana', en: 'Dominican Republic' }, name: 'Santo Domingo' },

  // Middle East & Africa
  { code: 'DXB', city: { es: 'Dubái', en: 'Dubai' }, country: { es: 'Emiratos Árabes Unidos', en: 'United Arab Emirates' }, name: 'Dubai International' },
  { code: 'DOH', city: { es: 'Doha', en: 'Doha' }, country: { es: 'Catar', en: 'Qatar' }, name: 'Hamad International' },
  { code: 'AUH', city: { es: 'Abu Dabi', en: 'Abu Dhabi' }, country: { es: 'Emiratos Árabes Unidos', en: 'United Arab Emirates' }, name: 'Abu Dhabi' },
  // Hajj/Umrah gateways - Mecca itself has no airport, pilgrims fly into
  // Jeddah (nearest to Mecca) or Madinah (for the Prophet's Mosque).
  { code: 'JED', city: { es: 'Yeda', en: 'Jeddah' }, country: { es: 'Arabia Saudí', en: 'Saudi Arabia' }, name: 'King Abdulaziz International' },
  { code: 'MED', city: { es: 'Medina', en: 'Madinah' }, country: { es: 'Arabia Saudí', en: 'Saudi Arabia' }, name: 'Prince Mohammad Bin Abdulaziz International' },
  { code: 'TLV', city: { es: 'Tel Aviv', en: 'Tel Aviv' }, country: { es: 'Israel', en: 'Israel' }, name: 'Ben Gurion' },
  { code: 'CAI', city: { es: 'El Cairo', en: 'Cairo' }, country: { es: 'Egipto', en: 'Egypt' }, name: 'Cairo' },
  { code: 'CMN', city: { es: 'Casablanca', en: 'Casablanca' }, country: { es: 'Marruecos', en: 'Morocco' }, name: 'Casablanca Mohammed V' },
  { code: 'RAK', city: { es: 'Marrakech', en: 'Marrakesh' }, country: { es: 'Marruecos', en: 'Morocco' }, name: 'Marrakesh Menara' },
  { code: 'JNB', city: { es: 'Johannesburgo', en: 'Johannesburg' }, country: { es: 'Sudáfrica', en: 'South Africa' }, name: 'O.R. Tambo' },
  { code: 'CPT', city: { es: 'Ciudad del Cabo', en: 'Cape Town' }, country: { es: 'Sudáfrica', en: 'South Africa' }, name: 'Cape Town' },

  // Asia & Oceania
  { code: 'NRT', city: { es: 'Tokio', en: 'Tokyo' }, country: { es: 'Japón', en: 'Japan' }, name: 'Tokyo Narita' },
  { code: 'HND', city: { es: 'Tokio', en: 'Tokyo' }, country: { es: 'Japón', en: 'Japan' }, name: 'Tokyo Haneda' },
  { code: 'SIN', city: { es: 'Singapur', en: 'Singapore' }, country: { es: 'Singapur', en: 'Singapore' }, name: 'Singapore Changi' },
  { code: 'HKG', city: { es: 'Hong Kong', en: 'Hong Kong' }, country: { es: 'Hong Kong', en: 'Hong Kong' }, name: 'Hong Kong' },
  { code: 'BKK', city: { es: 'Bangkok', en: 'Bangkok' }, country: { es: 'Tailandia', en: 'Thailand' }, name: 'Suvarnabhumi' },
  { code: 'PEK', city: { es: 'Pekín', en: 'Beijing' }, country: { es: 'China', en: 'China' }, name: 'Beijing Capital' },
  { code: 'PVG', city: { es: 'Shanghái', en: 'Shanghai' }, country: { es: 'China', en: 'China' }, name: 'Shanghai Pudong' },
  { code: 'ICN', city: { es: 'Seúl', en: 'Seoul' }, country: { es: 'Corea del Sur', en: 'South Korea' }, name: 'Seoul Incheon' },
  { code: 'DEL', city: { es: 'Nueva Delhi', en: 'New Delhi' }, country: { es: 'India', en: 'India' }, name: 'Indira Gandhi' },
  { code: 'BOM', city: { es: 'Bombay', en: 'Mumbai' }, country: { es: 'India', en: 'India' }, name: 'Chhatrapati Shivaji' },
  { code: 'LHE', city: { es: 'Lahore', en: 'Lahore' }, country: { es: 'Pakistán', en: 'Pakistan' }, name: 'Allama Iqbal International' },
  { code: 'KHI', city: { es: 'Karachi', en: 'Karachi' }, country: { es: 'Pakistán', en: 'Pakistan' }, name: 'Jinnah International' },
  { code: 'ISB', city: { es: 'Islamabad', en: 'Islamabad' }, country: { es: 'Pakistán', en: 'Pakistan' }, name: 'Islamabad International' },
  { code: 'DAC', city: { es: 'Daca', en: 'Dhaka' }, country: { es: 'Bangladés', en: 'Bangladesh' }, name: 'Hazrat Shahjalal International' },
  { code: 'MNL', city: { es: 'Manila', en: 'Manila' }, country: { es: 'Filipinas', en: 'Philippines' }, name: 'Ninoy Aquino International' },
  { code: 'SYD', city: { es: 'Sídney', en: 'Sydney' }, country: { es: 'Australia', en: 'Australia' }, name: 'Sydney' },
  { code: 'MEL', city: { es: 'Melbourne', en: 'Melbourne' }, country: { es: 'Australia', en: 'Australia' }, name: 'Melbourne' },
  { code: 'AKL', city: { es: 'Auckland', en: 'Auckland' }, country: { es: 'Nueva Zelanda', en: 'New Zealand' }, name: 'Auckland' },
];
