import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Lightbulb, Plus, HelpCircle, ExternalLink, ChevronDown, Search, Loader2, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { Store } from '@/lib/types';
import { SubscriptionTier } from '@/lib/constants';

interface AddStoreModalProps {
  store?: Store;
  tier?: SubscriptionTier;
  onClose: () => void;
  onSave: (store: Store | Omit<Store, 'id'>) => void;
}

const BUSINESS_TYPES = [
  // Food & Beverage
  'Restaurant', 'Cafe', 'Bar', 'Bakery', 'Food Truck', 'Pizzeria', 'Sushi Bar', 
  'Ice Cream Shop', 'Brewery', 'Winery', 'Juice Bar', 'Deli', 'Steakhouse',
  'Seafood Restaurant', 'BBQ Restaurant', 'Mexican Restaurant', 'Italian Restaurant',
  'Chinese Restaurant', 'Thai Restaurant', 'Indian Restaurant', 'Vietnamese Restaurant',
  'Greek Restaurant', 'Mediterranean Restaurant', 'Brunch Spot', 'Donut Shop',
  'Bagel Shop', 'Smoothie Shop', 'Tea House', 'Bubble Tea', 'Dessert Shop',
  // Retail - Food & Beverage
  'Liquor Store', 'Wine Shop', 'Grocery Store', 'Supermarket', 'Convenience Store',
  'Butcher Shop', 'Seafood Market', 'Specialty Food Store', 'Health Food Store',
  'Candy Store', 'Chocolate Shop',
  // Smoke & Vape
  'Smoke Shop', 'Vape Shop', 'CBD Store', 'Dispensary',
  // Health & Beauty
  'Salon', 'Barbershop', 'Spa', 'Nail Salon', 'Med Spa', 'Massage Therapy',
  'Tattoo Parlor', 'Tanning Salon', 'Skincare Clinic', 'Lash Studio', 'Brow Bar',
  'Waxing Studio', 'Hair Extensions', 'Wig Shop', 'Beauty Supply',
  // Automotive
  'Auto Shop', 'Car Wash', 'Auto Detailing', 'Tire Shop', 'Body Shop',
  'Oil Change', 'Car Dealership', 'Motorcycle Shop', 'Auto Parts Store',
  'Transmission Shop', 'Muffler Shop', 'Towing Service', 'Car Rental',
  // Fitness & Recreation
  'Gym', 'Yoga Studio', 'Pilates Studio', 'CrossFit', 'Martial Arts',
  'Dance Studio', 'Golf Course', 'Bowling Alley', 'Rock Climbing Gym',
  'Swimming Pool', 'Tennis Club', 'Boxing Gym', 'Spin Studio', 'Barre Studio',
  // Retail
  'Retail Store', 'Boutique', 'Jewelry Store', 'Florist', 'Pet Store',
  'Bookstore', 'Gift Shop', 'Furniture Store', 'Electronics Store',
  'Hardware Store', 'Sporting Goods', 'Bicycle Shop', 'Outdoor Store',
  'Thrift Store', 'Consignment Shop', 'Antique Store', 'Art Gallery',
  'Frame Shop', 'Music Store', 'Video Game Store', 'Comic Book Store',
  'Toy Store', 'Baby Store', 'Bridal Shop', 'Shoe Store', 'Sunglasses Store',
  'Watch Store', 'Luggage Store', 'Mattress Store', 'Appliance Store',
  'Lighting Store', 'Rug Store', 'Kitchen Store', 'Bath Store',
  // Pet Services
  'Pet Groomer', 'Dog Trainer', 'Pet Boarding', 'Doggy Daycare', 'Pet Sitter',
  // Services
  'Dry Cleaner', 'Laundromat', 'Tailor', 'Locksmith', 'Moving Company',
  'Storage Facility', 'Printing Shop', 'Shipping Store', 'Notary',
  'Shoe Repair', 'Watch Repair', 'Phone Repair', 'Computer Repair',
  'Appliance Repair', 'Jewelry Repair', 'Alterations',
  // Professional Services
  'Law Firm', 'Accounting Firm', 'Insurance Agency', 'Real Estate Agency',
  'Marketing Agency', 'Photography Studio', 'Consulting Firm', 'Tax Preparer',
  'Financial Advisor', 'Mortgage Broker', 'Travel Agency', 'Staffing Agency',
  'Web Design Agency', 'IT Services', 'Security Company',
  // Healthcare
  'Dental Office', 'Chiropractor', 'Optometrist', 'Veterinarian',
  'Physical Therapy', 'Urgent Care', 'Pharmacy', 'Medical Clinic',
  'Mental Health', 'Dermatologist', 'Pediatrician', 'OB-GYN',
  'Orthopedic', 'Hearing Aid', 'Home Health Care', 'Senior Care',
  // Home Services
  'Plumber', 'Electrician', 'HVAC', 'Landscaping', 'Cleaning Service',
  'Pest Control', 'Roofing', 'Painting', 'Handyman', 'Carpet Cleaning',
  'Window Cleaning', 'Pressure Washing', 'Pool Service', 'Garage Door',
  'Fence Company', 'Tree Service', 'Lawn Care', 'Sprinkler Service',
  'Flooring', 'Countertops', 'Cabinet Maker', 'General Contractor',
  // Entertainment & Events
  'Movie Theater', 'Arcade', 'Escape Room', 'Comedy Club', 'Music Venue',
  'Night Club', 'Karaoke Bar', 'Pool Hall', 'Mini Golf', 'Go Karts',
  'Trampoline Park', 'Laser Tag', 'Amusement Park', 'Water Park',
  'Event Venue', 'Wedding Venue', 'Banquet Hall', 'Party Rental',
  'DJ Service', 'Photo Booth', 'Caterer', 'Event Planner', 'Wedding Planner',
  // Hospitality
  'Hotel', 'Bed & Breakfast', 'Vacation Rental', 'Motel', 'Resort', 'Hostel',
  // Education & Childcare
  'Tutoring Center', 'Music School', 'Driving School', 'Language School',
  'Daycare', 'Preschool', 'After School Program', 'Summer Camp',
  'Art School', 'Cooking Class', 'Dance School', 'Swim School',
  // Financial
  'Bank', 'Credit Union', 'Check Cashing', 'Pawn Shop', 'Gold Buyer',
  // Other
  'Other'
];

// Maximum character limit for review guidance
const REVIEW_GUIDANCE_MAX_LENGTH = 500;

