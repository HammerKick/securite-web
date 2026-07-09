<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\Product;
use App\Entity\User;
use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class OrderController extends AbstractController
{
    #[Route('/order', name: 'app_order_list', methods: ['GET'])]
    public function index(OrderRepository $orderRepository): JsonResponse
    {
        $orders = $orderRepository->findAll();

        $data = array_map(fn(Order $o) => [
            'id' => $o->getId(),
            'date' => $o->getDate()?->format('Y-m-d H:i:s'),
            'user_id' => $o->getUserId()?->getId(),
            'product_id' => $o->getProduct()?->getId(),
        ], $orders);

        return $this->json($data);
    }

        #[Route('/order/{id}', name: 'app_order_show', methods: ['GET'])]
        public function show($id, EntityManagerInterface $em): JsonResponse
        {

            $conn = $em->getConnection();
            $sql = "SELECT * FROM `order` WHERE id = " . $id;
            $result = $conn->executeQuery($sql)->fetchAssociative();

            if (!$result) {
                return $this->json(['error' => 'Not found'], 404);
            }

            return $this->json($result);
        }

    #[Route('/order', name: 'app_order_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $order = new Order();
        $order->setDate(new \DateTime($data['date'] ?? 'now'));

        $user = $em->getRepository(User::class)->find($data['user_id']);
        $product = $em->getRepository(Product::class)->find($data['product_id']);

        $order->setUserId($user);
        $order->setProduct($product);

        $em->persist($order);
        $em->flush();

        return $this->json(['id' => $order->getId()], 201);
    }

    #[Route('/order/{id}', name: 'app_order_update', methods: ['PUT'])]
    public function update(int $id, Request $request, OrderRepository $orderRepository, EntityManagerInterface $em): JsonResponse
    {
        $order = $orderRepository->find($id);

        if (!$order) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['date'])) {
            $order->setDate(new \DateTime($data['date']));
        }
        if (isset($data['user_id'])) {
            $order->setUserId($em->getRepository(User::class)->find($data['user_id']));
        }
        if (isset($data['product_id'])) {
            $order->setProduct($em->getRepository(Product::class)->find($data['product_id']));
        }

        $em->flush();

        return $this->json(['message' => 'Updated']);
    }

    #[Route('/order/{id}', name: 'app_order_delete', methods: ['DELETE'])]
    public function delete(int $id, OrderRepository $orderRepository, EntityManagerInterface $em): JsonResponse
    {
        $order = $orderRepository->find($id);

        if (!$order) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $em->remove($order);
        $em->flush();

        return $this->json(['message' => 'Deleted']);
    }
}