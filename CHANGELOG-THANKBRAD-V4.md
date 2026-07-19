# ThankBrad V4 — Animation croisée et résumé de compatibilité

## Brad distribue désormais la parole

Quand deux réponses sont différentes, Brad peut choisir quatre manières de poursuivre :

- **Partagé** : les deux répondent.
- **Zoom individuel** : Brad choisit une personne et creuse sa réponse.
- **Réaction croisée** : une personne réagit au point de vue de l’autre.
- **Pont** : les deux cherchent le lien, le compromis ou la différence fondamentale.

Les zooms individuels alternent entre les participants. Une personne non ciblée n’a rien à saisir : elle écoute et la carte se révèle dès que la personne choisie a répondu.

## Résumé final enrichi

Le résumé affiche maintenant un aperçu ludique de la dynamique de la session :

- indice global sur 100 ;
- archétype de la conversation ;
- curiosité mutuelle ;
- ouverture ;
- énergie de l’échange ;
- convergences ;
- accords et contrastes repérés dans les choix structurés ;
- sujet conseillé pour une prochaine session.

Cet indice repose uniquement sur les activités, choix et réactions de la partie. Il n’est ni scientifique, ni psychologique, ni prédictif de la relation.

## Technique

- nouvelles métadonnées `bradFocus` et `bradTargetParticipantId` ;
- réponses à un seul participant prises en charge par le moteur de session ;
- réponses envoyées à Brad avec le prénom correspondant ;
- alternance des participants ciblés ;
- compatibilité avec les anciennes sessions V1 à V3 ;
- 30 tests automatiques.
