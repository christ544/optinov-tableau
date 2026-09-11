#!/bin/bash
#
# DEPLOIEMENT DU TABLEAU DE BORD SUR PLANETHOSTER (N0C)
# — a lancer EN SSH, SUR LE SERVEUR, depuis le dossier de l'application.
#
#   ./deployer.sh premier     premier deploiement (le code est deja clone)
#   ./deployer.sh             mise a jour : recupere le code, reconstruit, redemarre
#
# CE QUE CE SCRIPT REMPLACE.
# Sur Render, chaque fusion vers `main` declenchait un build automatique.
# PlanetHoster est un hebergement classique : un processus Node tourne en
# permanence, et c'est a nous de lui apporter la nouvelle version. Ce script fait,
# dans l'ordre, les six gestes que Render enchainait tout seul : recuperer le code,
# installer les dependances, appliquer les migrations, construire, remettre le lien
# node_modules en place, redemarrer.
#
# CE QUI N'A PAS BESOIN DE CE SCRIPT : les CONTENUS. Ecrire un article, repondre a
# une demande, changer un temoignage se fait depuis le tableau de bord et prend
# effet immediatement. Ce script ne sert qu'aux changements de CODE.

set -euo pipefail
# set -e  : on s'arrete a la premiere erreur. Sans lui, un `npm ci` en echec serait
#           suivi d'un build sur des dependances incompletes, puis d'un
#           redemarrage — et le tableau de bord tomberait au lieu d'etre
#           simplement pas mis a jour. Mieux vaut un deploiement interrompu qu'une
#           application cassee.
# set -u  : une variable non definie devient une erreur, plutot qu'un chemin vide
#           du type "rm -rf /" une fois concatene.
# set -o pipefail : dans `a | b`, l'echec de `a` compte comme un echec.

# ---------------------------------------------------------------- A RENSEIGNER
# Identifiant du compte N0C (celui du chemin /home/xxx).
UTILISATEUR="${N0C_UTILISATEUR:-VOTRE_IDENTIFIANT}"

# Version de Node choisie a la creation de l'application dans le panneau N0C.
# Doit correspondre au champ "engines" du package.json (22.x).
VERSION_NODE="${N0C_VERSION_NODE:-22}"

# Nom de l'application tel qu'il apparait dans le panneau N0C. Il sert a deux
# choses : le dossier du code (~/NOM) et le chemin de l'environnement Node que
# N0C calque dessus (~/nodevenv/NOM/VERSION).
APPLICATION="${N0C_APPLICATION:-optinov-admin}"

# Adresse publique du tableau de bord, utilisee seulement par la verification de
# sante apres redemarrage. Doit etre IDENTIQUE a PAYLOAD_PUBLIC_SERVER_URL du .env.
DOMAINE="${DOMAINE_ADMIN:-https://admin.optinov.ci}"
# ------------------------------------------------------------------------------

if [ "${UTILISATEUR}" = "VOTRE_IDENTIFIANT" ]; then
  echo "Renseignez UTILISATEUR en haut de ce script, ou lancez :" >&2
  echo "  N0C_UTILISATEUR=votreidentifiant ./deployer.sh" >&2
  exit 1
fi

MAISON="/home/${UTILISATEUR}"
APP="${MAISON}/${APPLICATION}"
VENV="${MAISON}/nodevenv/${APPLICATION}/${VERSION_NODE}"

