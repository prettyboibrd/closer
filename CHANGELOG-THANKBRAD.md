# Passage de Closer à ThankBrad

## Identité

- Application renommée **ThankBrad** dans l'interface, les métadonnées et la documentation.
- IA animatrice renommée **Brad**.
- Client IA renommé de `lib/lia.ts` vers `lib/brad.ts`.

## Modes de jeu

- Ajout du choix **Avec Brad** / **Mode classique** à la création d'une session.
- Mode stocké dans la session et partagé en temps réel avec le second joueur.
- Mode classique sans aucun appel Anthropic.
- Repli automatique vers la sélection classique lorsque Brad est indisponible.

## Variété

- Pas de catégorie identique deux fois de suite lorsqu'une alternative existe.
- Blocage temporaire d'une catégorie utilisée deux fois parmi les six dernières.
- Alternance renforcée des formats.
- Validation locale du choix de Brad : un choix invalide ou trop répétitif est rejeté.
- Contexte transmis à Brad limité aux réponses réellement saisies dans l'application.

## Robustesse

- Protection supplémentaire contre deux clics simultanés sur « Continuer ».
- Migration douce des anciennes clés locales `closer:` vers `thankbrad:`.

## Vérifications

- `npm test` : **29 tests réussis**.
- `npm run build` : **build de production réussi**.
