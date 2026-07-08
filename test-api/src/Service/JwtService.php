<?php

namespace App\Service;

use App\Entity\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    public function __construct(
        private readonly string $secret,
    ) {
    }

    /**
     * Génère un token JWT signé pour un utilisateur donné.
     */
    public function generateToken(User $user): string
    {
        $payload = [
            'iat' => time(),           // date d'émission
            'exp' => time() + 3600,    // expiration dans 1h
            'sub' => $user->getId(),   // identifiant de l'utilisateur
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    /**
     * Décode et vérifie un token JWT.
     * Retourne le payload décodé si valide, null sinon (token invalide, expiré, mal signé...).
     */
    public function decodeToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (\Exception $e) {
            return null;
        }
    }
}