<?php

namespace App\Controller\Api;

use App\Entity\Product;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

final class ProductController extends AbstractController
{
    #[Route('/api/products/getAllProducts', methods: ['GET'])]
    public function getAllProducts(EntityManagerInterface $entityManager, SerializerInterface $serializer): JsonResponse
    {
        $products = $entityManager->getRepository(Product::class)->findAll();

        $json = $serializer->serialize(
            ['products' => $products],
            'json',
            ['groups' => ['product:read']]
        );

        return new JsonResponse($json, 200, [], true);
    }

        #[Route('/api/products/getProductById/{id}', methods: ['GET'])]
        public function getProductById(EntityManagerInterface $entityManager, $id): JsonResponse
        {

            $conn = $entityManager->getConnection();
            $sql = "SELECT * FROM product WHERE id = " . $id;
            $product = $conn->executeQuery($sql)->fetchAssociative();

            if (!$product) {
                return $this->json(['error' => 'Product not found'], 404);
            }

            return $this->json(['product' => $product]);
        }

    #[Route('/api/products/addProduct', methods: ['POST'])]
    public function addProduct(EntityManagerInterface $entityManager, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Invalid or missing JSON body'], 400);
        }

        if (empty($data['name']) || !isset($data['price'], $data['is_available'])) {
            return $this->json(['error' => 'Missing required fields: name, price, is_available'], 400);
        }

        $product = new Product();
        $product->setName($data['name']);
        $product->setPrice($data['price']);
        $product->setIsAvailable($data['is_available']);

        $entityManager->persist($product);
        $entityManager->flush();

        $json = $serializer->serialize(
            ['message' => 'Product added successfully', 'product' => $product],
            'json',
            ['groups' => ['product:read']]
        );

        return new JsonResponse($json, 201, [], true);
    }

    #[Route('/api/products/deleteProduct/{id}', methods: ['DELETE'])]
    public function deleteProduct(EntityManagerInterface $entityManager, int $id): JsonResponse
    {
        $product = $entityManager->getRepository(Product::class)->find($id);

        if (!$product) {
            return $this->json(['error' => 'Product not found'], 404);
        }

        $entityManager->remove($product);
        $entityManager->flush();

        return $this->json(['message' => 'Product deleted successfully'], 200);
    }
}