const keywordSuggestions: Record<string, string[]> = {
  // Food & Beverage
  'Restaurant': [
    'dinner', 'lunch', 'breakfast', 'brunch', 'takeout', 'delivery', 'dine-in', 'reservations', 'outdoor seating', 'patio',
    'family dining', 'date night', 'happy hour', 'private dining', 'catering', 'buffet', 'kids menu', 'vegetarian', 'vegan', 'gluten-free',
    'fast service', 'good portions', 'fresh food', 'homemade', 'local ingredients', 'daily specials', 'full bar', 'wine list', 'craft cocktails', 'beer',
    'parking', 'wheelchair accessible', 'pet friendly', 'late night', 'early bird', 'group dining', 'birthday', 'anniversary', 'business lunch', 'casual dining',
    'fine dining', 'comfort food', 'healthy options', 'organic', 'farm to table', 'seasonal menu', 'chef special', 'tasting menu', 'prix fixe', 'open kitchen'
  ],
  'Cafe': [
    'coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'cold brew', 'iced coffee', 'tea', 'matcha', 'chai',
    'pastries', 'croissants', 'muffins', 'scones', 'bagels', 'sandwiches', 'salads', 'soup', 'breakfast', 'brunch',
    'wifi', 'study spot', 'work friendly', 'outlets', 'quiet', 'outdoor seating', 'patio', 'drive thru', 'mobile order', 'pickup',
    'oat milk', 'almond milk', 'soy milk', 'dairy free', 'vegan', 'gluten free', 'organic', 'fair trade', 'local roast', 'fresh baked',
    'early morning', 'open late', 'weekend hours', 'parking', 'cozy', 'clean', 'fast service', 'friendly staff', 'loyalty program', 'gift cards'
  ],
  'Bar': [
    'cocktails', 'beer', 'wine', 'whiskey', 'vodka', 'tequila', 'rum', 'gin', 'bourbon', 'scotch',
    'draft beer', 'craft beer', 'local beer', 'imported beer', 'wine list', 'happy hour', 'drink specials', 'shots', 'margaritas', 'martinis',
    'sports bar', 'live music', 'DJ', 'dancing', 'karaoke', 'trivia night', 'pool table', 'darts', 'arcade', 'patio',
    'late night', 'open late', 'food menu', 'appetizers', 'wings', 'burgers', 'nachos', 'kitchen open late', 'full menu', 'bar food',
    'rooftop', 'outdoor', 'private events', 'bachelor party', 'bachelorette', 'birthday', 'group friendly', 'reservations', 'VIP', 'bottle service'
  ],
  'Bakery': [
    'bread', 'cakes', 'cupcakes', 'cookies', 'pastries', 'croissants', 'donuts', 'muffins', 'pies', 'brownies',
    'wedding cakes', 'birthday cakes', 'custom cakes', 'sheet cakes', 'layer cakes', 'cheesecake', 'tiered cakes', 'cake pops', 'cake slices', 'mini cakes',
    'fresh baked', 'made daily', 'gluten free', 'vegan', 'sugar free', 'keto', 'organic', 'local', 'artisan', 'homemade',
    'special orders', 'custom orders', 'catering', 'party trays', 'dessert trays', 'gift boxes', 'delivery', 'pickup', 'preorder', 'same day',
    'coffee', 'espresso', 'breakfast', 'sandwiches', 'early morning', 'open early', 'parking', 'seating', 'quick service', 'wholesale'
  ],
  'Food Truck': [
    'tacos', 'burritos', 'burgers', 'hot dogs', 'sandwiches', 'BBQ', 'wings', 'fries', 'nachos', 'quesadillas',
    'lunch', 'dinner', 'late night', 'street food', 'fast food', 'quick lunch', 'grab and go', 'takeout', 'catering', 'events',
    'cash', 'card', 'mobile pay', 'venmo', 'menu board', 'daily specials', 'combo meals', 'sides', 'drinks', 'dessert',
    'location schedule', 'food truck park', 'brewery', 'parking lot', 'downtown', 'office park', 'festival', 'fair', 'concert', 'market',
    'vegetarian', 'vegan', 'gluten free', 'halal', 'kosher', 'organic', 'local', 'fresh made', 'homemade', 'authentic'
  ],
  'Pizzeria': [
    'pizza', 'slice', 'whole pie', 'pepperoni', 'cheese pizza', 'supreme', 'meat lovers', 'veggie', 'margherita', 'white pizza',
    'thin crust', 'thick crust', 'deep dish', 'NY style', 'Sicilian', 'stuffed crust', 'gluten free crust', 'cauliflower crust', 'pan pizza', 'wood fired',
    'delivery', 'pickup', 'dine in', 'takeout', 'catering', 'party size', 'family deal', 'lunch special', 'dinner deal', 'combo',
    'wings', 'breadsticks', 'garlic knots', 'calzone', 'stromboli', 'salad', 'pasta', 'subs', 'appetizers', 'dessert',
    'open late', 'fast delivery', 'online ordering', 'app', 'coupons', 'deals', 'specials', 'rewards', 'gift cards', 'catering menu'
  ],
  'Sushi Bar': [
    'sushi', 'sashimi', 'rolls', 'nigiri', 'maki', 'hand roll', 'specialty roll', 'dragon roll', 'rainbow roll', 'spicy tuna',
    'salmon', 'tuna', 'yellowtail', 'eel', 'shrimp', 'crab', 'octopus', 'scallop', 'mackerel', 'sea bass',
    'omakase', 'chef special', 'sushi combo', 'sashimi platter', 'boat', 'party tray', 'catering', 'all you can eat', 'lunch special', 'dinner',
    'sake', 'Japanese beer', 'plum wine', 'green tea', 'miso soup', 'edamame', 'gyoza', 'tempura', 'teriyaki', 'ramen',
    'dine in', 'takeout', 'delivery', 'reservations', 'sushi bar', 'private room', 'happy hour', 'BYOB', 'fresh fish', 'daily catch'
  ],
  'Ice Cream Shop': [
    'ice cream', 'gelato', 'frozen yogurt', 'sorbet', 'soft serve', 'hard scoop', 'cone', 'cup', 'waffle cone', 'sugar cone',
    'sundae', 'banana split', 'milkshake', 'malt', 'float', 'smoothie', 'ice cream cake', 'pint', 'quart', 'gallon',
    'chocolate', 'vanilla', 'strawberry', 'mint chip', 'cookies and cream', 'cookie dough', 'rocky road', 'butter pecan', 'seasonal flavors', 'specialty flavors',
    'toppings', 'sprinkles', 'hot fudge', 'caramel', 'whipped cream', 'nuts', 'candy', 'fruit', 'brownie', 'cookie',
    'dairy free', 'vegan', 'sugar free', 'gluten free', 'nut free', 'kid friendly', 'party packs', 'catering', 'gift cards', 'punch card'
  ],
  'Brewery': [
    'craft beer', 'IPA', 'lager', 'stout', 'porter', 'pilsner', 'wheat beer', 'pale ale', 'amber', 'sour',
    'hazy IPA', 'double IPA', 'session beer', 'seasonal beer', 'limited release', 'barrel aged', 'nitro', 'cider', 'seltzer', 'flight',
    'taproom', 'beer garden', 'patio', 'outdoor seating', 'tours', 'tastings', 'growler', 'crowler', 'cans', 'bottles',
    'food trucks', 'kitchen', 'snacks', 'pretzels', 'live music', 'trivia', 'events', 'private events', 'dog friendly', 'kid friendly',
    'merchandise', 'gift shop', 'beer club', 'mug club', 'parking', 'reservations', 'walk-ins', 'happy hour', 'local', 'small batch'
  ],
  'Winery': [
    'wine', 'red wine', 'white wine', 'rosé', 'sparkling', 'champagne', 'prosecco', 'cabernet', 'merlot', 'pinot noir',
    'chardonnay', 'sauvignon blanc', 'pinot grigio', 'riesling', 'moscato', 'zinfandel', 'malbec', 'sangria', 'port', 'dessert wine',
    'wine tasting', 'tasting room', 'tasting fee', 'flight', 'bottle', 'glass', 'wine club', 'membership', 'vineyard tour', 'cellar tour',
    'outdoor seating', 'patio', 'picnic area', 'cheese', 'charcuterie', 'food pairing', 'live music', 'events', 'weddings', 'private events',
    'gift shop', 'wine shipping', 'local', 'estate grown', 'reserve', 'vintage', 'organic', 'sustainable', 'views', 'scenery'
  ],
  'Juice Bar': [
    'juice', 'smoothie', 'acai bowl', 'pitaya bowl', 'cold pressed', 'fresh squeezed', 'green juice', 'fruit juice', 'vegetable juice', 'detox',
    'protein shake', 'meal replacement', 'superfood', 'wheatgrass', 'ginger shot', 'turmeric', 'wellness shot', 'immunity boost', 'energy boost', 'cleanse',
    'organic', 'raw', 'vegan', 'dairy free', 'gluten free', 'no sugar added', 'natural', 'fresh', 'local', 'seasonal',
    'protein powder', 'almond butter', 'peanut butter', 'hemp seeds', 'chia seeds', 'spirulina', 'collagen', 'CBD', 'add-ins', 'customize',
    'grab and go', 'quick service', 'online order', 'pickup', 'delivery', 'catering', 'cleanse packages', 'subscription', 'loyalty program', 'gift cards'
  ],
  'Deli': [
    'sandwich', 'sub', 'hoagie', 'hero', 'cold cuts', 'sliced meat', 'turkey', 'ham', 'roast beef', 'pastrami',
    'salami', 'bologna', 'corned beef', 'brisket', 'cheese', 'swiss', 'provolone', 'american', 'cheddar', 'pepper jack',
    'salad', 'coleslaw', 'potato salad', 'macaroni salad', 'soup', 'chili', 'pickle', 'chips', 'sides', 'combo meal',
    'catering', 'party trays', 'sandwich platters', 'meat and cheese trays', 'wrap platters', 'box lunches', 'corporate catering', 'event catering', 'delivery', 'pickup',
    'breakfast', 'lunch', 'early morning', 'quick service', 'call ahead', 'online order', 'daily specials', 'fresh baked bread', 'gluten free', 'vegetarian'
  ],
  'Steakhouse': [
    'steak', 'ribeye', 'filet mignon', 'NY strip', 'sirloin', 'porterhouse', 't-bone', 'prime rib', 'wagyu', 'USDA prime',
    'rare', 'medium rare', 'medium', 'well done', 'dry aged', 'wet aged', 'grass fed', 'choice', 'select', 'angus',
    'lobster', 'crab', 'shrimp', 'seafood', 'surf and turf', 'sides', 'baked potato', 'creamed spinach', 'mac and cheese', 'asparagus',
    'wine list', 'cocktails', 'bar', 'happy hour', 'reservations', 'private dining', 'date night', 'anniversary', 'business dinner', 'special occasion',
    'lunch', 'dinner', 'prix fixe', 'tasting menu', 'butcher cuts', 'tomahawk', 'bone in', 'au poivre', 'oscar style', 'parking'
  ],
  'Seafood Restaurant': [
    'seafood', 'fish', 'shrimp', 'crab', 'lobster', 'oysters', 'clams', 'mussels', 'scallops', 'calamari',
    'salmon', 'tuna', 'halibut', 'cod', 'snapper', 'grouper', 'mahi', 'swordfish', 'sea bass', 'tilapia',
    'fried', 'grilled', 'blackened', 'broiled', 'steamed', 'raw bar', 'ceviche', 'sashimi', 'fish tacos', 'fish and chips',
    'crab legs', 'lobster tail', 'shrimp scampi', 'clam chowder', 'gumbo', 'jambalaya', 'boil', 'seafood platter', 'catch of the day', 'market price',
    'fresh', 'daily catch', 'sustainable', 'local', 'waterfront', 'outdoor seating', 'view', 'reservations', 'happy hour', 'full bar'
  ],
  'BBQ Restaurant': [
    'BBQ', 'barbecue', 'brisket', 'ribs', 'pulled pork', 'burnt ends', 'smoked', 'low and slow', 'pit master', 'smoke',
    'baby back ribs', 'spare ribs', 'beef ribs', 'pork ribs', 'st louis ribs', 'sausage', 'hot links', 'chicken', 'turkey', 'tri tip',
    'Texas style', 'Kansas City', 'Carolina', 'Memphis', 'dry rub', 'wet rub', 'sauce', 'sweet', 'spicy', 'vinegar',
    'sides', 'coleslaw', 'beans', 'mac and cheese', 'potato salad', 'cornbread', 'pickles', 'onions', 'white bread', 'banana pudding',
    'by the pound', 'plate', 'combo', 'family pack', 'catering', 'takeout', 'dine in', 'outdoor seating', 'picnic tables', 'casual'
  ],
  'Mexican Restaurant': [
    'tacos', 'burritos', 'enchiladas', 'quesadillas', 'fajitas', 'nachos', 'tamales', 'tostadas', 'chimichanga', 'flautas',
    'carnitas', 'carne asada', 'al pastor', 'barbacoa', 'chorizo', 'pollo', 'chicken', 'beef', 'pork', 'shrimp',
    'rice', 'beans', 'guacamole', 'salsa', 'pico', 'sour cream', 'cheese', 'lettuce', 'tomato', 'jalapeno',
    'margarita', 'tequila', 'mezcal', 'cerveza', 'beer', 'horchata', 'agua fresca', 'mexican coke', 'happy hour', 'cantina',
    'combo plate', 'lunch special', 'dinner', 'family style', 'catering', 'takeout', 'delivery', 'dine in', 'patio', 'authentic'
  ],
  'Italian Restaurant': [
    'pasta', 'pizza', 'lasagna', 'spaghetti', 'fettuccine', 'penne', 'ravioli', 'gnocchi', 'linguine', 'rigatoni',
    'alfredo', 'marinara', 'bolognese', 'carbonara', 'vodka sauce', 'pesto', 'primavera', 'arrabiata', 'aglio e olio', 'cacio e pepe',
    'chicken parm', 'eggplant parm', 'veal', 'osso buco', 'saltimbocca', 'piccata', 'marsala', 'francese', 'meatballs', 'sausage',
    'antipasto', 'bruschetta', 'caprese', 'calamari', 'minestrone', 'italian wedding soup', 'caesar salad', 'tiramisu', 'cannoli', 'gelato',
    'wine list', 'chianti', 'pinot grigio', 'prosecco', 'espresso', 'cappuccino', 'romantic', 'date night', 'family style', 'reservations'
  ],
  'Chinese Restaurant': [
    'chinese food', 'fried rice', 'lo mein', 'chow mein', 'egg roll', 'spring roll', 'wonton', 'dumpling', 'potsticker', 'dim sum',
    'general tso', 'orange chicken', 'kung pao', 'sweet and sour', 'mongolian beef', 'beef broccoli', 'cashew chicken', 'moo shu', 'twice cooked pork', 'mapo tofu',
    'chicken', 'beef', 'pork', 'shrimp', 'tofu', 'vegetable', 'seafood', 'duck', 'crispy', 'steamed',
    'wonton soup', 'hot and sour soup', 'egg drop soup', 'fried wontons', 'crab rangoon', 'fortune cookie', 'white rice', 'brown rice', 'combo', 'family dinner',
    'takeout', 'delivery', 'dine in', 'lunch special', 'buffet', 'all you can eat', 'MSG free', 'spicy', 'mild', 'authentic'
  ],
  'Thai Restaurant': [
    'thai food', 'pad thai', 'curry', 'red curry', 'green curry', 'yellow curry', 'massaman', 'panang', 'tom yum', 'tom kha',
    'fried rice', 'basil fried rice', 'pineapple fried rice', 'pad see ew', 'drunken noodles', 'pad kee mao', 'satay', 'larb', 'papaya salad', 'spring rolls',
    'chicken', 'beef', 'pork', 'shrimp', 'tofu', 'vegetables', 'duck', 'seafood', 'fish', 'squid',
    'mild', 'medium', 'spicy', 'thai hot', 'coconut milk', 'lemongrass', 'basil', 'peanut sauce', 'fish sauce', 'lime',
    'thai iced tea', 'thai iced coffee', 'bubble tea', 'lunch special', 'dinner', 'takeout', 'delivery', 'dine in', 'vegetarian', 'vegan'
  ],
  'Indian Restaurant': [
    'indian food', 'curry', 'tikka masala', 'butter chicken', 'vindaloo', 'korma', 'saag', 'biryani', 'tandoori', 'samosa',
    'naan', 'garlic naan', 'roti', 'paratha', 'rice', 'basmati', 'dal', 'chana masala', 'palak paneer', 'aloo gobi',
    'chicken', 'lamb', 'goat', 'shrimp', 'fish', 'vegetable', 'paneer', 'lentils', 'chickpeas', 'potato',
    'mild', 'medium', 'spicy', 'extra hot', 'raita', 'chutney', 'pickle', 'papadum', 'lassi', 'mango lassi',
    'buffet', 'lunch buffet', 'dinner', 'takeout', 'delivery', 'catering', 'vegetarian', 'vegan', 'halal', 'gluten free'
  ],
  'Vietnamese Restaurant': [
    'pho', 'banh mi', 'spring rolls', 'summer rolls', 'vermicelli', 'bun', 'rice', 'noodles', 'soup', 'broth',
    'beef pho', 'chicken pho', 'rare beef', 'brisket', 'meatball', 'tendon', 'tripe', 'combo', 'vegetable', 'tofu',
    'grilled pork', 'lemongrass chicken', 'shaking beef', 'broken rice', 'com tam', 'caramelized pork', 'egg roll', 'cha gio', 'goi cuon', 'crispy',
    'sriracha', 'hoisin', 'fish sauce', 'lime', 'basil', 'bean sprouts', 'jalapeno', 'cilantro', 'mint', 'fresh herbs',
    'vietnamese coffee', 'iced coffee', 'bubble tea', 'lunch', 'dinner', 'takeout', 'delivery', 'dine in', 'fast', 'authentic'
  ],
  'Greek Restaurant': [
    'greek food', 'gyro', 'souvlaki', 'kebab', 'lamb', 'chicken', 'pork', 'beef', 'falafel', 'shawarma',
    'hummus', 'tzatziki', 'baba ganoush', 'dolmas', 'spanakopita', 'saganaki', 'calamari', 'greek salad', 'feta', 'olives',
    'pita', 'pita bread', 'rice', 'fries', 'potatoes', 'combo plate', 'platter', 'wrap', 'sandwich', 'bowl',
    'moussaka', 'pastitsio', 'lamb chops', 'whole fish', 'grilled octopus', 'baklava', 'loukoumades', 'greek yogurt', 'honey', 'dessert',
    'lunch', 'dinner', 'takeout', 'delivery', 'dine in', 'catering', 'fast casual', 'family owned', 'authentic', 'mediterranean'
  ],
  'Mediterranean Restaurant': [
    'mediterranean', 'hummus', 'falafel', 'shawarma', 'kebab', 'gyro', 'pita', 'flatbread', 'wrap', 'bowl',
    'chicken', 'lamb', 'beef', 'fish', 'shrimp', 'vegetarian', 'vegan', 'grilled', 'marinated', 'seasoned',
    'tzatziki', 'tahini', 'baba ganoush', 'tabbouleh', 'fattoush', 'greek salad', 'feta', 'olives', 'pickles', 'turnips',
    'rice', 'couscous', 'lentils', 'chickpeas', 'eggplant', 'cauliflower', 'tomato', 'cucumber', 'onion', 'garlic',
    'lunch', 'dinner', 'takeout', 'delivery', 'catering', 'fast casual', 'healthy', 'fresh', 'gluten free', 'halal'
  ],
  'Brunch Spot': [
    'brunch', 'breakfast', 'eggs', 'omelette', 'scrambled', 'fried', 'poached', 'eggs benedict', 'florentine', 'hash',
    'pancakes', 'waffles', 'french toast', 'crepes', 'mimosa', 'bloody mary', 'bellini', 'champagne', 'bottomless', 'unlimited',
    'bacon', 'sausage', 'ham', 'avocado toast', 'smoked salmon', 'bagel', 'toast', 'fruit', 'yogurt', 'granola',
    'coffee', 'espresso', 'latte', 'orange juice', 'fresh squeezed', 'tea', 'hot chocolate', 'smoothie', 'juice', 'refreshments',
    'weekend brunch', 'saturday', 'sunday', 'reservations', 'wait', 'walk in', 'patio', 'outdoor', 'group', 'special occasion'
  ],
  'Donut Shop': [
    'donuts', 'doughnuts', 'glazed', 'chocolate', 'maple', 'strawberry', 'vanilla', 'jelly', 'cream filled', 'custard',
    'cake donut', 'raised donut', 'old fashioned', 'cruller', 'fritter', 'apple fritter', 'bear claw', 'cinnamon roll', 'donut holes', 'munchkins',
    'sprinkles', 'frosting', 'icing', 'bacon maple', 'specialty', 'seasonal', 'fresh', 'made daily', 'hot donuts', 'fresh out of fryer',
    'coffee', 'espresso', 'latte', 'cold brew', 'milk', 'juice', 'breakfast sandwich', 'kolache', 'croissant', 'pastry',
    'dozen', 'half dozen', 'single', 'box', 'preorder', 'catering', 'party', 'office', 'early morning', 'drive thru'
  ],
  'Bagel Shop': [
    'bagels', 'plain', 'everything', 'sesame', 'poppy', 'onion', 'garlic', 'cinnamon raisin', 'blueberry', 'asiago',
    'cream cheese', 'plain cream cheese', 'veggie cream cheese', 'lox spread', 'butter', 'jam', 'peanut butter', 'hummus', 'avocado', 'schmear',
    'lox', 'smoked salmon', 'nova', 'capers', 'red onion', 'tomato', 'breakfast sandwich', 'egg', 'bacon', 'sausage',
    'deli sandwich', 'turkey', 'ham', 'roast beef', 'tuna salad', 'egg salad', 'chicken salad', 'BLT', 'club', 'veggie',
    'coffee', 'espresso', 'latte', 'tea', 'juice', 'fresh baked', 'daily', 'dozen', 'catering', 'delivery'
  ],
  'Smoothie Shop': [
    'smoothie', 'fruit smoothie', 'green smoothie', 'protein smoothie', 'meal replacement', 'post workout', 'healthy', 'fresh', 'blended', 'frozen',
    'strawberry', 'banana', 'mango', 'pineapple', 'blueberry', 'mixed berry', 'peach', 'tropical', 'acai', 'pitaya',
    'protein', 'whey', 'plant protein', 'peanut butter', 'almond butter', 'spinach', 'kale', 'ginger', 'turmeric', 'superfood',
    'almond milk', 'oat milk', 'coconut milk', 'soy milk', 'dairy free', 'vegan', 'no sugar added', 'low calorie', 'keto', 'paleo',
    'bowl', 'acai bowl', 'smoothie bowl', 'juice', 'fresh juice', 'cold pressed', 'size', 'add-ins', 'boost', 'loyalty'
  ],
  'Tea House': [
    'tea', 'loose leaf', 'tea bag', 'hot tea', 'iced tea', 'green tea', 'black tea', 'oolong', 'white tea', 'herbal tea',
    'matcha', 'chai', 'earl grey', 'english breakfast', 'jasmine', 'chamomile', 'peppermint', 'lavender', 'rooibos', 'hibiscus',
    'tea latte', 'matcha latte', 'chai latte', 'london fog', 'milk tea', 'honey', 'sugar', 'cream', 'oat milk', 'almond milk',
    'afternoon tea', 'high tea', 'tea service', 'scones', 'sandwiches', 'pastries', 'desserts', 'macarons', 'cake', 'cookies',
    'tea ware', 'teapot', 'tea set', 'gifts', 'loose leaf sale', 'online order', 'pickup', 'dine in', 'cozy', 'relaxing'
  ],
  'Bubble Tea': [
    'bubble tea', 'boba', 'milk tea', 'tapioca', 'pearls', 'boba pearls', 'black sugar', 'brown sugar', 'tiger', 'classic',
    'taro', 'matcha', 'thai tea', 'jasmine', 'oolong', 'green tea', 'black tea', 'fruit tea', 'passion fruit', 'mango',
    'ice level', 'sugar level', 'no ice', 'less ice', 'regular ice', 'no sugar', 'less sugar', 'half sugar', 'regular sugar', 'extra sugar',
    'toppings', 'jelly', 'coconut jelly', 'aloe', 'pudding', 'red bean', 'grass jelly', 'cheese foam', 'milk foam', 'cream',
    'small', 'medium', 'large', 'hot', 'cold', 'slush', 'smoothie', 'fresh', 'made to order', 'rewards'
  ],
  'Dessert Shop': [
    'dessert', 'cake', 'pie', 'cupcake', 'cookie', 'brownie', 'cheesecake', 'ice cream', 'gelato', 'frozen yogurt',
    'chocolate', 'vanilla', 'strawberry', 'red velvet', 'carrot cake', 'tiramisu', 'creme brulee', 'mousse', 'pudding', 'flan',
    'pastry', 'croissant', 'danish', 'eclair', 'cannoli', 'macaron', 'churro', 'crepe', 'waffle', 'sundae',
    'milkshake', 'float', 'banana split', 'parfait', 'trifle', 'cobbler', 'crumble', 'tart', 'fruit', 'whipped cream',
    'dine in', 'takeout', 'delivery', 'catering', 'custom order', 'birthday', 'celebration', 'gift', 'party', 'late night'
  ],
  'Supermarket': [
    'groceries', 'produce', 'meat', 'seafood', 'deli', 'bakery', 'dairy', 'frozen', 'canned goods', 'pantry',
    'organic', 'natural', 'fresh', 'local', 'farm fresh', 'free range', 'grass fed', 'non-GMO', 'gluten free', 'vegan',
    'pharmacy', 'health', 'beauty', 'household', 'cleaning', 'paper goods', 'pet', 'baby', 'seasonal', 'floral',
    'weekly ad', 'sale', 'coupon', 'rewards', 'loyalty', 'digital coupons', 'BOGO', 'clearance', 'manager special', 'rollback',
    'pickup', 'delivery', 'instacart', 'curbside', 'online order', 'self checkout', 'express lane', 'parking', 'cart', '24 hour'
  ],
  'Butcher Shop': [
    'butcher', 'meat', 'beef', 'pork', 'chicken', 'lamb', 'veal', 'turkey', 'duck', 'game',
    'steak', 'ribeye', 'filet', 'sirloin', 'ground beef', 'ground chuck', 'roast', 'brisket', 'short ribs', 'oxtail',
    'sausage', 'bacon', 'ham', 'pork chop', 'pork loin', 'tenderloin', 'ribs', 'belly', 'shoulder', 'butt',
    'organic', 'grass fed', 'free range', 'local', 'prime', 'choice', 'custom cut', 'special order', 'marinated', 'seasoned',
    'deli', 'cold cuts', 'prepared foods', 'catering', 'party trays', 'BBQ packs', 'grill packs', 'freezer packs', 'bulk', 'wholesale'
  ],
  'Seafood Market': [
    'seafood', 'fish', 'fresh fish', 'whole fish', 'fillet', 'salmon', 'tuna', 'halibut', 'cod', 'snapper',
    'shrimp', 'prawns', 'crab', 'lobster', 'oysters', 'clams', 'mussels', 'scallops', 'calamari', 'octopus',
    'fresh', 'frozen', 'wild caught', 'farm raised', 'sustainable', 'local', 'daily catch', 'seasonal', 'sushi grade', 'sashimi grade',
    'cleaned', 'filleted', 'steaked', 'butterflied', 'shell on', 'peeled', 'deveined', 'ready to cook', 'marinated', 'seasoned',
    'prepared foods', 'cooked', 'fried', 'steamed', 'boil', 'catering', 'party trays', 'special order', 'custom', 'wholesale'
  ],
  'Specialty Food Store': [
    'specialty', 'gourmet', 'imported', 'international', 'ethnic', 'artisan', 'local', 'small batch', 'handmade', 'craft',
    'cheese', 'charcuterie', 'olive oil', 'vinegar', 'pasta', 'sauce', 'spices', 'seasonings', 'condiments', 'preserves',
    'chocolate', 'candy', 'cookies', 'crackers', 'nuts', 'dried fruit', 'coffee', 'tea', 'wine', 'beer',
    'gift basket', 'gift box', 'corporate gifts', 'party', 'catering', 'cheese board', 'platter', 'samples', 'tasting', 'events',
    'organic', 'vegan', 'gluten free', 'kosher', 'halal', 'dietary', 'allergen free', 'special diet', 'healthy', 'natural'
  ],
  'Health Food Store': [
    'health food', 'organic', 'natural', 'whole foods', 'vitamins', 'supplements', 'protein', 'collagen', 'probiotics', 'omega',
    'vegan', 'vegetarian', 'gluten free', 'dairy free', 'keto', 'paleo', 'plant based', 'raw', 'non-GMO', 'clean eating',
    'produce', 'fresh', 'local', 'farm', 'bulk', 'grains', 'nuts', 'seeds', 'dried fruit', 'snacks',
    'juice bar', 'smoothie', 'cold pressed', 'shots', 'wellness', 'immunity', 'energy', 'detox', 'cleanse', 'superfoods',
    'beauty', 'skincare', 'essential oils', 'aromatherapy', 'CBD', 'herbal', 'homeopathic', 'natural remedies', 'eco friendly', 'sustainable'
  ],
  'Candy Store': [
    'candy', 'chocolate', 'gummies', 'hard candy', 'lollipop', 'taffy', 'fudge', 'caramel', 'licorice', 'sour candy',
    'bulk candy', 'by the pound', 'pick and mix', 'candy bar', 'candy bag', 'gift box', 'party favors', 'candy buffet', 'sweet table', 'goodie bags',
    'retro candy', 'nostalgic', 'vintage', 'old fashioned', 'imported', 'international', 'novelty', 'seasonal', 'holiday', 'limited edition',
    'sugar free', 'diabetic friendly', 'vegan', 'organic', 'natural', 'allergen free', 'nut free', 'gluten free', 'kosher', 'halal',
    'gift', 'birthday', 'party', 'wedding', 'baby shower', 'corporate', 'custom', 'personalized', 'wrapped', 'basket'
  ],
  'Chocolate Shop': [
    'chocolate', 'dark chocolate', 'milk chocolate', 'white chocolate', 'truffles', 'bonbons', 'pralines', 'ganache', 'filled', 'assorted',
    'chocolate bar', 'chocolate box', 'gift box', 'sampler', 'variety', 'seasonal', 'holiday', 'limited edition', 'signature', 'house made',
    'single origin', 'bean to bar', 'artisan', 'craft', 'handmade', 'small batch', 'fair trade', 'organic', 'vegan', 'sugar free',
    'hot chocolate', 'drinking chocolate', 'mocha', 'chocolate dipped', 'fruit', 'nuts', 'caramel', 'sea salt', 'espresso', 'lavender',
    'gift', 'valentines', 'mothers day', 'christmas', 'easter', 'birthday', 'anniversary', 'thank you', 'corporate', 'wedding'
  ],
  'CBD Store': [
    'CBD', 'cannabidiol', 'hemp', 'full spectrum', 'broad spectrum', 'isolate', 'THC free', 'organic', 'lab tested', 'COA',
    'tincture', 'oil', 'drops', 'capsules', 'softgels', 'gummies', 'edibles', 'topical', 'cream', 'balm',
    'pain relief', 'anxiety', 'sleep', 'stress', 'inflammation', 'recovery', 'wellness', 'relaxation', 'calm', 'focus',
    'pet CBD', 'dog', 'cat', 'treats', 'oil', 'vape', 'cartridge', 'flower', 'pre-roll', 'concentrate',
    'mg', 'strength', 'dosage', 'serving', 'third party tested', 'certificate', 'quality', 'potency', 'purity', 'natural'
  ],
  // Health & Beauty
  'Salon': [
    'haircut', 'hair color', 'highlights', 'balayage', 'ombre', 'lowlights', 'root touch up', 'full color', 'color correction', 'bleach',
    'blowout', 'styling', 'updo', 'braids', 'extensions', 'keratin', 'straightening', 'perm', 'relaxer', 'deep conditioning',
    'trim', 'layers', 'bangs', 'bob', 'pixie', 'long hair', 'short hair', 'mens cut', 'kids cut', 'senior cut',
    'wedding hair', 'bridal', 'prom', 'special occasion', 'consultation', 'walk-ins', 'appointments', 'online booking', 'same day', 'late hours',
    'parking', 'wheelchair accessible', 'gift cards', 'packages', 'loyalty program', 'student discount', 'senior discount', 'products', 'retail', 'tips welcome'
  ],
  'Barbershop': [
    'haircut', 'fade', 'taper', 'buzz cut', 'crew cut', 'flat top', 'line up', 'edge up', 'shape up', 'skin fade',
    'beard trim', 'beard shape', 'shave', 'hot towel shave', 'straight razor', 'mustache trim', 'eyebrow trim', 'neck shave', 'ear trim', 'nose trim',
    'mens haircut', 'boys haircut', 'kids cut', 'senior cut', 'military cut', 'classic cut', 'modern styles', 'textured', 'pompadour', 'undercut',
    'walk-ins', 'appointments', 'online booking', 'wait time', 'check in', 'cash', 'card', 'tips', 'loyalty program', 'student discount',
    'senior discount', 'parking', 'TV', 'wifi', 'drinks', 'products', 'pomade', 'wax', 'gel', 'beard oil'
  ],
  'Spa': [
    'massage', 'facial', 'body treatment', 'scrub', 'wrap', 'sauna', 'steam room', 'hot tub', 'jacuzzi', 'pool',
    'Swedish massage', 'deep tissue', 'hot stone', 'aromatherapy', 'couples massage', 'prenatal massage', 'sports massage', 'reflexology', 'Thai massage', 'shiatsu',
    'anti-aging facial', 'hydrating facial', 'acne facial', 'chemical peel', 'microdermabrasion', 'LED therapy', 'oxygen facial', 'collagen', 'vitamin C', 'hyaluronic',
    'mani pedi', 'waxing', 'body contouring', 'detox', 'relaxation', 'wellness', 'day spa', 'spa day', 'spa package', 'couples package',
    'gift card', 'membership', 'robes', 'slippers', 'locker room', 'shower', 'refreshments', 'parking', 'reservations', 'walk-ins'
  ],
  'Nail Salon': [
    'manicure', 'pedicure', 'gel manicure', 'gel pedicure', 'acrylic nails', 'dip powder', 'SNS', 'shellac', 'regular polish', 'nail art',
    'french tips', 'fill', 'full set', 'overlay', 'nail repair', 'nail removal', 'soak off', 'cuticle care', 'nail shaping', 'buffing',
    'spa pedicure', 'deluxe pedicure', 'paraffin', 'hot stones', 'callus removal', 'leg massage', 'arm massage', 'exfoliation', 'moisturizing', 'mask',
    'walk-ins', 'appointments', 'online booking', 'wait time', 'groups', 'parties', 'bridal party', 'birthday party', 'kids', 'mens',
    'cash', 'card', 'tips', 'gift cards', 'loyalty program', 'parking', 'clean', 'sanitary', 'ventilated', 'relaxing'
  ],
  'Med Spa': [
    'botox', 'filler', 'lip filler', 'juvederm', 'restylane', 'kybella', 'sculptra', 'dysport', 'xeomin', 'injectable',
    'laser', 'IPL', 'laser hair removal', 'tattoo removal', 'skin resurfacing', 'fraxel', 'CO2 laser', 'BBL', 'photofacial', 'vein treatment',
    'microneedling', 'PRP', 'vampire facial', 'chemical peel', 'hydrafacial', 'dermaplaning', 'microdermabrasion', 'LED therapy', 'oxygen facial', 'vi peel',
    'coolsculpting', 'body contouring', 'cellulite treatment', 'skin tightening', 'ultherapy', 'RF', 'emsculpt', 'kybella', 'liposuction', 'fat dissolving',
    'consultation', 'free consultation', 'financing', 'packages', 'membership', 'before after', 'certified', 'licensed', 'RN', 'MD supervised'
  ],
  'Massage Therapy': [
    'massage', 'Swedish massage', 'deep tissue', 'hot stone', 'aromatherapy', 'sports massage', 'prenatal massage', 'couples massage', 'Thai massage', 'shiatsu',
    'reflexology', 'lymphatic drainage', 'trigger point', 'myofascial', 'cupping', 'craniosacral', 'chair massage', 'back massage', 'neck massage', 'full body',
    '30 minute', '60 minute', '90 minute', '120 minute', 'add-on', 'hot towel', 'scalp massage', 'foot massage', 'hand massage', 'face massage',
    'walk-ins', 'appointments', 'online booking', 'same day', 'evening hours', 'weekend hours', 'parking', 'private room', 'relaxing', 'quiet',
    'gift card', 'package', 'membership', 'loyalty program', 'couples room', 'tips accepted', 'cash', 'card', 'HSA', 'FSA'
  ],
  'Tattoo Parlor': [
    'tattoo', 'custom tattoo', 'flash tattoo', 'cover up', 'touch up', 'color tattoo', 'black and grey', 'fine line', 'blackwork', 'traditional',
    'neo traditional', 'realism', 'portrait', 'watercolor', 'geometric', 'tribal', 'Japanese', 'American traditional', 'script', 'lettering',
    'small tattoo', 'large tattoo', 'sleeve', 'half sleeve', 'back piece', 'chest piece', 'leg tattoo', 'arm tattoo', 'hand tattoo', 'neck tattoo',
    'walk-ins', 'appointment', 'consultation', 'deposit', 'hourly rate', 'flat rate', 'minimum charge', 'portfolio', 'instagram', 'booking',
    'sterile', 'clean', 'licensed', 'experienced', 'aftercare', 'touch up included', 'cash', 'card', 'tip', 'gift certificate'
  ],
  'Tanning Salon': [
    'tanning bed', 'spray tan', 'airbrush tan', 'UV tanning', 'stand up', 'lay down', 'high pressure', 'low pressure', 'red light', 'bronzing bed',
    'mystic tan', 'versa spa', 'custom spray', 'express tan', 'rapid tan', 'competition tan', 'bridal tan', 'prom tan', 'event tan', 'vacation tan',
    'lotion', 'bronzer', 'accelerator', 'tingle lotion', 'moisturizer', 'after tan', 'tan extender', 'exfoliator', 'prep', 'products',
    'single session', 'package', 'unlimited', 'monthly', 'membership', 'first time free', 'student discount', 'referral', 'gift card', 'rewards',
    'clean beds', 'sanitized', 'private rooms', 'AC', 'music', 'fan', 'timer', 'goggles', 'towels', 'parking'
  ],
  'Skincare Clinic': [
    'facial', 'acne treatment', 'anti-aging', 'chemical peel', 'microdermabrasion', 'dermaplaning', 'hydrafacial', 'LED therapy', 'microneedling', 'extraction',
    'acne', 'rosacea', 'eczema', 'psoriasis', 'hyperpigmentation', 'melasma', 'sun damage', 'age spots', 'fine lines', 'wrinkles',
    'consultation', 'skin analysis', 'customized treatment', 'treatment plan', 'home care', 'products', 'skincare routine', 'follow up', 'series', 'package',
    'licensed', 'esthetician', 'dermatologist', 'certified', 'medical grade', 'professional', 'clean', 'sterile', 'private', 'relaxing',
    'appointment', 'online booking', 'parking', 'gift card', 'membership', 'loyalty', 'HSA', 'FSA', 'financing', 'before after'
  ],
  'Lash Studio': [
    'lashes', 'eyelash extensions', 'lash extensions', 'classic lashes', 'volume lashes', 'hybrid lashes', 'mega volume', 'russian volume', 'wispy', 'natural',
    'full set', 'lash fill', 'refill', '2 week fill', '3 week fill', 'lash lift', 'lash tint', 'brow lamination', 'brow tint', 'combo',
    'mink', 'silk', 'synthetic', 'faux mink', 'length', 'curl', 'diameter', 'mapping', 'customized', 'lash bath',
    'lash removal', 'aftercare', 'lash serum', 'products', 'retail', 'touch up', 'correction', 'allergic reaction', 'sensitive', 'gentle',
    'appointment', 'online booking', 'new client', 'returning client', 'pricing', 'deposit', 'cancellation', 'late policy', 'portfolio', 'certified'
  ],
  'Brow Bar': [
    'brows', 'eyebrows', 'brow shaping', 'brow wax', 'brow threading', 'brow tint', 'brow lamination', 'microblading', 'microshading', 'ombre brows',
    'powder brows', 'nano brows', 'brow mapping', 'brow design', 'arch', 'shape', 'cleanup', 'maintenance', 'full brow', 'touch up',
    'henna brows', 'brow gel', 'brow pomade', 'brow pencil', 'brow products', 'retail', 'aftercare', 'brow serum', 'growth serum', 'castor oil',
    'wax', 'hard wax', 'soft wax', 'thread', 'tweeze', 'trim', 'bleach', 'lighten', 'men', 'women',
    'walk in', 'appointment', 'quick service', 'express', 'pricing', 'package', 'membership', 'new client', 'certified', 'experienced'
  ],
  'Waxing Studio': [
    'waxing', 'wax', 'brazilian', 'bikini', 'full bikini', 'french bikini', 'leg wax', 'arm wax', 'underarm', 'back wax',
    'chest wax', 'stomach', 'full body', 'face wax', 'lip', 'chin', 'brow', 'sideburn', 'nose', 'ear',
    'hard wax', 'soft wax', 'strip wax', 'stripless', 'sensitive skin', 'gentle', 'less painful', 'numbing', 'before care', 'aftercare',
    'first time', 'maintenance', 'growth', 'weeks', 'regrowth', 'ingrown', 'exfoliate', 'smooth', 'clean', 'hygienic',
    'appointment', 'walk in', 'men', 'women', 'pricing', 'package', 'membership', 'brazilian specialist', 'experienced', 'private'
  ],
  'Hair Extensions': [
    'hair extensions', 'extensions', 'tape in', 'sew in', 'weave', 'clip in', 'halo', 'micro link', 'i-tip', 'k-tip',
    'fusion', 'keratin bond', 'hand tied', 'weft', 'machine weft', 'beaded row', 'NBR', 'install', 'removal', 'reinstall',
    'length', 'volume', 'thickness', 'color match', 'blend', 'custom color', 'highlights', 'balayage', 'ombre', 'rooted',
    'human hair', 'remy', 'virgin hair', 'quality', 'maintenance', 'care', 'wash', 'styling', 'longevity', 'lifespan',
    'consultation', 'appointment', 'pricing', 'deposit', 'touch up', 'move up', 'tightening', 'certified', 'trained', 'experienced'
  ],
  'Wig Shop': [
    'wigs', 'wig', 'human hair wig', 'synthetic wig', 'lace front', 'full lace', 'closure', 'frontal', '360 lace', 'glueless',
    'custom wig', 'wig install', 'wig styling', 'wig cut', 'wig color', 'wig wash', 'wig maintenance', 'wig repair', 'wig cap', 'wig stand',
    'hair pieces', 'toppers', 'ponytail', 'bun', 'bangs', 'clip in', 'units', 'bundles', 'closures', 'frontals',
    'straight', 'curly', 'wavy', 'body wave', 'deep wave', 'kinky curly', 'bob', 'pixie', 'long', 'short',
    'medical wig', 'chemo', 'alopecia', 'hair loss', 'consultation', 'private fitting', 'financing', 'insurance', 'quality', 'natural looking'
  ],
  'Beauty Supply': [
    'beauty supply', 'hair care', 'skin care', 'makeup', 'cosmetics', 'nails', 'hair color', 'relaxer', 'perm', 'styling products',
    'shampoo', 'conditioner', 'leave in', 'oil', 'gel', 'mousse', 'hairspray', 'edge control', 'deep conditioner', 'treatment',
    'flat iron', 'curling iron', 'blow dryer', 'clippers', 'trimmers', 'combs', 'brushes', 'rollers', 'pins', 'accessories',
    'wigs', 'weave', 'braiding hair', 'extensions', 'lashes', 'adhesive', 'nail polish', 'acrylics', 'gel polish', 'nail tools',
    'wholesale', 'retail', 'professional', 'salon quality', 'brands', 'discount', 'sale', 'clearance', 'rewards', 'new arrivals'
  ],
  // Automotive
  'Auto Shop': [
    'oil change', 'brake repair', 'brakes', 'engine repair', 'transmission', 'AC repair', 'air conditioning', 'heating', 'check engine light', 'diagnostics',
    'tune up', 'spark plugs', 'timing belt', 'water pump', 'radiator', 'coolant', 'battery', 'alternator', 'starter', 'electrical',
    'suspension', 'shocks', 'struts', 'alignment', 'steering', 'power steering', 'exhaust', 'muffler', 'catalytic converter', 'emissions',
    'inspection', 'state inspection', 'safety inspection', 'pre-purchase inspection', 'maintenance', 'scheduled maintenance', 'factory service', 'warranty work', 'recall', 'TSB',
    'appointment', 'walk-in', 'drop off', 'shuttle', 'loaner car', 'waiting room', 'wifi', 'estimate', 'warranty', 'ASE certified'
  ],
  'Car Wash': [
    'car wash', 'exterior wash', 'interior cleaning', 'full service', 'express wash', 'hand wash', 'touchless', 'soft touch', 'tunnel wash', 'self serve',
    'wax', 'polish', 'tire shine', 'wheel clean', 'undercarriage', 'bug removal', 'tar removal', 'spot free rinse', 'air dry', 'hand dry',
    'interior vacuum', 'floor mats', 'dashboard', 'windows', 'door jambs', 'trunk', 'console', 'cup holders', 'air freshener', 'leather clean',
    'unlimited plan', 'monthly membership', 'wash club', 'single wash', 'package', 'upgrade', 'add-on', 'gift card', 'fleet', 'commercial',
    'drive thru', 'quick', 'no appointment', 'open early', 'open late', 'weekend hours', 'parking', 'vacuum stations', 'clean', 'fast'
  ],
  'Auto Detailing': [
    'detail', 'full detail', 'interior detail', 'exterior detail', 'hand wash', 'clay bar', 'polish', 'wax', 'sealant', 'ceramic coating',
    'paint correction', 'scratch removal', 'swirl removal', 'oxidation', 'headlight restoration', 'trim restoration', 'wheel detail', 'engine bay', 'undercarriage', 'door jambs',
    'shampoo', 'carpet cleaning', 'upholstery', 'leather conditioning', 'vinyl', 'plastic restoration', 'odor removal', 'pet hair', 'stain removal', 'smoke smell',
    'mobile detailing', 'come to you', 'shop', 'drop off', 'same day', 'appointment', 'package', 'quote', 'estimate', 'gift card',
    'new car', 'used car', 'pre-sale', 'showroom', 'boat', 'RV', 'motorcycle', 'fleet', 'commercial', 'regular maintenance'
  ],
  'Tire Shop': [
    'tires', 'new tires', 'used tires', 'tire installation', 'tire mount', 'tire balance', 'wheel alignment', 'rotation', 'flat repair', 'plug',
    'all season', 'summer tires', 'winter tires', 'snow tires', 'performance tires', 'truck tires', 'SUV tires', 'run flat', 'spare tire', 'donut',
    'Michelin', 'Goodyear', 'Bridgestone', 'Continental', 'Pirelli', 'BF Goodrich', 'Firestone', 'Cooper', 'Hankook', 'Yokohama',
    'TPMS', 'valve stem', 'tire pressure', 'tread depth', 'road hazard', 'warranty', 'mileage warranty', 'price match', 'financing', 'rebate',
    'no appointment', 'while you wait', 'same day', 'quick service', 'free inspection', 'free rotation', 'free air', 'parking', 'wifi', 'waiting room'
  ],
  'Body Shop': [
    'collision repair', 'body work', 'dent repair', 'dent removal', 'paintless dent repair', 'PDR', 'scratch repair', 'bumper repair', 'fender repair', 'door ding',
    'paint', 'auto paint', 'color match', 'blend', 'clear coat', 'full paint', 'spot paint', 'touch up', 'custom paint', 'wrap',
    'frame repair', 'frame straightening', 'structural repair', 'unibody', 'welding', 'panel replacement', 'quarter panel', 'hood', 'trunk', 'roof',
    'insurance claim', 'direct repair', 'estimate', 'free estimate', 'rental car', 'tow', 'towing', 'storage', 'supplement', 'total loss',
    'certified', 'warranty', 'lifetime warranty', 'OEM parts', 'aftermarket', 'quality', 'before after', 'photos', 'timeline', 'updates'
  ],
  'Oil Change': [
    'oil change', 'synthetic oil', 'full synthetic', 'synthetic blend', 'conventional oil', 'high mileage', 'diesel oil', 'European formula', 'oil filter', 'drain plug',
    'Mobil 1', 'Castrol', 'Pennzoil', 'Valvoline', 'Royal Purple', 'Amsoil', 'Quaker State', '5W30', '5W20', '0W20',
    'fluid check', 'top off', 'air filter', 'cabin filter', 'wiper blades', 'tire pressure', 'tire rotation', 'battery test', 'light check', 'belt check',
    'quick lube', 'express', 'no appointment', 'while you wait', 'drive thru', '15 minute', '10 minute', 'fast', 'convenient', 'cheap',
    'coupon', 'deal', 'special', 'package', 'maintenance plan', 'sticker', 'reminder', 'mileage', 'manufacturer spec', 'warranty safe'
  ],
  'Car Dealership': [
    'new cars', 'used cars', 'certified pre-owned', 'CPO', 'inventory', 'test drive', 'trade in', 'financing', 'lease', 'buy',
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'BMW', 'Mercedes', 'Audi',
    'sedan', 'SUV', 'truck', 'van', 'coupe', 'convertible', 'hybrid', 'electric', 'EV', 'crossover',
    'service department', 'parts', 'accessories', 'warranty', 'extended warranty', 'maintenance plan', 'recall', 'loaner car', 'shuttle', 'pickup delivery',
    'no haggle', 'one price', 'negotiable', 'OTD price', 'monthly payment', 'down payment', 'credit check', 'approval', 'rebate', 'incentive'
  ],
  'Motorcycle Shop': [
    'motorcycle', 'bike', 'Harley', 'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'Indian',
    'cruiser', 'sport bike', 'touring', 'adventure', 'dirt bike', 'dual sport', 'scooter', 'moped', 'trike', 'sidecar',
    'new', 'used', 'certified', 'trade in', 'financing', 'lease', 'test ride', 'demo', 'inventory', 'special order',
    'service', 'repair', 'maintenance', 'oil change', 'tires', 'brakes', 'tune up', 'parts', 'accessories', 'gear',
    'helmet', 'jacket', 'gloves', 'boots', 'riding gear', 'apparel', 'saddlebags', 'exhaust', 'custom', 'performance'
  ],
  'Auto Parts Store': [
    'auto parts', 'car parts', 'parts', 'oil', 'filter', 'oil filter', 'air filter', 'cabin filter', 'brake pads', 'rotors',
    'battery', 'alternator', 'starter', 'spark plugs', 'ignition', 'belts', 'hoses', 'coolant', 'antifreeze', 'transmission fluid',
    'wipers', 'wiper blades', 'headlight', 'bulb', 'fuse', 'relay', 'sensor', 'O2 sensor', 'MAF', 'thermostat',
    'tools', 'jack', 'jack stands', 'wrench', 'socket', 'OBD', 'scanner', 'charger', 'jumper cables', 'tow strap',
    'in stock', 'special order', 'next day', 'same day', 'lookup', 'fitment', 'warranty', 'core charge', 'return', 'loaner tool'
  ],
  'Transmission Shop': [
    'transmission', 'trans', 'automatic', 'manual', 'CVT', 'DSG', 'rebuild', 'repair', 'replace', 'overhaul',
    'transmission fluid', 'flush', 'filter', 'pan gasket', 'seal', 'leak', 'slipping', 'hard shift', 'no reverse', 'wont move',
    'torque converter', 'clutch', 'flywheel', 'differential', 'transfer case', 'axle', 'CV joint', 'driveshaft', 'U joint', 'AWD',
    'diagnostic', 'scan', 'code', 'check engine', 'transmission light', 'limp mode', 'solenoid', 'valve body', 'TCM', 'PCM',
    'estimate', 'free diagnostic', 'warranty', 'nationwide warranty', 'financing', 'tow', 'loaner', 'shuttle', 'same day', 'quick'
  ],
  'Muffler Shop': [
    'muffler', 'exhaust', 'catalytic converter', 'cat', 'resonator', 'pipe', 'flex pipe', 'manifold', 'header', 'downpipe',
    'exhaust repair', 'exhaust replacement', 'custom exhaust', 'performance exhaust', 'dual exhaust', 'straight pipe', 'delete', 'loud', 'quiet', 'stock',
    'leak', 'hole', 'rust', 'rattle', 'noise', 'smell', 'fumes', 'check engine', 'O2 sensor', 'emissions',
    'weld', 'clamp', 'hanger', 'gasket', 'flange', 'tip', 'chrome', 'black', 'stainless', 'aluminized',
    'free inspection', 'estimate', 'while you wait', 'same day', 'warranty', 'lifetime', 'affordable', 'quick', 'no appointment', 'walk in'
  ],
  'Towing Service': [
    'towing', 'tow truck', 'tow', 'flatbed', 'wheel lift', 'dolly', 'roadside', 'roadside assistance', 'AAA', 'emergency',
    'jump start', 'battery', 'dead battery', 'lockout', 'locked out', 'keys locked', 'flat tire', 'tire change', 'spare', 'fuel delivery',
    'accident', 'breakdown', 'stuck', 'ditch', 'winch', 'recovery', 'off road', 'mud', 'snow', 'water',
    '24 hour', 'emergency', 'fast', 'quick', 'response time', 'ETA', 'dispatch', 'GPS', 'location', 'near me',
    'local', 'long distance', 'impound', 'storage', 'auction', 'junk car', 'scrap', 'cash for cars', 'price', 'estimate'
  ],
  'Car Rental': [
    'car rental', 'rental car', 'rent a car', 'daily rental', 'weekly rental', 'monthly rental', 'hourly', 'pickup', 'drop off', 'one way',
    'economy', 'compact', 'midsize', 'full size', 'SUV', 'truck', 'van', 'minivan', 'luxury', 'convertible',
    'unlimited miles', 'mileage', 'insurance', 'CDW', 'LDW', 'liability', 'roadside', 'GPS', 'car seat', 'additional driver',
    'age requirement', '25', 'under 25', 'young driver fee', 'license', 'credit card', 'deposit', 'deductible', 'damage', 'inspection',
    'airport', 'downtown', 'delivery', 'after hours', 'key drop', 'reservation', 'booking', 'corporate', 'discount', 'coupon'
  ],
  // Fitness & Recreation
  'Gym': [
    'weights', 'free weights', 'dumbbells', 'barbells', 'squat rack', 'bench press', 'machines', 'cable machine', 'smith machine', 'leg press',
    'cardio', 'treadmill', 'elliptical', 'bike', 'stair climber', 'rowing machine', 'spin bike', 'track', 'pool', 'sauna',
    'personal training', 'group fitness', 'classes', 'yoga', 'pilates', 'spin', 'HIIT', 'bootcamp', 'Zumba', 'aerobics',
    '24 hour', 'open late', 'early morning', 'locker room', 'showers', 'towels', 'parking', 'wifi', 'TV', 'AC',
    'membership', 'no contract', 'month to month', 'annual', 'student discount', 'senior discount', 'corporate', 'family plan', 'guest pass', 'free trial'
  ],
  'Yoga Studio': [
    'yoga', 'vinyasa', 'hatha', 'power yoga', 'hot yoga', 'bikram', 'yin yoga', 'restorative', 'prenatal yoga', 'kids yoga',
    'beginner', 'intermediate', 'advanced', 'all levels', 'flow', 'stretch', 'meditation', 'breathwork', 'mindfulness', 'relaxation',
    'morning class', 'evening class', 'weekend class', 'drop in', 'class pass', 'membership', 'unlimited', 'private session', 'workshop', 'retreat',
    'mat rental', 'props', 'blocks', 'straps', 'blankets', 'bolsters', 'hot room', 'heated', 'AC', 'showers',
    'parking', 'online booking', 'app', 'schedule', 'first class free', 'new student special', 'teacher training', 'certified', 'RYT', 'experienced'
  ],
  'Pilates Studio': [
    'pilates', 'reformer', 'mat pilates', 'tower', 'cadillac', 'chair', 'barrel', 'springboard', 'megaformer', 'lagree',
    'core', 'strength', 'flexibility', 'posture', 'alignment', 'balance', 'toning', 'lengthening', 'low impact', 'rehabilitation',
    'private session', 'duet', 'trio', 'group class', 'beginner', 'intermediate', 'advanced', 'prenatal', 'postnatal', 'senior',
    'class pack', 'membership', 'unlimited', 'drop in', 'intro offer', 'first class', 'new client', 'schedule', 'online booking', 'app',
    'certified', 'PMA', 'experienced', 'small class', 'personal attention', 'clean studio', 'equipment', 'parking', 'showers', 'towels'
  ],
  'CrossFit': [
    'CrossFit', 'WOD', 'AMRAP', 'EMOM', 'metcon', 'strength', 'conditioning', 'functional fitness', 'HIIT', 'circuit',
    'Olympic lifting', 'snatch', 'clean and jerk', 'deadlift', 'squat', 'press', 'pull ups', 'muscle ups', 'box jumps', 'burpees',
    'kettlebell', 'barbell', 'dumbbell', 'rowing', 'bike', 'running', 'rope climb', 'wall balls', 'double unders', 'handstand',
    'fundamentals', 'on-ramp', 'beginner', 'scaled', 'RX', 'competition', 'open gym', 'class schedule', 'drop in', 'membership',
    'community', 'coaching', 'certified', 'programming', 'nutrition', 'mobility', 'recovery', 'parking', 'showers', 'lockers'
  ],
  'Martial Arts': [
    'karate', 'taekwondo', 'jiu jitsu', 'BJJ', 'judo', 'MMA', 'kickboxing', 'muay thai', 'boxing', 'kung fu',
    'self defense', 'sparring', 'grappling', 'striking', 'forms', 'kata', 'belt', 'rank', 'tournament', 'competition',
    'kids class', 'adult class', 'family class', 'beginner', 'advanced', 'private lesson', 'group class', 'after school', 'summer camp', 'birthday party',
    'uniform', 'gi', 'equipment', 'gloves', 'pads', 'bag work', 'mat', 'ring', 'cage', 'dojo',
    'schedule', 'trial class', 'free class', 'membership', 'contract', 'testing', 'belt test', 'certified', 'master', 'instructor'
  ],
  'Dance Studio': [
    'dance', 'ballet', 'jazz', 'tap', 'hip hop', 'contemporary', 'modern', 'lyrical', 'ballroom', 'Latin',
    'salsa', 'bachata', 'swing', 'tango', 'waltz', 'line dance', 'country', 'breakdance', 'pole', 'aerial',
    'kids dance', 'adult dance', 'beginner', 'intermediate', 'advanced', 'competition', 'recital', 'performance', 'choreography', 'technique',
    'private lesson', 'group class', 'drop in', 'class pack', 'membership', 'schedule', 'online booking', 'studio rental', 'party', 'event',
    'costume', 'shoes', 'attire', 'dress code', 'parking', 'waiting area', 'viewing window', 'mirrors', 'sprung floor', 'AC'
  ],
  'Golf Course': [
    'golf', 'tee time', '18 holes', '9 holes', 'twilight', 'walking', 'riding', 'cart', 'pull cart', 'caddie',
    'driving range', 'practice green', 'putting green', 'chipping area', 'lessons', 'pro shop', 'club rental', 'club fitting', 'demo day', 'tournament',
    'green fee', 'cart fee', 'membership', 'public', 'semi-private', 'private', 'resort', 'links', 'parkland', 'executive',
    'par 3', 'par 72', 'slope rating', 'course rating', 'handicap', 'GPS', 'yardage', 'scorecard', 'beverage cart', 'snack bar',
    'clubhouse', 'restaurant', 'bar', 'grill', 'locker room', 'event space', 'wedding', 'outing', 'corporate', 'charity'
  ],
  'Bowling Alley': [
    'bowling', 'lanes', 'open bowling', 'league', 'cosmic bowling', 'glow bowling', 'blacklight', 'bumpers', 'kids bowling', 'adult league',
    'shoes', 'shoe rental', 'balls', 'house ball', 'own ball', 'pro shop', 'drilling', 'league night', 'open play', 'reservations',
    'arcade', 'games', 'prizes', 'snack bar', 'food', 'drinks', 'beer', 'pizza', 'nachos', 'wings',
    'birthday party', 'party package', 'group event', 'corporate event', 'team building', 'private party', 'room rental', 'catering', 'DJ', 'music',
    'per game', 'per hour', 'unlimited', 'specials', 'discount', 'coupon', 'student discount', 'family deal', 'parking', 'clean'
  ],
  'Rock Climbing Gym': [
    'climbing', 'rock climbing', 'bouldering', 'top rope', 'lead climbing', 'auto belay', 'walls', 'routes', 'grades', 'problems',
    'beginner', 'intermediate', 'advanced', 'V scale', 'YDS', 'setting', 'new routes', 'routesetter', 'comp wall', 'training wall',
    'belay', 'belay certification', 'harness', 'shoes', 'chalk', 'rental', 'gear', 'equipment', 'crash pad', 'mat',
    'day pass', 'punch card', 'membership', 'monthly', 'annual', 'student', 'family', 'corporate', 'group', 'party',
    'classes', 'instruction', 'private lesson', 'intro class', 'youth', 'kids', 'team', 'competition', 'fitness', 'training'
  ],
  'Swimming Pool': [
    'swimming', 'pool', 'lap swim', 'open swim', 'recreational swim', 'lanes', 'lap lanes', 'diving', 'diving board', 'slide',
    'lessons', 'swim lessons', 'learn to swim', 'kids lessons', 'adult lessons', 'private lessons', 'group lessons', 'swim team', 'water polo', 'masters',
    'aqua aerobics', 'water aerobics', 'aqua fitness', 'water exercise', 'therapy', 'rehab', 'physical therapy', 'warm water', 'heated', 'indoor',
    'outdoor', 'seasonal', 'summer', 'year round', 'hours', 'schedule', 'lap swim hours', 'open swim hours', 'family swim', 'adult swim',
    'membership', 'day pass', 'punch card', 'guest', 'locker room', 'shower', 'towels', 'parking', 'lifeguard', 'clean'
  ],
  'Tennis Club': [
    'tennis', 'courts', 'hard court', 'clay court', 'grass court', 'indoor', 'outdoor', 'lighted', 'covered', 'bubble',
    'lessons', 'private lessons', 'group lessons', 'clinic', 'camp', 'junior', 'adult', 'beginner', 'intermediate', 'advanced',
    'league', 'USTA', 'team', 'tournament', 'match', 'singles', 'doubles', 'mixed doubles', 'round robin', 'ladder',
    'membership', 'court rental', 'court time', 'reservation', 'booking', 'guest', 'pro shop', 'racket', 'stringing', 'demo',
    'ball machine', 'practice', 'hitting partner', 'social', 'events', 'clinics', 'fitness', 'cardio tennis', 'pickle ball', 'paddle'
  ],
  'Boxing Gym': [
    'boxing', 'box', 'punch', 'heavy bag', 'speed bag', 'double end bag', 'mitts', 'pad work', 'shadow boxing', 'sparring',
    'gloves', 'wraps', 'hand wraps', 'headgear', 'mouthguard', 'groin protector', 'equipment', 'gear', 'rental', 'pro shop',
    'classes', 'boxing class', 'cardio boxing', 'fitness boxing', 'technique', 'fundamentals', 'beginner', 'advanced', 'competitive', 'amateur',
    'personal training', 'private lesson', 'one on one', 'trainer', 'coach', 'corner', 'conditioning', 'strength', 'cardio', 'circuit',
    'membership', 'day pass', 'drop in', 'package', 'pricing', 'trial', 'first class free', 'open gym', 'hours', 'schedule'
  ],
  'Spin Studio': [
    'spin', 'spinning', 'cycling', 'indoor cycling', 'bike', 'spin bike', 'peloton', 'stationary bike', 'cardio', 'endurance',
    'class', 'spin class', 'cycling class', 'rhythm ride', 'power ride', 'endurance ride', 'interval', 'HIIT', 'climb', 'sprint',
    'instructor', 'music', 'playlist', 'beats', 'dark room', 'lights', 'energy', 'motivation', 'community', 'tribe',
    'shoes', 'clip in', 'SPD', 'delta', 'rental', 'towel', 'water', 'locker', 'shower', 'amenities',
    'first class free', 'trial', 'class pack', 'membership', 'unlimited', 'schedule', 'booking', 'waitlist', 'cancellation', 'late policy'
  ],
  'Barre Studio': [
    'barre', 'barre class', 'ballet barre', 'bar', 'toning', 'sculpting', 'lengthening', 'strengthening', 'low impact', 'full body',
    'arms', 'thighs', 'seat', 'glutes', 'core', 'abs', 'back', 'posture', 'flexibility', 'balance',
    'small movements', 'isometric', 'pulse', 'shake', 'burn', 'tuck', 'squeeze', 'light weights', 'ball', 'resistance band',
    'beginner', 'intermediate', 'advanced', 'all levels', 'prenatal', 'postnatal', 'modifications', 'challenging', 'results', 'transformation',
    'class', 'schedule', 'membership', 'class pack', 'drop in', 'first class', 'trial', 'intro offer', 'new student', 'unlimited'
  ],
  // Retail
  'Retail Store': [
    'shopping', 'products', 'merchandise', 'inventory', 'selection', 'variety', 'brands', 'new arrivals', 'clearance', 'sale',
    'price', 'discount', 'coupon', 'deal', 'BOGO', 'percent off', 'buy one get one', 'special offer', 'member price', 'rewards',
    'return policy', 'exchange', 'refund', 'receipt', 'warranty', 'guarantee', 'gift card', 'gift receipt', 'layaway', 'financing',
    'cash', 'card', 'apple pay', 'contactless', 'checkout', 'self checkout', 'online order', 'pickup', 'delivery', 'shipping',
    'hours', 'location', 'parking', 'wheelchair accessible', 'restroom', 'fitting room', 'customer service', 'help desk', 'cart', 'basket'
  ],
  'Boutique': [
    'clothing', 'dresses', 'tops', 'pants', 'jeans', 'skirts', 'jackets', 'coats', 'sweaters', 'blouses',
    'accessories', 'jewelry', 'handbags', 'scarves', 'hats', 'belts', 'sunglasses', 'shoes', 'boots', 'sandals',
    'womens', 'mens', 'kids', 'plus size', 'petite', 'maternity', 'formal', 'casual', 'workwear', 'athleisure',
    'new arrivals', 'sale', 'clearance', 'seasonal', 'limited edition', 'local designer', 'handmade', 'vintage', 'consignment', 'sustainable',
    'gift wrapping', 'personal styling', 'alterations', 'loyalty program', 'gift card', 'online shop', 'shipping', 'returns', 'exchange', 'fitting room'
  ],
  'Jewelry Store': [
    'jewelry', 'rings', 'necklaces', 'bracelets', 'earrings', 'watches', 'pendants', 'chains', 'charms', 'anklets',
    'engagement ring', 'wedding band', 'anniversary band', 'promise ring', 'eternity band', 'mens ring', 'womens ring', 'custom ring', 'diamond ring', 'gemstone ring',
    'gold', 'silver', 'platinum', 'white gold', 'rose gold', 'sterling silver', '14k', '18k', '10k', 'plated',
    'diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'opal', 'birthstone', 'moissanite', 'lab grown', 'natural',
    'repair', 'resize', 'cleaning', 'appraisal', 'custom design', 'engraving', 'financing', 'layaway', 'trade in', 'gift wrap'
  ],
  'Florist': [
    'flowers', 'bouquet', 'arrangement', 'roses', 'lilies', 'tulips', 'sunflowers', 'orchids', 'carnations', 'mixed flowers',
    'wedding flowers', 'bridal bouquet', 'bridesmaid', 'boutonniere', 'corsage', 'centerpiece', 'ceremony', 'reception', 'arch', 'installation',
    'funeral flowers', 'sympathy', 'casket spray', 'standing spray', 'wreath', 'tribute', 'memorial', 'service', 'church', 'cemetery',
    'birthday', 'anniversary', 'valentines', 'mothers day', 'get well', 'thank you', 'congratulations', 'new baby', 'just because', 'apology',
    'delivery', 'same day delivery', 'local delivery', 'nationwide', 'pickup', 'vase', 'gift', 'plant', 'succulent', 'subscription'
  ],
  'Pet Store': [
    'pet store', 'dog', 'cat', 'fish', 'bird', 'reptile', 'small animal', 'hamster', 'guinea pig', 'rabbit',
    'dog food', 'cat food', 'treats', 'kibble', 'wet food', 'raw', 'grain free', 'prescription diet', 'puppy food', 'senior food',
    'toys', 'beds', 'crate', 'kennel', 'carrier', 'leash', 'collar', 'harness', 'bowl', 'feeder',
    'grooming', 'shampoo', 'brush', 'nail clippers', 'flea', 'tick', 'heartworm', 'supplements', 'vitamins', 'dental',
    'aquarium', 'tank', 'filter', 'heater', 'substrate', 'decoration', 'live fish', 'freshwater', 'saltwater', 'supplies'
  ],
  'Bookstore': [
    'books', 'fiction', 'nonfiction', 'bestseller', 'new release', 'paperback', 'hardcover', 'ebook', 'audiobook', 'used books',
    'mystery', 'romance', 'thriller', 'sci-fi', 'fantasy', 'horror', 'biography', 'memoir', 'history', 'self help',
    'kids books', 'children', 'young adult', 'YA', 'picture book', 'chapter book', 'middle grade', 'teen', 'educational', 'textbook',
    'author event', 'book signing', 'reading', 'book club', 'recommendations', 'staff picks', 'gift card', 'gift wrap', 'special order', 'preorder',
    'coffee', 'cafe', 'seating', 'browse', 'local', 'independent', 'indie', 'loyalty program', 'rewards', 'membership'
  ],
  'Gift Shop': [
    'gifts', 'gift shop', 'souvenirs', 'keepsake', 'memento', 'present', 'unique gifts', 'local gifts', 'handmade', 'artisan',
    'cards', 'greeting cards', 'birthday', 'thank you', 'sympathy', 'wedding', 'baby', 'graduation', 'holiday', 'seasonal',
    'home decor', 'candles', 'picture frames', 'ornaments', 'figurines', 'wall art', 'kitchen', 'garden', 'seasonal decor', 'holiday decor',
    'jewelry', 'accessories', 'scarves', 'bags', 'wallets', 'keychains', 'magnets', 'stickers', 'postcards', 'apparel',
    'gift wrap', 'gift basket', 'gift box', 'custom', 'personalized', 'engraved', 'monogram', 'corporate gifts', 'bulk', 'wholesale'
  ],
  'Furniture Store': [
    'furniture', 'sofa', 'couch', 'sectional', 'loveseat', 'recliner', 'chair', 'ottoman', 'coffee table', 'end table',
    'bedroom', 'bed', 'mattress', 'dresser', 'nightstand', 'headboard', 'bed frame', 'king', 'queen', 'full',
    'dining', 'dining table', 'dining chairs', 'buffet', 'hutch', 'bar stool', 'counter stool', 'bench', 'kitchen table', 'dinette',
    'office', 'desk', 'office chair', 'bookcase', 'filing cabinet', 'home office', 'entertainment center', 'TV stand', 'media console', 'shelving',
    'delivery', 'assembly', 'financing', 'layaway', 'clearance', 'sale', 'floor model', 'custom order', 'fabric', 'leather'
  ],
  'Electronics Store': [
    'electronics', 'TV', 'television', 'computer', 'laptop', 'tablet', 'phone', 'smartphone', 'headphones', 'speakers',
    'gaming', 'PlayStation', 'Xbox', 'Nintendo', 'PC gaming', 'monitor', 'keyboard', 'mouse', 'controller', 'VR',
    'camera', 'DSLR', 'mirrorless', 'GoPro', 'drone', 'lens', 'memory card', 'tripod', 'lighting', 'accessories',
    'smart home', 'Alexa', 'Google Home', 'smart TV', 'streaming', 'Roku', 'Apple TV', 'Fire Stick', 'soundbar', 'home theater',
    'warranty', 'protection plan', 'trade in', 'financing', 'price match', 'open box', 'refurbished', 'clearance', 'new release', 'preorder'
  ],
  'Hardware Store': [
    'hardware', 'tools', 'power tools', 'hand tools', 'drill', 'saw', 'hammer', 'screwdriver', 'wrench', 'pliers',
    'lumber', 'wood', 'plywood', 'boards', '2x4', 'trim', 'molding', 'drywall', 'cement', 'concrete',
    'plumbing', 'pipes', 'fittings', 'faucet', 'toilet', 'sink', 'water heater', 'PVC', 'copper', 'PEX',
    'electrical', 'wire', 'outlet', 'switch', 'breaker', 'panel', 'lighting', 'bulbs', 'LED', 'fixtures',
    'paint', 'stain', 'primer', 'brush', 'roller', 'tape', 'sandpaper', 'caulk', 'adhesive', 'fasteners'
  ],
  'Sporting Goods': [
    'sports', 'sporting goods', 'athletic', 'fitness', 'outdoor', 'camping', 'hiking', 'fishing', 'hunting', 'cycling',
    'football', 'basketball', 'baseball', 'soccer', 'golf', 'tennis', 'hockey', 'volleyball', 'lacrosse', 'swimming',
    'shoes', 'cleats', 'running shoes', 'basketball shoes', 'training', 'apparel', 'jersey', 'shorts', 'pants', 'jacket',
    'equipment', 'balls', 'bats', 'gloves', 'helmets', 'pads', 'racket', 'clubs', 'accessories', 'bags',
    'team orders', 'custom', 'screen printing', 'embroidery', 'fitting', 'clearance', 'sale', 'brands', 'Nike', 'Adidas'
  ],
  'Bicycle Shop': [
    'bicycle', 'bike', 'road bike', 'mountain bike', 'hybrid', 'cruiser', 'BMX', 'kids bike', 'electric bike', 'e-bike',
    'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Schwinn', 'Raleigh', 'GT', 'Felt', 'Scott',
    'helmet', 'lock', 'lights', 'pump', 'water bottle', 'cage', 'rack', 'basket', 'fenders', 'kickstand',
    'repair', 'tune up', 'flat fix', 'brake adjustment', 'gear adjustment', 'wheel true', 'overhaul', 'fitting', 'assembly', 'maintenance',
    'new', 'used', 'trade in', 'financing', 'test ride', 'layaway', 'clearance', 'sale', 'accessories', 'apparel'
  ],
  'Outdoor Store': [
    'outdoor', 'camping', 'hiking', 'backpacking', 'climbing', 'fishing', 'hunting', 'kayaking', 'paddling', 'skiing',
    'tent', 'sleeping bag', 'sleeping pad', 'backpack', 'daypack', 'cooler', 'stove', 'lantern', 'headlamp', 'chair',
    'boots', 'hiking boots', 'trail shoes', 'sandals', 'waders', 'rain gear', 'jacket', 'base layer', 'fleece', 'down',
    'fishing rod', 'reel', 'tackle', 'bait', 'lures', 'line', 'net', 'license', 'hunting gear', 'camo',
    'REI', 'Patagonia', 'North Face', 'Columbia', 'Osprey', 'rental', 'gear rental', 'expert advice', 'classes', 'events'
  ],
  'Thrift Store': [
    'thrift', 'secondhand', 'used', 'pre-owned', 'consignment', 'resale', 'vintage', 'retro', 'antique', 'donation',
    'clothing', 'shoes', 'accessories', 'handbags', 'jewelry', 'mens', 'womens', 'kids', 'baby', 'maternity',
    'furniture', 'home goods', 'kitchenware', 'decor', 'art', 'books', 'records', 'CDs', 'DVDs', 'electronics',
    'toys', 'games', 'sports equipment', 'tools', 'appliances', 'linens', 'bedding', 'curtains', 'rugs', 'lamps',
    'cheap', 'deals', 'bargain', 'discount', 'sale day', 'color tag', 'donation drop off', 'tax receipt', 'nonprofit', 'charity'
  ],
  'Consignment Shop': [
    'consignment', 'resale', 'secondhand', 'pre-owned', 'gently used', 'like new', 'designer', 'brand name', 'high end', 'luxury',
    'clothing', 'womens', 'mens', 'kids', 'maternity', 'plus size', 'formal', 'casual', 'business', 'athletic',
    'handbags', 'purses', 'designer bags', 'Louis Vuitton', 'Gucci', 'Chanel', 'Coach', 'shoes', 'jewelry', 'accessories',
    'furniture', 'home decor', 'art', 'antiques', 'collectibles', 'vintage', 'estate', 'downsizing', 'moving sale', 'estate sale',
    'sell', 'consign', 'seller', 'split', 'percentage', 'payout', 'appointment', 'drop off', 'pickup', 'selling tips'
  ],
  'Antique Store': [
    'antiques', 'antique', 'vintage', 'collectibles', 'estate', 'retro', 'mid century', 'victorian', 'art deco', 'primitive',
    'furniture', 'dresser', 'table', 'chair', 'cabinet', 'armoire', 'desk', 'bed', 'mirror', 'clock',
    'china', 'porcelain', 'glassware', 'crystal', 'silverware', 'silver', 'brass', 'copper', 'pewter', 'pottery',
    'jewelry', 'watches', 'coins', 'stamps', 'postcards', 'books', 'maps', 'prints', 'paintings', 'artwork',
    'toys', 'dolls', 'militaria', 'sports memorabilia', 'advertising', 'signs', 'lighting', 'lamps', 'rugs', 'textiles'
  ],
  'Art Gallery': [
    'art', 'gallery', 'artwork', 'paintings', 'sculpture', 'photography', 'prints', 'drawings', 'mixed media', 'installation',
    'contemporary', 'modern', 'abstract', 'realism', 'impressionism', 'pop art', 'street art', 'folk art', 'fine art', 'local art',
    'artist', 'local artist', 'emerging artist', 'established artist', 'featured artist', 'solo show', 'group show', 'exhibition', 'opening', 'reception',
    'original', 'limited edition', 'signed', 'numbered', 'framed', 'unframed', 'canvas', 'paper', 'custom framing', 'commission',
    'buy', 'collect', 'invest', 'price range', 'affordable', 'high end', 'consultation', 'corporate art', 'art rental', 'appraisal'
  ],
  'Frame Shop': [
    'framing', 'custom framing', 'picture frame', 'frame', 'mat', 'matting', 'mounting', 'glass', 'museum glass', 'UV glass',
    'wood frame', 'metal frame', 'ornate', 'modern', 'rustic', 'contemporary', 'traditional', 'gilded', 'black', 'white',
    'photo', 'art', 'print', 'poster', 'diploma', 'certificate', 'jersey', 'memorabilia', 'shadow box', 'canvas stretch',
    'conservation', 'archival', 'acid free', 'preservation', 'restoration', 'repair', 'reframe', 'dry mount', 'float mount', 'hinge mount',
    'ready made', 'standard size', 'custom size', 'quick turnaround', 'same day', 'rush', 'bulk', 'corporate', 'wholesale', 'delivery'
  ],
  'Music Store': [
    'music', 'instruments', 'guitar', 'acoustic', 'electric', 'bass', 'ukulele', 'banjo', 'mandolin', 'strings',
    'piano', 'keyboard', 'synthesizer', 'organ', 'digital piano', 'drums', 'drum set', 'cymbals', 'percussion', 'electronic drums',
    'band', 'orchestra', 'violin', 'cello', 'viola', 'flute', 'clarinet', 'saxophone', 'trumpet', 'trombone',
    'amplifier', 'amp', 'pedals', 'effects', 'cables', 'picks', 'straps', 'cases', 'stands', 'accessories',
    'lessons', 'rentals', 'repair', 'setup', 'trade in', 'used', 'vintage', 'new', 'financing', 'layaway'
  ],
  'Video Game Store': [
    'video games', 'games', 'gaming', 'PlayStation', 'PS5', 'PS4', 'Xbox', 'Series X', 'Nintendo', 'Switch',
    'PC games', 'Steam', 'digital', 'physical', 'disc', 'download code', 'gift card', 'PSN', 'Xbox Live', 'Nintendo eShop',
    'new games', 'used games', 'preowned', 'trade in', 'sell games', 'buy games', 'preorder', 'release date', 'midnight release', 'collector edition',
    'console', 'controller', 'headset', 'accessories', 'charging', 'storage', 'gaming chair', 'monitor', 'capture card', 'streaming',
    'retro', 'classic', 'NES', 'SNES', 'N64', 'GameCube', 'Wii', 'collectibles', 'figures', 'merchandise'
  ],
  'Comic Book Store': [
    'comics', 'comic books', 'graphic novels', 'manga', 'DC', 'Marvel', 'Image', 'Dark Horse', 'indie', 'independent',
    'new comics', 'back issues', 'variant', 'cover', 'first print', 'key issue', 'graded', 'CGC', 'CBCS', 'slabbed',
    'pull list', 'subscription', 'new comic day', 'Wednesday', 'FCBD', 'Free Comic Book Day', 'sale', 'discount', 'clearance', 'dollar bin',
    'collectibles', 'statues', 'figures', 'action figures', 'Funko Pop', 'posters', 'prints', 'art', 't-shirts', 'merchandise',
    'games', 'trading cards', 'Pokemon', 'Magic', 'Yu-Gi-Oh', 'D&D', 'RPG', 'board games', 'events', 'tournaments'
  ],
  'Toy Store': [
    'toys', 'games', 'kids', 'children', 'baby', 'toddler', 'preschool', 'educational', 'STEM', 'learning',
    'dolls', 'action figures', 'Barbie', 'LEGO', 'Hot Wheels', 'Nerf', 'Play-Doh', 'board games', 'puzzles', 'stuffed animals',
    'outdoor toys', 'bikes', 'scooters', 'ride on', 'swing set', 'playhouse', 'sandbox', 'water toys', 'sports', 'balls',
    'arts and crafts', 'building toys', 'remote control', 'RC', 'electronics', 'video games', 'costumes', 'dress up', 'party supplies', 'favors',
    'birthday', 'gift', 'gift wrap', 'registry', 'wish list', 'new arrivals', 'clearance', 'sale', 'brands', 'quality'
  ],
  'Baby Store': [
    'baby', 'infant', 'newborn', 'toddler', 'nursery', 'maternity', 'pregnancy', 'expecting', 'new parent', 'registry',
    'stroller', 'car seat', 'carrier', 'wrap', 'bassinet', 'crib', 'pack n play', 'high chair', 'bouncer', 'swing',
    'diapers', 'wipes', 'formula', 'bottles', 'breast pump', 'nursing', 'feeding', 'pacifier', 'teething', 'bibs',
    'clothes', 'onesies', 'sleepers', 'shoes', 'hats', 'blankets', 'swaddle', 'bedding', 'sheets', 'mattress',
    'toys', 'books', 'monitors', 'gates', 'safety', 'bath', 'skincare', 'gear', 'travel', 'gift'
  ],
  'Bridal Shop': [
    'bridal', 'wedding dress', 'wedding gown', 'bride', 'bridesmaid', 'mother of bride', 'mother of groom', 'flower girl', 'formal', 'gown',
    'designer', 'Vera Wang', 'David\'s Bridal', 'Maggie Sottero', 'Pronovias', 'Allure', 'Mori Lee', 'Justin Alexander', 'Stella York', 'Essence',
    'A-line', 'ballgown', 'mermaid', 'sheath', 'fit and flare', 'empire', 'tea length', 'short', 'plus size', 'petite',
    'veil', 'headpiece', 'tiara', 'jewelry', 'shoes', 'accessories', 'shapewear', 'lingerie', 'garter', 'something blue',
    'appointment', 'fitting', 'alterations', 'rush', 'sample sale', 'trunk show', 'consignment', 'preservation', 'cleaning', 'storage'
  ],
  'Shoe Store': [
    'shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'loafers', 'oxfords', 'athletic', 'dress shoes',
    'Nike', 'Adidas', 'Converse', 'Vans', 'New Balance', 'Skechers', 'Clarks', 'Steve Madden', 'Sam Edelman', 'Cole Haan',
    'mens', 'womens', 'kids', 'wide', 'narrow', 'size', 'half size', 'fitting', 'measure', 'orthotics',
    'running', 'walking', 'training', 'basketball', 'soccer', 'cleats', 'work boots', 'steel toe', 'slip resistant', 'waterproof',
    'clearance', 'sale', 'BOGO', 'discount', 'rewards', 'gift card', 'return policy', 'exchange', 'comfort', 'style'
  ],
  'Sunglasses Store': [
    'sunglasses', 'eyewear', 'shades', 'frames', 'lenses', 'prescription sunglasses', 'polarized', 'UV protection', 'mirrored', 'gradient',
    'Ray-Ban', 'Oakley', 'Maui Jim', 'Costa', 'Gucci', 'Prada', 'Tom Ford', 'Versace', 'Dior', 'Persol',
    'aviator', 'wayfarer', 'round', 'square', 'cat eye', 'sport', 'wrap', 'oversized', 'classic', 'modern',
    'mens', 'womens', 'unisex', 'kids', 'fitting', 'adjustment', 'repair', 'nose pads', 'temple tips', 'case',
    'insurance', 'FSA', 'HSA', 'vision plan', 'warranty', 'replacement', 'scratch resistant', 'anti-reflective', 'transitions', 'clip on'
  ],
  'Watch Store': [
    'watches', 'watch', 'timepiece', 'luxury watch', 'designer watch', 'sport watch', 'dress watch', 'smart watch', 'analog', 'digital',
    'Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Cartier', 'Seiko', 'Citizen', 'Tissot', 'Fossil', 'Michael Kors',
    'automatic', 'mechanical', 'quartz', 'chronograph', 'diver', 'pilot', 'skeleton', 'moonphase', 'GMT', 'tourbillon',
    'mens', 'womens', 'unisex', 'gold', 'silver', 'stainless steel', 'leather band', 'metal bracelet', 'rubber strap', 'NATO',
    'battery', 'repair', 'service', 'overhaul', 'sizing', 'band replacement', 'water resistance', 'warranty', 'trade in', 'consignment'
  ],
  'Luggage Store': [
    'luggage', 'suitcase', 'carry on', 'checked bag', 'duffel', 'backpack', 'travel bag', 'tote', 'garment bag', 'weekender',
    'Samsonite', 'Tumi', 'Rimowa', 'Away', 'Briggs & Riley', 'Travelpro', 'Delsey', 'American Tourister', 'Victorinox', 'Hartmann',
    'hardside', 'softside', 'spinner', 'wheeled', '2 wheel', '4 wheel', 'expandable', 'lightweight', 'durable', 'TSA lock',
    'travel accessories', 'packing cubes', 'toiletry bag', 'neck pillow', 'luggage tag', 'passport holder', 'adapter', 'scale', 'organizer', 'compression',
    'set', 'matching', 'warranty', 'repair', 'replacement', 'sale', 'clearance', 'new arrivals', 'brands', 'quality'
  ],
  'Mattress Store': [
    'mattress', 'bed', 'memory foam', 'innerspring', 'hybrid', 'latex', 'pillow top', 'firm', 'medium', 'plush',
    'king', 'queen', 'full', 'twin', 'twin XL', 'California king', 'split king', 'adjustable base', 'foundation', 'box spring',
    'Tempur-Pedic', 'Sealy', 'Serta', 'Beautyrest', 'Purple', 'Casper', 'Sleep Number', 'Stearns & Foster', 'Simmons', 'Nectar',
    'pillow', 'sheets', 'mattress protector', 'bed frame', 'headboard', 'bedding', 'comforter', 'duvet', 'blanket', 'accessories',
    'trial period', 'warranty', 'financing', 'delivery', 'setup', 'removal', 'sale', 'clearance', 'floor model', 'comfort guarantee'
  ],
  'Appliance Store': [
    'appliances', 'refrigerator', 'fridge', 'washer', 'dryer', 'dishwasher', 'stove', 'oven', 'range', 'microwave',
    'freezer', 'ice maker', 'wine cooler', 'beverage center', 'garbage disposal', 'trash compactor', 'hood', 'vent', 'cooktop', 'wall oven',
    'Samsung', 'LG', 'Whirlpool', 'GE', 'KitchenAid', 'Maytag', 'Frigidaire', 'Bosch', 'Viking', 'Sub-Zero',
    'stainless steel', 'black stainless', 'white', 'black', 'slate', 'panel ready', 'counter depth', 'french door', 'side by side', 'top freezer',
    'delivery', 'installation', 'haul away', 'warranty', 'extended warranty', 'financing', 'rebate', 'sale', 'clearance', 'open box'
  ],
  'Lighting Store': [
    'lighting', 'lights', 'chandelier', 'pendant', 'ceiling light', 'flush mount', 'semi-flush', 'wall sconce', 'lamp', 'table lamp',
    'floor lamp', 'desk lamp', 'track lighting', 'recessed', 'under cabinet', 'landscape', 'outdoor lighting', 'porch light', 'security light', 'LED',
    'modern', 'contemporary', 'traditional', 'transitional', 'farmhouse', 'industrial', 'crystal', 'brass', 'bronze', 'chrome',
    'bulbs', 'LED bulbs', 'smart bulbs', 'dimmer', 'switch', 'transformer', 'shade', 'globes', 'glass', 'fabric',
    'design consultation', 'showroom', 'custom', 'special order', 'delivery', 'installation', 'sale', 'clearance', 'trade discount', 'wholesale'
  ],
  'Rug Store': [
    'rugs', 'rug', 'carpet', 'area rug', 'runner', 'oriental', 'Persian', 'Turkish', 'Moroccan', 'kilim',
    'modern', 'contemporary', 'traditional', 'transitional', 'shag', 'flatweave', 'hand knotted', 'hand tufted', 'machine made', 'vintage',
    'wool', 'silk', 'cotton', 'jute', 'sisal', 'synthetic', 'polypropylene', 'polyester', 'nylon', 'viscose',
    'living room', 'bedroom', 'dining room', 'entryway', 'kitchen', 'bathroom', 'outdoor', 'patio', 'kids', 'nursery',
    'custom size', 'padding', 'rug pad', 'cleaning', 'repair', 'restoration', 'appraisal', 'trade in', 'consignment', 'delivery'
  ],
  'Kitchen Store': [
    'kitchen', 'cookware', 'pots', 'pans', 'skillet', 'dutch oven', 'bakeware', 'sheet pan', 'roasting pan', 'casserole',
    'knives', 'knife set', 'cutting board', 'utensils', 'spatula', 'whisk', 'tongs', 'ladle', 'measuring cups', 'mixing bowls',
    'small appliances', 'blender', 'mixer', 'food processor', 'toaster', 'coffee maker', 'instant pot', 'air fryer', 'juicer', 'stand mixer',
    'gadgets', 'tools', 'peeler', 'grater', 'mandoline', 'thermometer', 'timer', 'scale', 'opener', 'storage',
    'registry', 'gift', 'brands', 'Le Creuset', 'All-Clad', 'KitchenAid', 'Cuisinart', 'OXO', 'sale', 'clearance'
  ],
  'Bath Store': [
    'bath', 'bathroom', 'towels', 'bath towels', 'hand towels', 'washcloths', 'bath mat', 'rug', 'shower curtain', 'liner',
    'accessories', 'soap dispenser', 'toothbrush holder', 'tumbler', 'tissue holder', 'trash can', 'toilet brush', 'hooks', 'robe hook', 'towel bar',
    'shower', 'showerhead', 'rain shower', 'handheld', 'body jets', 'faucet', 'sink', 'toilet', 'bidet', 'vanity',
    'storage', 'cabinet', 'shelf', 'organizer', 'basket', 'caddy', 'mirror', 'medicine cabinet', 'lighting', 'exhaust fan',
    'robes', 'slippers', 'spa', 'candles', 'diffuser', 'bath bombs', 'salts', 'oils', 'luxury', 'gift'
  ],
  'Doggy Daycare': [
    'dog daycare', 'doggy daycare', 'daycare', 'play', 'playtime', 'socialization', 'exercise', 'supervision', 'group play', 'pack',
    'small dog', 'large dog', 'puppy', 'senior', 'temperament', 'evaluation', 'assessment', 'trial day', 'meet and greet', 'compatibility',
    'indoor', 'outdoor', 'play yard', 'climate controlled', 'AC', 'heat', 'clean', 'safe', 'secure', 'fenced',
    'half day', 'full day', 'package', 'monthly', 'weekly', 'drop in', 'early drop off', 'late pickup', 'hours', 'schedule',
    'webcam', 'report card', 'photos', 'updates', 'feeding', 'medication', 'nap time', 'rest', 'vaccination', 'requirements'
  ],
  'Pet Sitter': [
    'pet sitter', 'pet sitting', 'in home', 'house sitting', 'overnight', 'drop in', 'visit', 'dog walking', 'walk', 'potty break',
    'dog', 'cat', 'bird', 'fish', 'reptile', 'small animal', 'exotic', 'multiple pets', 'special needs', 'senior pet',
    'feeding', 'medication', 'insulin', 'subcutaneous', 'pills', 'liquid', 'eye drops', 'ear drops', 'bandage', 'wound care',
    'daily rate', 'per visit', 'overnight rate', 'holiday rate', 'last minute', 'recurring', 'regular', 'backup', 'trusted', 'insured',
    'bonded', 'background check', 'references', 'reviews', 'experience', 'certified', 'first aid', 'CPR', 'photos', 'updates'
  ],
  // Services
  'Dry Cleaner': [
    'dry cleaning', 'laundry', 'wash and fold', 'shirts', 'pants', 'suits', 'dresses', 'coats', 'jackets', 'sweaters',
    'stain removal', 'spot treatment', 'pressing', 'ironing', 'starching', 'hand wash', 'delicates', 'silk', 'wool', 'cashmere',
    'alterations', 'tailoring', 'hemming', 'taking in', 'letting out', 'zipper repair', 'button replacement', 'patching', 'relining', 'resizing',
    'wedding gown', 'prom dress', 'formal wear', 'uniforms', 'linens', 'comforters', 'curtains', 'rugs', 'leather', 'suede',
    'same day', 'next day', 'rush', 'pickup', 'delivery', 'drop off', 'drive thru', 'coupons', 'punch card', 'monthly account'
  ],
  'Plumber': [
    'plumber', 'plumbing', 'leak', 'clog', 'drain', 'pipe', 'faucet', 'toilet', 'sink', 'shower',
    'water heater', 'tankless', 'garbage disposal', 'sump pump', 'water softener', 'filtration', 'pressure', 'main line', 'sewer', 'septic',
    'repair', 'replacement', 'installation', 'maintenance', 'inspection', 'emergency', '24 hour', 'same day', 'weekend', 'after hours',
    'estimate', 'free estimate', 'quote', 'flat rate', 'hourly', 'licensed', 'insured', 'bonded', 'warranty', 'guarantee',
    'residential', 'commercial', 'new construction', 'remodel', 'bathroom', 'kitchen', 'laundry', 'basement', 'outdoor', 'sprinkler'
  ],
  'HVAC': [
    'HVAC', 'heating', 'cooling', 'air conditioning', 'AC', 'furnace', 'heat pump', 'boiler', 'ductless', 'mini split',
    'repair', 'service', 'installation', 'replacement', 'maintenance', 'tune up', 'inspection', 'diagnostic', 'emergency', '24 hour',
    'not cooling', 'not heating', 'no air', 'weak airflow', 'strange noise', 'smell', 'leak', 'frozen', 'thermostat', 'filter',
    'Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 'American Standard', 'Bryant', 'Daikin', 'efficiency', 'SEER',
    'estimate', 'free estimate', 'financing', 'rebate', 'licensed', 'insured', 'certified', 'NATE', 'EPA', 'warranty'
  ],
  'Landscaping': [
    'landscaping', 'landscape', 'lawn', 'yard', 'garden', 'plants', 'trees', 'shrubs', 'flowers', 'mulch',
    'design', 'installation', 'hardscape', 'patio', 'walkway', 'retaining wall', 'fire pit', 'outdoor living', 'water feature', 'lighting',
    'lawn care', 'mowing', 'edging', 'trimming', 'pruning', 'fertilizing', 'weed control', 'aeration', 'seeding', 'sod',
    'irrigation', 'sprinkler', 'drip', 'drainage', 'grading', 'excavation', 'tree removal', 'stump grinding', 'clearing', 'cleanup',
    'residential', 'commercial', 'maintenance', 'weekly', 'bi-weekly', 'one time', 'seasonal', 'spring cleanup', 'fall cleanup', 'estimate'
  ],
  'Cleaning Service': [
    'cleaning', 'house cleaning', 'maid service', 'housekeeping', 'clean', 'cleaner', 'home', 'residential', 'commercial', 'office',
    'deep cleaning', 'standard cleaning', 'move in', 'move out', 'post construction', 'one time', 'recurring', 'weekly', 'bi-weekly', 'monthly',
    'kitchen', 'bathroom', 'bedroom', 'living room', 'floors', 'vacuum', 'mop', 'dust', 'wipe', 'sanitize',
    'windows', 'blinds', 'baseboards', 'cabinets', 'appliances', 'oven', 'refrigerator', 'laundry', 'dishes', 'organization',
    'supplies included', 'eco friendly', 'green', 'pet friendly', 'insured', 'bonded', 'background check', 'estimate', 'quote', 'book online'
  ],
  'Pest Control': [
    'pest control', 'exterminator', 'pest', 'bug', 'insect', 'rodent', 'mouse', 'rat', 'ant', 'roach',
    'cockroach', 'spider', 'bed bug', 'termite', 'flea', 'tick', 'mosquito', 'wasp', 'bee', 'hornet',
    'inspection', 'treatment', 'spray', 'bait', 'trap', 'removal', 'prevention', 'barrier', 'fumigation', 'tent',
    'residential', 'commercial', 'one time', 'monthly', 'quarterly', 'annual', 'contract', 'warranty', 'guarantee', 'retreatment',
    'estimate', 'free inspection', 'same day', 'emergency', 'licensed', 'certified', 'eco friendly', 'pet safe', 'child safe', 'organic'
  ],
  'Roofing': [
    'roofing', 'roof', 'roofer', 'shingles', 'tile', 'metal', 'flat roof', 'TPO', 'EPDM', 'slate',
    'repair', 'replacement', 'installation', 'new roof', 'reroof', 'tear off', 'overlay', 'patch', 'leak', 'damage',
    'storm damage', 'hail damage', 'wind damage', 'insurance claim', 'inspection', 'assessment', 'estimate', 'quote', 'free estimate', 'financing',
    'gutter', 'downspout', 'flashing', 'vent', 'skylight', 'chimney', 'soffit', 'fascia', 'ridge', 'valley',
    'licensed', 'insured', 'bonded', 'warranty', 'manufacturer warranty', 'workmanship', 'GAF', 'Owens Corning', 'CertainTeed', 'certified'
  ],
  'Painting': [
    'painting', 'painter', 'paint', 'interior', 'exterior', 'house painting', 'residential', 'commercial', 'walls', 'ceiling',
    'trim', 'doors', 'cabinets', 'deck', 'fence', 'stain', 'primer', 'prep', 'sand', 'caulk',
    'Sherwin Williams', 'Benjamin Moore', 'Behr', 'PPG', 'Dunn Edwards', 'color', 'color consultation', 'samples', 'match', 'custom',
    'estimate', 'free estimate', 'quote', 'per room', 'per square foot', 'hourly', 'licensed', 'insured', 'warranty', 'guarantee',
    'wallpaper', 'wallpaper removal', 'texture', 'drywall repair', 'popcorn ceiling', 'removal', 'epoxy', 'garage floor', 'pressure wash', 'power wash'
  ],
  'Handyman': [
    'handyman', 'handy man', 'repairs', 'maintenance', 'fix', 'install', 'assemble', 'home repair', 'honey do', 'odd jobs',
    'drywall', 'patch', 'hole', 'texture', 'paint', 'caulk', 'grout', 'tile', 'trim', 'molding',
    'door', 'window', 'screen', 'lock', 'handle', 'hinge', 'weatherstrip', 'threshold', 'frame', 'hardware',
    'faucet', 'toilet', 'sink', 'garbage disposal', 'outlet', 'switch', 'light fixture', 'ceiling fan', 'smoke detector', 'TV mount',
    'furniture assembly', 'IKEA', 'shelf', 'curtain rod', 'picture hanging', 'hourly', 'flat rate', 'estimate', 'licensed', 'insured'
  ],
  'Carpet Cleaning': [
    'carpet cleaning', 'carpet cleaner', 'carpets', 'rugs', 'upholstery', 'furniture', 'sofa', 'couch', 'mattress', 'auto',
    'steam cleaning', 'hot water extraction', 'deep clean', 'shampoo', 'dry cleaning', 'encapsulation', 'bonnet', 'truck mount', 'portable', 'eco friendly',
    'stain', 'stain removal', 'spot', 'pet stain', 'pet odor', 'urine', 'deodorizer', 'sanitize', 'disinfect', 'allergen',
    'per room', 'per square foot', 'whole house', 'special', 'deal', 'coupon', 'estimate', 'free estimate', 'same day', 'next day',
    'residential', 'commercial', 'office', 'move out', 'move in', 'rental', 'Airbnb', 'warranty', 'guarantee', 'satisfaction'
  ],
  'Window Cleaning': [
    'window cleaning', 'window washer', 'windows', 'glass', 'screens', 'tracks', 'sills', 'frames', 'mirrors', 'skylights',
    'interior', 'exterior', 'inside', 'outside', 'residential', 'commercial', 'storefront', 'office', 'high rise', 'ladder',
    'streak free', 'spot free', 'squeegee', 'pure water', 'water fed pole', 'pressure wash', 'soft wash', 'detail', 'hand wash', 'professional',
    'per window', 'per pane', 'whole house', 'estimate', 'free estimate', 'quote', 'package', 'special', 'recurring', 'one time',
    'seasonal', 'spring', 'fall', 'holiday', 'move in', 'move out', 'insured', 'bonded', 'satisfaction', 'guarantee'
  ],
  'Pressure Washing': [
    'pressure washing', 'power washing', 'soft wash', 'exterior cleaning', 'driveway', 'sidewalk', 'patio', 'deck', 'fence', 'siding',
    'house wash', 'roof wash', 'gutter cleaning', 'concrete', 'brick', 'stucco', 'vinyl', 'wood', 'composite', 'stone',
    'mold', 'mildew', 'algae', 'moss', 'dirt', 'grime', 'stains', 'oil', 'rust', 'graffiti',
    'residential', 'commercial', 'fleet', 'parking lot', 'building', 'awning', 'signage', 'dumpster pad', 'drive thru', 'restaurant',
    'estimate', 'free estimate', 'per square foot', 'flat rate', 'package', 'before after', 'insured', 'licensed', 'eco friendly', 'same day'
  ],
  'Pool Service': [
    'pool service', 'pool cleaning', 'pool maintenance', 'swimming pool', 'spa', 'hot tub', 'jacuzzi', 'pool care', 'pool guy', 'pool company',
    'weekly service', 'chemical balance', 'chlorine', 'pH', 'alkalinity', 'algae', 'green pool', 'cloudy', 'filter', 'pump',
    'skimming', 'brushing', 'vacuuming', 'tile cleaning', 'drain', 'refill', 'acid wash', 'plaster', 'equipment', 'repair',
    'heater', 'heat pump', 'salt cell', 'automation', 'lights', 'cover', 'safety', 'inspection', 'leak detection', 'renovation',
    'opening', 'closing', 'winterize', 'seasonal', 'monthly', 'one time', 'estimate', 'residential', 'commercial', 'HOA'
  ],
  'Garage Door': [
    'garage door', 'garage door repair', 'overhead door', 'opener', 'spring', 'cable', 'roller', 'track', 'panel', 'section',
    'broken spring', 'broken cable', 'off track', 'wont open', 'wont close', 'noisy', 'slow', 'stuck', 'dent', 'damage',
    'replacement', 'installation', 'new door', 'new opener', 'insulated', 'steel', 'wood', 'aluminum', 'fiberglass', 'glass',
    'LiftMaster', 'Chamberlain', 'Genie', 'Craftsman', 'Amarr', 'Clopay', 'Wayne Dalton', 'CHI', 'smart', 'WiFi',
    'emergency', '24 hour', 'same day', 'estimate', 'free estimate', 'warranty', 'licensed', 'insured', 'residential', 'commercial'
  ],
  'Fence Company': [
    'fence', 'fencing', 'fence company', 'fence installation', 'fence repair', 'privacy fence', 'wood fence', 'vinyl fence', 'chain link', 'aluminum',
    'iron', 'wrought iron', 'ornamental', 'picket', 'split rail', 'farm fence', 'horse fence', 'pool fence', 'dog fence', 'security fence',
    'gate', 'driveway gate', 'automatic gate', 'sliding gate', 'swing gate', 'pedestrian gate', 'lock', 'latch', 'hardware', 'post',
    'repair', 'replace', 'stain', 'paint', 'leaning', 'rotted', 'damaged', 'storm damage', 'fallen', 'blown down',
    'estimate', 'free estimate', 'per foot', 'linear foot', 'permit', 'survey', 'property line', 'HOA', 'licensed', 'insured'
  ],
  'Tree Service': [
    'tree service', 'tree removal', 'tree trimming', 'tree pruning', 'tree cutting', 'arborist', 'tree care', 'tree company', 'trees', 'branches',
    'stump', 'stump grinding', 'stump removal', 'root', 'root removal', 'land clearing', 'lot clearing', 'brush', 'debris', 'hauling',
    'dead tree', 'dying tree', 'diseased', 'hazardous', 'leaning', 'storm damage', 'emergency', 'fallen tree', 'crane', 'bucket truck',
    'trimming', 'shaping', 'canopy', 'crown', 'thinning', 'raising', 'reduction', 'cabling', 'bracing', 'lightning protection',
    'estimate', 'free estimate', 'licensed', 'insured', 'bonded', 'certified', 'ISA', 'residential', 'commercial', 'firewood'
  ],
  'Lawn Care': [
    'lawn care', 'lawn service', 'lawn mowing', 'grass cutting', 'yard work', 'lawn maintenance', 'turf', 'grass', 'yard', 'property',
    'mowing', 'edging', 'trimming', 'blowing', 'weed eating', 'string trim', 'clean up', 'bagging', 'mulching', 'disposal',
    'fertilizing', 'weed control', 'pre-emergent', 'post-emergent', 'herbicide', 'pesticide', 'grub control', 'fungicide', 'treatment', 'application',
    'aeration', 'overseeding', 'seeding', 'sod', 'sodding', 'dethatching', 'top dressing', 'soil', 'pH', 'test',
    'weekly', 'bi-weekly', 'monthly', 'one time', 'seasonal', 'contract', 'estimate', 'free estimate', 'residential', 'commercial'
  ],
  'Sprinkler Service': [
    'sprinkler', 'irrigation', 'sprinkler system', 'sprinkler repair', 'sprinkler installation', 'lawn sprinkler', 'drip irrigation', 'watering', 'water', 'landscape',
    'head', 'sprinkler head', 'nozzle', 'rotor', 'spray', 'pop up', 'drip', 'emitter', 'valve', 'solenoid',
    'controller', 'timer', 'smart controller', 'WiFi', 'rain sensor', 'zone', 'coverage', 'pressure', 'pipe', 'line',
    'leak', 'broken', 'clogged', 'not working', 'adjustment', 'tune up', 'maintenance', 'audit', 'efficiency', 'water saving',
    'winterization', 'blowout', 'spring startup', 'activation', 'estimate', 'free estimate', 'licensed', 'insured', 'residential', 'commercial'
  ],
  'Flooring': [
    'flooring', 'floors', 'floor installation', 'hardwood', 'laminate', 'vinyl', 'LVP', 'LVT', 'tile', 'carpet',
    'engineered hardwood', 'solid hardwood', 'bamboo', 'cork', 'linoleum', 'porcelain', 'ceramic', 'natural stone', 'marble', 'travertine',
    'installation', 'replacement', 'refinishing', 'sanding', 'staining', 'repair', 'patch', 'subfloor', 'underlayment', 'moisture barrier',
    'removal', 'demo', 'disposal', 'prep', 'leveling', 'transition', 'trim', 'baseboard', 'quarter round', 'stairs',
    'estimate', 'free estimate', 'per square foot', 'material', 'labor', 'showroom', 'samples', 'warranty', 'licensed', 'insured'
  ],
  'Countertops': [
    'countertops', 'counters', 'kitchen counters', 'bathroom counters', 'granite', 'quartz', 'marble', 'quartzite', 'soapstone', 'concrete',
    'solid surface', 'Corian', 'laminate', 'Formica', 'butcher block', 'stainless steel', 'recycled glass', 'porcelain', 'Silestone', 'Caesarstone',
    'fabrication', 'installation', 'template', 'measure', 'cut', 'polish', 'edge', 'ogee', 'bullnose', 'waterfall',
    'sink', 'undermount', 'drop in', 'farmhouse', 'cutout', 'faucet hole', 'backsplash', 'seam', 'support', 'bracket',
    'estimate', 'free estimate', 'per square foot', 'slab', 'remnant', 'showroom', 'selection', 'turnaround', 'warranty', 'sealing'
  ],
  'Cabinet Maker': [
    'cabinets', 'cabinet maker', 'cabinetry', 'custom cabinets', 'kitchen cabinets', 'bathroom cabinets', 'built-ins', 'closet', 'pantry', 'mudroom',
    'wood', 'hardwood', 'maple', 'oak', 'cherry', 'walnut', 'birch', 'painted', 'stained', 'glazed',
    'shaker', 'raised panel', 'flat panel', 'slab', 'glass', 'inset', 'overlay', 'frameless', 'face frame', 'traditional',
    'design', 'custom design', 'measure', 'consultation', 'showroom', 'samples', 'finishes', 'hardware', 'soft close', 'accessories',
    'installation', 'refacing', 'refinishing', 'painting', 'estimate', 'quote', 'lead time', 'turnaround', 'warranty', 'quality'
  ],
  'General Contractor': [
    'general contractor', 'contractor', 'GC', 'builder', 'construction', 'remodel', 'renovation', 'addition', 'new construction', 'custom home',
    'kitchen remodel', 'bathroom remodel', 'basement', 'attic', 'room addition', 'ADU', 'garage conversion', 'second story', 'whole house', 'gut rehab',
    'design build', 'plans', 'permits', 'inspection', 'code', 'timeline', 'schedule', 'budget', 'change order', 'progress',
    'subcontractor', 'trades', 'plumber', 'electrician', 'HVAC', 'framing', 'drywall', 'painting', 'flooring', 'finish',
    'estimate', 'free estimate', 'consultation', 'bid', 'licensed', 'insured', 'bonded', 'references', 'portfolio', 'warranty'
  ],
  'Electrician': [
    'electrician', 'electrical', 'wiring', 'outlet', 'switch', 'circuit', 'breaker', 'panel', 'fuse', 'junction box',
    'lighting', 'ceiling fan', 'chandelier', 'recessed lighting', 'LED', 'dimmer', 'motion sensor', 'outdoor lighting', 'landscape lighting', 'security lighting',
    'repair', 'installation', 'upgrade', 'replacement', 'troubleshooting', 'inspection', 'code compliance', 'permit', 'rewire', 'whole house',
    'EV charger', 'generator', 'surge protector', 'smart home', 'thermostat', 'smoke detector', 'carbon monoxide', 'doorbell', 'intercom', 'security',
    'emergency', '24 hour', 'same day', 'estimate', 'free estimate', 'licensed', 'insured', 'residential', 'commercial', 'industrial'
  ],
  'Laundromat': [
    'laundromat', 'laundry', 'self service', 'coin laundry', 'wash', 'dry', 'washer', 'dryer', 'machines', 'capacity',
    'large capacity', 'triple load', 'front load', 'top load', 'commercial', 'industrial', 'speed queen', 'clean', 'well maintained', 'working',
    'detergent', 'fabric softener', 'dryer sheets', 'bleach', 'stain remover', 'vending', 'change machine', 'quarters', 'card', 'app pay',
    'wash and fold', 'drop off', 'pickup', 'delivery', 'same day', 'next day', 'by the pound', 'service', 'attendant', 'staffed',
    'hours', 'open late', '24 hour', 'parking', 'seating', 'TV', 'wifi', 'air conditioned', 'safe', 'well lit'
  ],
  'Tailor': [
    'tailor', 'alterations', 'sewing', 'hemming', 'hem', 'pants', 'jeans', 'dress', 'suit', 'jacket',
    'shortening', 'lengthening', 'taking in', 'letting out', 'tapering', 'slimming', 'waist', 'seat', 'sleeves', 'shoulders',
    'zipper', 'zipper repair', 'zipper replacement', 'buttons', 'button replacement', 'patching', 'mending', 'relining', 'cuffs', 'lapels',
    'wedding dress', 'bridesmaid', 'formal wear', 'prom dress', 'suit alterations', 'custom suit', 'bespoke', 'made to measure', 'fitting', 'consultation',
    'rush', 'same day', 'next day', 'turnaround', 'pickup', 'delivery', 'pricing', 'quality', 'experienced', 'skilled'
  ],
  'Locksmith': [
    'locksmith', 'locks', 'keys', 'lockout', 'locked out', 'car lockout', 'house lockout', 'office lockout', 'emergency', '24 hour',
    'key cutting', 'key copy', 'duplicate', 'rekey', 'rekeying', 'lock change', 'lock repair', 'lock installation', 'deadbolt', 'smart lock',
    'car keys', 'transponder', 'chip key', 'key fob', 'remote', 'ignition', 'broken key', 'key extraction', 'programming', 'replacement',
    'residential', 'commercial', 'automotive', 'safe', 'safe opening', 'safe installation', 'master key', 'access control', 'security', 'high security',
    'mobile', 'on site', 'fast', 'quick response', 'licensed', 'bonded', 'insured', 'upfront pricing', 'no hidden fees', 'warranty'
  ],
  'Moving Company': [
    'moving', 'movers', 'moving company', 'relocation', 'local move', 'long distance', 'interstate', 'cross country', 'international', 'residential',
    'commercial', 'office move', 'apartment', 'house', 'condo', 'storage', 'packing', 'unpacking', 'loading', 'unloading',
    'boxes', 'supplies', 'tape', 'bubble wrap', 'blankets', 'dollies', 'truck', 'van', 'crew', 'labor only',
    'hourly rate', 'flat rate', 'estimate', 'free estimate', 'in home estimate', 'binding quote', 'insurance', 'valuation', 'liability', 'claims',
    'licensed', 'insured', 'DOT', 'USDOT', 'bonded', 'reviews', 'references', 'same day', 'last minute', 'scheduling'
  ],
  'Storage Facility': [
    'storage', 'self storage', 'storage unit', 'mini storage', 'storage locker', 'storage space', 'warehouse', 'climate controlled', 'temperature controlled', 'humidity controlled',
    'small unit', 'medium unit', 'large unit', '5x5', '5x10', '10x10', '10x15', '10x20', '10x30', 'drive up',
    'indoor', 'outdoor', 'ground floor', 'elevator', 'accessible', 'first month free', 'move in special', 'discount', 'month to month', 'long term',
    'secure', 'gated', 'keypad', 'code', 'camera', 'surveillance', 'on site manager', '24 hour access', 'extended hours', 'office hours',
    'boxes', 'supplies', 'truck rental', 'moving truck', 'insurance', 'coverage', 'auto pay', 'online payment', 'reservation', 'tour'
  ],
  'Printing Shop': [
    'printing', 'print', 'copies', 'copy', 'color copies', 'black and white', 'scanning', 'scan', 'fax', 'binding',
    'business cards', 'flyers', 'brochures', 'postcards', 'posters', 'banners', 'signs', 'vinyl', 'stickers', 'labels',
    'invitations', 'announcements', 'wedding', 'graduation', 'holiday cards', 'thank you cards', 'envelopes', 'letterhead', 'notepads', 'forms',
    'booklets', 'catalogs', 'manuals', 'presentations', 'reports', 'laminating', 'mounting', 'foam board', 'canvas', 'wide format',
    'same day', 'rush', 'turnaround', 'digital', 'offset', 'bulk', 'quantity', 'quote', 'file upload', 'design'
  ],
  'Shipping Store': [
    'shipping', 'package', 'mail', 'send', 'ship', 'UPS', 'FedEx', 'USPS', 'DHL', 'freight',
    'ground', 'express', 'overnight', 'priority', 'international', 'domestic', 'tracking', 'insurance', 'signature', 'delivery confirmation',
    'packing', 'supplies', 'boxes', 'tape', 'bubble wrap', 'peanuts', 'fragile', 'custom crate', 'palletize', 'shrink wrap',
    'mailbox', 'PO box', 'mail forwarding', 'package receiving', 'hold for pickup', 'notification', 'virtual address', 'business address', 'mail scanning', 'open mail',
    'notary', 'passport photos', 'printing', 'copies', 'fax', 'shredding', 'office supplies', 'packing service', 'pickup', 'drop off'
  ],
  'Notary': [
    'notary', 'notary public', 'notarize', 'notarization', 'signature', 'witness', 'acknowledgment', 'jurat', 'oath', 'affirmation',
    'documents', 'legal documents', 'contracts', 'deeds', 'title', 'power of attorney', 'POA', 'wills', 'trusts', 'affidavits',
    'real estate', 'closing', 'loan signing', 'refinance', 'mortgage', 'home equity', 'reverse mortgage', 'mobile notary', 'traveling notary', 'remote',
    'RON', 'remote online notarization', 'same day', 'appointment', 'walk in', 'after hours', 'weekend', 'emergency', 'rush', 'expedited',
    'certified', 'commissioned', 'bonded', 'insured', 'NNA', 'background check', 'fee', 'pricing', 'per signature', 'travel fee'
  ],
  'Shoe Repair': [
    'shoe repair', 'cobbler', 'heel repair', 'sole repair', 'resole', 'half sole', 'full sole', 'heel replacement', 'heel tap', 'lift',
    'leather repair', 'stitching', 'patching', 'glue', 'conditioning', 'cleaning', 'polish', 'shine', 'dyeing', 'color change',
    'zipper repair', 'zipper replacement', 'stretch', 'stretching', 'widening', 'orthopedic', 'lift', 'modification', 'custom', 'insole',
    'boots', 'dress shoes', 'heels', 'sandals', 'athletic', 'work boots', 'designer', 'luxury', 'vintage', 'restoration',
    'purse repair', 'handbag', 'belt repair', 'luggage repair', 'leather goods', 'quick', 'while you wait', 'drop off', 'pickup', 'quality'
  ],
  'Watch Repair': [
    'watch repair', 'watch service', 'battery', 'battery replacement', 'crystal', 'glass', 'band', 'strap', 'bracelet', 'link',
    'sizing', 'adjustment', 'clasp', 'crown', 'stem', 'movement', 'clean', 'overhaul', 'service', 'maintenance',
    'mechanical', 'automatic', 'quartz', 'chronograph', 'water resistance', 'pressure test', 'gasket', 'seal', 'restoration', 'refinish',
    'Rolex', 'Omega', 'TAG', 'Breitling', 'Cartier', 'Swiss', 'vintage', 'antique', 'luxury', 'high end',
    'estimate', 'diagnostic', 'warranty', 'certified', 'trained', 'experienced', 'master', 'same day', 'quick service', 'drop off'
  ],
  'Appliance Repair': [
    'appliance repair', 'repair', 'service', 'fix', 'technician', 'refrigerator', 'fridge', 'freezer', 'washer', 'dryer',
    'dishwasher', 'oven', 'stove', 'range', 'cooktop', 'microwave', 'garbage disposal', 'ice maker', 'wine cooler', 'hood',
    'not cooling', 'not heating', 'not spinning', 'not draining', 'leaking', 'noisy', 'error code', 'not starting', 'tripping breaker', 'diagnostic',
    'Samsung', 'LG', 'Whirlpool', 'GE', 'Maytag', 'KitchenAid', 'Frigidaire', 'Bosch', 'Sub-Zero', 'all brands',
    'same day', 'next day', 'emergency', 'appointment', 'estimate', 'diagnostic fee', 'parts', 'warranty', 'licensed', 'insured'
  ],
  'Jewelry Repair': [
    'jewelry repair', 'ring repair', 'necklace repair', 'bracelet repair', 'earring repair', 'clasp', 'chain', 'solder', 'welding', 'prong',
    'stone setting', 'reset', 'tighten', 'replace stone', 'missing stone', 'diamond', 'gemstone', 'pearl restringing', 'knotting', 'beading',
    'sizing', 'ring sizing', 'sizing up', 'sizing down', 'stretch', 'cut off', 'stuck ring', 'engraving', 'inscription', 'custom',
    'polishing', 'cleaning', 'rhodium', 'plating', 'refinishing', 'restoration', 'antique', 'vintage', 'heirloom', 'estate',
    'appraisal', 'insurance appraisal', 'estimate', 'same day', 'while you wait', 'rush', 'quality', 'experienced', 'certified', 'GIA'
  ],
  'Alterations': [
    'alterations', 'tailoring', 'sewing', 'hemming', 'hem', 'pants', 'jeans', 'dress', 'skirt', 'shorts',
    'taking in', 'letting out', 'tapering', 'slimming', 'shorten', 'lengthen', 'sleeves', 'waist', 'inseam', 'cuffs',
    'zipper', 'buttons', 'lining', 'patch', 'mend', 'repair', 'rip', 'tear', 'seam', 'split',
    'wedding dress', 'bridesmaid', 'prom', 'formal', 'suit', 'jacket', 'coat', 'leather', 'denim', 'uniform',
    'fitting', 'consultation', 'rush', 'same day', 'next day', 'turnaround', 'pricing', 'quality', 'experienced', 'skilled'
  ],
  // Professional Services
  'Law Firm': [
    'lawyer', 'attorney', 'law firm', 'legal', 'consultation', 'representation', 'case', 'lawsuit', 'litigation', 'settlement',
    'personal injury', 'car accident', 'slip and fall', 'workers comp', 'wrongful death', 'medical malpractice', 'product liability', 'premises liability', 'dog bite', 'negligence',
    'family law', 'divorce', 'custody', 'child support', 'alimony', 'adoption', 'prenup', 'separation', 'domestic', 'modification',
    'criminal defense', 'DUI', 'DWI', 'drug charges', 'assault', 'theft', 'felony', 'misdemeanor', 'bail', 'expungement',
    'free consultation', 'contingency', 'no fee unless we win', 'payment plan', 'retainer', 'hourly', 'flat fee', 'experience', 'results', 'reviews'
  ],
  'Accounting Firm': [
    'accountant', 'CPA', 'accounting', 'bookkeeping', 'taxes', 'tax preparation', 'tax return', 'filing', 'audit', 'financial',
    'individual', 'personal', 'business', 'corporate', 'small business', 'LLC', 'S-corp', 'C-corp', 'partnership', 'sole proprietor',
    'tax planning', 'tax strategy', 'deductions', 'credits', 'refund', 'estimated taxes', 'quarterly', 'extension', 'amendment', 'IRS',
    'payroll', 'accounts payable', 'accounts receivable', 'invoicing', 'financial statements', 'profit loss', 'balance sheet', 'cash flow', 'budgeting', 'forecasting',
    'QuickBooks', 'Xero', 'consultation', 'year round', 'tax season', 'deadline', 'appointment', 'virtual', 'in person', 'pricing'
  ],
  'Insurance Agency': [
    'insurance', 'insurance agent', 'coverage', 'policy', 'quote', 'premium', 'deductible', 'claim', 'filing', 'protection',
    'auto insurance', 'car insurance', 'home insurance', 'homeowners', 'renters', 'condo', 'flood', 'umbrella', 'liability', 'property',
    'life insurance', 'term life', 'whole life', 'universal', 'health insurance', 'dental', 'vision', 'disability', 'long term care', 'Medicare',
    'business insurance', 'commercial', 'general liability', 'professional liability', 'workers comp', 'bond', 'E&O', 'D&O', 'cyber', 'fleet',
    'State Farm', 'Allstate', 'Farmers', 'Progressive', 'Geico', 'independent agent', 'bundle', 'discount', 'savings', 'review'
  ],
  'Real Estate Agency': [
    'real estate', 'realtor', 'agent', 'broker', 'buy', 'sell', 'rent', 'lease', 'property', 'home',
    'house', 'condo', 'townhouse', 'apartment', 'land', 'lot', 'commercial', 'investment', 'rental property', 'vacation home',
    'listing', 'MLS', 'showing', 'open house', 'offer', 'contract', 'closing', 'escrow', 'title', 'inspection',
    'buyer agent', 'seller agent', 'dual agency', 'commission', 'negotiation', 'market analysis', 'CMA', 'pricing', 'staging', 'photography',
    'first time buyer', 'relocation', 'downsizing', 'upsizing', 'pre-approval', 'mortgage', 'financing', 'local', 'area expert', 'neighborhood'
  ],
  'Marketing Agency': [
    'marketing', 'advertising', 'digital marketing', 'social media', 'SEO', 'PPC', 'Google Ads', 'Facebook Ads', 'content', 'strategy',
    'branding', 'logo', 'brand identity', 'design', 'graphic design', 'website', 'web design', 'development', 'email marketing', 'automation',
    'analytics', 'reporting', 'ROI', 'leads', 'conversions', 'traffic', 'engagement', 'followers', 'reach', 'impressions',
    'video', 'photography', 'copywriting', 'blog', 'PR', 'public relations', 'influencer', 'campaign', 'launch', 'rebrand',
    'small business', 'startup', 'enterprise', 'B2B', 'B2C', 'ecommerce', 'local', 'national', 'consultation', 'proposal'
  ],
  'Photography Studio': [
    'photography', 'photographer', 'photos', 'pictures', 'portraits', 'headshots', 'studio', 'session', 'shoot', 'booking',
    'wedding', 'engagement', 'bridal', 'elopement', 'family', 'newborn', 'maternity', 'baby', 'kids', 'senior',
    'corporate', 'business', 'product', 'commercial', 'event', 'party', 'graduation', 'prom', 'quinceañera', 'pet',
    'prints', 'digital', 'gallery', 'album', 'retouching', 'editing', 'turnaround', 'delivery', 'rights', 'usage',
    'packages', 'pricing', 'deposit', 'booking', 'availability', 'location', 'on site', 'outdoor', 'props', 'backdrop'
  ],
  'Consulting Firm': [
    'consulting', 'consultant', 'advisor', 'advisory', 'strategy', 'management', 'business', 'operations', 'process', 'improvement',
    'planning', 'analysis', 'assessment', 'audit', 'recommendation', 'implementation', 'change management', 'transformation', 'optimization', 'efficiency',
    'IT consulting', 'technology', 'HR', 'human resources', 'finance', 'marketing', 'sales', 'operations', 'supply chain', 'logistics',
    'startup', 'small business', 'enterprise', 'nonprofit', 'government', 'healthcare', 'retail', 'manufacturing', 'industry', 'specialized',
    'engagement', 'project', 'retainer', 'hourly', 'fixed fee', 'proposal', 'scope', 'deliverables', 'timeline', 'results'
  ],
  'Tax Preparer': [
    'tax preparer', 'tax preparation', 'taxes', 'tax return', 'filing', 'refund', 'tax season', 'IRS', 'federal', 'state',
    '1040', 'W-2', '1099', 'schedule C', 'self employed', 'freelancer', 'gig worker', 'contractor', 'business', 'personal',
    'deductions', 'credits', 'child tax credit', 'EITC', 'education credit', 'itemized', 'standard', 'exemptions', 'withholding', 'estimated',
    'H&R Block', 'Jackson Hewitt', 'Liberty Tax', 'TurboTax', 'CPA', 'enrolled agent', 'licensed', 'experienced', 'accurate', 'guaranteed',
    'walk in', 'appointment', 'drop off', 'virtual', 'online', 'price', 'fee', 'advance', 'RAL', 'bank product'
  ],
  'Financial Advisor': [
    'financial advisor', 'financial planner', 'wealth management', 'investment', 'retirement', 'portfolio', 'assets', 'planning', 'strategy', 'goals',
    '401k', 'IRA', 'Roth', 'pension', 'rollover', 'annuity', 'stocks', 'bonds', 'mutual funds', 'ETF',
    'estate planning', 'trust', 'will', 'beneficiary', 'inheritance', 'tax planning', 'college savings', '529', 'insurance', 'protection',
    'fiduciary', 'fee only', 'commission', 'AUM', 'CFP', 'certified', 'registered', 'SEC', 'FINRA', 'series 65',
    'consultation', 'review', 'analysis', 'plan', 'comprehensive', 'ongoing', 'minimum', 'assets', 'relationship', 'trust'
  ],
  'Mortgage Broker': [
    'mortgage', 'home loan', 'refinance', 'refi', 'purchase', 'lender', 'broker', 'rate', 'interest rate', 'APR',
    'conventional', 'FHA', 'VA', 'USDA', 'jumbo', 'fixed rate', 'ARM', 'adjustable', '30 year', '15 year',
    'pre-approval', 'pre-qualification', 'application', 'documents', 'verification', 'underwriting', 'closing', 'closing costs', 'points', 'fees',
    'down payment', 'PMI', 'escrow', 'credit score', 'DTI', 'debt to income', 'income', 'employment', 'assets', 'reserves',
    'first time buyer', 'investment property', 'second home', 'cash out', 'HELOC', 'home equity', 'quotes', 'compare', 'lock', 'float'
  ],
  'Travel Agency': [
    'travel', 'travel agent', 'vacation', 'trip', 'booking', 'reservation', 'itinerary', 'planning', 'package', 'deal',
    'flights', 'airfare', 'airline', 'hotels', 'resort', 'all inclusive', 'cruise', 'tour', 'excursion', 'rental car',
    'honeymoon', 'destination wedding', 'anniversary', 'family vacation', 'group travel', 'corporate travel', 'business travel', 'solo travel', 'adventure', 'luxury',
    'domestic', 'international', 'Europe', 'Caribbean', 'Mexico', 'Hawaii', 'Disney', 'theme park', 'beach', 'ski',
    'travel insurance', 'passport', 'visa', 'documents', 'cancellation', 'rebooking', 'support', 'consultation', 'quote', 'custom'
  ],
  'Staffing Agency': [
    'staffing', 'staffing agency', 'temp agency', 'employment', 'jobs', 'hiring', 'recruiting', 'placement', 'temp', 'temporary',
    'temp to perm', 'direct hire', 'contract', 'full time', 'part time', 'seasonal', 'on demand', 'day labor', 'gig', 'flexible',
    'warehouse', 'manufacturing', 'administrative', 'clerical', 'customer service', 'call center', 'medical', 'healthcare', 'IT', 'engineering',
    'resume', 'application', 'interview', 'background check', 'drug test', 'onboarding', 'orientation', 'assignment', 'placement', 'start date',
    'pay', 'hourly', 'weekly pay', 'direct deposit', 'benefits', 'insurance', 'holiday pay', 'overtime', 'open positions', 'apply'
  ],
  'Web Design Agency': [
    'web design', 'website', 'web development', 'design', 'developer', 'agency', 'studio', 'digital', 'online', 'internet',
    'custom website', 'WordPress', 'Shopify', 'Squarespace', 'Wix', 'ecommerce', 'landing page', 'responsive', 'mobile', 'SEO',
    'redesign', 'refresh', 'update', 'maintenance', 'hosting', 'domain', 'SSL', 'security', 'speed', 'performance',
    'UX', 'UI', 'user experience', 'wireframe', 'mockup', 'prototype', 'branding', 'logo', 'graphics', 'content',
    'portfolio', 'quote', 'proposal', 'timeline', 'project', 'retainer', 'hourly', 'fixed price', 'support', 'training'
  ],
  'IT Services': [
    'IT', 'IT services', 'IT support', 'tech support', 'computer', 'network', 'server', 'cloud', 'infrastructure', 'technology',
    'managed services', 'MSP', 'help desk', 'remote support', 'on site', 'break fix', 'maintenance', 'monitoring', '24/7', 'response time',
    'network setup', 'WiFi', 'router', 'switch', 'firewall', 'VPN', 'backup', 'disaster recovery', 'data', 'security',
    'Microsoft 365', 'Google Workspace', 'email', 'collaboration', 'phone system', 'VoIP', 'hardware', 'software', 'licensing', 'procurement',
    'small business', 'enterprise', 'consultation', 'assessment', 'audit', 'project', 'migration', 'upgrade', 'contract', 'SLA'
  ],
  'Security Company': [
    'security', 'security company', 'security guard', 'guard', 'officer', 'patrol', 'monitoring', 'surveillance', 'protection', 'safety',
    'armed', 'unarmed', 'uniformed', 'plainclothes', 'mobile patrol', 'standing guard', 'access control', 'gate', 'reception', 'concierge',
    'event security', 'concert', 'festival', 'wedding', 'corporate', 'executive protection', 'bodyguard', 'VIP', 'celebrity', 'dignitary',
    'residential', 'commercial', 'industrial', 'retail', 'construction', 'HOA', 'apartment', 'office', 'warehouse', 'parking',
    'camera', 'alarm', 'CCTV', 'monitoring', 'response', 'licensed', 'bonded', 'insured', 'background check', 'trained'
  ],
  'Dental Office': [
    'dentist', 'dental', 'teeth', 'cleaning', 'checkup', 'exam', 'xray', 'filling', 'cavity', 'crown',
    'root canal', 'extraction', 'wisdom teeth', 'implant', 'bridge', 'dentures', 'veneer', 'bonding', 'whitening', 'bleaching',
    'invisalign', 'braces', 'retainer', 'orthodontics', 'periodontal', 'gum', 'deep cleaning', 'scaling', 'fluoride', 'sealant',
    'emergency', 'same day', 'walk in', 'appointment', 'new patient', 'accepting patients', 'insurance', 'delta dental', 'PPO', 'payment plan',
    'family dentist', 'pediatric', 'kids', 'adult', 'senior', 'cosmetic', 'sedation', 'nitrous', 'gentle', 'painless'
  ],
  'Veterinarian': [
    'vet', 'veterinarian', 'animal hospital', 'pet clinic', 'dog', 'cat', 'puppy', 'kitten', 'exotic', 'bird',
    'checkup', 'exam', 'vaccines', 'shots', 'rabies', 'distemper', 'parvo', 'microchip', 'spay', 'neuter',
    'sick visit', 'emergency', 'urgent care', '24 hour', 'after hours', 'weekend', 'surgery', 'dental', 'xray', 'ultrasound',
    'prescription', 'medication', 'flea', 'tick', 'heartworm', 'deworming', 'allergy', 'skin', 'ear infection', 'senior pet',
    'boarding', 'grooming', 'nail trim', 'appointment', 'walk in', 'new patient', 'insurance', 'payment plan', 'wellness plan', 'estimate'
  ],
  'Chiropractor': [
    'chiropractor', 'chiropractic', 'adjustment', 'spinal adjustment', 'manipulation', 'alignment', 'spine', 'back', 'neck', 'joints',
    'back pain', 'neck pain', 'headache', 'migraine', 'sciatica', 'herniated disc', 'bulging disc', 'pinched nerve', 'posture', 'scoliosis',
    'xray', 'exam', 'consultation', 'evaluation', 'treatment plan', 'maintenance', 'wellness', 'preventive', 'corrective', 'relief',
    'massage', 'therapy', 'muscle', 'soft tissue', 'stretching', 'exercises', 'rehabilitation', 'decompression', 'traction', 'ultrasound',
    'appointment', 'walk in', 'new patient', 'insurance', 'cash pay', 'affordable', 'package', 'membership', 'family', 'pediatric'
  ],
  'Optometrist': [
    'optometrist', 'eye doctor', 'eye exam', 'vision', 'glasses', 'contacts', 'contact lenses', 'frames', 'lenses', 'prescription',
    'comprehensive exam', 'dilation', 'refraction', 'eye health', 'glaucoma', 'cataracts', 'macular degeneration', 'diabetic eye', 'dry eye', 'red eye',
    'progressive', 'bifocal', 'single vision', 'transitions', 'anti-reflective', 'blue light', 'polarized', 'sunglasses', 'prescription sunglasses', 'safety glasses',
    'daily contacts', 'weekly', 'monthly', 'extended wear', 'toric', 'multifocal', 'colored contacts', 'fitting', 'trial', 'supply',
    'insurance', 'VSP', 'EyeMed', 'Medicare', 'Medicaid', 'FSA', 'HSA', 'same day glasses', 'frame selection', 'designer frames'
  ],
  'Physical Therapy': [
    'physical therapy', 'PT', 'rehab', 'rehabilitation', 'therapy', 'therapist', 'exercise', 'stretching', 'strengthening', 'mobility',
    'pain', 'injury', 'surgery', 'post-op', 'pre-op', 'sports injury', 'work injury', 'car accident', 'slip and fall', 'chronic pain',
    'back', 'neck', 'shoulder', 'knee', 'hip', 'ankle', 'wrist', 'elbow', 'hand', 'foot',
    'manual therapy', 'massage', 'dry needling', 'cupping', 'ultrasound', 'electrical stimulation', 'TENS', 'heat', 'ice', 'taping',
    'evaluation', 'treatment plan', 'appointment', 'insurance', 'workers comp', 'auto accident', 'referral', 'direct access', 'copay', 'deductible'
  ],
  'Urgent Care': [
    'urgent care', 'walk in clinic', 'immediate care', 'same day', 'no appointment', 'walk in', 'after hours', 'weekend', 'holiday', 'extended hours',
    'cold', 'flu', 'fever', 'cough', 'sore throat', 'ear infection', 'sinus', 'allergies', 'rash', 'infection',
    'injury', 'sprain', 'strain', 'fracture', 'cut', 'laceration', 'stitches', 'burn', 'bite', 'sting',
    'xray', 'lab', 'blood work', 'drug test', 'physical', 'sports physical', 'DOT physical', 'flu shot', 'vaccine', 'COVID test',
    'insurance', 'copay', 'self pay', 'cash', 'affordable', 'cost', 'wait time', 'online check in', 'fast', 'convenient'
  ],
  'Pharmacy': [
    'pharmacy', 'prescription', 'Rx', 'medication', 'medicine', 'drugs', 'refill', 'transfer', 'generic', 'brand',
    'pick up', 'drive thru', 'delivery', 'mail order', 'auto refill', 'reminder', 'sync', 'consultation', 'pharmacist', 'counseling',
    'OTC', 'over the counter', 'vitamins', 'supplements', 'first aid', 'cold medicine', 'allergy', 'pain relief', 'diabetic supplies', 'medical equipment',
    'insurance', 'copay', 'GoodRx', 'discount', 'generic', 'formulary', 'prior auth', 'Medicare', 'Medicaid', 'Part D',
    'vaccine', 'flu shot', 'COVID', 'shingles', 'pneumonia', 'immunization', 'compounding', 'specialty', 'hours', 'wait time'
  ],
  'Medical Clinic': [
    'clinic', 'doctor', 'physician', 'primary care', 'family medicine', 'internal medicine', 'general practice', 'healthcare', 'medical', 'office',
    'appointment', 'new patient', 'established patient', 'same day', 'walk in', 'sick visit', 'well visit', 'annual', 'physical', 'checkup',
    'blood pressure', 'cholesterol', 'diabetes', 'thyroid', 'asthma', 'COPD', 'chronic disease', 'management', 'prevention', 'screening',
    'lab', 'blood work', 'EKG', 'xray', 'referral', 'specialist', 'prescription', 'refill', 'vaccine', 'immunization',
    'insurance', 'Medicare', 'Medicaid', 'cash pay', 'sliding scale', 'affordable', 'telehealth', 'virtual visit', 'portal', 'records'
  ],
  'Mental Health': [
    'mental health', 'therapy', 'counseling', 'therapist', 'counselor', 'psychologist', 'psychiatrist', 'LCSW', 'LPC', 'LMFT',
    'depression', 'anxiety', 'stress', 'trauma', 'PTSD', 'grief', 'loss', 'relationship', 'couples', 'family',
    'individual', 'group therapy', 'support group', 'CBT', 'DBT', 'EMDR', 'mindfulness', 'medication management', 'evaluation', 'assessment',
    'appointment', 'intake', 'consultation', 'telehealth', 'virtual', 'in person', 'sliding scale', 'affordable', 'insurance', 'out of pocket',
    'confidential', 'safe space', 'non-judgmental', 'supportive', 'compassionate', 'experienced', 'specialized', 'adolescent', 'adult', 'child'
  ],
  'Dermatologist': [
    'dermatologist', 'dermatology', 'skin', 'skin doctor', 'skincare', 'acne', 'eczema', 'psoriasis', 'rosacea', 'rash',
    'mole', 'mole check', 'skin cancer', 'melanoma', 'biopsy', 'removal', 'excision', 'Mohs', 'screening', 'full body',
    'warts', 'skin tags', 'cysts', 'lipoma', 'keloid', 'scar', 'birthmark', 'age spots', 'sun damage', 'precancer',
    'cosmetic', 'Botox', 'filler', 'laser', 'chemical peel', 'microneedling', 'IPL', 'phototherapy', 'anti-aging', 'wrinkles',
    'appointment', 'new patient', 'referral', 'insurance', 'copay', 'self pay', 'telehealth', 'urgent', 'same day', 'wait time'
  ],
  'Pediatrician': [
    'pediatrician', 'pediatrics', 'kids doctor', 'childrens doctor', 'baby', 'infant', 'toddler', 'child', 'adolescent', 'teen',
    'well child', 'checkup', 'wellness', 'growth', 'development', 'milestones', 'vaccines', 'immunizations', 'school physical', 'sports physical',
    'sick visit', 'fever', 'cold', 'flu', 'ear infection', 'strep', 'rash', 'asthma', 'allergies', 'ADHD',
    'newborn', 'breastfeeding', 'formula', 'feeding', 'sleep', 'behavior', 'potty training', 'nutrition', 'weight', 'height',
    'appointment', 'same day', 'urgent', 'after hours', 'nurse line', 'portal', 'insurance', 'Medicaid', 'CHIP', 'accepting patients'
  ],
  'OB-GYN': [
    'OB-GYN', 'OBGYN', 'gynecologist', 'obstetrician', 'womens health', 'womens doctor', 'female doctor', 'pregnancy', 'prenatal', 'obstetrics',
    'annual exam', 'well woman', 'pap smear', 'breast exam', 'mammogram', 'pelvic exam', 'birth control', 'contraception', 'IUD', 'implant',
    'pregnancy test', 'ultrasound', 'prenatal care', 'high risk', 'delivery', 'C-section', 'VBAC', 'postpartum', 'breastfeeding', 'newborn',
    'menopause', 'hormone', 'HRT', 'irregular periods', 'heavy bleeding', 'fibroids', 'endometriosis', 'PCOS', 'infertility', 'fertility',
    'appointment', 'new patient', 'accepting patients', 'insurance', 'Medicaid', 'payment plan', 'telehealth', 'same day', 'urgent', 'after hours'
  ],
  'Orthopedic': [
    'orthopedic', 'orthopedist', 'bone doctor', 'joint', 'spine', 'sports medicine', 'surgery', 'surgeon', 'specialist', 'musculoskeletal',
    'knee', 'hip', 'shoulder', 'back', 'neck', 'ankle', 'foot', 'hand', 'wrist', 'elbow',
    'arthritis', 'joint pain', 'fracture', 'broken bone', 'torn ligament', 'ACL', 'meniscus', 'rotator cuff', 'carpal tunnel', 'herniated disc',
    'xray', 'MRI', 'CT scan', 'injection', 'cortisone', 'PRP', 'stem cell', 'physical therapy', 'rehab', 'conservative',
    'surgery', 'arthroscopy', 'joint replacement', 'total knee', 'total hip', 'spine surgery', 'minimally invasive', 'recovery', 'appointment', 'referral'
  ],
  'Hearing Aid': [
    'hearing aid', 'hearing aids', 'hearing', 'hearing loss', 'audiologist', 'audiology', 'hearing test', 'audiogram', 'screening', 'evaluation',
    'behind the ear', 'BTE', 'in the ear', 'ITE', 'in the canal', 'ITC', 'CIC', 'RIC', 'invisible', 'rechargeable',
    'Phonak', 'Widex', 'Oticon', 'ReSound', 'Starkey', 'Signia', 'digital', 'Bluetooth', 'streaming', 'app',
    'fitting', 'programming', 'adjustment', 'repair', 'cleaning', 'maintenance', 'warranty', 'trial period', 'return policy', 'financing',
    'insurance', 'Medicare', 'Medicaid', 'VA', 'discount', 'affordable', 'free hearing test', 'consultation', 'appointment', 'walk in'
  ],
  'Home Health Care': [
    'home health', 'home care', 'in home care', 'caregiving', 'caregiver', 'aide', 'CNA', 'HHA', 'nurse', 'RN',
    'skilled nursing', 'wound care', 'IV', 'medication', 'injections', 'physical therapy', 'occupational therapy', 'speech therapy', 'rehab', 'recovery',
    'personal care', 'bathing', 'dressing', 'grooming', 'toileting', 'feeding', 'mobility', 'transfers', 'companion', 'companionship',
    'meal prep', 'light housekeeping', 'laundry', 'errands', 'transportation', 'appointments', 'shopping', 'medication reminder', 'supervision', '24 hour',
    'hourly', 'daily', 'overnight', 'live in', 'respite', 'hospice', 'palliative', 'Medicare', 'Medicaid', 'private pay'
  ],
  'Senior Care': [
    'senior care', 'elderly care', 'aging', 'seniors', 'assisted living', 'memory care', 'Alzheimer\'s', 'dementia', 'nursing home', 'skilled nursing',
    'independent living', 'retirement community', 'continuing care', 'CCRC', 'adult day care', 'respite', 'short term', 'long term', 'permanent', 'temporary',
    'activities', 'dining', 'meals', 'housekeeping', 'laundry', 'transportation', 'medication management', 'personal care', 'assistance', 'supervision',
    'private room', 'shared room', 'apartment', 'studio', 'amenities', 'safety', 'security', '24 hour staff', 'nurse', 'on site',
    'tour', 'visit', 'assessment', 'cost', 'pricing', 'Medicare', 'Medicaid', 'long term care insurance', 'VA', 'private pay'
  ],
  // Hospitality
  'Hotel': [
    'hotel', 'room', 'suite', 'king', 'queen', 'double', 'single', 'adjoining', 'connecting', 'accessible',
    'check in', 'check out', 'late checkout', 'early check in', 'front desk', 'concierge', 'bellhop', 'valet', 'parking', 'shuttle',
    'wifi', 'breakfast', 'continental', 'hot breakfast', 'room service', 'restaurant', 'bar', 'lounge', 'coffee', 'snacks',
    'pool', 'gym', 'fitness center', 'spa', 'hot tub', 'sauna', 'business center', 'meeting room', 'conference', 'event space',
    'pet friendly', 'smoking', 'non smoking', 'view', 'balcony', 'mini fridge', 'microwave', 'kitchenette', 'laundry', 'dry cleaning'
  ],
  // Education
  'Tutoring Center': [
    'tutoring', 'tutor', 'homework help', 'test prep', 'SAT', 'ACT', 'GRE', 'GMAT', 'LSAT', 'MCAT',
    'math', 'algebra', 'geometry', 'calculus', 'statistics', 'science', 'biology', 'chemistry', 'physics', 'english',
    'reading', 'writing', 'essay', 'grammar', 'vocabulary', 'spanish', 'french', 'foreign language', 'history', 'social studies',
    'elementary', 'middle school', 'high school', 'college', 'one on one', 'small group', 'online', 'in person', 'after school', 'summer',
    'assessment', 'progress report', 'hourly rate', 'package', 'flexible schedule', 'certified', 'experienced', 'background check', 'free consultation', 'trial session'
  ],
  'Music School': [
    'music lessons', 'music school', 'lessons', 'instruction', 'teacher', 'instructor', 'private lesson', 'group lesson', 'class', 'learn',
    'piano', 'guitar', 'violin', 'drums', 'voice', 'singing', 'vocal', 'bass', 'ukulele', 'saxophone',
    'beginner', 'intermediate', 'advanced', 'kids', 'adult', 'all ages', 'fundamentals', 'technique', 'theory', 'reading music',
    'recital', 'performance', 'practice', 'practice room', 'instrument rental', 'sheet music', 'books', 'materials', 'curriculum', 'progress',
    'weekly', 'bi-weekly', 'monthly', 'schedule', 'flexible', 'makeup', 'cancellation', 'trial lesson', 'registration', 'pricing'
  ],
  'Driving School': [
    'driving school', 'driving lessons', 'drivers ed', 'drivers education', 'learn to drive', 'instructor', 'teacher', 'training', 'behind the wheel', 'BTW',
    'permit', 'license', 'DMV', 'test', 'road test', 'written test', 'practice test', 'parallel parking', 'highway', 'freeway',
    'teen driver', 'adult driver', 'first time driver', 'refresher', 'defensive driving', 'traffic school', 'ticket dismissal', 'insurance discount', 'certificate', 'completion',
    'classroom', 'online', 'in car', 'dual control', 'pickup', 'drop off', 'schedule', 'flexible', 'evening', 'weekend',
    'package', 'hours', 'pricing', 'payment plan', 'permit test prep', 'license prep', 'pass rate', 'experienced', 'patient', 'bilingual'
  ],
  'Language School': [
    'language school', 'language lessons', 'ESL', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean',
    'learn', 'speak', 'conversation', 'grammar', 'vocabulary', 'pronunciation', 'reading', 'writing', 'listening', 'comprehension',
    'beginner', 'intermediate', 'advanced', 'fluent', 'native speaker', 'immersion', 'intensive', 'crash course', 'business', 'travel',
    'private lesson', 'group class', 'small group', 'online', 'in person', 'kids', 'adult', 'professional', 'certificate', 'TOEFL',
    'schedule', 'flexible', 'weekly', 'daily', 'pricing', 'package', 'trial class', 'free assessment', 'placement test', 'progress'
  ],
  'Preschool': [
    'preschool', 'pre-k', 'pre-kindergarten', 'early childhood', 'early education', 'school', 'program', 'curriculum', 'learning', 'development',
    'toddler', 'age 2', 'age 3', 'age 4', 'age 5', 'potty trained', 'not potty trained', 'half day', 'full day', 'extended day',
    'play based', 'Montessori', 'Reggio', 'academic', 'kindergarten prep', 'school readiness', 'social skills', 'emotional development', 'cognitive', 'physical',
    'licensed', 'accredited', 'certified teachers', 'ratio', 'class size', 'small class', 'outdoor play', 'playground', 'meals', 'snacks',
    'tuition', 'registration', 'waitlist', 'enrollment', 'tour', 'open house', 'schedule', 'calendar', 'summer', 'year round'
  ],
  'After School Program': [
    'after school', 'after school program', 'after care', 'extended care', 'homework help', 'tutoring', 'enrichment', 'activities', 'supervision', 'care',
    'pickup', 'transportation', 'bus', 'school pickup', 'elementary', 'middle school', 'K-8', 'ages 5-12', 'snack', 'meals',
    'homework time', 'study hall', 'academic support', 'reading', 'math', 'STEM', 'arts', 'sports', 'recreation', 'clubs',
    'licensed', 'certified', 'background check', 'ratio', 'safe', 'secure', 'sign out', 'authorized pickup', 'emergency contact', 'communication',
    'daily rate', 'weekly', 'monthly', 'drop in', 'registration', 'enrollment', 'schedule', 'hours', 'early dismissal', 'school closure'
  ],
  'Summer Camp': [
    'summer camp', 'camp', 'day camp', 'summer program', 'kids', 'children', 'youth', 'ages 5-12', 'teens', 'young adults',
    'weekly sessions', 'full day', 'half day', 'extended care', 'early drop off', 'late pickup', 'bus', 'transportation', 'lunch', 'snacks',
    'activities', 'sports', 'swimming', 'arts and crafts', 'nature', 'science', 'STEM', 'music', 'drama', 'dance',
    'field trips', 'special events', 'theme weeks', 'counselors', 'ratio', 'supervision', 'safety', 'certified', 'first aid', 'CPR',
    'registration', 'enrollment', 'tuition', 'discount', 'sibling', 'early bird', 'scholarship', 'financial aid', 'forms', 'medical'
  ],
  'Art School': [
    'art school', 'art class', 'art lessons', 'studio', 'instruction', 'teacher', 'artist', 'learn', 'create', 'express',
    'drawing', 'painting', 'sculpture', 'pottery', 'ceramics', 'printmaking', 'mixed media', 'collage', 'digital art', 'illustration',
    'watercolor', 'acrylic', 'oil', 'pastel', 'charcoal', 'pencil', 'ink', 'canvas', 'paper', 'clay',
    'kids', 'teens', 'adults', 'beginner', 'intermediate', 'advanced', 'all levels', 'private lesson', 'group class', 'workshop',
    'supplies', 'materials included', 'easel', 'kiln', 'wheel', 'schedule', 'weekly', 'session', 'drop in', 'registration'
  ],
  'Cooking Class': [
    'cooking class', 'culinary', 'learn to cook', 'instruction', 'chef', 'instructor', 'hands on', 'demonstration', 'recipe', 'technique',
    'Italian', 'French', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'baking', 'pastry', 'bread', 'dessert',
    'knife skills', 'basics', 'fundamentals', 'intermediate', 'advanced', 'date night', 'couples', 'team building', 'corporate', 'private',
    'kids', 'teens', 'adults', 'family', 'birthday party', 'bachelorette', 'group', 'event', 'private event', 'booking',
    'menu', 'tasting', 'wine pairing', 'BYOB', 'apron', 'supplies', 'recipes', 'take home', 'schedule', 'registration'
  ],
  'Dance School': [
    'dance school', 'dance studio', 'dance class', 'lessons', 'instruction', 'teacher', 'choreography', 'learn', 'technique', 'style',
    'ballet', 'jazz', 'tap', 'hip hop', 'contemporary', 'modern', 'lyrical', 'ballroom', 'Latin', 'salsa',
    'kids', 'teens', 'adults', 'beginner', 'intermediate', 'advanced', 'recreational', 'competitive', 'company', 'team',
    'private lesson', 'group class', 'drop in', 'trial class', 'registration', 'tuition', 'schedule', 'weekly', 'session', 'semester',
    'recital', 'performance', 'costume', 'competition', 'convention', 'workshop', 'summer intensive', 'dress code', 'shoes', 'attire'
  ],
  'Swim School': [
    'swim school', 'swim lessons', 'swimming lessons', 'learn to swim', 'instructor', 'teacher', 'coach', 'pool', 'water', 'aquatics',
    'baby swim', 'infant', 'toddler', 'preschool', 'kids', 'child', 'teen', 'adult', 'beginner', 'advanced',
    'water safety', 'survival', 'stroke', 'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'treading', 'floating', 'diving',
    'private lesson', 'semi-private', 'group lesson', 'small group', 'class size', 'ratio', 'warm water', 'heated pool', 'indoor', 'outdoor',
    'schedule', 'session', 'weekly', 'monthly', 'makeup', 'cancellation', 'registration', 'waitlist', 'trial', 'assessment'
  ],
  // Financial
  'Bank': [
    'bank', 'banking', 'account', 'checking', 'savings', 'money market', 'CD', 'certificate of deposit', 'deposit', 'withdrawal',
    'ATM', 'debit card', 'credit card', 'online banking', 'mobile banking', 'app', 'transfer', 'wire', 'direct deposit', 'bill pay',
    'loan', 'personal loan', 'auto loan', 'mortgage', 'home equity', 'HELOC', 'line of credit', 'business loan', 'SBA', 'refinance',
    'interest rate', 'APY', 'APR', 'fees', 'no fee', 'minimum balance', 'overdraft', 'protection', 'FDIC', 'insured',
    'branch', 'hours', 'drive thru', 'appointment', 'banker', 'teller', 'notary', 'safe deposit box', 'coin counter', 'foreign currency'
  ],
  'Credit Union': [
    'credit union', 'member', 'membership', 'not for profit', 'community', 'local', 'account', 'checking', 'savings', 'share',
    'loan', 'auto loan', 'personal loan', 'mortgage', 'home equity', 'credit card', 'secured loan', 'signature loan', 'student loan', 'refinance',
    'rate', 'low rate', 'APY', 'dividend', 'fee', 'low fee', 'no fee', 'minimum balance', 'NCUA', 'insured',
    'ATM', 'shared branch', 'online banking', 'mobile app', 'direct deposit', 'bill pay', 'transfer', 'wire', 'cashiers check', 'money order',
    'branch', 'hours', 'drive thru', 'appointment', 'member service', 'financial counseling', 'education', 'seminar', 'join', 'eligibility'
  ],
  'Check Cashing': [
    'check cashing', 'cash check', 'checks', 'paycheck', 'payroll', 'government check', 'tax refund', 'insurance check', 'personal check', 'money order',
    'fee', 'percentage', 'flat fee', 'low fee', 'no hold', 'instant cash', 'same day', 'walk in', 'no appointment', 'fast',
    'money order', 'bill pay', 'utility', 'prepaid card', 'reload', 'debit card', 'wire transfer', 'Western Union', 'MoneyGram', 'international',
    'payday loan', 'cash advance', 'installment loan', 'title loan', 'pawn', 'gold', 'tax prep', 'tax filing', 'ID', 'verification',
    'hours', 'open late', 'weekend', 'holiday', 'location', 'parking', 'safe', 'secure', 'trusted', 'licensed'
  ],
  'Pawn Shop': [
    'pawn', 'pawn shop', 'pawnbroker', 'loan', 'collateral', 'pawn loan', 'borrow', 'cash', 'quick cash', 'emergency',
    'jewelry', 'gold', 'silver', 'diamonds', 'watches', 'electronics', 'TV', 'laptop', 'phone', 'tablet',
    'tools', 'instruments', 'guitars', 'firearms', 'guns', 'collectibles', 'coins', 'sports memorabilia', 'designer', 'brand name',
    'buy', 'sell', 'trade', 'appraisal', 'free quote', 'best price', 'top dollar', 'fair price', 'negotiate', 'cash offer',
    'redeem', 'extend', 'renew', 'interest rate', 'fee', 'layaway', 'inventory', 'selection', 'deals', 'bargains'
  ],
  'Gold Buyer': [
    'gold buyer', 'sell gold', 'cash for gold', 'gold', 'silver', 'platinum', 'precious metals', 'scrap gold', 'broken jewelry', 'unwanted jewelry',
    'rings', 'necklaces', 'bracelets', 'earrings', 'watches', 'coins', 'bullion', 'bars', 'dental gold', 'gold filled',
    'karat', '10k', '14k', '18k', '22k', '24k', 'sterling silver', '.925', 'weight', 'gram',
    'appraisal', 'free appraisal', 'evaluation', 'quote', 'estimate', 'spot price', 'market price', 'top dollar', 'best price', 'competitive',
    'instant cash', 'same day', 'no obligation', 'private', 'confidential', 'secure', 'licensed', 'trusted', 'reviews', 'reputation'
  ],
  // Liquor & Beverage Retail
  'Liquor Store': [
    'wine', 'beer', 'spirits', 'liquor', 'vodka', 'whiskey', 'bourbon', 'scotch', 'tequila', 'rum',
    'gin', 'brandy', 'cognac', 'mezcal', 'sake', 'soju', 'champagne', 'prosecco', 'vermouth', 'aperitif',
    'red wine', 'white wine', 'rosé', 'sparkling', 'pinot', 'cabernet', 'chardonnay', 'merlot', 'riesling', 'moscato',
    'craft beer', 'domestic beer', 'imported beer', 'IPA', 'lager', 'stout', 'seltzer', 'cider', 'malt', 'coolers',
    'mixers', 'ice', 'cups', 'kegs', 'mini bottles', 'handles', 'fifths', 'pints', 'cold beer', 'delivery'
  ],
  'Wine Shop': [
    'wine', 'red wine', 'white wine', 'rosé', 'sparkling', 'champagne', 'prosecco', 'cava', 'brut', 'dessert wine',
    'cabernet', 'merlot', 'pinot noir', 'syrah', 'malbec', 'zinfandel', 'chardonnay', 'sauvignon blanc', 'pinot grigio', 'riesling',
    'France', 'Italy', 'Spain', 'California', 'Napa', 'Sonoma', 'Oregon', 'Washington', 'Argentina', 'Australia',
    'vintage', 'reserve', 'organic', 'biodynamic', 'natural wine', 'low sulfite', 'vegan wine', 'box wine', 'magnum', 'half bottle',
    'tasting', 'wine club', 'gift basket', 'gift box', 'corporate gifts', 'wedding', 'special occasion', 'food pairing', 'cheese', 'charcuterie'
  ],
  'Grocery Store': [
    'groceries', 'produce', 'meat', 'seafood', 'deli', 'bakery', 'dairy', 'eggs', 'cheese', 'milk',
    'bread', 'cereal', 'pasta', 'rice', 'canned goods', 'frozen', 'snacks', 'chips', 'candy', 'drinks',
    'organic', 'natural', 'gluten free', 'vegan', 'kosher', 'halal', 'local', 'farm fresh', 'non-GMO', 'bulk',
    'pharmacy', 'household', 'cleaning', 'paper goods', 'pet food', 'baby', 'health', 'beauty', 'vitamins', 'supplements',
    'coupons', 'weekly ad', 'sale', 'BOGO', 'rewards', 'pickup', 'delivery', 'instacart', 'online order', 'curbside'
  ],
  'Convenience Store': [
    'gas', 'fuel', 'snacks', 'drinks', 'soda', 'energy drinks', 'coffee', 'slurpee', 'fountain drink', 'water',
    'chips', 'candy', 'gum', 'cigarettes', 'tobacco', 'lottery', 'lotto', 'scratch offs', 'powerball', 'mega millions',
    'ATM', 'cash back', 'money order', 'prepaid cards', 'gift cards', 'phone cards', 'chargers', 'batteries', 'ice', 'propane',
    'hot dog', 'pizza', 'roller grill', 'breakfast sandwich', 'taquitos', 'nachos', 'fountain drinks', 'ice cream', 'donuts', 'pastries',
    '24 hours', 'open late', 'quick stop', 'drive thru', 'car wash', 'air pump', 'vacuum', 'restroom', 'parking', 'EBT'
  ],
  'Smoke Shop': [
    'cigarettes', 'tobacco', 'cigars', 'cigarillos', 'rolling tobacco', 'pipe tobacco', 'chewing tobacco', 'snuff', 'nicotine', 'menthol',
    'papers', 'rolling papers', 'wraps', 'cones', 'filters', 'tips', 'grinder', 'tray', 'lighter', 'torch',
    'pipe', 'glass pipe', 'water pipe', 'bong', 'hookah', 'shisha', 'vape', 'disposable vape', 'coils', 'juice',
    'CBD', 'delta 8', 'kratom', 'incense', 'candles', 'tapestries', 'posters', 'accessories', 'cleaning supplies', 'cases',
    'cheap cigarettes', 'carton', 'pack', 'single', 'discount', 'deals', 'rewards', 'ID required', '21+', 'cash'
  ],
  'Vape Shop': [
    'vape', 'vaporizer', 'e-cigarette', 'mod', 'box mod', 'pod system', 'disposable vape', 'pen', 'starter kit', 'advanced kit',
    'e-liquid', 'vape juice', 'nicotine salt', 'freebase', '0mg', '3mg', '6mg', '12mg', '50mg', 'nicotine free',
    'coil', 'pod', 'tank', 'atomizer', 'battery', '18650', '21700', 'charger', 'drip tip', 'cotton',
    'fruit', 'dessert', 'menthol', 'tobacco flavor', 'candy', 'beverage', 'custard', 'cereal', 'mint', 'ice',
    'SMOK', 'Vaporesso', 'GeekVape', 'Voopoo', 'Lost Vape', 'Elf Bar', 'Juul', 'puff bar', 'Hyde', 'Fume'
  ],
  'Dispensary': [
    'cannabis', 'marijuana', 'weed', 'flower', 'bud', 'pre-roll', 'joint', 'blunt', 'eighth', 'quarter',
    'edibles', 'gummies', 'chocolate', 'cookies', 'brownies', 'drinks', 'tincture', 'oil', 'capsules', 'tablets',
    'concentrate', 'wax', 'shatter', 'live resin', 'rosin', 'distillate', 'cartridge', 'vape cart', 'dab', 'hash',
    'indica', 'sativa', 'hybrid', 'THC', 'CBD', 'CBN', 'strain', 'terpenes', 'potency', 'lab tested',
    'medical', 'recreational', '21+', 'ID required', 'cash only', 'ATM', 'first time discount', 'daily deals', 'loyalty', 'online order'
  ],
  // Pet Services
  'Pet Groomer': [
    'grooming', 'dog grooming', 'cat grooming', 'bath', 'haircut', 'trim', 'shave', 'brush out', 'de-mat', 'de-shed',
    'nail trim', 'nail grind', 'ear cleaning', 'teeth brushing', 'anal glands', 'flea bath', 'medicated bath', 'oatmeal bath', 'whitening', 'conditioning',
    'breed cut', 'puppy cut', 'teddy bear cut', 'lion cut', 'sanitary trim', 'face trim', 'paw trim', 'full groom', 'bath only', 'walk in',
    'small dog', 'large dog', 'puppy', 'senior dog', 'anxious dog', 'aggressive dog', 'double coat', 'long hair', 'short hair', 'matted',
    'appointment', 'drop off', 'wait', 'mobile grooming', 'self wash', 'prices', 'packages', 'tips', 'same day', 'regular schedule'
  ],
  'Dog Trainer': [
    'dog training', 'puppy training', 'obedience', 'basic commands', 'sit', 'stay', 'come', 'heel', 'down', 'leave it',
    'potty training', 'house training', 'crate training', 'leash training', 'loose leash', 'recall', 'off leash', 'e-collar', 'prong collar', 'clicker',
    'behavior', 'aggression', 'reactivity', 'barking', 'jumping', 'biting', 'chewing', 'separation anxiety', 'fear', 'socialization',
    'private lesson', 'group class', 'board and train', 'in home', 'virtual', 'puppy class', 'advanced', 'CGC', 'therapy dog', 'service dog',
    'positive reinforcement', 'balanced training', 'certified', 'CPDT', 'experience', 'references', 'guarantee', 'follow up', 'pricing', 'packages'
  ],
  'Pet Boarding': [
    'boarding', 'dog boarding', 'cat boarding', 'overnight', 'weekend', 'holiday', 'long term', 'daycare', 'dog daycare', 'play group',
    'kennel', 'suite', 'private room', 'cage free', 'indoor', 'outdoor', 'play yard', 'walks', 'feeding', 'medication',
    'webcam', 'updates', 'photos', 'report card', 'pickup', 'drop off', 'late pickup', 'early drop off', 'flexible', 'hours',
    'vaccines required', 'temperament test', 'meet and greet', 'tour', 'small dog', 'large dog', 'puppy', 'senior', 'special needs', 'aggressive',
    'pricing', 'per night', 'package', 'discount', 'loyalty', 'reservation', 'deposit', 'cancellation', 'holiday rates', 'add ons'
  ],
  'Daycare': [
    'daycare', 'childcare', 'preschool', 'pre-K', 'infant', 'toddler', 'before school', 'after school', 'full day', 'half day',
    'drop in', 'part time', 'full time', 'flexible schedule', 'summer camp', 'holiday care', 'sick care', 'backup care', 'emergency care', 'overnight',
    'curriculum', 'learning', 'play based', 'Montessori', 'Reggio', 'STEM', 'language', 'music', 'art', 'outdoor play',
    'meals', 'snacks', 'diapers', 'potty training', 'nap', 'nap room', 'playground', 'security', 'cameras', 'app',
    'tuition', 'rates', 'waitlist', 'enrollment', 'registration', 'tour', 'licensed', 'accredited', 'ratio', 'background check'
  ],
  // Repair Services
  'Phone Repair': [
    'screen repair', 'cracked screen', 'broken screen', 'glass replacement', 'LCD', 'digitizer', 'touch screen', 'display', 'OLED', 'screen protector',
    'battery', 'battery replacement', 'charging port', 'lightning port', 'USB-C', 'power button', 'volume button', 'home button', 'face ID', 'touch ID',
    'water damage', 'liquid damage', 'speaker', 'microphone', 'camera', 'back glass', 'housing', 'frame', 'antenna', 'wifi',
    'iPhone', 'Samsung', 'Google Pixel', 'Android', 'tablet', 'iPad', 'Apple Watch', 'data recovery', 'transfer', 'backup',
    'same day', 'while you wait', 'walk in', 'appointment', 'mail in', 'warranty', 'OEM parts', 'aftermarket', 'price', 'estimate'
  ],
  'Computer Repair': [
    'computer repair', 'laptop repair', 'desktop repair', 'PC', 'Mac', 'Windows', 'Apple', 'Chromebook', 'iMac', 'MacBook',
    'virus removal', 'malware', 'spyware', 'ransomware', 'slow computer', 'speed up', 'tune up', 'optimization', 'cleanup', 'startup',
    'screen replacement', 'keyboard', 'trackpad', 'battery', 'charger', 'power jack', 'motherboard', 'RAM', 'memory upgrade', 'SSD upgrade',
    'data recovery', 'hard drive', 'backup', 'transfer', 'file recovery', 'deleted files', 'crashed', 'wont turn on', 'blue screen', 'black screen',
    'wifi', 'internet', 'network', 'printer', 'setup', 'software install', 'operating system', 'Windows install', 'same day', 'on site'
  ],
  // Other
  'Other': [
    'service', 'quality', 'professional', 'experienced', 'reliable', 'fast', 'affordable', 'local', 'near me', 'open now',
    'appointment', 'walk in', 'same day', 'emergency', 'weekend', 'evening', 'hours', 'location', 'parking', 'accessible',
    'price', 'cost', 'estimate', 'quote', 'free estimate', 'consultation', 'discount', 'coupon', 'deal', 'special',
    'reviews', 'rated', 'recommended', 'trusted', 'licensed', 'insured', 'bonded', 'certified', 'warranty', 'guarantee',
    'cash', 'card', 'financing', 'payment plan', 'invoice', 'receipt', 'contact', 'phone', 'email', 'website'
  ],
};