# Activer l'environnement Node de l'application.
#
# POURQUOI C'EST OBLIGATOIRE : le `node` par defaut du serveur n'est pas celui de
# votre application. Sans cette activation, `npm ci` installe dans le mauvais
# dossier, avec la mauvaise version — et l'application demarre sur des modules
# compiles pour un autre Node. Le symptome est deroutant : erreurs sur des modules
# natifs (sharp, en general) alors que l'installation s'est "bien passee".
activer() {
  local chemin="${VENV}/bin/activate"

  if [ ! -f "${chemin}" ]; then
    echo "Environnement Node introuvable : ${chemin}" >&2
    echo "Verifiez le nom de l'application et la version de Node dans le panneau N0C." >&2
    exit 1
  fi

  # POURQUOI ON DESARME `set -u` LE TEMPS DU `source`.
  #
  # Le script d'activation fourni par CloudLinux lit des variables sans les avoir
  # definies — CL_VIRTUAL_ENV_DISABLE_PROMPT, notamment. En temps normal cela ne
  # prete pas a consequence : bash les traite comme vides. Mais `set -u` (voir en
  # haut de ce fichier) transforme toute variable non definie en erreur, et le
  # deploiement s'interromprait sur :
  #
  #   activate: line 59: CL_VIRTUAL_ENV_DISABLE_PROMPT: unbound variable
  #
  # Ce fichier ne nous appartient pas : il est reinstalle par l'hebergeur a chaque
  # changement de version de Node, et le corriger sur place serait perdu. On leve
  # donc le controle sur ces quelques lignes, puis on le retablit aussitot — nos
  # propres variables restent verifiees.
  set +u
  # shellcheck disable=SC1090
  source "${chemin}"
  set -u
}

# Verifier que le fichier .env existe et porte le minimum vital.
#
# POURQUOI AVANT TOUT LE RESTE : sans DATABASE_URI, le build se termine
# normalement et c'est le DEMARRAGE qui echoue, une demi-heure plus tard, sur une
# erreur de connexion illisible. Autant le dire tout de suite.
verifier_env() {
  if [ ! -f "${APP}/.env" ]; then
    echo "Fichier .env absent dans ${APP}." >&2
    echo "  cp .env.example .env && nano .env" >&2
    exit 1
  fi

  local manquantes=""
  for variable in DATABASE_URI PAYLOAD_SECRET PAYLOAD_PUBLIC_SERVER_URL; do
    # `^VARIABLE=` suivi d'autre chose qu'une fin de ligne : la variable doit etre
    # presente ET renseignee. Un `PAYLOAD_SECRET=` vide, recopie tel quel depuis
    # .env.example, est l'oubli le plus frequent.
    if ! grep -qE "^${variable}=.+" "${APP}/.env"; then
      manquantes="${manquantes} ${variable}"
    fi
  done

  if [ -n "${manquantes}" ]; then
    echo "Variables absentes ou vides dans ${APP}/.env :${manquantes}" >&2
    echo "Voir la liste complete dans .env.example." >&2
    exit 1
  fi
}

# Installer les dependances.
#
# NODE_ENV=development et --include=dev ne sont pas une negligence : sans eux, npm
# saute les devDependencies, donc TypeScript — et le build echoue aussitot. Next
# propose normalement d'installer TypeScript tout seul a ce moment-la, mais
# CloudLinux le lui interdit. On installe donc tout, on construit, et le mode
# production ne concerne que l'execution.
#
# `npm ci` plutot que `npm install` : il installe EXACTEMENT ce que decrit
# package-lock.json, sans jamais le modifier. C'est ce qui garantit que le serveur
# execute les memes versions que celles testees en local.
installer() {
  cd "${APP}"
  NODE_ENV=development npm ci --include=dev
}

# Appliquer les migrations de base AVANT le build.
#
# Le schema doit correspondre a la configuration avant que quoi que ce soit ne
# lise la base. `payload migrate` ne fait rien si aucune migration n'est en
# attente — l'appeler a chaque deploiement est sans risque.
#
# A NOTER : payload.config.ts declare aussi `prodMigrations`, qui rejoue les
# migrations en attente au demarrage de l'application. Les appliquer ici quand
# meme a deux avantages : l'echec se voit tout de suite, dans le terminal, au lieu
# d'etre enfoui dans tmp/demarrage.log ; et le premier demarrage n'a plus a porter
# ce travail, ce qui compte sur un hebergement ou le quota memoire est serre.
migrer() {
  cd "${APP}"
  npx payload migrate
}

