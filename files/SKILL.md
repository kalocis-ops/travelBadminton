---
name: travel-context
description: Specjalistyczna wiedza o wyszukiwaniu lotów, hoteli i planowaniu podróży. Ładuj ten skill gdy zadanie dotyczy podróży, lotów, hoteli lub planowania wyjazdów.
---

# Travel Context Skill

## Jak wyszukiwać loty (web search)

### Najlepsze zapytania do web search:
- Loty: `"flights {FROM} to {TO} {DATE} cheapest site:google.com/flights OR skyscanner.com"`
- Tanie loty: `"cheap flights {FROM} {TO} {MONTH} {YEAR}"`
- Loty ostatniej chwili: `"last minute flights {FROM} {TO}"`

### Co sprawdzać:
1. **Google Flights** — najdokładniejsze ceny w czasie rzeczywistym
2. **Skyscanner** — dobre do porównania wielu linii
3. **Kayak** — dodatkowa weryfikacja
4. **Bezpośrednio linie lotnicze** — często taniej niż agregatory

### Format wyników lotów:
```
| Linia | Wylot | Przylot | Czas | Przesiadki | Cena |
|-------|-------|---------|------|------------|------|
| LOT   | 06:45 | 09:20   | 2h35 | Bezpośredni | ~450 PLN |
```

## Jak wyszukiwać hotele (web search)

### Najlepsze zapytania:
- `"hotels near {LANDMARK/DZIELNICA} {MIASTO} {DATY} {BUDZET}"`
- `"best hotels {DZIELNICA} {MIASTO} site:booking.com OR tripadvisor.com"`
- `"apartamenty {MIASTO} centrum {DATY}"`

### Hierarchia wyszukiwania hoteli:
1. **Lokalizacja pierwsza** — określ dzielnicę/landmark
2. **Booking.com** — największy wybór
3. **TripAdvisor** — opinie i rankingi
4. **Airbnb** — apartamenty, dłuższe pobyty

### Format wyników hoteli:
```
| Hotel | Lokalizacja | Cena/noc | Ocena | Link |
|-------|-------------|----------|-------|------|
| Name  | Centrum     | ~300 PLN | 8.9/10 | ... |
```

## Budżety orientacyjne (PLN, Europa)

| Kategoria | Hotel/noc | Lot (EU) | Lot (Intercont.) |
|-----------|-----------|----------|------------------|
| Budget    | 100-200   | 200-500  | 1500-2500 |
| Mid-range | 200-500   | 300-800  | 2500-4000 |
| Luxury    | 500+      | 500+     | 4000+ |

## Wskazówki dla planowania

- **Lot + hotel razem** — często taniej w pakiecie (sprawdź Travelist, Wakacje.pl dla PL)
- **Dni tygodnia** — wtorek/środa najtańsze loty
- **Booking z wyprzedzeniem** — 6-8 tygodni dla EU, 3-4 miesiące dla intercont.
- **Lokalizacja hotelu** — zawsze sprawdź odległość od centrum i transportu

## Polskie portale do sprawdzenia
- Wakacje.pl — pakiety all-inclusive
- Travelist.pl — hotele z rabatami
- Fly4free.pl — promocje lotnicze
- Fly.pl — loty

## Strefy czasowe i lotniska (popularne trasy z PL)
- WAW (Warszawa Chopin), WMI (Modlin) → Europa ~2-4h
- KRK (Kraków), KTW (Katowice), GDN (Gdańsk) → hub regionalne
- Przesiadki: VIE, FRA, AMS, CDG — najczęstsze huby z PL
