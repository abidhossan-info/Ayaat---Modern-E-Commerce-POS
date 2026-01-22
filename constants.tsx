
import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  Watch, 
  Camera, 
  Headphones, 
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
  { id: '2', name: 'Phones', slug: 'phones', icon: 'Smartphone' },
  { id: '3', name: 'Audio', slug: 'audio', icon: 'Headphones' },
  { id: '4', name: 'Cameras', slug: 'cameras', icon: 'Camera' },
  { id: '5', name: 'Watches', slug: 'watches', icon: 'Watch' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'MacBook Pro M3 Max',
    description: 'The most advanced chips ever built for a personal computer.',
    price: 3499,
    category: 'laptops',
    image: 'https://picsum.photos/seed/mbp/600/400',
    stock: 12,
    rating: 4.9,
    reviews: 128,
    isNew: true,
    variants: [
      { type: 'Color', options: ['Space Gray', 'Silver'] },
      { type: 'Storage', options: ['1TB', '2TB', '4TB'] }
    ],
    reviewsList: [
      { id: 'r1', userName: 'John Doe', rating: 5, comment: 'Absolutely incredible performance. Worth every penny.', date: 'May 12, 2024' },
      { id: 'r2', userName: 'Sarah Smith', rating: 4, comment: 'Powerful machine, but very expensive.', date: 'June 2, 2024' }
    ]
  },
  {
    id: 'p2',
    name: 'iPhone 15 Pro',
    description: 'Forged in titanium. Features the groundbreaking A17 Pro chip.',
    price: 999,
    category: 'phones',
    image: 'https://picsum.photos/seed/iphone/600/400',
    stock: 45,
    rating: 4.8,
    reviews: 2450,
    discount: 10,
    variants: [
      { type: 'Color', options: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
      { type: 'Storage', options: ['128GB', '256GB', '512GB', '1TB'] }
    ],
    reviewsList: [
      { id: 'r3', userName: 'Mike Ross', rating: 5, comment: 'The camera is phenomenal. Titanium feel is great.', date: 'April 20, 2024' }
    ]
  },
  {
    id: 'p3',
    name: 'Sony WH-1000XM5',
    description: 'Industry leading noise canceling with two processors.',
    price: 398,
    category: 'audio',
    image: 'https://picsum.photos/seed/sony/600/400',
    stock: 28,
    rating: 4.7,
    reviews: 890,
    variants: [
      { type: 'Color', options: ['Black', 'Platinum Silver', 'Midnight Blue'] }
    ],
    reviewsList: [
      { id: 'r4', userName: 'Jane Foster', rating: 5, comment: 'Best noise canceling I have ever used.', date: 'March 15, 2024' }
    ]
  },
  {
    id: 'p4',
    name: 'Fujifilm X-T5',
    description: 'Photography First. High-resolution 40.2MP BSI sensor.',
    price: 1699,
    category: 'cameras',
    image: 'https://picsum.photos/seed/fuji/600/400',
    stock: 5,
    rating: 4.9,
    reviews: 56,
    isNew: true,
    variants: [
      { type: 'Body', options: ['Black', 'Silver'] }
    ]
  },
  {
    id: 'p5',
    name: 'Apple Watch Ultra 2',
    description: 'The most rugged and capable Apple Watch.',
    price: 799,
    category: 'watches',
    image: 'https://picsum.photos/seed/awu/600/400',
    stock: 15,
    rating: 4.6,
    reviews: 432,
    variants: [
      { type: 'Band', options: ['Alpine Loop', 'Trail Loop', 'Ocean Band'] }
    ]
  },
  {
    id: 'p6',
    name: 'Logitech MX Master 3S',
    description: 'An icon remastered. Feel every moment of your workflow.',
    price: 99,
    category: 'accessories',
    image: 'https://picsum.photos/seed/mouse/600/400',
    stock: 120,
    rating: 4.8,
    reviews: 1200,
    variants: [
      { type: 'Color', options: ['Graphite', 'Pale Gray'] }
    ]
  },
  {
    id: 'p7',
    name: 'Dell XPS 13 Plus',
    description: 'Our most powerful 13-inch laptop is twice as powerful.',
    price: 1299,
    category: 'laptops',
    image: 'https://picsum.photos/seed/dell/600/400',
    stock: 18,
    rating: 4.5,
    reviews: 89,
    discount: 15
  },
  {
    id: 'p8',
    name: 'iPad Pro 12.9"',
    description: 'M2 chip. Brilliant 12.9-inch Liquid Retina XDR display.',
    price: 1099,
    category: 'tablets',
    image: 'https://picsum.photos/seed/ipad/600/400',
    stock: 30,
    rating: 4.7,
    reviews: 654,
    variants: [
      { type: 'Connectivity', options: ['Wi-Fi', 'Wi-Fi + Cellular'] }
    ]
  }
];

export const FEATURES = [
  {
    title: 'Fast Delivery',
    description: 'Get your orders in 24-48 hours',
    icon: <Truck className="w-6 h-6" />
  },
  {
    title: 'Secure Payment',
    description: '100% secure payment methods',
    icon: <ShieldCheck className="w-6 h-6" />
  },
  {
    title: 'Top Quality',
    description: 'Carefully selected premium products',
    icon: <Zap className="w-6 h-6" />
  },
  {
    title: '24/7 Support',
    description: 'Professional help always available',
    icon: <ShoppingBag className="w-6 h-6" />
  }
];
