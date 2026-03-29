export interface BookingParams {
  mode: "flights" | "hotels" | "badminton";
  from?: string;
  to?: string;
  city?: string;
  date?: string;
  dateTo?: string;
  passengers?: number;
  badmintonRegion?: string;
  badmintonPeriod?: string;
  badmintonCategory?: string;
}

export interface BookingLink {
  name: string;
  url: string;
  icon: string;
}

export function generateBookingLinks(params: BookingParams): BookingLink[] {
  if (params.mode === "flights") return generateFlightLinks(params);
  if (params.mode === "badminton") return generateBadmintonLinks(params);
  return generateHotelLinks(params);
}

function generateFlightLinks(params: BookingParams): BookingLink[] {
  const { from = "", to = "", date = "", passengers = 1 } = params;
  const dateShort = date.slice(2).replace(/-/g, "");

  return [
    {
      name: "Google Flights",
      icon: "🔍",
      url: `https://www.google.com/travel/flights?q=loty+${from}+${to}+${date}`,
    },
    {
      name: "Skyscanner",
      icon: "✈",
      url: `https://www.skyscanner.pl/transport/loty/${from.toLowerCase()}/${to.toLowerCase()}/${dateShort}/`,
    },
    {
      name: "Kayak",
      icon: "🎯",
      url: `https://www.pl.kayak.com/flights/${from}-${to}/${date}/${passengers}adults`,
    },
  ];
}

function generateHotelLinks(params: BookingParams): BookingLink[] {
  const { city = "", date = "", dateTo = "", passengers = 1 } = params;

  return [
    {
      name: "Booking.com",
      icon: "🏨",
      url: `https://www.booking.com/searchresults.pl.html?ss=${encodeURIComponent(city)}&checkin=${date}&checkout=${dateTo}&group_adults=${passengers}`,
    },
    {
      name: "Hotels.com",
      icon: "🏢",
      url: `https://pl.hotels.com/search.do?q-destination=${encodeURIComponent(city)}&q-check-in=${date}&q-check-out=${dateTo}&q-rooms=1&q-room-0-adults=${passengers}`,
    },
    {
      name: "Airbnb",
      icon: "🏠",
      url: `https://www.airbnb.pl/s/${encodeURIComponent(city)}/homes?checkin=${date}&checkout=${dateTo}&adults=${passengers}`,
    },
  ];
}

function generateBadmintonLinks(params: BookingParams): BookingLink[] {
  const { badmintonRegion = "", badmintonPeriod = "" } = params;
  const query = encodeURIComponent(`BWF World Tour ${badmintonPeriod} ${badmintonRegion}`);

  return [
    {
      name: "BWF Calendar",
      icon: "🏸",
      url: "https://bwfbadminton.com/calendar/",
    },
    {
      name: "BWF World Tour",
      icon: "🌍",
      url: `https://bwfbadminton.com/tournament/?search=${query}`,
    },
  ];
}
