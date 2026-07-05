export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  desc?: string;
  image?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  images?: string[];
  imageUrls?: string[];
  isNew?: boolean;
  category?: string;
  subcategory?: string;
  sizes?: string[];
  originalPrice?: number | null;
}

export const CATEGORIES = [
  'Women’s & Girls’ Fashion',
  'Men’s & Boys’ Fashion',
  'Electronic Accessories',
  'TV & Home Appliances',
  'Electronics Devices',
  'Mother & Baby',
  'Automotive & Motorbike',
  'Sports & Outdoors',
  'Home & Lifestyle',
  'Groceries',
  'Health & Beauty',
  'Watches, Bags & Jewellery',
  'Pet Care',
  'Books & Stationery',
  'Kitchen & Dining',
  'Furniture',
  'Toys & Games',
  'Mobile & Gadgets',
  'Tools & Hardware',
  'Gift & Seasonal Items'
] as const;

export const CATEGORY_MAP: Record<string, string[]> = {
  'Women’s & Girls’ Fashion': [
    'Sarees & Lehengas', 
    'Kurtis & Shalwar Kameez', 
    'Western Wear', 
    'Hijabs & Abayas', 
    'Bags & Purses', 
    'Ladies Shoes', 
    'Cosmopolitan Jewellery'
  ],
  'Men’s & Boys’ Fashion': [
    'T-Shirts & Polos', 
    'Premium Shirts', 
    'Panjabi & Pajama', 
    'Jeans & Gabardine', 
    'Men\'s Shoes', 
    'Watches & Luxury Accessories'
  ],
  'Electronic Accessories': [
    'Mobile Accessories', 
    'Audio & Headphones', 
    'Power Banks & Chargers', 
    'Memory Cards & Storage', 
    'Smart Bands & Fitness Tracker'
  ],
  'TV & Home Appliances': [
    'Smart TVs', 
    'Refrigerators & Freezers', 
    'Air Conditioners', 
    'Washing Machines', 
    'Microwaves & Ovens', 
    'Blenders & Rice Cooker'
  ],
  'Electronics Devices': [
    'Smartphones', 
    'Laptops & MacBooks', 
    'Desktops & Monitors', 
    'Tablets & iPads', 
    'Gaming Consoles', 
    'Cameras & Optics', 
    'Audio & Soundbars', 
    'Projectors', 
    'Trendy Mobile Accessories'
  ],
  'Mother & Baby': [
    'Baby Clothing', 
    'Diapers & Wipes', 
    'Baby Food & Feeding', 
    'Baby Stroller & Gear', 
    'Educational Baby Toys'
  ],
  'Automotive & Motorbike': [
    'Motorcycles & Scooters', 
    'Car Accessories', 
    'Helmets & Riding Gear', 
    'Engine Oils', 
    'Vehicle Parts'
  ],
  'Sports & Outdoors': [
    'Fitness & Gym Accessories', 
    'Cricket & Football Gear', 
    'Cycling & Bicycles', 
    'Tents & Outdoor Recreation', 
    'Sports Apparel & Shoes'
  ],
  'Home & Lifestyle': [
    'Bedding & Linens', 
    'Home Decor Items', 
    'LED & Accent Lighting', 
    'Smart Organizers', 
    'Aromatic Oil & diffusers'
  ],
  'Groceries': [
    'Rice, Grains & Pulses', 
    'Pure Oils & Ghee', 
    'Snacks & Cookies', 
    'Beverages & Fruits Juice', 
    'Dairy & Butter', 
    'Lustrous Spices'
  ],
  'Health & Beauty': [
    'Premium Skincare', 
    'Hair Care Essential', 
    'Aesthetic Makeup', 
    'Royal Fragrances', 
    'Trimmers & Personal Care'
  ],
  'Watches, Bags & Jewellery': [
    'Men\'s Watches', 
    'Women\'s Watches', 
    'Premium Backpacks', 
    'Leather Wallets', 
    'Gold & Diamond Jewellery'
  ],
  'Pet Care': [
    'Premium Cat Food', 
    'Dog Treat & Food', 
    'Pet Toys & Grooming', 
    'Aquarium & Bird Acc.'
  ],
  'Books & Stationery': [
    'Academic & Job Prep', 
    'Novels & Story Books', 
    'School Supplies', 
    'Aesthetic Journals & Notebooks'
  ],
  'Kitchen & Dining': [
    'Non-stick Cooktech', 
    'Premium Dinnerware', 
    'Japanese Knife Sets', 
    'Kitchen Tools'
  ],
  'Furniture': [
    'Executive Desks', 
    'Ergonomic Chairs', 
    'Luxury Beds', 
    'Wardrobes & Almirah', 
    'Cozy Sofas'
  ],
  'Toys & Games': [
    'Action & Figurine', 
    'Board Games & Chess', 
    'Remote Control Cars', 
    'Puzzles & Mind Games'
  ],
  'Mobile & Gadgets': [
    'High-End Smartphones', 
    'Feature Phones', 
    'Aesthetic Phone Cases', 
    'Smart Gadgets'
  ],
  'Tools & Hardware': [
    'Advanced Handtools', 
    'Electric Drill & Powertools', 
    'Safety & Protection Wear'
  ],
  'Gift & Seasonal Items': [
    'Birthday & Anniversary', 
    'Eid Festivity Special', 
    'Corporate Luxury Gifts', 
    'Gift Wraps & Greetings Card'
  ]
};

export interface Order {
  id?: string;
  productName: string;
  productPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'COD' | 'Bkash' | 'Nagad' | 'Bank';
  transactionId: string;
  status: 'Pending' | 'Delivered' | string;
  time: number;
  quantity?: number;
  color?: string;
  selectedSize?: string;
  deliveryLocation?: string;
  deliveryCharge?: number;
  totalAmount?: number;
  items?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    color: string;
    selectedSize?: string;
    image?: string;
  }[];
}

export interface PaymentSettings {
  bkash?: string;
  nagad?: string;
  bank?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  deliveryInside?: number | string;
  deliveryOutside?: number | string;
  insideDhaka?: number | string;
  outsideDhaka?: number | string;
  delivery_inside?: number | string;
  delivery_outside?: number | string;
  inside_dhaka?: number | string;
  outside_dhaka?: number | string;
  insideDhakaFee?: number | string;
  outsideDhakaFee?: number | string;
  footerDeveloperName?: string;
  footerWhatsapp?: string;
  footerEmail?: string;
  footerOfficeAddress?: string;
  footerTagline?: string;
  footerFacebook?: string;
}

export type TabType = 'shop' | 'profile' | 'history' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: number;
  role: 'customer' | string;
  photoURL?: string;
}

export interface CartItem {
  id: string; // generated using product.id + '-' + color + '-' + selectedSize
  product: Product;
  quantity: number;
  color: string;
  selectedSize?: string;
}

export interface ChatSession {
  id?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  lastMessage: string;
  lastActive: number;
  unreadByAdmin: boolean;
  unreadByCustomer: boolean;
  isGuest: boolean;
  expireAt?: any; // Firebase Timestamp or Date
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}
