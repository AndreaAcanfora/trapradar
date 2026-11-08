# Roadmap

Lo stato attuale (v0.1.0) è un MVP funzionante ma volutamente minimale:
poche euristiche testuali ad alta precisione, rilevamento countdown di base,
popup semplice. Le priorità successive, in ordine approssimativo:

## Prossimo (v0.2)

- [ ] Rilevamento "drip pricing" più robusto: confrontare il prezzo mostrato
      nella pagina prodotto con il totale mostrato nell'ultimo step del
      checkout, non solo parole chiave.
- [ ] Riconoscimento visivo dei bottoni accetta/rifiuta asimmetrici (dimensione,
      contrasto colore) come ulteriore segnale di dark pattern, non solo testo.
- [ ] Badge con breakdown per categoria al passaggio del mouse, non solo numero
      totale.
- [ ] Impostazioni popup: attiva/disattiva singole categorie, lista siti
      esclusi.
- [ ] Più lingue nelle euristiche testuali (al momento IT/EN): francese,
      tedesco, spagnolo.

## Dopo (v0.3+)

- [ ] Pacchetto per Chrome Web Store e per addons.mozilla.org (AMO), con
      processo di firma/pubblicazione documentato in CONTRIBUTING.
- [ ] Opzione per esportare un report locale (JSON/CSV) dei pattern trovati su
      un sito, utile per segnalazioni a enti di tutela consumatori.
- [ ] Libreria community di pattern condivisibile (file JSON firmato,
      aggiornabile senza nuova release, sempre scaricato on-demand dall'utente
      e mai eseguito come codice).
- [ ] Modalità "spiegazione estesa" con riferimenti alle normative pertinenti
      (es. Omnibus Directive UE, FTC click-to-cancel) per ogni categoria.

## Esplicitamente fuori scope

- Blocco automatico di elementi della pagina (rischio di rompere siti
  legittimi): l'estensione segnala, non modifica il DOM per l'utente.
- Qualsiasi invio di dati di navigazione a un server, anche aggregato o
  anonimizzato: l'approccio "zero rete" è un vincolo di prodotto, non solo
  tecnico.
