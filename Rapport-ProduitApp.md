## Application Test Product

Application simple de commande de produits divers

- L'utilisateur crée son compte puis peut commander des produits, commandes qu'il peut supprimer à tout moment
- L'admin peut créer des produits supplémentaires et a accès aux commandes de tous les utilisateurs

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
  Un souci similaire se présente sur les utilisateurs, les produits ne sont pas concernés car tout est public par défaut sans informations sensibles
- XSS : le champ commentaire autorise du JavaScript, par exemple avec <img src=x onerror="document.title='Pwned: ' + localStorage.getItem('token')"> on peut se mettre dans le titre le token d'authentification et récupérer les infos (voir xss-injection à la racine) - la raison est qu'il s'agit de dangerouslySetInnerHTML qui, comme son nom l'indique, est dangereux et peut permettre des libertés non prévues pour l'utilisateur
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

$ curl -i "http://localhost:8000/api/users/1%20OR%201=1" -H "Authorization: Bearer TOKEN"
ZU51bWJlciI6IjA2MDgzNzYxMjgifQ.kmDcjgWo_2kMCxm7NQI6kqNCHej1qR1t_3PemUdlBDI";e231a538-4a9e-4862-82db-72d0be388b49HTTP/1.1 200 OK
Cache-Control: no-cache, private
Content-Type: application/json
Date: Fri, 10 Jul 2026 10:25:00 GMT
X-Powered-By: PHP/8.5.7
X-Robots-Tag: noindex
Content-Length: 1220

[{"id":1,"email":"toitoinne@gmail.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$c7OMhz4cgpOcf2j.GbUq2.w6HNa9x63BZ8w0LfyIWfz6\/TaLJsMZG","phone_number":"0694960248"},{"id":2,"email":"test3@gmail.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$djRpDMp6xpNMua7bxjTrI.ZPQ40GmdKb3Q2l3EeYUL30f1hqKeAry","phone_number":"0731881633"},{"id":3,"email":"aa@gmail.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$gl9SdY.lVSOonBFbcx0ZaODdLZJjev7nzu.Co9kyspHoaYmeqFXTi","phone_number":"0721658987"},{"id":5,"email":"test2@gmail.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$M5\/lUOnZZQsjtm5XWAjPauHzo\/kDXVfEFc9HsF3cGJSeeNiyW6Sja","phone_number":"0650633718"},{"id":6,"email":"admin@gmail.com","roles":"[\u0022ROLE_USER\u0022,\u0022ROLE_ADMIN\u0022]","password":"$2y$13$RSq0NsWnZ1dxOiw3XV5JdutWA\/LWmupeb5.q4luFYyFix6JVXUJT.","phone_number":"0743668018"},{"id":4,"email":"test1@gmail.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$8dlLuhOvu9m1L5JV4mX.LubLWw3WOlzcHSjNC7iwa82DuDhS5Ng0S","phone_number":"0608376128"},{"id":7,"email":"testuser@test.com","roles":"[\u0022ROLE_USER\u0022]","password":"$2y$13$uqSK.SkUy5tGCEXA5u3CmOlGBWte601QTUNBzltXdAIvdxKCT2KXC","phone_number":null}]

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
   -H "Authorization: Bearer TOKEN" \
   -d '{"roles": ["ROLE_ADMIN"]}'

  Le résultat : un 200 qui ajoute le rôle admin à l'utilisateur, ce qui lui donne accès aux commandes admin de création de produit, à la liste complète des commandes sur l'interface mais aussi aux infos utilisateurs

# Corrections appliquées

Pour tous les CURL, penser à se log via :
curl -s -X POST http://127.0.0.1:8000/api/login \
 -H "Content-Type: application/json" \
 -d '{"username":"test1@gmail.com","password":"123"}'
Pour être en utilisateur

- Broken Access Control : ajout d'une vérification du rôle en backend, l'API REST Symfony fait un findAll si l'user est admin, sinon il fait un findBy en passant par l'id utilisateur, voir capture fix broken access control.png
  Même correctif pour l'utilisateur avec la même vérification de rôle en backend, aucun correctif pour les Produits où tout est accessile par défaut avec aucune donnée sensible

- XSS : changement de balise, retrait du dangerouslySetInnerHTML pour un span, plus de javascript exécutable (voir xss-fix.png)

- Injection SQL : retrait dans le backend des query SQL en dur et utilisation de l'ORM de Symfony, ajout de restrictions dans le security.yaml pour une deuxième couche de protection : un CURL avec injection SQL renvoie désormais une erreur 403
  curl -i "http://localhost:8000/api/users/1%20OR%201=1" -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODM2NzAxNTcsImV4cCI6MTc4MzY3Mzc1Nywic3ViIjo0LCJlbWFpbCI6InRlc3QxQGdtYWlsLmNvbSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJwaG9uZU51bWJlciI6IjA2MDgzNzYxMjgifQ.3b3I0CprFpDmetmWl1L7Qsglmp2RpgnJeHa6rGpHbcw"
  Ceci renvoie une erreur 403 Forbidden : plus d'injection possible, il faut être admin pour espérer quoi que ce soit

- Mass Assignment : pas de modification de rôle si on est pas admin, c'est le même correctif que sur le Broken Access Control où il faut appliquer quelque chose de similaire au backend
  curl -i -X PUT http://127.0.0.1:8000/api/users/4 \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer TOKEN" \
   -d '{"roles": ["ROLE_ADMIN"]}'
  Ceci renvoie une erreur 403 : plus de changement de rôle possible sans être administrateur
- Token en localStorage : retrait de notion de Token en front pour que tout soit géré par cookie et via le backend (appel d'api /api/me)
  Globalement, on génère toujours le token mais cette fois c'est un cookie qui le gère et qui est envoyé en front : plus d'affichage en localStorage et l'app fonctionne de la même manière

  Dans l'API Rest ça donne ça :
  $response->headers->setCookie(
            Cookie::create('token')
                ->withValue($token)
  ->withHttpOnly(true)
  ->withSecure($this->getParameter('kernel.environment') === 'prod')
  ->withSameSite(Cookie::SAMESITE_LAX)
  ->withPath('/')
  ->withExpires(time() + 3600)
  );

Voir "token plus en local storage.png"

- Information Disclosure : tout simplement passer les requêtes vers l'API en HTTPS ce qui automatiquement chiffre le mot de passe
  En environnement de dev ce n'est pas quelque chose de faisable mais en production par contre il faudra bien penser à faire la modification
