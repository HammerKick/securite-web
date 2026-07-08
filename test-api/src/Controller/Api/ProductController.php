<?php

namespace App\Controller\Api;

use App\Entity\Product;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class ProductController extends AbstractController
{
    #[Route('/api/products/getAllProducts', methods: ['GET'])]
    public function getAllProducts(EntityManagerInterface $entityManager): JsonResponse
    {
        $products = $entityManager->getRepository(Product::class)->findAll();

        return $this->json(['products' => $products], 200);
    }

    #[Route('/api/products/getProductById/{id}', methods: ['GET'])]
    public function getProductById(EntityManagerInterface $entityManager, int $id): JsonResponse
    {
        $product = $entityManager->getRepository(Product::class)->find($id);

        if (!$product) {
            return $this->json(['error' => 'Product not found'], 404);
        }

        return $this->json(['product' => $product], 200);
    }

    #[Route('/api/products/addProduct', methods: ['POST'])]
    public function addProduct(EntityManagerInterface $entityManager, Request $request): JsonResponse
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

        return $this->json([
            'message' => 'Product added successfully',
            'product' => $product
        ], 201);
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