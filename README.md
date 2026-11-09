# TrapRadar

Estensione browser open source (Manifest V3, Chrome + Firefox) che segnala in
tempo reale i **dark pattern** più comuni mentre navighi: abbonamenti nascosti,
costi aggiunti al checkout, countdown potenzialmente ingannevoli,
confirmshaming, caselle pre-selezionate e procedure di disdetta complicate.

**Tutta l'analisi è locale.** Nessun dato della pagina, nessuna cronologia e
nessun URL vengono inviati a un server: l'estensione non fa alcuna chiamata di
rete e non richiede un account.

## Come funziona

Un content script scansiona il testo visibile e i controlli del modulo della
pagina corrente con un piccolo motore di euristiche basato su espressioni
regolari (`extension/src/patterns.js`). Per i countdown, l'estensione salva in
`chrome.storage.local` (solo sul tuo dispositivo) la prima scadenza vista per
quel timer: se alla visita successiva il tempo rimanente è rimasto
sostanzialmente invariato, segnala che il countdown probabilmente non è reale.

I risultati sono raggruppati per categoria e mostrati nel popup con una
spiegazione in linguaggio semplice del perché quel pattern è stato segnalato.

## Categorie rilevate (v0.1)

| Categoria | Cosa cerca |
|---|---|
| Abbonamento nascosto | Linguaggio di rinnovo/addebito automatico dopo una prova |
| Costo aggiunto al checkout | Voci come "contributo spese", "service fee", "booking fee" |
| Countdown / scarsità sospetta | Timer che non avanzano tra una visita e l'altra, messaggi di scorte limitate |
| Confirmshaming | Link di rifiuto con testo colpevolizzante |
| Caselle pre-selezionate | Checkbox già spuntate legate ad abbonamenti/marketing/assicurazioni |
| Difficile disdire | Testo che descrive una disdetta solo telefonica/postale |

Vedi [`extension/src/patterns.js`](extension/src/patterns.js) per le regex
esatte: sono deliberatamente conservative (poche falsi positivi) per questa
prima versione.

## Installazione in sviluppo

### Chrome / Edge / Brave

1. Apri `chrome://extensions`.
2. Attiva "Modalità sviluppatore".
3. Clicca "Carica estensione non pacchettizzata" e seleziona la cartella
   `extension/`.

### Firefox

1. Apri `about:debugging#/runtime/this-firefox`.
2. Clicca "Carica componente aggiuntivo temporaneo…".
3. Seleziona il file `extension/manifest.json`.

(Il componente temporaneo viene rimosso alla chiusura di Firefox; per un
caricamento persistente in sviluppo usa un Firefox Developer Edition con
`xpinstall.signatures.required` disattivato, oppure `web-ext run`.)

## Sviluppo

Nessuna build richiesta: è JavaScript vanilla, nessuna dipendenza esterna.

```bash
# Creare lo .zip per gli store (dist/trapradar-<versione>.zip)
scripts/package.sh

# Rigenerare le icone (richiede Pillow: pip install pillow)
python3 scripts/gen_icons.py

# Eseguire i test del motore di euristiche
cd extension && node tests/patterns.test.js
```

Struttura del repository:

```
extension/
  manifest.json       # Manifest V3, compatibile Chrome e Firefox
  src/
    patterns.js       # motore di euristiche (condiviso content script + popup)
    content.js         # scansione DOM, rilevamento countdown, messaggistica
    background.js      # aggiorna solo il badge della toolbar
  popup/                # interfaccia utente del popup
  icons/
  tests/
    patterns.test.js   # test delle euristiche (node, nessuna dipendenza)
scripts/
  gen_icons.py          # generazione icone programmatica
  package.sh            # zip per addons.mozilla.org e Chrome Web Store
store/                  # testi e metadati per gli store
```

## Privacy

Informativa completa: [PRIVACY.md](PRIVACY.md).

- Nessuna chiamata di rete nel codice dell'estensione.
- Nessun server, nessun account, nessuna telemetria.
- Il solo dato persistito è la scadenza osservata dei countdown, salvata in
  `chrome.storage.local` (locale al dispositivo) e mai sincronizzata altrove.

## Contribuire

Le pull request sono benvenute, in particolare per:
- nuove euristiche testuali (con test in `tests/patterns.test.js`);
- traduzioni delle etichette/spiegazioni del popup in altre lingue;
- segnalazioni di falsi positivi/negativi su siti reali (senza includere dati
  personali o di pagamento negli esempi).

Vedi [ROADMAP.md](ROADMAP.md) per le prossime priorità.

## Licenza

[MIT](LICENSE).
