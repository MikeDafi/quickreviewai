import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, Lightbulb, Plus, HelpCircle, ExternalLink, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Store } from '@/lib/types';

interface AddStoreModalProps {
  store?: Store;
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

const REVIEW_EXPECTATIONS = [
  'Cleanliness',
  'Customer Service', 
  'Food Quality',
  'Atmosphere',
  'Value for Money',
  'Wait Time',
  'Staff Friendliness',
  'Product Quality',
  'Expertise',
  'Communication',
  'Professionalism',
  'Results',
  'Convenience',
  'Selection',
  'Parking',
];

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
  'Electrician': [
    'electrician', 'electrical', 'wiring', 'outlet', 'switch', 'circuit', 'breaker', 'panel', 'fuse', 'junction box',
    'lighting', 'ceiling fan', 'chandelier', 'recessed lighting', 'LED', 'dimmer', 'motion sensor', 'outdoor lighting', 'landscape lighting', 'security lighting',
    'repair', 'installation', 'upgrade', 'replacement', 'troubleshooting', 'inspection', 'code compliance', 'permit', 'rewire', 'whole house',
    'EV charger', 'generator', 'surge protector', 'smart home', 'thermostat', 'smoke detector', 'carbon monoxide', 'doorbell', 'intercom', 'security',
    'emergency', '24 hour', 'same day', 'estimate', 'free estimate', 'licensed', 'insured', 'residential', 'commercial', 'industrial'
  ],
  // Professional Services
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

export default function AddStoreModal({ store, onClose, onSave }: AddStoreModalProps) {
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
  const [expectations, setExpectations] = useState<string[]>(store?.reviewExpectations || []);
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

  const toggleExpectation = (expectation: string) => {
    if (expectations.includes(expectation)) {
      setExpectations(expectations.filter(e => e !== expectation));
    } else {
      setExpectations([...expectations, expectation]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      address: address || undefined,
      businessType: businessTypes.join(', '), // Store as comma-separated string
      keywords,
      reviewExpectations: expectations,
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              Store Address
            </label>
            <div className="space-y-3">
              {/* Street Address */}
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street Address (e.g. 123 Main St)"
                maxLength={150}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              
              {/* City */}
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                maxLength={100}
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

          {/* Review Expectations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
              Review Expectations
            </label>
              <button
                type="button"
                onClick={() => {
                  if (expectations.length === REVIEW_EXPECTATIONS.length) {
                    setExpectations([]);
                  } else {
                    setExpectations([...REVIEW_EXPECTATIONS]);
                  }
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                {expectations.length === REVIEW_EXPECTATIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              What should customers focus on in their review? <span className="text-gray-400">(AI will highlight one of these per generated review)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_EXPECTATIONS.map(exp => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => toggleExpectation(exp)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    expectations.includes(exp)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
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
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => handleGoogleUrlChange(e.target.value)}
              placeholder="https://g.page/r/..."
              maxLength={2000}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                googleUrlError 
                  ? 'border-red-300 focus:ring-red-600' 
                  : 'border-gray-300 focus:ring-emerald-600'
              }`}
            />
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
            <input
              type="url"
              value={yelpUrl}
              onChange={(e) => handleYelpUrlChange(e.target.value)}
              placeholder="https://www.yelp.com/biz/..."
              maxLength={2000}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                yelpUrlError 
                  ? 'border-red-300 focus:ring-red-600' 
                  : 'border-gray-300 focus:ring-emerald-600'
              }`}
            />
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
              disabled={!name || businessTypes.length === 0 || !!googleUrlError || !!yelpUrlError}
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
