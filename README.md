# ThankBrad 💬

**Des conversations dont on se souvient.**

ThankBrad est une web app mobile-first où deux personnes rejoignent la même session grâce à un code à six caractères ou un QR code. Elles apprennent à se connaître au travers de questions, choix secrets, prédictions, classements, missions et mini-jeux.

## Deux façons de jouer

### Avec Brad

Brad utilise uniquement les réponses saisies ou sélectionnées dans ThankBrad. Il n’écoute jamais la conversation orale. Il peut créer une question adaptée, rebondir une fois sur un détail utile, puis changer d’angle ou de sujet selon les réglages des joueurs.

### Mode classique

Aucun appel à Anthropic et aucune IA. Le moteur local respecte les mêmes contextes, sujets, intensités, points, réactions et règles de variété.

## V4 : Brad anime réellement la différence

Quand deux réponses divergent, Brad peut maintenant donner la parole à une seule personne, demander une réaction croisée ou faire chercher un pont entre les deux réponses. Les zooms alternent entre les participants et la personne non ciblée écoute sans devoir valider une réponse vide.

Le résumé final propose aussi un aperçu ludique de la dynamique : score de session, curiosité, ouverture, énergie, convergences, accords, contrastes et prochain sujet conseillé. Il ne s’agit pas d’un diagnostic ni d’une mesure scientifique.

## V3 : contexte, sujets et intensité

À la création de la session, l’hôte choisit :

- le contexte : premier rendez-vous, couple, amis, nouvelle rencontre ou surprise ;
- les sujets autorisés ;
- l’intensité maximale de 1 à 4 pour chaque sujet ;
- le mode Avec Brad ou Mode classique.

Sujets disponibles : léger, humour, voyages, souvenirs, personnalité, valeurs, philosophie, émotions, rêves, relations, intimité et sexualité 18+.

Pendant la partie, les joueurs peuvent choisir un sujet précis ou revenir au mix automatique. Le changement est synchronisé entre les deux appareils.

## Sexualité 18+

La sexualité est verrouillée par défaut. Pour l’ouvrir :

1. une personne demande ce sujet pendant la partie ;
2. chacun confirme séparément avoir au moins 18 ans ;
3. chacun choisit secrètement son niveau maximal ;
4. ThankBrad utilise le niveau le plus bas accepté sans révéler qui l’a choisi.

Les quatre niveaux sont : Suggestif, Intime, Explicite et Très explicite. Aucune mission sexuelle n’est proposée : il s’agit uniquement de questions à discuter, avec consentement, possibilité de passer et changement de sujet permanent.

## Fonctionnalités

- création et entrée dans une session ;
- code, lien et QR code ;
- exactement deux participants ;
- synchronisation temps réel via Supabase ;
- repli local via `localStorage` et `BroadcastChannel` ;
- huit formats d’activités ;
- 12 sujets avec intensité individuelle ;
- contexte réellement pris en compte ;
- réponses secrètes et révélation simultanée ;
- réactions, points de connexion et résumé de dynamique ;
- zoom individuel, réaction croisée et question de rapprochement ;
- présence et reconnexion ;
- protection contre les actions simultanées ;
- 281 activités dans le catalogue.

## Stack

- Next.js 16, App Router
- React 19
- TypeScript strict
- Tailwind CSS 4
- Framer Motion
- Supabase Realtime
- API Anthropic pour Brad
- Vitest

## Installation locale

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Variables d’environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

`ANTHROPIC_API_KEY` reste côté serveur. Le mode classique fonctionne sans cette clé.

## Vérification

```bash
npm test
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

État V4 : **30 tests réussis**, **TypeScript strict réussi**, **build de production réussi**, **0 vulnérabilité détectée**.

## Déploiement

```bash
git add .
git commit -m "ThankBrad V4: animation croisee et compatibilite"
git push
```

Vercel redéploie automatiquement. Les variables Supabase et Anthropic déjà présentes dans Vercel ne doivent pas être recréées.

## Compatibilité

Les anciennes sessions V1, V2 et V3 restent lisibles. Les nouvelles métadonnées d’animation sont facultatives et les anciennes cartes continuent de demander une réponse aux deux personnes.
