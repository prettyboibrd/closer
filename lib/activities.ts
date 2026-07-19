import type { Activity, ActivityType, Category, SessionActivity, SessionMode, Topic } from "./types";

// Helper to reduce boilerplate while keeping strict typing.
let counter = 0;
function a(
  type: ActivityType,
  category: Category,
  depthLevel: 1 | 2 | 3 | 4,
  title: string,
  prompt: string,
  options: string[] | null = null,
  durationSeconds: number | null = null,
  tags: string[] = [],
  topic?: Topic,
  contexts?: SessionMode[]
): Activity {
  counter += 1;
  return {
    id: `act_${String(counter).padStart(3, "0")}`,
    type,
    title,
    prompt,
    category,
    topic,
    depthLevel,
    durationSeconds,
    options,
    tags,
    active: true,
    contexts,
  };
}

const RANK_OPTIONS = ["Liberté", "Stabilité", "Amour", "Réussite", "Aventure"];
const MOI_AUTRE = ["Moi", "L'autre"];

export const ACTIVITIES: Activity[] = [
  // ---------- NIVEAU 1 — BRISE-GLACE ----------
  a("open_question", "leger", 1, "Petit plaisir", "Quel petit plaisir améliore toujours ta journée ?", null, null, ["quotidien"]),
  a("open_question", "leger", 1, "Réveil", "Es-tu plutôt du matin ou plutôt du soir ?"),
  a("open_question", "leger", 1, "Boisson", "Quelle est la première boisson que tu prends le matin ?"),
  a("secret_choice", "leger", 1, "Sucré ou salé", "Au petit-déjeuner, tu choisis quoi ?", ["Sucré", "Salé"]),
  a("secret_choice", "leger", 1, "Mer ou montagne", "Pour des vacances, tu préfères…", ["La mer", "La montagne"]),
  a("secret_choice", "leger", 1, "Chat ou chien", "Team…", ["Chat", "Chien"]),
  a("who_of_us", "drole", 1, "Coup de tête", "Qui de vous deux réserverait un voyage sur un coup de tête ?", MOI_AUTRE),
  a("who_of_us", "drole", 1, "En retard", "Qui de vous deux arrive le plus souvent en retard ?", MOI_AUTRE),
  a("who_of_us", "drole", 1, "Playlist", "Qui de vous deux a la playlist la plus étrange ?", MOI_AUTRE),
  a("who_of_us", "drole", 1, "Chef cuisine", "Qui de vous deux cuisine le mieux ?", MOI_AUTRE),
  a("guess_my_answer", "voyages", 1, "Pays de rêve", "Quel pays l'autre rêve-t-il de visiter ?"),
  a("guess_my_answer", "leger", 1, "Dessert préféré", "Quel est le dessert préféré de l'autre, à ton avis ?"),
  a("estimation", "leger", 1, "Paris–New York", "Combien de kilomètres séparent Paris de New York ?", null, null, ["distance"]),
  a("estimation", "drole", 1, "Cafés par jour", "Combien de cafés un adulte français boit-il en moyenne par jour ?"),
  a("complete_sentence", "leger", 1, "Week-end parfait", "Un week-end parfait pour moi commence par…"),
  a("complete_sentence", "drole", 1, "Rire garanti", "Ce qui me fait toujours rire, c'est…"),
  a("mission", "leger", 1, "Points communs", "Trouvez trois choses que vous avez en commun.", null, 60, ["chrono"]),
  a("open_question", "drole", 1, "Talent caché", "Quel est ton petit talent inutile mais amusant ?"),
  a("open_question", "leger", 1, "Chanson du moment", "Quelle chanson as-tu écoutée en boucle récemment ?"),
  a("secret_choice", "drole", 1, "Super-pouvoir", "Tu préfères pouvoir…", ["Voler", "Être invisible"]),
  a("secret_choice", "leger", 1, "Thé ou café", "Ta boisson chaude, c'est…", ["Thé", "Café"]),
  a("who_of_us", "leger", 1, "Photos", "Qui de vous deux prend le plus de photos ?", MOI_AUTRE),
  a("guess_my_answer", "drole", 1, "Série récente", "Quelle série l'autre a-t-il regardée en dernier ?"),
  a("estimation", "voyages", 1, "Pays du monde", "Combien de pays y a-t-il dans le monde environ ?"),
  a("complete_sentence", "leger", 1, "Journée idéale", "Ma journée idéale se termine par…"),
  a("open_question", "leger", 1, "Saison préférée", "Quelle est ta saison préférée et pourquoi ?"),
  a("mission", "drole", 1, "Fous rires", "Racontez chacun un souvenir qui vous fait encore rire.", null, 90, ["chrono"]),
  a("secret_choice", "leger", 1, "Ville ou campagne", "Pour vivre, tu choisis…", ["La ville", "La campagne"]),
  a("who_of_us", "drole", 1, "Karaoké", "Qui de vous deux se lancerait au karaoké en premier ?", MOI_AUTRE),

  // ---------- NIVEAU 2 — DÉCOUVERTE ----------
  a("open_question", "voyages", 2, "Voyage marquant", "Quel voyage t'a le plus marqué et pourquoi ?"),
  a("open_question", "personnalite", 2, "Recharge", "Comment recharges-tu tes batteries après une semaine chargée ?"),
  a("open_question", "souvenirs", 2, "Enfance", "Quel souvenir d'enfance te fait encore sourire ?"),
  a("secret_choice", "personnalite", 2, "Stable ou aventure", "Préférerais-tu une vie très stable ou une vie pleine d'aventures ?", ["Vie stable", "Vie d'aventures"]),
  a("secret_choice", "personnalite", 2, "Planifier ou improviser", "Face à un week-end libre, tu préfères…", ["Tout planifier", "Improviser"]),
  a("secret_choice", "valeurs", 2, "Solo ou groupe", "Tu te ressources plutôt…", ["Seul·e", "Entouré·e"]),
  a("who_of_us", "personnalite", 2, "Décideur", "Qui de vous deux prend les décisions le plus vite ?", MOI_AUTRE),
  a("who_of_us", "voyages", 2, "Organisateur", "Qui de vous deux organiserait le mieux un voyage ?", MOI_AUTRE),
  a("who_of_us", "personnalite", 2, "Optimiste", "Qui de vous deux voit le verre à moitié plein ?", MOI_AUTRE),
  a("guess_my_answer", "personnalite", 2, "Idéal détente", "Quelle est l'activité détente préférée de l'autre ?"),
  a("guess_my_answer", "voyages", 2, "Prochaine destination", "Où l'autre partirait-il demain si c'était gratuit ?"),
  a("guess_my_answer", "souvenirs", 2, "Meilleure année", "Quelle a été la meilleure année de l'autre, selon toi ?"),
  a("ranking", "valeurs", 2, "Ce qui compte", "Classe ces valeurs selon leur importance pour toi.", RANK_OPTIONS),
  a("complete_sentence", "personnalite", 2, "Je suis à l'aise", "Je me sens vraiment à l'aise quand…"),
  a("complete_sentence", "reves", 2, "Si j'osais", "Si j'osais davantage, je…"),
  a("mission", "souvenirs", 2, "Trois lieux", "Nommez chacun trois lieux qui ont compté pour vous.", null, 90, ["chrono"]),
  a("estimation", "voyages", 2, "Tour Eiffel", "En quelle année la Tour Eiffel a-t-elle été inaugurée ?"),
  a("estimation", "personnalite", 2, "Heures de sommeil", "Combien d'heures dort en moyenne un adulte par nuit ?"),
  a("open_question", "voyages", 2, "Culture", "Quelle culture ou pays aimerais-tu mieux comprendre ?"),
  a("open_question", "personnalite", 2, "Fierté récente", "De quoi es-tu fier·e récemment, même d'une petite chose ?"),
  a("secret_choice", "personnalite", 2, "Livre ou film", "Pour une soirée calme, tu choisis…", ["Un livre", "Un film"]),
  a("who_of_us", "souvenirs", 2, "Nostalgique", "Qui de vous deux est le plus nostalgique ?", MOI_AUTRE),
  a("guess_my_answer", "personnalite", 2, "Petit bonheur", "Quel petit bonheur rend l'autre heureux à coup sûr ?"),
  a("ranking", "personnalite", 2, "Priorités semaine", "Classe ces valeurs comme tu les vis cette semaine.", RANK_OPTIONS),
  a("complete_sentence", "voyages", 2, "En voyage", "En voyage, je ne peux pas me passer de…"),
  a("mission", "personnalite", 2, "Points communs cachés", "Trouvez un point commun surprenant que vous ignoriez.", null, 60, ["chrono"]),
  a("open_question", "souvenirs", 2, "Odeur", "Quelle odeur te ramène instantanément à un souvenir ?"),
  a("secret_choice", "reves", 2, "Grand ou petit", "Tes rêves ressemblent plutôt à…", ["Un grand projet unique", "Plein de petits projets"]),
  a("who_of_us", "personnalite", 2, "Curieux", "Qui de vous deux pose le plus de questions ?", MOI_AUTRE),
  a("guess_my_answer", "souvenirs", 2, "Souvenir marquant", "Quel souvenir l'autre citerait comme marquant ?"),

  // ---------- NIVEAU 3 — CONNEXION ----------
  a("open_question", "relations", 3, "Amitié durable", "Qu'est-ce qui rend une amitié durable selon toi ?"),
  a("open_question", "valeurs", 3, "Non négociable", "Quelle est une valeur non négociable pour toi ?"),
  a("open_question", "personnalite", 3, "Évolution", "En quoi as-tu le plus changé ces dernières années ?"),
  a("secret_choice", "valeurs", 3, "Cœur ou raison", "Pour les grandes décisions, tu écoutes surtout…", ["Ton cœur", "Ta raison"]),
  a("secret_choice", "relations", 3, "Parler ou écouter", "Dans une relation, tu es plutôt…", ["Celui qui parle", "Celui qui écoute"]),
  a("secret_choice", "valeurs", 3, "Réussite", "La réussite, c'est d'abord…", ["Être serein", "Accomplir de grandes choses"]),
  a("who_of_us", "relations", 3, "Réconciliation", "Qui de vous deux fait le premier pas après un désaccord ?", MOI_AUTRE),
  a("who_of_us", "personnalite", 3, "Émotions", "Qui de vous deux exprime le plus facilement ses émotions ?", MOI_AUTRE),
  a("guess_my_answer", "valeurs", 3, "Fierté profonde", "De quoi l'autre est-il le plus fier dans sa vie ?"),
  a("guess_my_answer", "relations", 3, "Qualité aimée", "Quelle qualité l'autre valorise-t-il le plus chez ses proches ?"),
  a("ranking", "valeurs", 3, "Vraies priorités", "Classe ces valeurs telles qu'elles guident vraiment tes choix.", RANK_OPTIONS),
  a("complete_sentence", "personnalite", 3, "Je me sens libre", "Je me sens vraiment libre quand…"),
  a("complete_sentence", "relations", 3, "Confiance", "Je fais confiance à quelqu'un quand…"),
  a("complete_sentence", "valeurs", 3, "Ce qui me tient", "Ce qui me tient debout dans les moments durs, c'est…"),
  a("mission", "relations", 3, "Gratitude", "Dites-vous chacun une chose que vous appréciez chez l'autre.", null, 60, ["chrono"]),
  a("open_question", "reves", 3, "Rêve mis de côté", "Quel rêve as-tu mis de côté et aimerais raviver ?"),
  a("open_question", "personnalite", 3, "Peur douce", "Quelle petite peur aimerais-tu dépasser ?"),
  a("secret_choice", "reves", 3, "Impact ou liberté", "Tu rêves surtout de…", ["Avoir un impact", "Être totalement libre"]),
  a("who_of_us", "valeurs", 3, "Idéaliste", "Qui de vous deux est le plus idéaliste ?", MOI_AUTRE),
  a("guess_my_answer", "reves", 3, "Vie idéale", "À quoi ressemble la vie idéale de l'autre dans 5 ans ?"),
  a("ranking", "reves", 3, "Ce qui te porte", "Classe ces valeurs selon ce qui te porte vers l'avenir.", RANK_OPTIONS),
  a("complete_sentence", "reves", 3, "Un jour", "Un jour, j'aimerais vraiment…"),
  a("mission", "souvenirs", 3, "Moment fondateur", "Partagez chacun un moment qui vous a façonné.", null, 120, ["chrono"]),
  a("open_question", "relations", 3, "Soutien", "Comment aimes-tu être soutenu quand ça ne va pas ?"),
  a("secret_choice", "personnalite", 3, "Changer ou accepter", "Face à un défaut, tu préfères…", ["Le travailler", "L'accepter"]),
  a("who_of_us", "relations", 3, "Attentionné", "Qui de vous deux pense le plus aux petites attentions ?", MOI_AUTRE),
  a("guess_my_answer", "personnalite", 3, "Recharge secrète", "Qu'est-ce qui redonne vraiment de l'énergie à l'autre ?"),

  // ---------- NIVEAU 4 — PROFOND ----------
  a("open_question", "profond", 4, "Sens", "Qu'est-ce qui donne du sens à ta vie en ce moment ?"),
  a("open_question", "profond", 4, "Leçon", "Quelle leçon importante la vie t'a-t-elle apprise ?"),
  a("open_question", "profond", 4, "Version future", "Que dirais-tu à la personne que tu seras dans dix ans ?"),
  a("secret_choice", "profond", 4, "Regret ou peur", "Ce qui te freine le plus, c'est plutôt…", ["La peur de l'échec", "La peur de regretter"]),
  a("secret_choice", "profond", 4, "Traces", "Tu aimerais laisser surtout…", ["Des souvenirs", "Un impact durable"]),
  a("who_of_us", "profond", 4, "Introspectif", "Qui de vous deux réfléchit le plus au sens des choses ?", MOI_AUTRE),
  a("guess_my_answer", "profond", 4, "Ce qui compte", "Qu'est-ce qui compte le plus pour l'autre, au fond ?"),
  a("complete_sentence", "profond", 4, "Au fond de moi", "Au fond de moi, j'ai besoin de…"),
  a("complete_sentence", "profond", 4, "Fier de devenir", "La personne que je deviens me rend fier·e parce que…"),
  a("complete_sentence", "profond", 4, "Ce que je cherche", "Ce que je cherche vraiment dans la vie, c'est…"),
  a("mission", "profond", 4, "Reconnaissance", "Dites-vous chacun ce que cette conversation vous a appris.", null, 90, ["chrono"]),
  a("open_question", "profond", 4, "Bonheur", "C'est quoi, une vie réussie, pour toi ?"),
  a("open_question", "profond", 4, "Vulnérabilité", "Quand t'es-tu senti·e le plus vivant·e récemment ?"),
  a("secret_choice", "profond", 4, "Temps ou sécurité", "Si tu devais choisir…", ["Plus de temps libre", "Plus de sécurité"]),
  a("who_of_us", "profond", 4, "Courageux", "Qui de vous deux a fait le choix le plus courageux ?", MOI_AUTRE),
  a("guess_my_answer", "profond", 4, "Rêve secret", "Quel rêve l'autre n'ose presque jamais dire à voix haute ?"),
  a("ranking", "profond", 4, "Au fond", "Classe ces valeurs telles qu'elles comptent au plus profond.", RANK_OPTIONS),
  a("complete_sentence", "relations", 4, "Être aimé", "Je me sens vraiment aimé·e quand…"),
  a("mission", "profond", 4, "Un souhait", "Formulez chacun un souhait sincère pour l'autre.", null, 60, ["chrono"]),
  a("open_question", "profond", 4, "Pardon", "Qu'as-tu appris à te pardonner ?"),
  a("secret_choice", "profond", 4, "Racines ou ailes", "Tu as le plus besoin de…", ["Racines", "Ailes"]),
  a("guess_my_answer", "profond", 4, "Plus grande force", "Quelle est la plus grande force de l'autre, selon toi ?"),

  // ---------- Compléments pour varier (niveaux 1-2) ----------
  a("open_question", "drole", 1, "Objet inutile", "Quel objet inutile possèdes-tu et adores-tu ?"),
  a("secret_choice", "drole", 1, "Pizza ou burger", "Repas plaisir, tu choisis…", ["Pizza", "Burger"]),
  a("who_of_us", "leger", 1, "Dormeur", "Qui de vous deux pourrait dormir n'importe où ?", MOI_AUTRE),
  a("estimation", "drole", 1, "Émojis", "Combien d'émojis existe-t-il environ dans le clavier standard ?"),
  a("complete_sentence", "drole", 1, "Bonne humeur", "Rien ne me met de meilleure humeur que…"),
  a("open_question", "voyages", 2, "Ville coup de cœur", "Quelle ville t'a donné envie d'y rester pour toujours ?"),
  a("guess_my_answer", "leger", 1, "Plat réconfort", "Quel plat réconforte l'autre à tous les coups ?"),
  a("secret_choice", "voyages", 2, "Road trip ou farniente", "Type de vacances idéal…", ["Road trip", "Farniente"]),
  a("who_of_us", "voyages", 2, "Aventurier", "Qui de vous deux testerait la nourriture la plus étrange en voyage ?", MOI_AUTRE),
  a("complete_sentence", "souvenirs", 2, "Ça me manque", "Une chose de mon passé qui me manque, c'est…"),
  a("open_question", "personnalite", 2, "Compliment", "Quel compliment te touche le plus ?"),
  a("secret_choice", "valeurs", 2, "Donner ou recevoir", "Tu es plus à l'aise pour…", ["Donner", "Recevoir"]),
  a("estimation", "leger", 2, "Battements de cœur", "Combien de fois le cœur bat-il en moyenne par minute au repos ?"),
  a("mission", "drole", 1, "Imitations", "Décrivez chacun votre journée d'hier en une seule phrase drôle.", null, 45, ["chrono"]),
  a("open_question", "reves", 2, "Talent rêvé", "Quel talent aimerais-tu maîtriser d'un claquement de doigts ?"),
  a("who_of_us", "drole", 1, "Séries", "Qui de vous deux enchaîne le plus d'épisodes d'affilée ?", MOI_AUTRE),
  a("guess_my_answer", "voyages", 2, "Souvenir de voyage", "Quel voyage l'autre garde-t-il en meilleur souvenir ?"),
  a("complete_sentence", "personnalite", 2, "Petit rituel", "Mon petit rituel qui me fait du bien, c'est…"),
  a("secret_choice", "reves", 2, "Ville ou nature", "Ta vie idéale se déroule plutôt…", ["En pleine ville", "En pleine nature"]),
  a("open_question", "relations", 3, "Belle rencontre", "Quelle rencontre a changé quelque chose pour toi ?"),
  a("guess_my_answer", "relations", 3, "Langage d'amour", "Comment l'autre préfère-t-il recevoir de l'affection ?"),
  a("secret_choice", "relations", 3, "Proche ou large", "Tu préfères…", ["Peu d'amis très proches", "Beaucoup de relations"]),
  a("complete_sentence", "valeurs", 3, "Je refuse", "Je ne suis jamais prêt·e à sacrifier…"),
  a("who_of_us", "profond", 4, "Sage", "Qui de vous deux donne les meilleurs conseils ?", MOI_AUTRE),
  a("open_question", "souvenirs", 2, "Première fois", "Raconte une première fois dont tu es fier·e."),
  a("estimation", "voyages", 2, "Langues", "Combien de langues parle-t-on environ dans le monde ?"),
  a("secret_choice", "personnalite", 2, "Routine ou nouveauté", "Tu te sens mieux avec…", ["Une routine rassurante", "De la nouveauté"]),
  a("complete_sentence", "reves", 3, "Si le temps", "Si j'avais tout le temps du monde, je…"),
  a("open_question", "drole", 1, "Mauvais goût", "Quel plaisir coupable assumes-tu totalement ?"),
  a("guess_my_answer", "personnalite", 2, "Trait dominant", "Quel trait de caractère décrit le mieux l'autre ?"),
  a("mission", "valeurs", 3, "Merci", "Remerciez-vous chacun pour une qualité précise de l'autre.", null, 60, ["chrono"]),
  a("open_question", "profond", 4, "Héritage", "Qu'aimerais-tu transmettre aux personnes que tu aimes ?"),
  a("secret_choice", "profond", 4, "Comprendre ou ressentir", "Face au monde, tu cherches surtout à…", ["Le comprendre", "Le ressentir"]),
  a("complete_sentence", "profond", 4, "Ma paix", "Je trouve la paix quand…"),

  // ============================================================
  //  EXTENSION DU CATALOGUE — chaque catégorie avec sa propre voix
  // ============================================================

  // ---------- LÉGER (niveau 1) — simple, quotidien, doux ----------
  a("open_question", "leger", 1, "Réconfort", "Quel plat te réconforte à tous les coups ?"),
  a("open_question", "leger", 1, "Petit luxe", "C'est quoi, ton petit luxe du quotidien ?"),
  a("secret_choice", "leger", 1, "Douche", "Douche plutôt…", ["Le matin", "Le soir"]),
  a("secret_choice", "leger", 1, "Sonnerie", "Le réveil, tu es plutôt…", ["Première sonnerie", "Snooze x5"]),
  a("secret_choice", "leger", 1, "Pizza", "La pizza à l'ananas, c'est…", ["Oui, assume", "Non, jamais"]),
  a("who_of_us", "leger", 1, "Ranger", "Qui de vous deux est le plus ordonné ?", ["Moi", "L'autre"]),
  a("who_of_us", "leger", 1, "Perdu", "Qui de vous deux se perd le plus facilement ?", ["Moi", "L'autre"]),
  a("complete_sentence", "leger", 1, "Le matin", "Ma journée démarre bien quand…"),
  a("estimation", "leger", 1, "Sommeil idéal", "Selon toi, combien d'heures de sommeil sont idéales par nuit ?"),
  a("open_question", "leger", 1, "Guilty pleasure", "Quelle émission ou musique tu adores en cachette ?"),

  // ---------- DRÔLE (niveau 1) — punchy, complice, rires ----------
  a("open_question", "drole", 1, "Surnom gênant", "Quel surnom ridicule on t'a déjà donné ?"),
  a("open_question", "drole", 1, "Honte", "Raconte un moment gênant dont tu ris aujourd'hui."),
  a("who_of_us", "drole", 1, "Danse", "Qui de vous deux se lâcherait le plus sur la piste ?", ["Moi", "L'autre"]),
  a("who_of_us", "drole", 1, "Pleurer film", "Qui de vous deux pleure devant les films ?", ["Moi", "L'autre"]),
  a("who_of_us", "drole", 1, "Ronfler", "Qui de vous deux ronflerait le plus fort ?", ["Moi", "L'autre"]),
  a("secret_choice", "drole", 1, "Zombie", "Apocalypse zombie : tu es…", ["Le stratège", "Le premier mangé"]),
  a("secret_choice", "drole", 1, "Talent", "Ton super-pouvoir inutile idéal…", ["Parler aux pigeons", "Plier la pizza par la pensée"]),
  a("complete_sentence", "drole", 1, "Panique", "Je perds tous mes moyens quand…"),
  a("complete_sentence", "drole", 1, "Fierté absurde", "Je suis bizarrement fier·e de…"),
  a("mission", "drole", 1, "Grimaces", "Faites chacun votre pire grimace. L'autre note sur 10.", null, 30, ["chrono"]),
  a("mission", "drole", 1, "Accent", "Racontez votre matinée avec un accent au choix.", null, 45, ["chrono"]),
  a("estimation", "drole", 1, "Selfies", "Combien de selfies sont pris dans le monde chaque jour, à ton avis ? (millions)"),

  // ---------- VOYAGES — évocateur, ça fait rêver ----------
  a("open_question", "voyages", 1, "Prochaine évasion", "Si tu partais demain, ce serait où ?"),
  a("open_question", "voyages", 2, "Coup de cœur", "Quel endroit t'a coupé le souffle ?"),
  a("open_question", "voyages", 2, "Voyage rêvé", "Quel voyage tu n'as pas encore osé faire ?"),
  a("secret_choice", "voyages", 1, "Bagage", "En voyage, tu es plutôt…", ["Valise minimaliste", "J'emporte tout"]),
  a("secret_choice", "voyages", 2, "Rythme", "Ton voyage idéal…", ["Tout voir, bouger", "Se poser, savourer"]),
  a("who_of_us", "voyages", 2, "Guide", "Qui de vous deux ferait le meilleur guide ?", ["Moi", "L'autre"]),
  a("guess_my_answer", "voyages", 2, "Destination secrète", "Quel pays l'autre rêve de visiter en secret ?"),
  a("complete_sentence", "voyages", 2, "L'ailleurs", "Ce que je cherche en voyageant, c'est…"),
  a("open_question", "voyages", 2, "Retour", "Quel endroit te donne toujours envie d'y retourner ?"),
  a("estimation", "voyages", 2, "Fuseaux", "Combien de fuseaux horaires y a-t-il dans le monde ?"),

  // ---------- SOUVENIRS — nostalgique, tendre ----------
  a("open_question", "souvenirs", 1, "Odeur d'enfance", "Quelle odeur te ramène direct en enfance ?"),
  a("open_question", "souvenirs", 2, "Chanson-madeleine", "Quelle chanson te ramène à un moment précis ?"),
  a("open_question", "souvenirs", 2, "Été d'avant", "Décris un été qui t'a marqué."),
  a("open_question", "souvenirs", 2, "Première fierté", "Quel est ton premier vrai souvenir de fierté ?"),
  a("secret_choice", "souvenirs", 2, "Mémoire", "Tu gardes surtout…", ["Les images", "Les émotions"]),
  a("who_of_us", "souvenirs", 2, "Archiviste", "Qui de vous deux garde le plus de souvenirs (photos, objets) ?", ["Moi", "L'autre"]),
  a("guess_my_answer", "souvenirs", 2, "Belle année", "Quelle a été la plus belle année de l'autre, à ton avis ?"),
  a("complete_sentence", "souvenirs", 2, "Ça me manque", "Une époque qui me manque, c'est…"),
  a("complete_sentence", "souvenirs", 3, "Je n'oublierai jamais", "Je n'oublierai jamais le jour où…"),
  a("mission", "souvenirs", 2, "Trois madeleines", "Nommez chacun trois souvenirs qui vous font sourire.", null, 60, ["chrono"]),

  // ---------- PERSONNALITÉ — sincère, révélateur ----------
  a("open_question", "personnalite", 2, "Énergie", "Qu'est-ce qui te redonne de l'énergie à coup sûr ?"),
  a("open_question", "personnalite", 2, "Agacement", "Quel petit truc t'agace plus que de raison ?"),
  a("open_question", "personnalite", 2, "Compliment juste", "Quel compliment te touche vraiment ?"),
  a("open_question", "personnalite", 3, "Évolution", "Sur quoi as-tu le plus grandi ces dernières années ?"),
  a("secret_choice", "personnalite", 2, "Recharge", "Tu recharges tes batteries…", ["Seul·e au calme", "Entouré·e"]),
  a("secret_choice", "personnalite", 2, "Décision", "Tu décides plutôt avec…", ["La tête", "Le ventre"]),
  a("secret_choice", "personnalite", 3, "Zone de confort", "Face à l'inconnu, tu es plutôt…", ["Je fonce", "J'observe d'abord"]),
  a("who_of_us", "personnalite", 2, "Spontané", "Qui de vous deux est le plus spontané ?", ["Moi", "L'autre"]),
  a("who_of_us", "personnalite", 3, "Sensible", "Qui de vous deux ressent les choses le plus fort ?", ["Moi", "L'autre"]),
  a("guess_my_answer", "personnalite", 2, "Recharge de l'autre", "Qu'est-ce qui ressource vraiment l'autre ?"),
  a("guess_my_answer", "personnalite", 3, "Petite peur", "Quelle petite peur l'autre aimerait dépasser ?"),
  a("complete_sentence", "personnalite", 2, "À l'aise", "Je me sens pleinement moi-même quand…"),
  a("complete_sentence", "personnalite", 3, "Ma force", "Ma plus grande force, c'est sans doute…"),
  a("ranking", "personnalite", 2, "Ce qui me porte", "Classe ces valeurs selon ce qui te porte au quotidien.", ["Liberté", "Stabilité", "Amour", "Réussite", "Aventure"]),

  // ---------- VALEURS — profond mais accessible ----------
  a("open_question", "valeurs", 3, "Non négociable", "Quelle est ta valeur non négociable ?"),
  a("open_question", "valeurs", 3, "Admiration", "Quelle qualité admires-tu le plus chez quelqu'un ?"),
  a("open_question", "valeurs", 3, "Réussir", "Ça veut dire quoi, réussir sa vie, pour toi ?"),
  a("who_of_us", "valeurs", 3, "Fidèle aux principes", "Qui de vous deux tient le plus à ses principes ?", ["Moi", "L'autre"]),
  a("complete_sentence", "valeurs", 3, "Debout", "Ce qui me tient debout, c'est…"),
  a("ranking", "valeurs", 3, "Mes priorités", "Classe ces valeurs telles qu'elles guident tes choix.", ["Liberté", "Stabilité", "Amour", "Réussite", "Aventure"]),

  // ---------- RÊVES — chaleureux, un peu vulnérable ----------
  a("open_question", "reves", 2, "Talent rêvé", "Quel talent aimerais-tu avoir d'un claquement de doigts ?"),
  a("open_question", "reves", 3, "Vie idéale", "À quoi ressemblerait une vie qui te comble ?"),
  a("secret_choice", "reves", 2, "Cap", "Tu rêves plutôt de…", ["Un grand projet", "Plein de petites joies"]),
  a("secret_choice", "reves", 3, "Empreinte", "Tu aimerais surtout…", ["Vivre pleinement", "Laisser une trace"]),
  a("who_of_us", "reves", 3, "Rêveur", "Qui de vous deux a les rêves les plus fous ?", ["Moi", "L'autre"]),
  a("guess_my_answer", "reves", 3, "Rêve tu", "Quel rêve l'autre n'ose presque pas dire tout haut ?"),
  a("complete_sentence", "reves", 3, "Si j'osais", "Si je n'avais peur de rien, je…"),
  a("mission", "reves", 3, "Trois envies", "Partagez chacun trois choses à faire avant 5 ans.", null, 60, ["chrono"]),

  // ---------- RELATIONS — tendre, connecté ----------
  a("open_question", "relations", 3, "Amitié", "Qu'est-ce qui rend une amitié précieuse pour toi ?"),
  a("open_question", "relations", 3, "Être soutenu", "Comment aimes-tu qu'on te soutienne quand ça va mal ?"),
  a("open_question", "relations", 3, "Belle rencontre", "Quelle rencontre a changé quelque chose en toi ?"),
  a("secret_choice", "relations", 3, "Dispute", "Après un désaccord, tu es plutôt…", ["Premier pas", "J'ai besoin de temps"]),
  a("mission", "relations", 3, "Gratitude", "Dites-vous chacun une chose sincère que vous appréciez chez l'autre.", null, 60, ["chrono"]),

  // ---------- PROFOND — belles questions, marquantes ----------
  a("open_question", "profond", 4, "Leçon", "Quelle leçon la vie t'a-t-elle apprise à la dure ?"),
  a("open_question", "profond", 4, "Lettre", "Que dirais-tu à toi-même il y a dix ans ?"),
  a("secret_choice", "profond", 4, "Moteur", "Ce qui te pousse le plus, c'est…", ["La peur de rater", "L'envie de créer"]),
  a("who_of_us", "profond", 4, "Courage", "Qui de vous deux a pris la décision la plus courageuse ?", ["Moi", "L'autre"]),
  a("complete_sentence", "profond", 4, "Je cherche", "Ce que je cherche vraiment, c'est…"),
  a("open_question", "profond", 4, "Transmettre", "Qu'aimerais-tu transmettre à ceux que tu aimes ?"),

  // ============================================================
  //  V3 — SUJETS EXPLICITES, CONTEXTE ET INTENSITÉ
  // ============================================================

  // ---------- PHILOSOPHIE ----------
  a("secret_choice", "philosophie", 1, "Chance ou choix", "Ta vie dépend surtout de…", ["La chance", "Tes choix"], null, [], "philosophie"),
  a("open_question", "philosophie", 1, "Règle de vie", "Quelle petite règle de vie te paraît étonnamment vraie ?", null, null, [], "philosophie"),
  a("secret_choice", "philosophie", 2, "Bonheur ou réussite", "Tu préférerais une vie…", ["Heureuse mais discrète", "Impressionnante mais exigeante"], null, [], "philosophie"),
  a("open_question", "philosophie", 2, "Temps", "Si tu pouvais ralentir une seule période de la vie, laquelle choisirais-tu ?", null, null, [], "philosophie"),
  a("open_question", "philosophie", 3, "Vérité difficile", "Quelle vérité sur la vie t'a demandé le plus de temps pour être acceptée ?", null, null, [], "philosophie"),
  a("secret_choice", "philosophie", 3, "Tout savoir", "Tu préfères connaître…", ["La date de ta mort", "La manière dont on se souviendra de toi"], null, [], "philosophie"),
  a("open_question", "philosophie", 4, "Conviction", "Quelle conviction fondamentale accepterais-tu difficilement de remettre en question ?", null, null, [], "philosophie"),
  a("open_question", "philosophie", 4, "Prix de la liberté", "Quelle sécurité serais-tu prêt·e à perdre pour te sentir vraiment libre ?", null, null, [], "philosophie"),

  // ---------- ÉMOTIONS ----------
  a("open_question", "emotions", 1, "Se sentir apprécié", "Quel petit geste te fait rapidement te sentir apprécié·e ?", null, null, [], "emotions"),
  a("secret_choice", "emotions", 1, "Quand ça ne va pas", "Quand tu vas mal, tu préfères…", ["Qu'on te parle", "Qu'on te laisse respirer"], null, [], "emotions"),
  a("complete_sentence", "emotions", 2, "Je me ferme", "J'ai tendance à me fermer quand…", null, null, [], "emotions"),
  a("open_question", "emotions", 2, "Dire les choses", "Quelle émotion as-tu le plus de mal à montrer clairement ?", null, null, [], "emotions"),
  a("open_question", "emotions", 3, "Mal compris", "Quelle partie de toi les autres comprennent-ils souvent de travers ?", null, null, [], "emotions"),
  a("secret_choice", "emotions", 3, "Blessure ou distance", "Quand tu es blessé·e, tu as tendance à…", ["Te rapprocher", "Prendre tes distances"], null, [], "emotions"),
  a("open_question", "emotions", 4, "Peur relationnelle", "Quelle peur émotionnelle influence le plus ta manière de t'attacher ?", null, null, [], "emotions"),
  a("complete_sentence", "emotions", 4, "Vulnérable", "Je me sens vraiment vulnérable quand…", null, null, [], "emotions"),

  // ---------- INTIMITÉ (NON EXPLICITE) ----------
  a("open_question", "intimite", 1, "Premier détail", "Quel détail chez quelqu'un peut créer une attirance avant même une vraie conversation ?", null, null, [], "intimite", ["first_date", "couple", "new_meeting", "surprise"]),
  a("secret_choice", "intimite", 1, "Tension", "Ce qui crée le plus vite une tension entre deux personnes…", ["Le regard", "La voix", "L'humour", "La proximité"], null, [], "intimite", ["first_date", "couple", "new_meeting", "surprise"]),
  a("open_question", "intimite", 1, "Embrasser", "Qu'est-ce qui te donne vraiment envie d'embrasser quelqu'un ?", null, null, [], "intimite", ["first_date", "couple", "new_meeting", "surprise"]),
  a("secret_choice", "intimite", 2, "Affection", "Tu te sens le plus proche grâce…", ["Aux mots", "Au toucher", "Au temps partagé", "Aux attentions"], null, [], "intimite"),
  a("open_question", "intimite", 2, "Proximité", "Qu'est-ce qui te met suffisamment en confiance pour laisser quelqu'un se rapprocher ?", null, null, [], "intimite"),
  a("open_question", "intimite", 2, "Limite douce", "Quelle limite te paraît importante à exprimer au début d'une relation ?", null, null, [], "intimite"),
  a("complete_sentence", "intimite", 3, "Désiré", "Je me sens vraiment désiré·e quand…", null, null, [], "intimite", ["first_date", "couple", "surprise"]),
  a("open_question", "intimite", 3, "Connexion physique", "Qu'est-ce qui transforme pour toi une attirance physique en véritable intimité ?", null, null, [], "intimite"),
  a("open_question", "intimite", 4, "Dire son désir", "Qu'aimerais-tu pouvoir demander plus facilement quand tu désires quelqu'un ?", null, null, [], "intimite", ["first_date", "couple", "surprise"]),

  // ---------- SEXUALITÉ 18+ — aucune mission, uniquement des échanges consentis ----------
  // Niveau 1 : suggestif
  a("open_question", "sexualite", 3, "Lieu insolite", "Quel est l'endroit le plus insolite où tu as déjà fait l'amour ?", null, null, ["adult", "consent", "explicit"], "sexualite"),
  a("secret_choice", "sexualite", 1, "Montée du désir", "Tu préfères une attirance…", ["Lente et progressive", "Immédiate et électrique"], null, ["adult", "consent"], "sexualite"),
  a("secret_choice", "sexualite", 1, "Déclencheur", "Ce qui crée le plus vite du désir chez toi…", ["Le regard", "La voix", "Le toucher", "Les mots"], null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 1, "Signal", "Quel signal discret envoies-tu quand quelqu'un te plaît sexuellement ?", null, null, ["adult", "consent"], "sexualite"),
  a("secret_choice", "sexualite", 1, "Style de flirt", "Quand quelqu'un te plaît, tu préfères un flirt…", ["Très subtil", "Assez direct", "Progressif"], null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 1, "Tension", "Quel détail peut te faire sentir qu'une attirance devient réciproque ?", null, null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 1, "Séduction", "Qu'est-ce qui rend une personne séduisante sans qu'elle ait besoin de te toucher ?", null, null, ["adult", "consent"], "sexualite"),
  a("secret_choice", "sexualite", 1, "Premier signal", "Tu remarques d'abord…", ["Le regard", "La voix", "L'énergie", "L'humour"], null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 1, "À l'aise", "Quelle façon de montrer son attirance te met le plus à l'aise ?", null, null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 2, "Baiser", "Quel type de baiser fait monter le désir le plus vite chez toi ?", null, null, ["adult", "consent"], "sexualite"),

  // Niveau 2 : intime
  a("open_question", "sexualite", 2, "Confiance", "Qu'est-ce qui doit être présent pour que tu te sentes vraiment libre sexuellement ?", null, null, ["adult", "consent"], "sexualite"),
  a("secret_choice", "sexualite", 2, "Guider", "Tu préfères le plus souvent…", ["Guider", "Être guidé·e", "Alterner"], null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 2, "Coupe-désir", "Qu'est-ce qui coupe immédiatement ton désir, même si l'attirance est forte ?", null, null, ["adult", "consent"], "sexualite"),
  a("secret_choice", "sexualite", 2, "Parler avant", "Pour les envies et les limites, tu préfères…", ["En parler avant", "Découvrir progressivement"], null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 2, "Mots", "Quelle place les mots ou les sons ont-ils dans ton plaisir ?", null, null, ["adult", "consent"], "sexualite"),
  a("open_question", "sexualite", 2, "Limite", "Quelle limite sexuelle est importante pour toi de pouvoir dire sans gêne ?", null, null, ["adult", "consent"], "sexualite"),

  // Niveau 3 : explicite
  a("secret_choice", "sexualite", 3, "Plaisir", "Dans le sexe, tu préfères surtout…", ["Le sexe oral", "La pénétration", "Les mains", "Un mélange"], null, ["adult", "consent", "explicit"], "sexualite"),
  a("open_question", "sexualite", 3, "Position", "Quelle position sexuelle te donne généralement le plus de plaisir ?", null, null, ["adult", "consent", "explicit"], "sexualite"),
  a("open_question", "sexualite", 3, "Fantasme réaliste", "Quel fantasme réaliste aimerais-tu essayer avec une personne de confiance ?", null, null, ["adult", "consent", "explicit"], "sexualite"),
  a("secret_choice", "sexualite", 3, "Rythme", "Tu prends davantage de plaisir quand c'est…", ["Doux et lent", "Intense et direct", "Variable"], null, ["adult", "consent", "explicit"], "sexualite"),
  a("open_question", "sexualite", 3, "Demander", "Qu'aimes-tu qu'on te demande clairement pendant le sexe ?", null, null, ["adult", "consent", "explicit"], "sexualite"),
  a("open_question", "sexualite", 3, "Pratique", "Quelle pratique te donne beaucoup de plaisir, et laquelle t'attire nettement moins ?", null, null, ["adult", "consent", "explicit"], "sexualite"),

  // Niveau 4 : très explicite
  a("open_question", "sexualite", 4, "Gorge profonde", "Est-ce que tu apprécies ou pratiques la gorge profonde, et sous quelles conditions ?", null, null, ["adult", "consent", "very-explicit"], "sexualite"),
  a("open_question", "sexualite", 4, "Oral", "Tu préfères donner ou recevoir du sexe oral, et qu'est-ce qui fait la différence ?", null, null, ["adult", "consent", "very-explicit"], "sexualite"),
  a("open_question", "sexualite", 4, "Fantasme cru", "Quel est le fantasme le plus cru que tu accepterais de partager ici ?", null, null, ["adult", "consent", "very-explicit"], "sexualite"),
  a("open_question", "sexualite", 4, "Jamais", "Quelle position ou pratique sexuelle ne voudrais-tu jamais essayer ?", null, null, ["adult", "consent", "very-explicit"], "sexualite"),
  a("secret_choice", "sexualite", 4, "Contrôle", "Dans un rapport consenti, le contrôle t'attire plutôt…", ["Pas du tout", "Un peu", "Beaucoup", "Selon la personne"], null, ["adult", "consent", "very-explicit"], "sexualite"),
  a("open_question", "sexualite", 4, "Demande directe", "Quelle pratique très explicite aimerais-tu pouvoir demander sans gêne à une personne de confiance ?", null, null, ["adult", "consent", "very-explicit"], "sexualite"),

  // ---------- CONTEXTE PREMIER RENDEZ-VOUS ----------
  a("open_question", "personnalite", 2, "Première impression", "Quelle première impression les gens ont-ils souvent de toi, et qu'est-ce qu'ils découvrent ensuite ?", null, null, ["context:first_date"], "personnalite", ["first_date"]),
  a("secret_choice", "valeurs", 2, "Début de relation", "Au début d'une relation, tu privilégies…", ["La spontanéité", "La clarté"], null, ["context:first_date"], "valeurs", ["first_date"]),
  a("open_question", "intimite", 2, "Alchimie", "À quel moment sais-tu qu'un premier rendez-vous a vraiment créé une alchimie ?", null, null, ["context:first_date"], "intimite", ["first_date"]),

  // ---------- CONTEXTE COUPLE ----------
  a("open_question", "souvenirs", 2, "Nous deux", "Quel souvenir de votre histoire mériterait d'être revécu exactement pareil ?", null, null, ["context:couple"], "souvenirs", ["couple"]),
  a("open_question", "relations", 3, "Mieux aimer", "Qu'est-ce que votre partenaire fait déjà bien, mais que vous aimeriez recevoir plus souvent ?", null, null, ["context:couple"], "relations", ["couple"]),
  a("complete_sentence", "intimite", 3, "Plus proches", "Je me sens le plus proche de toi quand…", null, null, ["context:couple"], "intimite", ["couple"]),

  // ---------- CONTEXTE AMIS ----------
  a("open_question", "relations", 2, "Amitié", "Quel moment t'a fait comprendre que cette amitié comptait vraiment ?", null, null, ["context:friends"], "relations", ["friends"]),
  a("who_of_us", "humour", 1, "Mauvaise idée", "Qui de vous deux transforme le plus vite une bonne soirée en mauvaise idée mémorable ?", MOI_AUTRE, null, ["context:friends"], "humour", ["friends"]),

  // ---------- CONTEXTE NOUVELLE RENCONTRE ----------
  a("open_question", "leger", 1, "Mode d'emploi", "Quel détail simple aide les gens à bien s'entendre avec toi dès le début ?", null, null, ["context:new_meeting"], "leger", ["new_meeting"]),
  a("secret_choice", "personnalite", 1, "Premier contact", "Avec quelqu'un de nouveau, tu es plutôt…", ["Très vite à l'aise", "J'observe d'abord"], null, ["context:new_meeting"], "personnalite", ["new_meeting"]),

];

// Sanity: ensure at least 100 activities.
if (ACTIVITIES.length < 100) {
  // eslint-disable-next-line no-console
  console.warn(`Seed contient seulement ${ACTIVITIES.length} activités`);
}

export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find((x) => x.id === id);
}

export function activityForSessionActivity(
  sessionActivity: SessionActivity
): Activity | undefined {
  return sessionActivity.customActivity ?? getActivityById(sessionActivity.activityId);
}
