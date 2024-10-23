---
title: Cassini pour les nuls
desciption: Tutoriel pour générer une carte de course d'orientation avec Cassini
banner: /images/cassini-example.png
date: 2024-10-22
author: Nicolas Rio
draft: true
---

[Cassini](https://cassini-map.com) est un logiciel permettant de **générer une carte de [course d’orientation](https://www.ffcorientation.fr/decouvrir/comment/)** (presque) prête à l’emploi à partir de [données LiDAR](https://fr.wikipedia.org/wiki/Lidar). Je l'ai développé dans le cadre du projet Mapant.fr, pour générer une carte topographique de la France entière à partir de données LiDAR et vectorielles en open data de l’IGN (Institut national de l'information géographique et forestière).

Cassini est fortement inspiré par Karttapullautin, le génial générateur de carte de course d’orientation derrière les projets mapant (mapant.fi, mapant.no…), et récemment réécrit en Rust par Raphaël Stefanini. J’explique plus en détail [dans cet article](https://cassini-map.com/what-and-why/) pourquoi j’ai développé cette alternative à Karttapullautin.

Cassini est un **programme en ligne de commande**, il s’utilise via un **terminal**. Autrement dit, il n’a pas d’interface graphique avec des fenêtres et des boutons. Cela peut être intimidant pour les utilisateurs non familiers avec l’informatique. Ce tutoriel a pour but d’expliquer **pas à pas** l’utilisation de Karttapullautin pour un utilisateur non initié. Seul prérequis : un PC Windows avec Powershell installé.

> **_Bon à savoir_** : Si les cartes générées à partir de données LiDAR sont d’une **qualité impressionnante**, elles ne remplacent pas le travail d’un **vrai cartographe**. Pensez à embaucher un vrai cartographe de course d’orientation si vous avez besoin d’une **carte de qualité supérieure**.

> **_Attention_** : La possession d’une carte **n’implique pas un droit d’accès à la zone cartographiée**. Avant d’aller sur le terrain, assurez vous d’avoir l’autorisation de son ou ses propriétaires.

> **_Note_** : Cassini est (humblement) baptisé en référence à la Carte de Cassini, première carte topographique du royaume de France réalisée au XVIII ème siècle.

## Installer Cassini

Etant donné qu'il utilise les librairies [PDAL](https://pdal.io) et [GDAL](https://gdal.org) pour une partie des traitements, Cassini est un peu plus complexe à installer que Karttapullautin. Pas de panique, je vous vous explique tout ça pas à pas.

### Installer Docker

La première chose à faire est d'installer [Docker](https://docker.com). Docker est un logiciel qui permet de simplifier la distribution et l'execution de logiciel sur différentes plateformes. Pour cela, rendez vous sur [la page d'accueil de Docker](https://docker.com). Lorsque vous survolez le bouton "Download Docker Desktop", deux versions de Docker pour Windows vous sont proposées : ARM64 et AMD64. 

Pour savoir laquelle choisir, il faut déterminer l'architecture de votre processeur. Pour cela, tapez `Paramètres` dans la barre de recherche Windows. Cliquez sur l'option `Paramètres Système`. Dans la fenêtre qui s'affiche, cliquez sur l'option `Système`. Ensuite, descendez en bas du menu à gauche de la fenêtre, et sélectionnez l'option `À propos de`. Dans le paragraphe `Spécifications de l'appareil`, regardez l'entrée `Type du système` :

- Si elle indique `Système d’exploitation 64 bits, processeur x64`, l'achitecture est AMD64.
- Si elle indique `Système d’exploitation 64 bits, processeur ARM`, l'achitecture est ARM64.

Téléchargez donc la version de Docker correspondant à l'architecture de votre ordinateur. Lorsque l'installeur est téléchargé, éxécutez le et répondez oui à toutes les options d'installation. Il se peut qu'il vous soit demandé de redémarer l'ordinateur.

Une fois l'installation terminée, lancez `Docker Desktop` en cliquant sur l'icône nouvellement crée sur le bureau. À la première ouverture, il vous sera demandé d'accepter des `Conditions générales`. Il vous sera aussi demandé de créer un compte. Passez cette étape et la suivante en cliquant sur `Skip` en haut à droite.

### Installer la commande `cassini`

Pour pouvoir utiliser la commande `cassini` dans Powershell, il va falloir jouer un peu au hacker. Dans un premier temps, il faut autoriser l’exécution des scripts PowerShell. Pour cela, ouvrez Powershell en tant qu'administrateur :
- Tapez `Powershell` dans la barre de recherche
- En bas à gauche du panneau de recherche, cliquez sur `Exécuter en tant qu'administrateur`

Cela aura pour effet d'ouvrir un terminal tout bleu ! Dans ce terminal, copiez/collez et validez :

```sh
set-executionpolicy unrestricted
```

Validez en tapant `O`. Ensuite, copiez/collez et validez :

```sh
if (!(Test-Path -Path $PROFILE)) {
  New-Item -ItemType File -Path $PROFILE -Force
}
```

Et enfin, copiez/collez et validez :

```sh
notepad $PROFILE
```

Cela aura pour effet d'ouvrir un document text. Le document peut être vide ou déja contenir du code. Ajoutez à la fin du document (parès un saut de ligne) :

```sh
function cassini {
  docker run --rm -it --name cassini -v "\${PWD}:/app" nicorio42/cassini $args
}
```

Sauvegardez le document (`CTRL + S`), puis fermez le.

Normalement, la commande `cassini` devrait être installée et disponible dans Powershell. Pour tester, ouvrez un nouveau Powershell (pas besoin de faire ça en tant qu'administrateur) : tapez `Powershell` dans la barre de recherche Windows et cliquez sur le premier résultat. Dans le terminal, copiez/collez et validez :

```sh
cassini --help
```

Comme c'est la première fois que la commande `cassini` est utilisée, elle va commencer par télécharger l'image Docker correspondante. Cela peut prendre un certain temps (et dépend de la vitesse de la connexion internet). Ensuite, le message d'aide de Cassini devrait s'afficher à l'écran :

```sh
A software that generates highly accurate topographic maps from LiDAR data. See documentation: https://cassini-map.com

Usage: cassini [OPTIONS] [FILE_PATH]

Arguments:
  [FILE_PATH]  The LiDAR file path When processing a single file.

Options:
      --batch              Enable batch mode for processing multiple LiDAR files placed in the in directory
      --skip-lidar         Skip the LiDAR processing stage of the pipeline (only if you already ran cassini once with the same input files).
      --skip-vector        Skip the vector processing stage of the pipeline.
      --threads <THREADS>  Number of threads used by Cassini to parallelize the work in batch mode (default 3).
      --default-config     Output a default config.json file.
  -h, --help               Print help (see more with '--help')
  -V, --version            Print version
```

## Le téléchargement des données LiDAR

Rendez-vous sur le [portail de téléchargement du projet LiDAR HD](https://diffusion-lidarhd.ign.fr/). **Zoomez** sur la zone qui vous intéresse, et **sélectionnez les tuiles LiDAR**. Pour cela, trois modes de sélection sont proposés en haut à droite de l’écran :
- Clic
- Polygone
- Rectangle

Une fois les tuiles sélectionnées, **téléchargez les fichiers LiDAR** correspondant. Dépliez l’accordéon `Liste des nuages de points classés`, et cliquez sur les liens affichés. Le temps de téléchargement d'un fichier peut être de plusieurs minutes.

> **_Astuce_** : Vous pouvez aussi télécharger **toutes les tuiles en même temps**. Pour cela, vous devez cliquer sur le bouton `Télécharger la liste des liens`, puis utiliser un outil tel que :
> - wget
> - DownThemAll!
> - Xtreme Download Manager

## La génération de la carte

Créez un dossier n'importe où sur votre ordinateur (disons un dossier `lidar` dans votre dossier `Documents`). Dans ce dossier, créez un autre dossier `in`, et placez-y les fichiers LiDAR préalablement téléchargés.

Ouvrez un terminal Powershell : tapez `Powershell` dans la barre de recherche Windows et cliquez sur le premier résultat. Ensuite, il va falloir naviguer jusqu'au dossier préalablement créé (notre dossier `lidar` dans mes `Documents par exemple`). Pour cela, copiez/collez et validez la commande suivante en replaçant `<CHEMIN_ABSOLU_VERS_DOSSIER_LIDAR>` par le chemin absolu vers votre dossier. Pour obtenir ce chemin, ouvrez le dossier dans l'explorateur de fichier, cliquez sur la barre d'adresse en haut de la fenêtre (sur la partie blanche à droite). Cela aura pour effet de mettre le chemin absolu du dossier en surbrillance, que vous pouvez ainsi copier/coller.

```sh
cd <CHEMIN_ABSOLU_VERS_DOSSIER_LIDAR>
```

Après avoir validé cette commande, le chemin absolu de votre dossier devrait apparaitre à gauche de votre curseur dans le terminal Powershell. Vous pouvez maintenant lancer cassini ! Pour cela, copier/collez et validez la commande suivante :

```sh
cassini --batch
```

La génération de la carte va prendre un peu de temps, en fonction de la puissance de votre ordinateur et de la quantité de fichier LiDAR à traiter. Une fois la génération terminée, si tout s'est bien passé, vous trouverez un dossier `out` avec un fichier `merged-map.png` à l'intérieur !

## Pour aller plus loin

### Accélérer la génération de la carte

### Modifier la paramètres