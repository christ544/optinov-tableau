/*
  FICHIER DE DEMARRAGE DU TABLEAU DE BORD — pour l'hebergement PlanetHoster (N0C).

  POURQUOI CE FICHIER EXISTE.
  En local, on lance le tableau de bord avec `npm run dev` ou `npm start`, qui
  appellent la commande `next`. Sur PlanetHoster, ce n'est pas nous qui lancons
  l'application : c'est Phusion Passenger, le moteur integre au serveur web.
  Passenger ne sait pas executer une commande npm — il execute UN FICHIER
  JavaScript, celui qu'on designe comme « fichier de demarrage » dans le panneau
  N0C. Le voici.

  Ce fichier ne sert QU'A PlanetHoster. Sur Render, rien ne le lit : le service
  demarre avec `npm run start` (voir render.yaml). Les deux hebergements peuvent
  donc coexister sans se gener, le temps de la bascule.

  POURQUOI L'EXTENSION .cjs, ET PAS .js.
  Le package.json declare "type": "module" : tous les fichiers .js du projet sont
  donc des modules ES. Or Passenger charge le fichier de demarrage avec
  `require()`, qui ne sait pas lire un module ES. Un fichier nomme server.js
  echouerait au demarrage — et Passenger n'afficherait qu'un « Web application
  could not be started » sans autre explication. L'extension .cjs force Node a
  traiter ce fichier comme du CommonJS, `require` compris, quelle que soit la
  valeur de "type" dans package.json.

  LE PORT. Passenger choisit lui-meme sur quoi l'application ecoute et le
  communique par la variable d'environnement PORT. On la lit donc au lieu de
  fixer un numero en dur : un port ecrit en dur donnerait une application qui
  demarre sans erreur mais que le serveur web n'atteint jamais — le genre de
  panne ou tout « a l'air » de fonctionner. Le 3000 n'est qu'un repli pour les
  essais en local.

  LE JOURNAL DE DEMARRAGE. Sur un hebergement mutualise, le journal de Passenger
  n'est pas lisible depuis le compte utilisateur : quand l'application refuse de
  demarrer, on n'a qu'une erreur 500 anonyme et un « Error ID » reserve au
  support. Ce fichier ecrit donc son propre compte rendu dans tmp/demarrage.log,
  a cote du tmp/restart.txt que Passenger surveille. C'est la qu'il faut regarder
  en premier apres un echec.

  A NE PAS OUBLIER : ce fichier suppose que le build a deja ete execute.
  Passenger ne compile rien, il ne fait qu'executer.
*/

const fs = require('fs')
const path = require('path')
const { createServer } = require('http')

/*
  LES VARIABLES D'ENVIRONNEMENT, CHARGEES AVANT TOUT LE RESTE.

  Next lit bien le fichier .env tout seul — mais seulement au moment ou elle
  prepare l'application, c'est-a-dire APRES les lignes de journal ci-dessous.
  Sans ce chargement explicite, le compte rendu de demarrage annoncerait
  « DATABASE_URI ABSENTE » sur une installation parfaitement configuree : un faux
  diagnostic, servi exactement au moment ou l'on cherche la panne.

  `loadEnvConfig` est la fonction que Next utilise elle-meme ; elle est fournie
  par le paquet @next/env, installe avec Next. Elle ne remplace jamais une
  variable deja definie : celles du panneau N0C gardent donc la priorite sur le
  fichier .env, ce qui est l'ordre attendu.
*/
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(__dirname, false)

const next = require('next')

const journal = path.join(__dirname, 'tmp', 'demarrage.log')

/*
  MEMOIRE OCCUPEE PAR LE PROCESSUS, en megaoctets (RSS : tout ce que le systeme
  lui a reellement alloue).

  Sur un hebergement mutualise, la panne la plus frequente n'est pas une erreur
  de code mais un depassement de quota memoire. Le processus est alors ABATTU —
  pas d'exception, pas de trace, juste une application qui ne repond plus. Sans
  releve de memoire dans le journal, rien ne distingue ce cas d'un plantage
  ordinaire. Payload est gourmand au demarrage : le releve a toute son utilite.
*/
const memoire = () => Math.round(process.memoryUsage().rss / 1048576)