# Construire, avec les ressources bridees.
#
# POURQUOI ON N'APPELLE PAS `npm run build`. Le script build du package.json fixe
# --max-old-space-size=8000, taille pensee pour une machine de developpement. Sur
# un hebergement mutualise, cette valeur fait tuer le processus. On appelle donc
# `next build` directement, avec nos propres reglages — passer NODE_OPTIONS en
# variable d'environnement ne suffirait pas, cross-env l'ecraserait.
#
# Les trois variables de threads repondent a une autre limite du mutualise : le
# nombre de processus. Sans elles, le compilateur de Next tente d'ouvrir autant de
# threads qu'il voit de coeurs — bien plus que le compte n'en autorise — et le
# build s'arrete sur un « os error 11 » (resource temporarily unavailable) qui ne
# dit pas son nom.
#
# --webpack N'EST PAS UNE PREFERENCE, C'EST UNE NECESSITE SUR CE SERVEUR.
# Next 16 a fait de Turbopack son constructeur par defaut. Or Turbopack exige des
# composants natifs, qui reclament une glibc que cet hebergement n'a pas. Next se
# rabat alors sur sa version WebAssembly — que Turbopack refuse. Le build s'arrete
# sur « Turbopack is not supported on this platform ». Webpack, lui, fonctionne en
# WASM ; next.config.ts declare deja sa configuration webpack, et server.cjs passe
# la meme option a l'execution.
#
# ON MET LE BUILD PRECEDENT A L'ABRI AVANT DE CONSTRUIRE.
# `next build` vide `.next` AVANT de travailler. Un build qui echoue laisse donc
# l'application sans aucun build : elle tourne encore en memoire, puis meurt au
# premier redemarrage. On DEPLACE donc l'ancien build au lieu de le laisser
# detruire, et on le remet si le build echoue : le deploiement echoue, le tableau
# de bord reste debout. C'est toute la difference entre une tentative ratee et une
# panne. Le cache est transfere dans le nouveau dossier pour ne pas repartir a
# froid : un build complet est deja assez long sur un hebergement mutualise.
construire() {
  cd "${APP}"

  rm -rf .next.precedent
  if [ -d .next ]; then
    mv .next .next.precedent
    mkdir -p .next
    if [ -d .next.precedent/cache ]; then
      mv .next.precedent/cache .next/cache
    fi
  fi

  if NODE_OPTIONS="--no-deprecation --max-old-space-size=2048" \
     NEXT_CPUS=1 \
     RAYON_NUM_THREADS=1 \
     TOKIO_WORKER_THREADS=1 \
     UV_THREADPOOL_SIZE=1 \
       npx next build --webpack
  then
    rm -rf .next.precedent
  else
    echo "Build en echec : le build precedent est restaure, le tableau de bord reste en ligne." >&2
    if [ -d .next.precedent ]; then
      rm -rf .next
      mv .next.precedent .next
    fi
    return 1
  fi
}

# Remettre node_modules en lien symbolique — APRES LE BUILD, JAMAIS AVANT.
#
# C'EST L'ETAPE QU'ON OUBLIE, ET ELLE CASSE TOUT. Sur CloudLinux, node_modules
# n'est pas un dossier mais un lien vers l'environnement Node de l'application.
# `npm ci` commence par supprimer node_modules : il detruit donc le lien et le
# remplace par un vrai dossier. L'installation reussit, le build reussit — et
# Passenger, qui cherche les modules dans l'environnement, ne demarre plus. D'ou
# un « Web application could not be started » juste apres un deploiement en
# apparence normal.
#
# POURQUOI APRES LE BUILD. Les deux outils ont des exigences opposees :
#   - Passenger veut le LIEN, pour trouver les modules dans l'environnement Node ;
#   - le compilateur de Next REFUSE ce lien : il pointe hors du dossier du projet,
#     et le build s'arrete sur « Symlink [project]/node_modules is invalid ».
# On construit donc avec un vrai dossier, et on repose le lien juste apres. C'est
# le seul ordre qui fonctionne — l'inverse casse le build, et l'oublier casse le
# demarrage.
reparer_lien_modules() {
  local cible="${VENV}/lib/node_modules"

  if [ -L "${APP}/node_modules" ]; then
    echo "Lien node_modules deja en place."
    return 0
  fi

  echo "Lien node_modules absent — remise en place."
  mkdir -p "${VENV}/lib"

  if [ -d "${APP}/node_modules" ]; then
    rm -rf "${cible}"
    mv "${APP}/node_modules" "${cible}"
  fi

  ln -s "${cible}" "${APP}/node_modules"
}