const MAX_BUSINESS_TYPES = 3;

// Helper to parse existing address into parts
function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  if (!address) return { street: '', city: '', state: '', zip: '' };
  
  // Try to parse "123 Main St, City, State 12345" format
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const street = parts[0] || '';
    const city = parts[1] || '';
    // Last part might be "State 12345" or just "State"
    const lastPart = parts[2] || '';
    const stateZipMatch = lastPart.match(/^([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?$/);
    if (stateZipMatch) {
      return { street, city, state: stateZipMatch[1]?.trim() || '', zip: stateZipMatch[2] || '' };
    }
    return { street, city, state: lastPart, zip: '' };
  }
  
  return { street: address, city: '', state: '', zip: '' };
}

export default function AddStoreModal({ store, tier = SubscriptionTier.FREE, onClose, onSave }: AddStoreModalProps) {
  const [name, setName] = useState(store?.name || '');
  
  // Parse existing address into parts
  const initialAddress = parseAddress(store?.address || '');
  const [street, setStreet] = useState(initialAddress.street);
  const [city, setCity] = useState(initialAddress.city);
  const [state, setState] = useState(initialAddress.state);
  const [zip, setZip] = useState(initialAddress.zip);
  
  // Combine address parts into full address
  const address = [street, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  
  // Parse existing business types from comma-separated string
  const initialBusinessTypes = store?.businessType 
    ? store.businessType.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const [businessTypes, setBusinessTypes] = useState<string[]>(initialBusinessTypes);
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(store?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  // Review guidance is stored as first element of reviewExpectations array for backwards compatibility
  const [reviewGuidance, setReviewGuidance] = useState<string>(
    store?.reviewExpectations?.[0] || ''
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [googleUrl, setGoogleUrl] = useState(store?.googleUrl || '');
  const [yelpUrl, setYelpUrl] = useState(store?.yelpUrl || '');
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [showYelpHelp, setShowYelpHelp] = useState(false);
  const [googleUrlError, setGoogleUrlError] = useState('');
  const [yelpUrlError, setYelpUrlError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [hasAutoLookedUp, setHasAutoLookedUp] = useState(false);
  const [googleAutoFilled, setGoogleAutoFilled] = useState(false);
  const [yelpAutoFilled, setYelpAutoFilled] = useState(false);
  const [lookupRateLimited, setLookupRateLimited] = useState(false);

  // Auto-lookup URLs when name and address are filled and user stops typing for 3 seconds
  useEffect(() => {
    // Skip if already looked up, or if URLs are already filled, or if editing existing store
    if (hasAutoLookedUp || store?.googleUrl || store?.yelpUrl || googleUrl || yelpUrl) {
      return;
    }
    
    // Need name and at least city to auto-lookup
    if (!name.trim() || !city.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      // Double-check URLs aren't filled (could have changed during timeout)
      if (!googleUrl && !yelpUrl) {
        setHasAutoLookedUp(true);
        lookupBusinessUrlsAuto();
      }
    }, 3000); // 3 seconds after stopping typing

    return () => clearTimeout(timer);
  }, [name, street, city, state, zip, googleUrl, yelpUrl, hasAutoLookedUp, store]);

  // Auto-lookup function (silent, no error messages)
  const lookupBusinessUrlsAuto = async () => {
    if (!name.trim() || !address.trim()) return;
    
    setLookupLoading(true);
    setLookupRateLimited(false);
    
    try {
      const res = await fetch('/api/lookup-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.yelpUrl && !yelpUrl) {
          setYelpUrl(data.yelpUrl);
          setYelpAutoFilled(true);
        }
        if (data.googleUrl && !googleUrl) {
          setGoogleUrl(data.googleUrl);
          setGoogleAutoFilled(true);
        }
        if (data.yelpUrl || data.googleUrl) {
          setLookupResult('Auto-filled review URLs!');
        }
      } else if (res.status === 429) {
        // Rate limited
        setLookupRateLimited(true);
        setLookupResult('Rate limited - try again later');
      }
    } catch (error) {
      console.error('Auto-lookup error:', error);
    } finally {
      setLookupLoading(false);
    }
  };

  // URL validation - only allow safe http/https URLs
  const validateUrl = (url: string): { valid: boolean; error: string } => {
    if (!url) return { valid: true, error: '' };
    
    const trimmed = url.trim();
    
    // Check for valid protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    
    // Block dangerous patterns
    if (/javascript:|data:|vbscript:|file:/i.test(trimmed)) {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    // Check for script injection attempts
    if (/<script|onclick|onerror|onload/i.test(trimmed)) {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    // Basic URL format validation
    try {
      new URL(trimmed);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    return { valid: true, error: '' };
  };

  const handleGoogleUrlChange = (value: string) => {
    setGoogleUrl(value);
    const validation = validateUrl(value);
    setGoogleUrlError(validation.error);
  };

  const handleYelpUrlChange = (value: string) => {
    setYelpUrl(value);
    const validation = validateUrl(value);
    setYelpUrlError(validation.error);
  };

  const lookupBusinessUrls = async () => {
    if (!name.trim()) {
      setLookupResult('Please enter a store name first');
      return;
    }
    
    setLookupLoading(true);
    setLookupResult(null);
    setHasAutoLookedUp(true);
    
    try {
      const res = await fetch('/api/lookup-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        let found = false;
        
        if (data.yelpUrl && !yelpUrl) {
          setYelpUrl(data.yelpUrl);
          found = true;
        }
        if (data.googleUrl && !googleUrl) {
          setGoogleUrl(data.googleUrl);
          found = true;
        }
        
        if (found) {
          setLookupResult('Found! Review the URLs below.');
        } else if (yelpUrl && googleUrl) {
          setLookupResult('URLs already filled in.');
        } else {
          setLookupResult('Could not find business. Try adding an address or enter URLs manually.');
        }
      } else {
        setLookupResult('Lookup failed. Please enter URLs manually.');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      setLookupResult('Lookup failed. Please enter URLs manually.');
    } finally {
      setLookupLoading(false);
    }
  };
  
  const businessTypeRef = useRef<HTMLDivElement>(null);

  // Get combined keyword suggestions from all selected business types
  const currentKeywordSuggestions = businessTypes.length > 0
    ? [...new Set(businessTypes.flatMap(type => keywordSuggestions[type] || []))]
    : [];
  
  // Filter business types based on input, excluding already selected ones
  const filteredBusinessTypes = BUSINESS_TYPES.filter(type => 
    !businessTypes.includes(type) &&
    (!businessTypeInput || type.toLowerCase().includes(businessTypeInput.toLowerCase()))
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (businessTypeRef.current && !businessTypeRef.current.contains(event.target as Node)) {
        setShowBusinessTypeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBusinessTypeSelect = (type: string) => {
    if (businessTypes.length >= MAX_BUSINESS_TYPES) return;
    if (businessTypes.includes(type)) return;
    
    const newBusinessTypes = [...businessTypes, type];
    setBusinessTypes(newBusinessTypes);
    setBusinessTypeInput('');
    setShowBusinessTypeDropdown(false);
    
    // Auto-prefill keywords from suggestions for this business type
    const suggestedKeywords = keywordSuggestions[type] || [];
    if (suggestedKeywords.length > 0 && keywords.length === 0) {
      // Only prefill if no keywords are set yet
      setKeywords(suggestedKeywords);
    } else if (suggestedKeywords.length > 0) {
      // Add new unique keywords from this business type
      const newKeywords = suggestedKeywords.filter(k => !keywords.includes(k));
      if (newKeywords.length > 0) {
        setKeywords([...keywords, ...newKeywords]);
      }
    }
  };
  
  const removeBusinessType = (type: string) => {
    setBusinessTypes(businessTypes.filter(t => t !== type));
  };
  
  const handleBusinessTypeInputChange = (value: string) => {
    setBusinessTypeInput(value);
    setShowBusinessTypeDropdown(true);
  };
  
  const handleBusinessTypeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Only allow selecting from predefined list
      if (businessTypeInput.trim() && businessTypes.length < MAX_BUSINESS_TYPES) {
        const exactMatch = BUSINESS_TYPES.find(
          type => type.toLowerCase() === businessTypeInput.toLowerCase()
        );
        if (exactMatch && !businessTypes.includes(exactMatch)) {
          handleBusinessTypeSelect(exactMatch);
        }
      }
    }
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywords(keywordInput);
    }
  };

  const addKeywords = (input: string) => {
    if (!input.trim()) return;
    
    // Split by comma to handle CSV input
    const newKeywords = input
      .split(',')
      .map(k => k.trim())
      .filter(k => k && !keywords.includes(k));
    
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
    }
  };

  // Scroll to top of form for Pro feature explanation
  const scrollToProFeature = () => {
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      address: address || undefined,
      businessType: businessTypes.join(', '), // Store as comma-separated string
      keywords,
      // Store review guidance as array with single element for backwards compatibility
      reviewExpectations: reviewGuidance.trim() ? [reviewGuidance.trim()] : [],
      googleUrl: googleUrl || undefined,
      yelpUrl: yelpUrl || undefined
    };

    if (store) {
      onSave({ ...storeData, id: store.id });
    } else {
      onSave(storeData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-gray-900">
            {store ? 'Edit Store' : 'Add New Store'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pro Feature Banner - Only show for free users */}
          {tier === SubscriptionTier.FREE && (
            <div className="bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Unlock Review Guidance with Pro</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Pro users can guide the AI to emphasize specific aspects of their business in every generated review.
                    Tell the AI what makes you special, and watch reviews highlight exactly what you want customers to know.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Custom review guidance for your brand
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Highlight your unique selling points
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Better SEO with targeted keywords
                    </li>
                  </ul>
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Upgrade to Pro
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tony's Pizza Palace"
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Store Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Address *
            </label>
            <div className="space-y-3">
              {/* Street Address */}
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street Address (e.g. 123 Main St)"
                maxLength={150}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              
              {/* City */}
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                maxLength={100}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              
              {/* State and Zip in a row */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="ZIP Code"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Optional. Helps customers find your location and auto-fill review URLs.
            </p>
          </div>

          {/* Business Type */}
          <div ref={businessTypeRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type(s) * <span className="font-normal text-gray-500">(up to {MAX_BUSINESS_TYPES})</span>
            </label>
            
            {/* Selected Business Types Tags */}
            {businessTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {businessTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => removeBusinessType(type)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
          </div>
            )}
            
            {/* Input for adding more */}
            {businessTypes.length < MAX_BUSINESS_TYPES && (
              <div className="relative">
                <input
                  type="text"
                  value={businessTypeInput}
                  onChange={(e) => handleBusinessTypeInputChange(e.target.value)}
                  onKeyDown={handleBusinessTypeKeyDown}
                  onFocus={() => setShowBusinessTypeDropdown(true)}
                  placeholder={businessTypes.length === 0 ? "Type or select your business type..." : "Add another business type..."}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showBusinessTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
            
            {/* Dropdown List */}
            {showBusinessTypeDropdown && filteredBusinessTypes.length > 0 && businessTypes.length < MAX_BUSINESS_TYPES && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBusinessTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeSelect(type)}
                    className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors text-gray-700"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            
            {/* No match hint */}
            {businessTypeInput && !BUSINESS_TYPES.some(t => t.toLowerCase().includes(businessTypeInput.toLowerCase())) && (
              <p className="text-xs text-amber-600 mt-1">
                No matching business type found. Please select from the list above.
              </p>
            )}
            
            {/* Hidden required input for form validation */}
            <input 
              type="hidden" 
              value={businessTypes.length > 0 ? businessTypes.join(',') : ''} 
              required 
            />
          </div>

          {/* Review Guidance - Pro Only */}
          <div className={tier === SubscriptionTier.FREE ? 'relative' : ''}>
            {tier === SubscriptionTier.FREE && (
              <button
                type="button"
                onClick={scrollToProFeature}
                className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] z-10 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <span className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Upgrade to Pro to guide AI reviews
                </span>
              </button>
            )}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                Review Guidance
                {tier === SubscriptionTier.FREE && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Tell the AI what to emphasize in generated reviews. Be specific about what makes your business special.
            </p>
            <textarea
              value={reviewGuidance}
              onChange={(e) => tier === SubscriptionTier.PRO && setReviewGuidance(e.target.value.slice(0, REVIEW_GUIDANCE_MAX_LENGTH))}
              disabled={tier === SubscriptionTier.FREE}
              placeholder={tier === SubscriptionTier.FREE 
                ? "Upgrade to Pro to customize review guidance..." 
                : "e.g., Mention our friendly staff, quick service, and fresh ingredients. Highlight the cozy atmosphere and great value for families."}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none ${
                tier === SubscriptionTier.FREE 
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'border-gray-300'
              }`}
            />
            {tier === SubscriptionTier.PRO && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {reviewGuidance.length}/{REVIEW_GUIDANCE_MAX_LENGTH}
              </p>
            )}
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Keywords
              </label>
              {businessTypes.length > 0 && currentKeywordSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowKeywordSuggestions(!showKeywordSuggestions)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" />
                  {showKeywordSuggestions ? 'Hide' : 'Show'} suggestions
                </button>
              )}
            </div>
            
            {showKeywordSuggestions && currentKeywordSuggestions.length > 0 && (
              <div className="mb-2 p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-700 mb-2">Suggested keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {currentKeywordSuggestions.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => addSuggestedKeyword(keyword)}
                      disabled={keywords.includes(keyword)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        keywords.includes(keyword)
                          ? 'bg-emerald-200 text-emerald-600 cursor-not-allowed'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      + {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Tags */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Type keyword and press Enter"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addKeywords(keywordInput)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add. Separate multiple with commas.
            </p>
          </div>

          {/* Rate limit warning */}
          {lookupRateLimited && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">Could auto-fill URLs, but rate limited. Please wait a moment and try again.</p>
              </div>
            </div>
          )}
          
          {/* Loading indicator for URL lookup */}
          {lookupLoading && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <p className="text-sm text-emerald-700">Searching for review URLs...</p>
              </div>
            </div>
          )}

          {/* Google Review URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Google Review URL
              </label>
                {googleAutoFilled && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ Auto-filled
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleHelp(!showGoogleHelp)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                How to find this
              </button>
            </div>
            {showGoogleHelp && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <p className="font-medium mb-2">To get your Google Review link:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Business Profile</a></li>
                  <li>Select your business</li>
                  <li>Click &quot;Get more reviews&quot; or &quot;Share review form&quot;</li>
                  <li>Copy the link provided</li>
                </ol>
                <p className="mt-2 text-blue-600">
                  Or search your business on Google Maps, click &quot;Write a review&quot;, and copy the URL.
                </p>
              </div>
            )}
            <div className="flex gap-2">
            <input
              type="url"
              value={googleUrl}
                onChange={(e) => handleGoogleUrlChange(e.target.value)}
              placeholder="https://g.page/r/..."
                maxLength={2000}
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  googleUrlError 
                    ? 'border-red-300 focus:ring-red-600' 
                    : 'border-gray-300 focus:ring-emerald-600'
                }`}
              />
              {googleUrl && !googleUrlError && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify
                </a>
              )}
            </div>
            {googleUrlError && (
              <p className="text-xs text-red-500 mt-1">{googleUrlError}</p>
            )}
          </div>

          {/* Yelp Review URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Yelp Review URL
              </label>
                {yelpAutoFilled && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ Auto-filled
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowYelpHelp(!showYelpHelp)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                How to find this
              </button>
            </div>
            {showYelpHelp && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg text-xs text-red-800">
                <p className="font-medium mb-2">To get your Yelp Review link:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://biz.yelp.com" target="_blank" rel="noopener noreferrer" className="underline">Yelp for Business</a></li>
                  <li>Log in to your business account</li>
                  <li>Go to your business page on Yelp</li>
                  <li>Copy the URL (e.g., yelp.com/biz/your-business-name)</li>
                </ol>
                <p className="mt-2 text-red-600">
                  Or simply search for your business on Yelp and copy the page URL.
                </p>
              </div>
            )}
            <div className="flex gap-2">
            <input
              type="url"
              value={yelpUrl}
                onChange={(e) => handleYelpUrlChange(e.target.value)}
              placeholder="https://www.yelp.com/biz/..."
                maxLength={2000}
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  yelpUrlError 
                    ? 'border-red-300 focus:ring-red-600' 
                    : 'border-gray-300 focus:ring-emerald-600'
                }`}
              />
              {yelpUrl && !yelpUrlError && (
                <a
                  href={yelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify
                </a>
              )}
            </div>
            {yelpUrlError && (
              <p className="text-xs text-red-500 mt-1">{yelpUrlError}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !street || !city || businessTypes.length === 0 || !!googleUrlError || !!yelpUrlError}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store ? 'Save Changes' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
