![enter image description here](https://raw.githubusercontent.com/Spikharpax/Avatar-Serveur/master/logo/Avatar.jpg)
![enter image description here](https://www.tienda24hs.com/WebRoot/StoreES/Shops/62148069/5782/5AEA/7466/642A/6979/C0A8/2AB9/A214/Hogar-inteligente-fibaro-tienda24hs.jpg)

**Fonctions :**

-   Allume / Ouvre / Eteint / Ferme + ( module + pièce ).

**EX :**

- Allume la lumière du salon
- Eteint la cafetière de la cuisine
- Ferme les volets de la chambre.

**Configuration :**

Dans le fichier fibaro.prop

      "ip": "192.168.X.X",
      "port": 80,
      "user": "USER",
      "password": "PASSWORD",
	
	  "node":{
	  "displayNode":true ou false 			(Permet d'afficher une icône sur l'interface du serveur correspondant au module de votre hc2)
	  "delNodeAfterCommand":true ou false   (Efface l'icone de l'interface du serveur après une commande de fermeture ou extinction)
	},	
		
**Version :**

Version 1.3 (10-04-2019)

- [x] Selon paramètre ajout d'un node par module sur le serveur.
- [x] Selon paramètre lors de la fermeture supprime le node (module)
- [x] l'icône du module est celui paramètré dans votre homecenter :)
- [x] Chaque modules affichés à un menu contextuel pour commander l'appareil correspondant.

Version 1.0 (24-09-2018)

- [x] Allumer / Eteindre un module 
- [x] Demander le statut d'un module

