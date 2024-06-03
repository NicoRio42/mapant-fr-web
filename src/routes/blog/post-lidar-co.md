# Comment générer automatiquement une carte de course d'orientation avec des données LiDAR

Si vous êtes orienteur et que vous vous intéressez à la cartographie, vous avez sûrement entendu parlé du LiDAR. Derière cet acronyme mystérieux se cache une technologie permettant de grandement faciliter la création de cartes de course d'orientation. Il éxiste même des solutions pour générer automatiquement des cartes seulement à partir de ces données, sans passage d'un cartogrpahe sur le terrain. Les cartes qui en résultent, même si leur qualité n'égale pas le travail d'un vrai cartographe, permettent de se faire une idée du terrain.

Dans cet article, je vais essayer de vous expliquer comment fonctionne le processus de génération d'une carte à partir de données LiDAR. Pour comprendre ce qui est dit, il est nécessaire de connaitre la légende des cartes de course d'orientation.

## Le LiDAR kesako

[LiDAR](https://fr.wikipedia.org/wiki/Lidar){target=_blank} est l'acronyme de "light detection and ranging", soit en français "détection et estimation de la distance par la lumière". La principale application du LiDAR est la télémétrie, c'est à dire la détermination de la distance d’un objet. Pour simplifier, on pointe un laser sur un objet, et on mesure le temps que met la lumière pour "rebondir" et revenir jusqu'à l'émetteur. En connaissant la vitesse de la lumière, la position et la direction du dispositif d'émission, on peut déduire la position absolue du "point d'impact".

Pour les applications en topographie telles que le programme [programme LiDAR HD](https://geoservices.ign.fr/lidarhd){target=_blank} de l'[Institut national de l'information géographique et forestière](https://geoservices.ign.fr/lidarhd){target=_blank}, le dispositif d'aquisition LiDAR est embarqué dans un avion. Cet avion survole un zone géographique donnée, et la "bombarde" avec des faiseaux laser. En fonction de leur direction, ceux-ci sont réfléchis par le sol, la végétation, les bâtiments... Il en résulte un nuage de point brute en 3 dimensions.

## La classification des points

Une fois ce nuage de points généré, s'en suit une étape dite de classification. Avec différents algorithmes, on vient retrouver sur quoi le point a "rebondi". Ces algorithmes sont plus ou moins complexes, mais on peut imaginer l'idée générale :
- Les points les plus bas correspondent au sol.
- Les points au dessus du sol correspondent à la végétation.

## Les courbes de niveau

Pour générer les courbes de niveau, on utilise les points correspondant au sol. Grâce à ces points, on génère un Model Numérique de Terrain (MNT). Cela consiste à découper la zone en petits carrés de taille fixe, et de leur associé l'altitude moyenne des point sol contenu dans ce carré (encore une fois je simplifie).

Le MNT est ensuite utilisé pour générer les courbes de niveau. Si on représente le MNT par une surface en 3D, les courbes de niveau sont à l'intersection entre cette surface et des plans horizontaux disposés à altitudes régulières.

## Les butes et dépressions

Pour les buttes et les dépressions, on génère des courbes de niveau avec une équidistance très faible (par éxemple 25cm). On cherche ensuite des courbes de niveau concentriques et de petit diamètre (par éxemple moins de 2 mètres). Si les cercles correspondent à des courbes de niveau de plus en plus hautes à mesure quel'on se rapproche du centre, on a détecté une bute. Sinon c'est une dépression.

## Les falaises

Pour les falaises, on commence par calculer un modèle numérique de pente à partir du MNT. On découpe encore la zone en petits carrés de taille fixe, mais cette fois on leur associe la valeur de la pente du terrain. Ensuite, on cherche les carrés ou la pente est preque verticale (supérieure à une valeur limite). Ils correspondent aux falaises sur la carte.

## La végétation

Pour la végétation, on s'intéresse maintenant aux points au dessus de la surface du sol. Ce sont ceux qui ont "rebondi" sur les branches des arbres (les campagnes d'aquisition LiDAR sont réalisées en hiver lorsque les feuilles des arbres sont tombées).

On détermine d'abord les zones découvertes, celles représentées en jaune sur la carte. Vous l'aurez compris, ce sont les zones ou il n'y a pas ou très peux de points au dessus du sol.

Pour la forêt et les différents niveaux de vert (correspondant aux différentes densités de végétation), on découpe encore un fois la zone en petits carrés réguliers. On regarde ensuite la densité de points situés entre 0 et 2 mètres de hauteur par rapport au sol. On regroupe ces densités en 4 fourchettes pour déterminer les zones de blanc, de vert 1, vert 2, et vert 3.

On réalise une opération similaire pour détecter les zones de végétation basse (zone de rayé vert sur la carte), en ne s'intéressant qu'aux points entre 0 et 50cm de hauteur par rapport au sol.

## Les données vectorielles

Pour avoir une carte de course d'orientation "clefs en main", il faut aussi représenter les éléments créés par l'homme. S'il éxiste des algorithmes pour détecter ces éléments à partir de données LiDAR, un bon compromis consites à utiliser des données vectorielles issues de bases de données ouvertes. En France, on peut utiliser les données de la BD_TOPO de l'IGN, ou encore celle du projet OpenStreetMap.

## Assemblage et génération de la carte

La dernière étape est l'assemblage de toutes ces données pour générer la carte. Chaque symbole est dessiné sur une image en fonction des données précédemment gérérées.

## Conclusion