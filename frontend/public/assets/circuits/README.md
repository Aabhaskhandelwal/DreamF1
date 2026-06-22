# Circuit diagram images

Drop detailed circuit map images here to upgrade the Telemetry → Circuit tab
from the GPS glow-line fallback to a full diagram (sectors, turn numbers, DRS
zones, speed trap — like the official F1 circuit graphics).

## Naming

Name each file by its **circuit key** with any of these extensions (tried in
order): `.avif`, `.png`, `.webp`, `.jpg`.

| Grand Prix | Filename |
|---|---|
| Australia | `Australia.*` |
| Bahrain | `Bahrain.*` |
| Saudi Arabia | `SaudiArabia.*` |
| Japan | `Japan.*` |
| China | `China.*` |
| Monaco | `Monaco.*` |
| Spain | `Spain.*` |
| Canada | `Canada.*` |
| Austria | `Austria.*` |
| Great Britain | `UnitedKingdom.*` |
| Hungary | `Hungary.*` |
| Belgium | `Belgium.*` |
| Netherlands | `Netherlands.*` |
| Azerbaijan | `Azerbaijan.*` |
| Singapore | `Singapore.*` |
| Mexico | `Mexico.*` |
| Brazil | `Brazil.*` |
| Qatar | `Qatar.*` |
| Abu Dhabi | `UnitedArabEmirates.*` |
| United States (Austin) | `UnitedStates.*` |
| Miami | `Miami.*` |
| Las Vegas | `LasVegas.*` |
| Italy (Monza) | `Italy.*` |
| Emilia-Romagna (Imola) | `Imola.*` |

Keys are defined in `frontend/lib/circuits.ts`. Any circuit without an image
keeps the GPS telemetry glow-map automatically — nothing breaks if a file is
missing.
