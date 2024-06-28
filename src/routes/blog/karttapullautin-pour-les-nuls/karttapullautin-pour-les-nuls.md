[Karttapullautin](https://github.com/rphlo/karttapullautin) est un logiciel permettant de **générer une carte de [course d’orientation](https://www.ffcorientation.fr/decouvrir/comment/)** (presque) prête à l’emploi à partir de [données LiDAR](https://fr.wikipedia.org/wiki/Lidar) et de fichiers vectoriels. Le projet [LiDAR HD](https://geoservices.ign.fr/lidarhd) de l’[IGN](https://www.ign.fr/) a pour ambition de couvrir la **France entière** en données LiDAR haute définition. La campagne étant déjà aux deux tiers terminée, cela ouvre de nombreuses possibilités de génération de carte de course d’orientation en France !

Il existe d’**autres alternatives à Karttapullautin** pour la génération de cartes à partir de données LiDAR. Notamment, les **dernières versions d’[OCAD](https://www.ocad.com/en/)** (logiciel de cartographie payant) intègrent cette fonctionnalité nativement. Dans le cadre du projet mapant.fr, je développe aussi [mon propre générateur de carte](https://github.com/NicoRio42/map-generator) adapté au traitement distribué de grande quantités de données (le projet est pour l’instant au stade d’expérimentation, utilisez le à vos risques et périls).

Karttapullautin a été créé par le finlandais **Jarkko Ryppo** au début des années 2010. Il était uniquement utilisable sous Windows. Dernièrement, [Raphaël Stefanini](https://www.linkedin.com/in/rphlo/) a repris le projet en **ré-écrivant le code source** dans le [langage Rust](https://www.rust-lang.org/). Cela a eu pour effet de diviser le temps de calcul d’un **facteur 30**, et de rendre le logiciel disponible sur les **plateformes Mac et Linux**.

Karttapullautin est un **programme en ligne de commande**, il s’utilise via un **terminal**. Autrement dit, il n’a pas d’interface graphique avec des fenêtres et des boutons. Cela peut être intimidant pour les utilisateurs non familiers avec l’informatique. Cet article a pour but d’expliquer **pas à pas** l’utilisation de Karttapullautin pour un utilisateur non initié.

> **_Bon à savoir_** : Si les cartes générées à partir de données LiDAR sont d’une **qualité impressionnante**, elles ne remplacent pas le travail d’un **vrai cartographe**. Pensez à embaucher un vrai cartographe de course d’orientation si vous avez besoin d’une **carte de qualité supérieure**.

> **_Attention_** : La possession d’une carte **n’implique pas un droit d’accès à la zone cartographiée**. Avant d’aller sur le terrain, assurez vous d’avoir l’autorisation de son propriétaire.

## Le téléchargement des données LiDAR

Rendez-vous sur le [portail de téléchargement du projet LiDAR HD](https://diffusion-lidarhd.ign.fr/). **Zoomez** sur la zone qui vous intéresse, et **sélectionnez les tuiles LiDAR**. Pour cela, trois modes de sélection sont proposés en haut à droite de l’écran :
- Clic
- Polygone
- Rectangle

Une fois les tuiles sélectionnées, **téléchargez les fichiers LiDAR** correspondant. Dépliez l’accordéon `Liste des nuages de points classés`, et cliquez sur les liens affichés. Le temps de téléchargement est d’**environ 2 minutes** par fichier.

> **_Astuce_** : Vous pouvez aussi télécharger **toutes les tuiles en même temps**. Pour cela, vous devez cliquer sur le bouton `Télécharger la liste des liens`, puis utiliser un outil tel que :
> - wget
> - DownThemAll!
> - Xtreme Download Manager

## Le téléchargement et la préparation des données vectorielles

Pour générer une carte de course d’orientation complète avec Karttapullautin, il faut aussi des **données vectorielles**. En effet, les données LiDAR permettent de générer les courbes de niveau, les buttes, les dépressions, la végétation et les falaises, mais pas les **éléments dus à l’homme** (bâtiments, routes, lignes electriques…). Certains éléments naturels tels que les **rivières et les lacs** sont aussi difficiles à générer à partir des données LiDAR. Pour qu’ils apparaissent sur la carte, il faut donc une **autre source de données**.

Karttapullautin permet l’utilisation de fichiers [ERSI Shapefiles](https://fr.wikipedia.org/wiki/Shapefile) pour l’incorporation de ces données. Ces fichiers peuvent être obtenus à partir de la base de données géographique ouverte [OpenStreetMap](https://www.openstreetmap.org/). Pour les obtenir, rendez vous sur son [portail de téléchargement](https://www.openstreetmap.org/export). **Zoomez** sur la zone pour laquelle vous avez téléchargé les fichiers LiDAR. Dans la barre latérale de gauche, **cliquez** sur `Sélectionnez manuellement une autre zone`. Sélectionnez la zone en prenant de la **marge sur les côtés** et appuyez sur le bouton `Exporter`. Le téléchargement d’un fichier `map.osm` devrait se lancer.

Il faut ensuite transformer ce fichier au format `ESRI Shapefiles`. Pour cela, téléchargez le [logiciel QGIS](https://qgis.org/fr/site/forusers/download.html). Lancez le, et **importez le fichier** `map.osm` en le faisant glisser sur la zone principale de la fenêtre. Une boîte de dialogue s’ouvre, cliquez sur `Ajouter une couche` en bas à droite. **5 lignes** devraient apparaître dans la barre latérale de gauche :
- map – points
- map – other_relations
- map – multipolygons
- map – multilinestrings
- map – lines


![Vue couche de QGIS](/qgis-layers.png)

Pour **chacune de ces lignes** (sauf la ligne “map – other_relations”), vous devez générer un **export Shapefiles**. Pour cela, effectuez un **clic droit** sur la ligne. Dans le menu contextuel, survolez `Exporter`, puis cliquez sur `Sauvegarder les entités sous`. Une **boîte de dialogue s’ouvre**.

Sélectionnez le format `ESRI Shapefiles`. Ensuite, cliquez sur les **trois petits points** à droite du champ `Nom de fichier` et indiquez un **emplacement** sur votre ordinateur et un **nom de fichier**. Enfin, dans le menu `SRC` (Systèmes de Coordonnées de Références), sélectionnez `EPSG:2154 - RGF93 v1 / Lambert 93`. Si l’option n'apparaît pas dans le menu, cliquez sur le petit bouton représentant un **globe terrestre** à droite du champ, pour la sélectionner via la **boîte de dialogue de recherche des SRC**. Cette dernière étape est **très importante**, et les données vectorielles ne s’afficheront pas sur la carte si elle n’est pas réalisée correctement.

![Boîte de dialogue d'export dans QGIS](/qgis-export-dialog.png)

Lorsque vous avez effectué les **4 exports** (points, multipolygons, multilinestrings et lines), ouvrez l’**explorateur de fichier** et rendez vous dans le dossier ou vous avez exporté vos Shapefiles. Il devrait contenir **24 fichiers** avec des extensions barbares (“.cpg”, “.dbf”, “.prj”...). Sélectionnez tous les fichiers et **compressez les dans une archive au format** `.zip` (sous Windows : `CTRL + A`, clic droit, `Envoyer vers`, puis `Dossier compressé`).

> **_Attention_** : il faut que les fichiers Shapefiles soient **à la racine de l’archive**. Une erreur classique est de compresser le dossier contenant les fichiers.

## La configuration et l'exécution de Karttapullautin

Téléchargez l'**exécutable Karttapullautin** correspondant à votre système d’exploitation sur le [site du projet](https://github.com/rphlo/karttapullautin/releases). Décompressez l’archive `.gz` n’importe où sur votre disque dur. Vous devriez obtenir un dossier contenant :
- Un fichier exécutable `pullauta` (ou `pullauta.exe` sous Windows)
- Un fichier `README.md`
- Un fichier `LICENSE`
- Deux fichiers texte `fastighetskartan.txt` et `osm.txt`

**Double cliquez sur l'exécutable** `pullauta`. Cela devrait créer un dossier `temp`, ainsi qu’un fichier de configuration `pullauta.ini`. Ouvrez ce fichier avec un **éditeur de texte** (Bloc-notes sous Windows).

Rendez vous à la **ligne 161** et activez le mode de **traitement en masse** en remplaçant `batch=0` par `batch=1`. Ensuite, rendez vous à la **ligne 164** et ajustez le nombre de “process” en modifiant le chiffre à la fin de la ligne `processes=2`. Ce chiffre correspond au nombre de **tâches en parallèle** qui seront effectuées. Plus ce nombre est élevé, plus la génération de la carte sera **rapide**. Cependant, il doit être **inférieur au nombre de cœurs du microprocesseur** de votre ordinateur. Enfin, rendez vous à la **ligne 178** et ajoutez un `#` devant `vectorconf=`. Puis à la **ligne suivante**, enlevez le `#` au début de `# vectorconf=osm.txt`. **Enregistrez** le fichier pullauta.ini avec ces modifications.

Dans le même dossier, **créez un dossier** nommé `in`. Mettez-y **les fichiers LiDAR** préalablement téléchargés, ainsi que **l'archive** `.zip` contenant vos **fichiers Shapefiles**.

Vous êtes maintenant **prêt à lancer la génération** de la carte ! Pour cela, vous devez **ouvrir un terminal** dans le dossier contenant l'exécutable `pullauta`. Sous Windows, vous pouvez faire ça depuis **l’explorateur de fichier** :
- Cliquez sur la **barre d'adresse** en haut de la fenêtre. Cela devrait mettre l’adresse du dossier en surbrillance.
- Tapez `cmd` puis appuyez sur la touche `Entrée`

Un terminal tout noir devrait s’ouvrir, vous voilà dans **la matrice** !

Tapez `./pullauta` (ou `./pullauta.exe` si vous êtes sous Windows) pour la **lancer la génération**. Elle peut durer **plusieurs heures** en fonction de la quantité de fichiers LiDAR.

## L’assemblage des tuiles

Vous pouvez suivre l’**avancement de la génération** de la carte en regardant les tuiles générées au fur et à mesure dans le dossier `out`.

Une fois la génération **terminée**, vous pouvez **assembler** toutes les tuiles `.png` en **une seule image**. Pour cela, tapez la commande suivant dans le même terminal : `./pullauta pngmergedepr` (ou `./pullauta.exe pngmergedepr` sous Windows). Cela aura pour effet de créer un fichier image `merged_depr.jpg`.

Voilà, vous avez **généré votre carte grâce à Karttapullautin** ! N’hésitez pas à <a href="mailto:contact@mapant.fr">me contacter</a> si certaines étapes de ce tutoriel ne sont pas assez claires. Si vous n’avez pas envie de vous lancer dans ce processus, ou si vous voulez **soutenir le projet mapant.fr**, vous pouvez aussi [contribuer en sélectionnant une zone](/contribute/step-1) sur la carte de France. La zone sera traitée en **priorité** lors de la réalisation du **projet mapant.fr**.
