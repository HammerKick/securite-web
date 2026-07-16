# Installation et lancement

- Clôner le projet git : https://github.com/HammerKick/securite-web
- Sur postgreSQL, créer la base de données et coller son URL dans .env (DATABASE_URL)
- Générer la clé JWT secrète par le moyen de votre choix puis la coller dans .env (JWT_SECRET)
- Dans le dossier du projet, cd test-api
- symfony server:start
- cd ..
- cd test-product
- npm run dev
- Créez deux comptes utilisateur : test1@gmail.com et test2@gmail.com
- Créez un compte admin admin@gmail.com avec la checkbox Admin (pour les tests)

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
