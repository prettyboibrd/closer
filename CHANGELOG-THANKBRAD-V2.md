# ThankBrad V2 — Brad plus pertinent

## Pourquoi cette version

La V1 de Brad choisissait uniquement une question déjà écrite dans le catalogue. Elle ne pouvait donc pas créer un vrai rebond personnalisé. De plus, quand les joueurs répondaient seulement à voix haute sans écrire de note, Brad ne disposait d'aucun contenu précis à exploiter.

## Changements

- Brad peut maintenant créer une question ponctuelle adaptée aux réponses notées.
- Les joueurs peuvent orienter la suite : **Creuser**, **Changer**, ou **Surprise**.
- En l'absence de choix, Brad gère automatiquement le rythme.
- Deux rebonds consécutifs sont bloqués : après avoir creusé un sujet, Brad doit pivoter.
- Les pivots et surprises doivent changer de catégorie et éviter les thèmes surexploités.
- Brad utilise aussi les choix structurés et les réactions pour comprendre l'ambiance.
- Les questions générées sont validées localement avant d'être ajoutées à la session.
- En cas d'erreur API ou de réponse invalide, le moteur classique prend immédiatement le relais.
- Une transition courte de Brad peut apparaître avant la prochaine question.
- Les questions personnalisées sont signalées dans l'interface.
- Le champ de note explique mieux qu'une phrase ou quelques mots permettent un meilleur rebond.

## Confidentialité

Brad n'écoute jamais le microphone. Il reçoit uniquement les réponses saisies, les choix effectués et les réactions dans l'application.

## Vérifications

- 31 tests réussis.
- Build Next.js de production réussi.
- 0 vulnérabilité détectée lors de l'installation des dépendances.
