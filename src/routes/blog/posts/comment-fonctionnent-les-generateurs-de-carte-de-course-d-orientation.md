---
title: Comment fonctionne la génération automatiquement de cartes de course d'orientation avec des données LiDAR
description: Tutoriel pour générer une carte de course d'orientation avec Karttapullautin
banner: https://www.ign.fr/files/default/styles/1240_330/public/2023-03/foret_mont_d_ardeche_lidar_bandeau2.jpg?itok=rho5sTwj
date: 2024-06-28
author: Nicolas Rio
draft: true
---

Si vous êtes orienteur ou que vous vous intéressez à la cartographie, vous avez sûrement entendu parler du LiDAR. Derrière cet acronyme mystérieux se cache une technologie permettant (notamment) de faciliter la création de cartes de course d'orientation. Des logiciels tels que [Karttapullautin](https://github.com/rphlo/karttapullautin/tree/master) ou les dernières versions de [OCAD](https://www.ocad.com/en/), permettent de générer automatiquement des cartes seulement à partir de données LiDAR, sans passage d'un cartographe sur le terrain. Ce sont ces solutions qui sont utilisées pour le projet [Mapant.fr](https://mapant.fr).

Dans cet article, je vais essayer de démystifier le processus de génération d'une carte à partir de données LiDAR. Pour comprendre ce qui est dit, il est nécessaire de connaître la légende des cartes de course d'orientation.

Disclaimer :

- Cet article reflète ma compréhension du LiDAR et de ses applications cartographiques. N'étant pas un professionnel du secteur, et ayant appris tout cela par moi même en me documentant sur internet et en expérimentant, les informations et analogies peuvent être erronées. N'hésitez pas à me contacter si vous pensez que certaines parties sont inexactes et doivent être modifiées.
- Les logiciels de génération automatique de carte à partir de donnée LiDAR donnent des résultats impressionnants. Cependant, rien n'égale le travail de relevé et d'interprétation d'un vrai cartographe.
- La possession d'une carte, même autogénérée, n'implique en aucun cas un droit d'accès au terrain. Assurez vous d'avoir l'autorisation du propriétaire de la zone avant d'y mettre les pieds.

## LiDAR, mais encore ?

[LiDAR](https://fr.wikipedia.org/wiki/Lidar) est l'acronyme de "Light Detection and Ranging", soit en français "détection et estimation de la distance par la lumière". La principale application du LiDAR est la télémétrie, c'est à dire la détermination de la distance entre un objet et le capteur. Pour simplifier, on pointe un laser sur un objet, et on mesure le temps que met la lumière pour "rebondir" et revenir jusqu'à l'émetteur. En connaissant la vitesse de la lumière, la position et la direction du dispositif d'émission, on peut déduire la position absolue du "point d'impact".

Pour les applications en topographie telles que le programme [programme LiDAR HD](https://geoservices.ign.fr/lidarhd) de l'[Institut national de l'information géographique et forestière](https://geoservices.ign.fr/lidarhd), le dispositif d’acquisition LiDAR est embarqué dans un avion. Cet avion crible une zone géographique donnée de faiseaux laser en la survolant. En fonction de leur direction, les faiseaux laser sont réfléchis par le sol, la végétation, les bâtiments... Il en résulte un nuage de point brut en 3 dimensions.

![lidar-plane](https://www.ign.fr/files/default/2021-12/09.jpg)

## La classification des points

Une fois ce nuage de points généré, s'en suit une étape dite de classification. Avec différents algorithmes, on vient retrouver sur quoi le point a "rebondi". Ces algorithmes sont plus ou moins complexes, mais on peut imaginer l'idée générale :

- Les points les plus bas correspondent au sol.
- Les points au dessus du sol correspondent à la végétation.

## Les courbes de niveau

Pour générer les courbes de niveau, on utilise les points correspondant au sol. Grâce à ces points, on génère un Modèle Numérique de Terrain (MNT). Cela consiste à découper la zone en petits carrés de taille fixe, et de leur associé l'altitude moyenne des point sol contenu dans ce carré.

Le MNT est ensuite utilisé pour générer les courbes de niveau. Si on représente le MNT par une surface en 3D, les courbes de niveau sont à l'intersection entre cette surface et des plans horizontaux disposés à altitudes régulières.

![Courbes de niveau en 3D](https://upload.wikimedia.org/wikipedia/commons/9/97/Digitales_Gel%C3%A4ndemodell.png)

<a href="https://commons.wikimedia.org/wiki/File:Digitales_Gel%C3%A4ndemodell.png">Original téléversé par Robert Kropf sur Wikipédia allemand.(Texte original : Robert (Computergrafik und Foto))</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.en">CC BY-SA 3.0 DE</a>, via Wikimedia Commons

## Les buttes et dépressions

Pour les buttes et les dépressions, on génère des courbes de niveau avec une équidistance très faible (par exemple 25cm). On cherche ensuite des courbes de niveau concentriques et de petit diamètre (par éxemple moins de 2 mètres). Si les cercles correspondent à des courbes de niveau de plus en plus hautes à mesure quel'on se rapproche du centre, on a détecté une bute. Sinon c'est une dépression.

## Les falaises

Pour les falaises, on commence par calculer un modèle numérique de pente à partir du MNT. On découpe encore la zone en petits carrés de taille fixe, mais cette fois on leur associe la valeur de la pente du terrain. Ensuite, on cherche les carrés ou la pente est presque verticale (supérieure à une valeur limite). Ils correspondent aux falaises sur la carte.

## La végétation

Pour la végétation, on s'intéresse maintenant aux points au dessus de la surface du sol. Ce sont ceux qui ont "rebondi" sur les branches des arbres (les campagnes d'aquisition LiDAR sont réalisées en hiver lorsque les feuilles des arbres sont tombées).

On détermine d'abord les zones découvertes, celles représentées en jaune sur la carte. Ce sont les zones ou il n'y a pas ou très peu de points au dessus du sol.

Pour la forêt et les différents niveaux de vert (correspondant aux différentes densités de végétation), on découpe encore un fois la zone en petits carrés réguliers. On regarde ensuite la densité de points situés au dessus du sol. On regroupe ces densités avec trois niveaux de seuil pour déterminer les zones de blanc, de vert 1, vert 2, et vert 3.

On réalise une opération similaire pour détecter les zones de végétation basse (zone de rayé vert sur la carte), en ne s'intéressant qu'aux points entre 0 et 50cm de hauteur par rapport au sol.

## Les données vectorielles

Pour avoir une carte de course d'orientation "clefs en main", il faut aussi représenter les éléments liés à l'homme. S'il éxiste des algorithmes pour détecter ces éléments à partir de données LiDAR, un bon compromis consite est d'utiliser des données vectorielles issues de bases de données ouvertes. En France, on peut utiliser les données de la BD_TOPO de l'IGN, ou encore celle du projet OpenStreetMap.

## Assemblage et génération de la carte

La dernière étape est l'assemblage de toutes ces données pour générer la carte. Chaque symbole est dessiné sur une image en fonction des données précédemment gérérées.

## Conclusion