# Redemarrer l'application servie par Passenger.
#
# Passenger surveille le fichier tmp/restart.txt : quand sa date de modification
# change, il arrete proprement l'ancien processus et en demarre un nouveau, sans
# coupure visible. C'est l'equivalent en ligne de commande du bouton "Redemarrer"
# du panneau N0C. Sans ce geste, Passenger continue de servir l'ancien code depuis
# sa memoire, et on croit son deploiement sans effet.
#
# Le journal de demarrage est vide avant chaque redemarrage : ce qu'on veut lire
# apres une panne, c'est le compte rendu de CE demarrage-ci, pas l'empilement de
# tous les precedents.
redemarrer() {
  mkdir -p "${APP}/tmp"
  : > "${APP}/tmp/demarrage.log"
  touch "${APP}/tmp/restart.txt"
  echo "Redemarrage demande."
}

# Verification de sante apres redemarrage.
#
# CE QUE CA CORRIGE : sans elle, un deploiement peut "reussir" (aucune erreur de
# build) tout en laissant une application cassee — variable d'environnement
# manquante, erreur de demarrage silencieuse. Rien ne le signalerait avant le
# prochain utilisateur.
#
# Payload demande une trentaine de secondes pour se preparer ; on retente pendant
# jusqu'a 90 s (18 x 5 s) avant d'abandonner, plutot que d'echouer sur la premiere
# tentative pendant que l'ancien processus s'eteint encore.
verifier_sante() {
  local url="$1"
  local intitule="$2"
  local tentative=0

  echo "Verification : ${intitule} (${url})..."
  while [ "${tentative}" -lt 18 ]; do
    if curl -sf -o /dev/null --max-time 10 "${url}"; then
      echo "  OK — ${intitule} repond."
      return 0
    fi
    tentative=$((tentative + 1))
    sleep 5
  done

  echo "  ECHEC — ${intitule} ne repond pas, $((tentative * 5))s apres le redemarrage." >&2
  echo "  Lisez ${APP}/tmp/demarrage.log : la premiere ligne d'erreur dit presque" >&2
  echo "  toujours de quoi il s'agit." >&2
  return 1
}

# ------------------------------------------------------------------- Execution
mode="${1:-mise-a-jour}"

case "${mode}" in
  premier|mise-a-jour) ;;
  *)
    echo "Usage : ./deployer.sh [premier|mise-a-jour]" >&2
    exit 1
    ;;
esac

echo "=== TABLEAU DE BORD OPTINOV — ${mode} ==="
verifier_env

if [ "${mode}" = "mise-a-jour" ]; then
  echo "Recuperation du code..."
  cd "${APP}"
  git pull --ff-only
  # --ff-only : on refuse de fusionner. Si le depot du serveur a diverge (une
  # modification faite directement dessus, par exemple), on veut le savoir tout de
  # suite plutot que de fabriquer un commit de fusion sur un serveur de production.
fi

activer
installer
migrer
construire
reparer_lien_modules
redemarrer

verifier_sante "${DOMAINE}/admin/login" "page de connexion"
verifier_sante "${DOMAINE}/api/globals/parametres?depth=0" "API des parametres"

echo ""
echo "Deploiement termine."
echo "En cas d'anomalie, lisez d'abord ${APP}/tmp/demarrage.log."
