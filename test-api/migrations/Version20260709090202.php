<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260709120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le champ phone_number sur User et backfill avec des numéros aléatoires';
    }

    public function up(Schema $schema): void
    {
        // 1. Ajout de la colonne (nullable pour le moment)
        $this->addSql('ALTER TABLE "user" ADD phone_number VARCHAR(20) DEFAULT NULL');

        // 2. Backfill des utilisateurs existants avec un numéro aléatoire
        $rows = $this->connection->fetchAllAssociative('SELECT id FROM "user"');

        foreach ($rows as $row) {
            $phone = $this->generateRandomFrenchPhoneNumber();

            $this->addSql(
                'UPDATE "user" SET phone_number = :phone WHERE id = :id',
                ['phone' => $phone, 'id' => $row['id']]
            );
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP phone_number');
    }

    private function generateRandomFrenchPhoneNumber(): string
    {
        $prefix = random_int(0, 1) === 0 ? '06' : '07';
        $suffix = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);

        return $prefix . $suffix;
    }
}