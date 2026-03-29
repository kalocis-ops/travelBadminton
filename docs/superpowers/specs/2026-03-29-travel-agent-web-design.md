# Travel Agent Web — Design Spec
**Data:** 2026-03-29
**Status:** Approved

---

## Cel

Zbudować interfejs webowy dla istniejącego agenta podróży (Claude + web_search). Strona ma służyć jako osobiste narzędzie i portfolio demo. Użytkownik wpisuje trasę i datę, agent zwraca wyniki z linkami do rezerwacji.

---

## Stack

- **Frontend:** Next.js 15 App Router (już w projekcie)
- **Backend:** istniejący `src/agent.ts` + `src/api/route.ts` (bez zmian)
- **Styl:** Czysty/Minimal — biały, akcent #2563eb, karty z cieniem
- **Język:** TypeScript

---

## Architektura

```
src/
├── app/
│   ├── page.tsx                  ← strona główna
│   ├── layout.tsx                ← layout z metadanymi
│   ├── globals.css               ← style globalne
│   └── components/
│       ├── SearchForm.tsx        ← formularz z zakładkami
│       └── ResultCards.tsx       ← siatka kart z wynikami
├── agent.ts                      ← bez zmian
├── api/
│   └── travel/
│       └── route.ts              ← bez zmian
```

---

## Interfejs użytkownika

### Pasek wyszukiwania

Zakładki na górze: **✈ Loty** | **🏨 Hotele** | **🗺 Pełny plan**

Pola formularza (zakładka Loty):
- Skąd (np. Warszawa)
- Dokąd (np. Dublin)
- Data wylotu
- Liczba osób (domyślnie: 1)

Zakładka Hotele: miasto, data przyjazdu, data wyjazdu, liczba osób.
Zakładka Plan: skąd, dokąd, daty, liczba osób, budżet (opcjonalnie).

### Wyniki

Po kliknięciu "Szukaj":
- Stan ładowania z animacją (spinner lub skeleton)
- Agent Claude przetwarza zapytanie przez istniejące API
- Wyniki jako **siatka 3 kart** (na mobile: 1 kolumna)

Każda karta zawiera:
- Nazwa linii/hotelu
- Cena (orientacyjna)
- Kluczowe szczegóły (godziny, ocena, lokalizacja)
- Przycisk **"Rezerwuj →"** jako deep link

### Deep linki

| Serwis | Format |
|--------|--------|
| Ryanair | `https://www.ryanair.com/pl/pl/booking/home/{from}/{to}/{date}/1/0/0/0` |
| Google Flights | `https://www.google.com/travel/flights?q=loty+{from}+{to}+{date}` |
| Booking.com | `https://www.booking.com/searchresults.pl.html?ss={city}&checkin={date}` |
| Skyscanner | `https://www.skyscanner.pl/transport/loty/{from}/{to}/{date}/` |

Agent w odpowiedzi zwraca dane w formacie JSON (rozszerzenie obecnego `TravelResponse`) z polem `results[]` zawierającym: `name`, `price`, `details`, `bookingUrl`.

---

## Zmiany w istniejącym kodzie

### `src/agent.ts`
Dodać do `TravelResponse`:
```ts
results?: Array<{
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
}>
```

System prompty rozszerzyć o instrukcję zwracania danych w formacie JSON na końcu odpowiedzi (po tekście narracyjnym), np.:
```
<!-- RESULTS_JSON
[{"name":"Ryanair","price":"od 350 PLN","details":"WAW 06:05→DUB 08:00, bezpośredni","bookingUrl":"https://..."}]
-->
```

### `src/api/route.ts`
Parsować `RESULTS_JSON` z odpowiedzi agenta i zwracać w polu `results`.

---

## Rozbudowa — Faza 2 (prawdziwe API)

Struktura `bookingUrl` i `results[]` jest zaprojektowana tak, żeby podmiana deep linków na prawdziwe API (Amadeus, Booking.com Affiliate) wymagała tylko zmiany w `agent.ts` — bez dotykania frontendu.

---

## Czego NIE robimy teraz

- Autentykacja / logowanie użytkowników
- Zapis historii wyszukiwań
- Płatności
- Mapa wyników
- Powiadomienia o zmianie cen