function noter(message) {
  try {
    fs.mkdirSync(path.dirname(journal), { recursive: true })
    fs.appendFileSync(journal, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    /*
      Si le journal n'est pas ecrivable, on ne fait surtout pas echouer le
      demarrage pour autant : la sortie console reste envoyee a Passenger, et une
      application qui tourne sans journal vaut mieux qu'une application arretee
      par son propre outil de diagnostic.
    */
  }
}

function echouer(motif, erreur) {
  const details = erreur && erreur.stack ? erreur.stack : String(erreur)
  noter(`ECHEC — ${motif}\n${details}`)
  console.error(`Echec du demarrage du tableau de bord (${motif}) :`, erreur)
  process.exit(1)
}

/*
  Sans ces deux filets, une erreur survenant en dehors de la chaine de promesses
  ci-dessous ferait mourir le processus en silence : Passenger afficherait sa
  page d'erreur generique et le journal resterait vide.
*/
process.on('uncaughtException', (erreur) => echouer('exception non capturee', erreur))
process.on('unhandledRejection', (erreur) => echouer('promesse rejetee', erreur))

/*
  ARRET DEMANDE PAR PASSENGER. Il envoie SIGTERM avant d'eteindre une
  application — au redeploiement, apres une periode sans visite, ou parce que le
  quota memoire du compte est atteint. Sans cette ligne, tous ces cas se
  ressemblent : le journal s'interrompt, sans dire pourquoi. Avec elle, on sait
  que l'arret etait VOULU, et combien le processus consommait a cet instant.
*/
process.on('SIGTERM', () => {
  noter(`SIGTERM — Passenger a demande l'arret (memoire ${memoire()} Mo)`)
  process.exit(0)
})

const port = Number(process.env.PORT) || 3000

noter(
  `Demarrage demande — node ${process.version}, port ${port}, dossier ${__dirname}, ` +
    `NODE_ENV=${process.env.NODE_ENV ?? '(absent)'}, ` +
    `DATABASE_URI=${process.env.DATABASE_URI ? 'presente' : 'ABSENTE'}, ` +
    `PAYLOAD_SECRET=${process.env.PAYLOAD_SECRET ? 'presente' : 'ABSENTE'}, ` +
    `PAYLOAD_PUBLIC_SERVER_URL=${process.env.PAYLOAD_PUBLIC_SERVER_URL || '(absente)'}, ` +
    `SMTP_HOST=${process.env.SMTP_HOST || '(absent — e-mails affiches en console)'}, ` +
    `memoire ${memoire()} Mo`,
)
/*
  On note la PRESENCE des variables sensibles, jamais leur valeur : ce journal
  reste sur le disque du serveur et n'a aucune raison de contenir un mot de passe
  de base ou une cle de session. Savoir qu'une variable manque suffit a expliquer
  la panne — la connaitre n'ajoute rien.

  PAYLOAD_PUBLIC_SERVER_URL fait exception, et c'est voulu : ce n'est pas un
  secret, c'est une adresse publique, et sa valeur exacte est justement celle
  qu'on vient verifier. Une adresse qui ne correspond pas a celle ouverte dans le
  navigateur donne un tableau de bord ou la consultation marche et ou tout
  enregistrement est refuse (« Vous n'etes pas autorise a effectuer cette
  action ») — panne classique, invisible autrement.
*/

/*
  BATTEMENT PENDANT LA PREPARATION.

  `app.prepare()` peut demander une trentaine de secondes : Payload y charge sa
  configuration, etablit sa connexion a la base et applique les migrations en
  attente (prodMigrations, voir payload.config.ts). Si le processus est abattu
  pendant ce temps — quota memoire —, le journal s'arrete apres « Demarrage
  demande » sans autre indication, et rien ne dit si l'application etait bloquee
  ou simplement lente.

  Une ligne toutes les 5 secondes leve le doute, et la courbe de memoire montre
  si l'on approchait du plafond. `unref()` est important : sans lui, cette
  minuterie suffirait a garder Node en vie, et le processus ne s'arreterait
  jamais tout seul.
*/
const battement = setInterval(() => noter(`preparation en cours, memoire ${memoire()} Mo`), 5000)
battement.unref()

/*
  LE PROTOCOLE VU PAR LE CLIENT, normalise.

  PlanetHoster termine le HTTPS en amont (LiteSpeed) et transmet chaque requete a
  Passenger, qui la transmet ici : Node ne voit donc jamais directement une
  connexion TLS, seulement l'en-tete standard que pose le proxy pour dire quel
  etait le protocole d'origine. Sans redirection, une adresse http:// (lien
  partage sans le « s », vieux favori) servirait le tableau de bord en clair,
  cookie de session compris.

  TROIS ECARTS SUFFISENT A FAUSSER LA COMPARAISON, et tous sont legitimes :
    - la casse : « HTTPS » n'est pas « https » ;
    - une chaine de proxys, qui pose une LISTE : « https, http » ;
    - des espaces autour de la valeur.
  On normalise donc avant de comparer, et on ne garde que le PREMIER element :
  c'est celui que le client a reellement utilise, les suivants decrivant les
  sauts internes.
*/
function protocole_origine(req) {
  const brut = req.headers['x-forwarded-proto']
  return String(brut === undefined || brut === null ? '' : brut)
    .split(',')[0]
    .trim()
    .toLowerCase()
}

/*
  ON NE REDIRIGE QUE SUR UNE CERTITUDE : l'en-tete dit « http ».

  Toute autre valeur — absente, inconnue, mal formee — laisse passer. Le pire qui
  puisse alors arriver est de servir une page en clair qui aurait pu etre
  redirigee ; le pire de la regle inverse serait une boucle de redirection, donc
  un tableau de bord entierement inaccessible. Entre une protection qui manque
  une fois et une panne totale, le choix est vite fait — le site immobilier est
  tombe exactement de cette facon le 20 aout, la regle inverse etant en place le
  jour ou le proxy a change de reponse.

  L'ANOMALIE EST SIGNALEE UNE SEULE FOIS, au premier passage : si le proxy envoie
  une valeur inattendue, on veut le savoir sans noyer le journal a raison d'une
  ligne par requete.
*/
let anomalie_signalee = false

function rediriger_vers_https(req, res) {
  const proto = protocole_origine(req)

  if (proto !== '' && proto !== 'http' && proto !== 'https' && !anomalie_signalee) {
    anomalie_signalee = true
    console.warn(
      'x-forwarded-proto inattendu : ' +
        JSON.stringify(req.headers['x-forwarded-proto']) +
        ' — aucune redirection appliquee.',
    )
  }

  if (proto !== 'http') return false

  res.writeHead(308, { Location: `https://${req.headers.host}${req.url}` })
  res.end()
  return true
}

/*
  `webpack: true` N'EST PAS UN DETAIL.

  Depuis Next 16, Turbopack est le constructeur par defaut, y compris pour cette
  fonction `next()` : sans option, elle poserait TURBOPACK=auto. Or le build de
  ce projet passe par Webpack (voir le script « build » du package.json et la
  cle `webpack` de next.config.ts), parce que Turbopack reclame une glibc que
  l'hebergement mutualise n'a pas. Cette option aligne l'execution sur la
  construction.

  `dev: false` : Passenger execute un build deja fait, jamais un mode
  developpement. `dir: __dirname` : le dossier de l'application ne depend pas du
  repertoire courant depuis lequel Passenger a ete lance.
*/
const app = next({ dev: false, dir: __dirname, webpack: true })
const traiter = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      if (rediriger_vers_https(req, res)) return
      traiter(req, res)
    }).listen(port, () => {
      clearInterval(battement)
      noter(`Pret — le tableau de bord repond sur le port ${port} (memoire ${memoire()} Mo)`)
      console.log(`Tableau de bord OPTINOV demarre sur le port ${port}`)
    })
  })
  .catch((erreur) => echouer('preparation de Next', erreur))
