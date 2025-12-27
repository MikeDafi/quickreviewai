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
    // 1 node away - core dining attributes
    'delicious', 'flavorful', 'tasty', 'authentic', 'fresh ingredients', 'well-seasoned', 'perfectly cooked', 'generous portions', 'beautifully plated', 'mouthwatering',
    'savory', 'quality ingredients', 'homemade', 'chef-crafted', 'farm-to-table', 'locally sourced', 'signature dishes', 'diverse menu', 'seasonal specials', 'comfort food',
    // 2 nodes away - experience & atmosphere
    'cozy atmosphere', 'family-friendly', 'romantic setting', 'great ambiance', 'attentive service', 'friendly staff', 'quick service', 'knowledgeable servers', 'perfect for date night', 'great for groups',
    'welcoming', 'clean', 'well-decorated', 'comfortable seating', 'reasonable prices', 'good value', 'worth every penny', 'hidden gem', 'local favorite', 'must-try',
    'memorable experience', 'will return', 'highly recommend', 'exceeded expectations', 'consistent quality', 'never disappoints', 'best in town', 'Instagram-worthy', 'great for celebrations', 'easy parking'
  ],
  'Cafe': [
    // 1 node away - coffee & food
    'best coffee', 'perfectly brewed', 'artisanal', 'rich espresso', 'smooth latte', 'great pastries', 'fresh-baked', 'delicious treats', 'quality beans', 'expertly crafted',
    'flavorful', 'aromatic', 'specialty drinks', 'creative menu', 'dairy alternatives', 'vegan options', 'homemade goods', 'breakfast favorites', 'light bites', 'fresh sandwiches',
    // 2 nodes away - atmosphere & experience
    'cozy', 'inviting', 'perfect for working', 'great WiFi', 'comfortable seating', 'aesthetic interior', 'Instagram-worthy', 'relaxing vibe', 'friendly baristas', 'quick service',
    'warm atmosphere', 'local favorite', 'neighborhood gem', 'perfect study spot', 'great music', 'natural lighting', 'outdoor seating', 'peaceful', 'charming', 'unique decor',
    'consistent quality', 'reasonable prices', 'loyalty rewards', 'convenient location', 'early hours', 'clean', 'sustainable practices', 'community hub', 'welcoming', 'will return'
  ],
  'Bar': [
    // 1 node away - drinks & service
    'great cocktails', 'craft drinks', 'skilled bartenders', 'creative mixology', 'extensive selection', 'quality spirits', 'craft beer', 'wine selection', 'signature drinks', 'perfectly mixed',
    'fresh ingredients', 'unique flavors', 'strong pours', 'well-balanced', 'premium liquor', 'local brews', 'rotating taps', 'happy hour deals', 'drink specials', 'impressive menu',
    // 2 nodes away - atmosphere & experience
    'fun atmosphere', 'great vibes', 'friendly bartenders', 'lively crowd', 'perfect for groups', 'date night spot', 'late night', 'good music', 'dancing', 'sports viewing',
    'comfortable seating', 'rooftop views', 'outdoor patio', 'cozy booths', 'clean', 'good food', 'appetizers', 'welcoming', 'local hangout', 'neighborhood bar',
    'no pretense', 'unpretentious', 'inclusive', 'reasonable prices', 'quick service', 'attentive staff', 'memorable night', 'will return', 'highly recommend', 'hidden gem'
  ],
  'Bakery': [
    // 1 node away - baked goods
    'fresh-baked', 'delicious pastries', 'flaky croissants', 'moist cakes', 'artisan bread', 'homemade', 'quality ingredients', 'perfectly sweetened', 'buttery', 'melt-in-your-mouth',
    'creative flavors', 'beautiful decorations', 'custom cakes', 'wedding cakes', 'specialty items', 'gluten-free options', 'vegan options', 'seasonal treats', 'traditional recipes', 'family recipes',
    // 2 nodes away - experience
    'wonderful aroma', 'friendly staff', 'welcoming', 'charming shop', 'cozy', 'quick service', 'great for gifts', 'perfect portions', 'reasonably priced', 'good value',
    'local favorite', 'hidden gem', 'morning treat', 'coffee pairing', 'celebration cakes', 'party orders', 'consistent quality', 'never disappoints', 'Instagram-worthy', 'must-try',
    'early hours', 'convenient location', 'clean', 'beautiful display', 'helpful recommendations', 'takes special orders', 'always fresh', 'sells out fast', 'worth the wait', 'will return'
  ],
  'Food Truck': [
    // 1 node away - food quality
    'fresh ingredients', 'unique flavors', 'creative menu', 'delicious', 'flavorful', 'generous portions', 'quality food', 'homemade', 'authentic', 'perfectly seasoned',
    'bold flavors', 'fusion cuisine', 'specialty items', 'signature dish', 'locally sourced', 'made to order', 'hot and fresh', 'satisfying', 'tasty', 'crave-worthy',
    // 2 nodes away - experience
    'quick service', 'great value', 'friendly', 'fast but quality', 'convenient', 'perfect lunch', 'worth the line', 'affordable', 'cash and card', 'easy to find',
    'food festival favorite', 'local favorite', 'follows schedule', 'clean setup', 'good portions', 'fair prices', 'catering available', 'events', 'outdoor dining', 'casual vibe',
    'Instagram-worthy', 'great photos', 'must-try', 'hidden gem', 'loyal following', 'always a line', 'worth tracking down', 'food truck rallies', 'community events', 'will seek out again'
  ],
  'Pizzeria': [
    // 1 node away - pizza quality
    'perfect crust', 'fresh ingredients', 'authentic', 'wood-fired', 'crispy crust', 'cheesy', 'generous toppings', 'quality cheese', 'homemade sauce', 'traditional recipe',
    'New York style', 'Neapolitan', 'thin crust', 'deep dish', 'perfectly baked', 'not greasy', 'well-balanced', 'flavorful', 'signature pies', 'creative toppings',
    // 2 nodes away - experience
    'family-friendly', 'great for groups', 'quick delivery', 'hot and fresh', 'generous portions', 'good value', 'reasonable prices', 'friendly staff', 'fast service', 'takeout friendly',
    'dine-in atmosphere', 'local favorite', 'neighborhood staple', 'late night', 'game day', 'party orders', 'catering', 'kids menu', 'comfortable', 'casual vibe',
    'consistent quality', 'never disappoints', 'best in town', 'will return', 'highly recommend', 'crave-worthy', 'go-to spot', 'reliable', 'always satisfying', 'worth the drive'
  ],
  'Sushi Bar': [
    // 1 node away - sushi quality
    'fresh fish', 'high-quality', 'skilled chefs', 'beautiful presentation', 'authentic', 'melt-in-your-mouth', 'perfectly cut', 'premium ingredients', 'ocean-fresh', 'sashimi-grade',
    'creative rolls', 'traditional preparation', 'omakase', 'chef specials', 'seasonal fish', 'imported ingredients', 'wasabi freshly grated', 'perfect rice', 'artistic plating', 'attention to detail',
    // 2 nodes away - experience
    'great selection', 'extensive menu', 'sake pairings', 'Japanese beer', 'elegant atmosphere', 'sushi bar seating', 'watch the chefs', 'intimate setting', 'clean', 'minimalist decor',
    'attentive service', 'knowledgeable staff', 'recommendations', 'worth the price', 'special occasion', 'date night', 'omakase experience', 'authentic atmosphere', 'peaceful', 'refined',
    'consistent quality', 'always fresh', 'best sushi in town', 'will return', 'highly recommend', 'impressed', 'exceeded expectations', 'memorable meal', 'must-try', 'hidden gem'
  ],
  'Ice Cream Shop': [
    // 1 node away - ice cream quality
    'delicious flavors', 'creamy', 'rich', 'homemade', 'unique flavors', 'generous scoops', 'high-quality', 'real ingredients', 'not too sweet', 'perfectly smooth',
    'creative combinations', 'seasonal flavors', 'fresh waffle cones', 'toppings galore', 'sundae bar', 'milkshakes', 'dairy-free options', 'vegan options', 'sorbet', 'gelato',
    // 2 nodes away - experience
    'fun atmosphere', 'friendly staff', 'great portions', 'good value', 'kid-friendly', 'nostalgic', 'charming shop', 'cute decor', 'Instagram-worthy', 'colorful',
    'quick service', 'samples available', 'helpful recommendations', 'local favorite', 'summer staple', 'perfect treat', 'family outing', 'birthday parties', 'outdoor seating', 'walk-up window',
    'always a line', 'worth the wait', 'will return', 'best ice cream', 'consistent quality', 'never disappoints', 'memorable', 'sweet tooth satisfied', 'happy place', 'highly recommend'
  ],
  'Brewery': [
    // 1 node away - beer quality
    'craft beer', 'fresh brews', 'unique flavors', 'quality ingredients', 'small batch', 'locally brewed', 'hoppy', 'smooth', 'well-balanced', 'creative recipes',
    'rotating taps', 'seasonal releases', 'IPAs', 'stouts', 'lagers', 'sours', 'barrel-aged', 'limited editions', 'flight options', 'variety',
    // 2 nodes away - experience
    'great selection', 'knowledgeable staff', 'fun atmosphere', 'brewery tours', 'taproom', 'outdoor space', 'beer garden', 'dog-friendly', 'family-friendly', 'live music',
    'food trucks', 'good snacks', 'trivia nights', 'events', 'local hangout', 'community vibe', 'relaxed atmosphere', 'industrial chic', 'merchandise', 'growler fills',
    'support local', 'passionate brewers', 'will return', 'highly recommend', 'great for groups', 'date night', 'weekend spot', 'consistent quality', 'hidden gem', 'must visit'
  ],
  'Winery': [
    // 1 node away - wine quality
    'excellent wines', 'smooth', 'well-balanced', 'complex flavors', 'award-winning', 'premium grapes', 'estate grown', 'small production', 'aged perfectly', 'varietals',
    'reds', 'whites', 'rosé', 'sparkling', 'dessert wines', 'reserve selections', 'vintage', 'terroir', 'oak notes', 'fruit-forward',
    // 2 nodes away - experience
    'beautiful setting', 'scenic views', 'vineyard tours', 'great tastings', 'knowledgeable staff', 'relaxing', 'peaceful', 'romantic', 'stunning grounds', 'outdoor seating',
    'picnic area', 'cheese pairings', 'events', 'weddings', 'private tastings', 'wine club', 'friendly hosts', 'educational', 'Instagram-worthy', 'photo opportunities',
    'day trip worthy', 'memorable experience', 'will return', 'highly recommend', 'special occasion', 'gift shop', 'ships wine', 'consistent quality', 'hidden gem', 'must visit'
  ],
  'Juice Bar': [
    // 1 node away - product quality
    'fresh ingredients', 'cold-pressed', 'organic', 'nutrient-rich', 'healthy', 'delicious', 'vibrant colors', 'natural', 'no added sugar', 'real fruit',
    'smoothies', 'acai bowls', 'green juices', 'detox options', 'protein boosts', 'superfood add-ins', 'customizable', 'fresh daily', 'energizing', 'refreshing',
    // 2 nodes away - experience
    'quick service', 'clean', 'modern', 'bright atmosphere', 'friendly staff', 'knowledgeable', 'helpful recommendations', 'great taste', 'good portions', 'reasonable prices',
    'post-workout', 'meal replacement', 'grab and go', 'convenient location', 'loyalty program', 'sustainable packaging', 'eco-friendly', 'health-conscious', 'feel-good', 'local ingredients',
    'consistent quality', 'will return', 'daily habit', 'highly recommend', 'best smoothies', 'tastes fresh', 'never disappoints', 'worth it', 'healthy and delicious', 'guilt-free'
  ],
  'Deli': [
    // 1 node away - food quality
    'fresh cuts', 'quality meats', 'great sandwiches', 'generous portions', 'quality ingredients', 'house-made', 'fresh bread', 'perfectly seasoned', 'authentic', 'traditional recipes',
    'specialty items', 'imported goods', 'cheese selection', 'prepared foods', 'salads', 'soups', 'hot sandwiches', 'cold cuts', 'catering trays', 'party platters',
    // 2 nodes away - experience
    'friendly service', 'quick', 'efficient', 'knows regulars', 'old-school charm', 'neighborhood staple', 'family-owned', 'clean', 'well-organized', 'good value',
    'lunch spot', 'takeout friendly', 'call ahead', 'reliable', 'consistent', 'satisfying', 'filling', 'comfort food', 'nostalgic', 'authentic experience',
    'local favorite', 'will return', 'highly recommend', 'best sandwich', 'go-to spot', 'never disappoints', 'worth the line', 'must-try', 'hidden gem', 'legendary'
  ],
  // Health & Beauty
  'Salon': [
    // 1 node away - service quality
    'skilled stylists', 'professional', 'talented', 'experienced', 'up-to-date techniques', 'listens to clients', 'attention to detail', 'precision cuts', 'beautiful color', 'perfect highlights',
    'balayage experts', 'color correction', 'styling expertise', 'blowouts', 'updos', 'extensions', 'treatments', 'healthy hair', 'quality products', 'personalized service',
    // 2 nodes away - experience
    'relaxing', 'modern', 'luxurious', 'clean', 'welcoming atmosphere', 'comfortable', 'stylish decor', 'good music', 'complimentary drinks', 'friendly staff',
    'easy booking', 'on time', 'reasonable prices', 'good value', 'consistent results', 'no pressure upselling', 'honest recommendations', 'transformation', 'confidence boost', 'feel amazing',
    'will return', 'highly recommend', 'found my stylist', 'best haircut', 'loyal client', 'trusted', 'never disappoints', 'exceeded expectations', 'worth every penny', 'life-changing'
  ],
  'Barbershop': [
    // 1 node away - service quality
    'skilled barbers', 'precise cuts', 'clean fades', 'sharp lines', 'attention to detail', 'classic techniques', 'modern styles', 'beard trims', 'hot towel shave', 'straight razor',
    'lineup perfection', 'scissor work', 'clipper skills', 'experienced', 'knows what looks good', 'listens', 'consistent cuts', 'quality products', 'styling advice', 'grooming expertise',
    // 2 nodes away - experience
    'friendly atmosphere', 'good conversation', 'welcoming', 'classic vibe', 'modern shop', 'clean', 'comfortable chairs', 'walk-ins welcome', 'appointments available', 'quick service',
    'fair prices', 'no long wait', 'community feel', 'neighborhood shop', 'loyal customers', 'regulars', 'sports on TV', 'good music', 'relaxed vibe', 'masculine space',
    'will return', 'highly recommend', 'found my barber', 'best cut ever', 'trusted', 'consistent', 'never disappoints', 'go-to spot', 'worth the visit', 'local gem'
  ],
  'Spa': [
    // 1 node away - service quality
    'relaxing', 'rejuvenating', 'therapeutic', 'professional', 'skilled therapists', 'healing', 'restorative', 'deep tissue', 'hot stone', 'aromatherapy',
    'facials', 'body treatments', 'wraps', 'scrubs', 'customized treatments', 'quality products', 'organic options', 'effective results', 'tension relief', 'stress reduction',
    // 2 nodes away - experience
    'tranquil', 'serene', 'peaceful atmosphere', 'beautiful space', 'clean', 'luxurious', 'escape', 'pampering', 'self-care', 'wellness',
    'attentive staff', 'complimentary amenities', 'robes and slippers', 'sauna', 'steam room', 'quiet rooms', 'couples treatments', 'packages available', 'gift certificates', 'membership perks',
    'will return', 'highly recommend', 'much needed', 'total relaxation', 'felt renewed', 'melted stress away', 'heavenly', 'worth every penny', 'treat yourself', 'best spa'
  ],
  'Nail Salon': [
    // 1 node away - service quality
    'skilled technicians', 'clean', 'sanitary', 'attention to detail', 'precise', 'beautiful designs', 'nail art', 'long-lasting', 'quality products', 'gel manicure',
    'acrylics', 'dip powder', 'pedicures', 'cuticle care', 'shape perfection', 'color selection', 'trendy styles', 'classic looks', 'French tips', 'ombre',
    // 2 nodes away - experience
    'relaxing', 'friendly staff', 'welcoming', 'comfortable chairs', 'massage chairs', 'clean environment', 'well-ventilated', 'appointment available', 'walk-ins welcome', 'efficient',
    'reasonable prices', 'good value', 'loyalty rewards', 'consistent quality', 'no rushing', 'takes their time', 'listens to requests', 'gentle', 'professional atmosphere', 'modern salon',
    'will return', 'highly recommend', 'found my salon', 'love my nails', 'always perfect', 'never disappoints', 'best nails', 'compliments every time', 'trusted', 'go-to spot'
  ],
  'Med Spa': [
    // 1 node away - treatment quality
    'professional', 'effective treatments', 'visible results', 'modern equipment', 'latest technology', 'skilled practitioners', 'medical-grade', 'customized plans', 'Botox', 'fillers',
    'laser treatments', 'chemical peels', 'microneedling', 'body contouring', 'skin rejuvenation', 'anti-aging', 'acne treatment', 'pigmentation', 'safe procedures', 'FDA approved',
    // 2 nodes away - experience
    'knowledgeable staff', 'thorough consultations', 'clean facility', 'sterile environment', 'comfortable', 'discreet', 'private', 'honest recommendations', 'no pressure', 'transparent pricing',
    'follow-up care', 'before and after photos', 'natural-looking results', 'subtle enhancements', 'confidence boost', 'feel younger', 'refreshed look', 'maintained results', 'membership options', 'packages',
    'will return', 'highly recommend', 'life-changing', 'worth the investment', 'trusted provider', 'exceeded expectations', 'amazing results', 'professional experience', 'best decision', 'transformed'
  ],
  'Massage Therapy': [
    // 1 node away - service quality
    'skilled therapists', 'therapeutic', 'deep tissue', 'Swedish', 'sports massage', 'prenatal', 'hot stone', 'aromatherapy', 'pressure just right', 'tension relief',
    'pain relief', 'muscle relaxation', 'knot release', 'full body', 'targeted areas', 'customized pressure', 'professional technique', 'healing touch', 'range of motion', 'flexibility',
    // 2 nodes away - experience
    'relaxing', 'clean', 'peaceful environment', 'tranquil', 'calming music', 'comfortable table', 'warm room', 'quality oils', 'fresh linens', 'private rooms',
    'stress relief', 'mental clarity', 'feel renewed', 'better sleep', 'regular maintenance', 'wellness routine', 'self-care', 'treat yourself', 'membership options', 'packages available',
    'will return', 'highly recommend', 'found my therapist', 'best massage', 'exactly what I needed', 'melted tension', 'heavenly', 'life-changing', 'worth every penny', 'regular now'
  ],
  'Tattoo Parlor': [
    // 1 node away - artistry
    'skilled artists', 'talented', 'creative designs', 'custom work', 'original art', 'attention to detail', 'clean lines', 'solid color', 'fine line work', 'realistic',
    'traditional', 'neo-traditional', 'blackwork', 'watercolor', 'geometric', 'portraits', 'cover-ups', 'touch-ups', 'healed beautifully', 'aged well',
    // 2 nodes away - experience
    'clean', 'sterile environment', 'professional', 'proper sanitation', 'new needles', 'licensed', 'comfortable', 'good communication', 'patient', 'collaborative',
    'listens to ideas', 'honest advice', 'fair pricing', 'transparent quotes', 'no rushing', 'takes their time', 'consultation available', 'portfolio impressive', 'friendly staff', 'welcoming',
    'will return', 'highly recommend', 'found my artist', 'love my tattoo', 'exceeded expectations', 'exactly what I wanted', 'painless as possible', 'trusted', 'best work', 'worth the wait'
  ],
  'Tanning Salon': [
    // 1 node away - service quality
    'even tan', 'natural-looking', 'great color', 'no streaks', 'gradual build', 'long-lasting', 'quality beds', 'spray tan', 'airbrush', 'customized levels',
    'bronzed glow', 'sun-kissed', 'golden tan', 'premium lotions', 'skin care', 'moisturizing', 'fast results', 'controlled exposure', 'timer options', 'various bed types',
    // 2 nodes away - experience
    'clean', 'sanitized beds', 'friendly staff', 'helpful recommendations', 'comfortable', 'private rooms', 'air-conditioned', 'convenient', 'easy booking', 'flexible hours',
    'membership options', 'package deals', 'fair prices', 'good value', 'quick sessions', 'no waiting', 'well-maintained', 'modern equipment', 'results-focused', 'knowledgeable',
    'will return', 'highly recommend', 'perfect for events', 'vacation prep', 'confidence boost', 'consistent results', 'trusted', 'go-to spot', 'always satisfied', 'best tan'
  ],
  'Skincare Clinic': [
    // 1 node away - treatment quality
    'professional', 'effective treatments', 'visible results', 'clear skin', 'glowing complexion', 'customized approach', 'thorough analysis', 'quality products', 'medical-grade', 'science-backed',
    'facials', 'peels', 'extractions', 'hydration', 'anti-aging', 'acne treatment', 'rosacea', 'hyperpigmentation', 'texture improvement', 'pore refinement',
    // 2 nodes away - experience
    'knowledgeable staff', 'licensed estheticians', 'clean facility', 'relaxing', 'educational', 'home care advice', 'honest recommendations', 'no pressure', 'follow-up care', 'progress tracking',
    'before and after', 'transformation', 'confidence boost', 'skin health', 'long-term results', 'maintenance plans', 'packages available', 'membership perks', 'quality over quick fixes', 'investment in self',
    'will return', 'highly recommend', 'life-changing', 'skin transformed', 'finally clear', 'trusted provider', 'best decision', 'worth it', 'amazing results', 'found my clinic'
  ],
  // Automotive
  'Auto Shop': [
    // 1 node away - service quality
    'expert mechanics', 'skilled technicians', 'accurate diagnosis', 'quality repairs', 'thorough inspection', 'attention to detail', 'proper fix', 'OEM parts', 'warranty on work', 'certified',
    'brake service', 'engine repair', 'transmission', 'electrical', 'suspension', 'timing belt', 'tune-ups', 'maintenance', 'preventive care', 'check engine light',
    // 2 nodes away - experience
    'honest', 'trustworthy', 'fair pricing', 'no upselling', 'transparent quotes', 'explained repairs', 'showed the problem', 'reliable', 'quick turnaround', 'on-time completion',
    'clean shop', 'organized', 'professional', 'friendly staff', 'good communication', 'kept informed', 'convenient location', 'shuttle service', 'loaner cars', 'comfortable waiting area',
    'will return', 'highly recommend', 'found my mechanic', 'trusted for years', 'family cars', 'fleet service', 'honest shop', 'no surprises', 'fair and square', 'best in town'
  ],
  'Car Wash': [
    // 1 node away - wash quality
    'thorough clean', 'sparkling finish', 'attention to detail', 'streak-free', 'spot-free rinse', 'premium wash', 'wax included', 'tire shine', 'interior cleaning', 'vacuum service',
    'hand wash', 'touchless', 'soft cloth', 'undercarriage', 'wheel cleaning', 'bug removal', 'tar removal', 'clay bar', 'polish', 'protection',
    // 2 nodes away - experience
    'quick service', 'efficient', 'convenient', 'drive-through', 'self-serve options', 'good value', 'fair prices', 'membership deals', 'unlimited washes', 'express lane',
    'friendly staff', 'professional', 'well-maintained equipment', 'clean facility', 'waiting area', 'free vacuums', 'air fresheners', 'mat cleaning', 'consistent quality', 'reliable',
    'will return', 'highly recommend', 'go-to wash', 'best car wash', 'car looks new', 'always satisfied', 'monthly member', 'worth it', 'convenient location', 'never disappoints'
  ],
  'Auto Detailing': [
    // 1 node away - detailing quality
    'meticulous', 'attention to detail', 'showroom finish', 'like new', 'thorough', 'deep clean', 'paint correction', 'ceramic coating', 'wax protection', 'polish',
    'interior detailing', 'leather conditioning', 'stain removal', 'odor elimination', 'engine bay', 'wheel detailing', 'headlight restoration', 'scratch removal', 'swirl removal', 'hand wash',
    // 2 nodes away - experience
    'professional', 'skilled detailers', 'quality products', 'premium service', 'before and after photos', 'transformation', 'worth every penny', 'investment protection', 'resale value', 'pride of ownership',
    'mobile service', 'convenient', 'on-site', 'flexible scheduling', 'packages available', 'custom quotes', 'honest assessment', 'recommendations', 'maintenance plans', 'memberships',
    'will return', 'highly recommend', 'best detail ever', 'exceeded expectations', 'car looks amazing', 'trusted', 'consistent quality', 'found my detailer', 'worth the price', 'incredible results'
  ],
  'Tire Shop': [
    // 1 node away - service quality
    'quality tires', 'proper installation', 'balanced correctly', 'aligned perfectly', 'knowledgeable staff', 'right tire recommendations', 'brand selection', 'all-season', 'performance', 'winter tires',
    'tire rotation', 'flat repair', 'TPMS service', 'proper torque', 'road hazard warranty', 'mileage warranty', 'tire inspection', 'tread check', 'pressure check', 'spare tire',
    // 2 nodes away - experience
    'quick service', 'fair pricing', 'competitive prices', 'price matching', 'no appointment needed', 'efficient', 'while you wait', 'comfortable waiting area', 'honest recommendations', 'no pressure',
    'explained options', 'transparent pricing', 'reliable', 'professional', 'clean shop', 'organized', 'good inventory', 'special orders', 'fleet service', 'commercial accounts',
    'will return', 'highly recommend', 'found my tire shop', 'trusted', 'best prices', 'quality service', 'no surprises', 'consistent', 'go-to shop', 'always satisfied'
  ],
  'Body Shop': [
    // 1 node away - repair quality
    'quality work', 'seamless repairs', 'color match perfect', 'factory finish', 'attention to detail', 'skilled technicians', 'certified', 'OEM parts', 'structural repair', 'frame straightening',
    'dent removal', 'paintless dent repair', 'bumper repair', 'scratch repair', 'collision repair', 'insurance approved', 'lifetime warranty', 'quality paint', 'clear coat', 'blending',
    // 2 nodes away - experience
    'professional', 'fair estimates', 'accurate quotes', 'no hidden fees', 'works with insurance', 'direct billing', 'timely completion', 'kept informed', 'good communication', 'clean facility',
    'rental car assistance', 'towing available', 'before and after photos', 'honest assessment', 'trustworthy', 'reliable', 'family-owned', 'established', 'reputation', 'referrals',
    'will return', 'highly recommend', 'car looks new', 'exceeded expectations', 'couldn\'t tell difference', 'seamless repair', 'trusted shop', 'stress-free', 'handled everything', 'best body shop'
  ],
  'Oil Change': [
    // 1 node away - service quality
    'quick service', 'thorough', 'proper oil', 'quality filter', 'fluid top-off', 'tire pressure check', 'inspection included', 'synthetic options', 'conventional', 'high-mileage',
    'correct weight', 'manufacturer specs', 'reset reminder', 'check all fluids', 'air filter check', 'cabin filter', 'wiper check', 'battery test', 'light inspection', 'belts and hoses',
    // 2 nodes away - experience
    'convenient', 'fast', 'no appointment', 'while you wait', 'comfortable waiting', 'WiFi available', 'fair pricing', 'transparent', 'no upselling', 'honest recommendations',
    'professional', 'clean facility', 'friendly staff', 'explained everything', 'showed old filter', 'printed report', 'maintenance tracking', 'reminder service', 'fleet accounts', 'loyalty program',
    'will return', 'highly recommend', 'go-to spot', 'trusted', 'reliable', 'consistent service', 'best value', 'quick and easy', 'no hassle', 'always professional'
  ],
  'Car Dealership': [
    // 1 node away - sales quality
    'great selection', 'quality vehicles', 'well-maintained inventory', 'certified pre-owned', 'new models', 'fair pricing', 'competitive rates', 'trade-in value', 'financing options', 'lease specials',
    'knowledgeable staff', 'product expertise', 'test drives', 'vehicle history', 'Carfax provided', 'warranty options', 'extended coverage', 'service plans', 'transparent pricing', 'no hidden fees',
    // 2 nodes away - experience
    'no pressure', 'patient', 'listened to needs', 'found the right car', 'worked within budget', 'respectful', 'professional', 'follow-up service', 'after-sale support', 'service department',
    'clean showroom', 'comfortable', 'refreshments', 'kids area', 'shuttle service', 'loaner vehicles', 'convenient hours', 'weekend availability', 'online inventory', 'virtual tours',
    'will return', 'highly recommend', 'found my car', 'great experience', 'smooth transaction', 'no regrets', 'trusted dealership', 'family purchases', 'loyal customer', 'best dealership'
  ],
  // Fitness & Recreation
  'Gym': [
    // 1 node away - facility quality
    'state-of-the-art equipment', 'well-maintained', 'clean', 'variety of machines', 'free weights', 'cardio section', 'functional training', 'stretching area', 'locker rooms', 'showers',
    'professional trainers', 'certified staff', 'personal training', 'group classes', 'spinning', 'yoga', 'HIIT', 'strength training', 'programming', 'fitness assessments',
    // 2 nodes away - experience
    'motivating', 'welcoming', 'inclusive', 'all fitness levels', 'supportive community', 'friendly members', 'no intimidation', 'positive atmosphere', '24/7 access', 'convenient hours',
    'affordable membership', 'no contracts', 'flexible plans', 'family plans', 'guest passes', 'parking available', 'towel service', 'sauna', 'pool', 'amenities',
    'will return', 'highly recommend', 'reached my goals', 'consistent results', 'life-changing', 'found my gym', 'worth the investment', 'motivating environment', 'best gym', 'love coming here'
  ],
  'Yoga Studio': [
    // 1 node away - class quality
    'skilled instructors', 'knowledgeable teachers', 'proper alignment', 'modifications offered', 'all levels welcome', 'variety of styles', 'vinyasa', 'hatha', 'restorative', 'hot yoga',
    'meditation', 'breathwork', 'mindfulness', 'spiritual practice', 'physical challenge', 'flexibility', 'strength building', 'balance', 'body awareness', 'mind-body connection',
    // 2 nodes away - experience
    'peaceful', 'tranquil', 'welcoming', 'inclusive', 'non-judgmental', 'supportive community', 'clean space', 'beautiful studio', 'natural light', 'good energy',
    'quality mats', 'props available', 'reasonable prices', 'class packages', 'unlimited options', 'beginner-friendly', 'workshops', 'teacher training', 'retreats', 'online classes',
    'will return', 'highly recommend', 'transformative', 'life-changing', 'found my practice', 'stress relief', 'mental clarity', 'physical progress', 'best studio', 'second home'
  ],
  'Pilates Studio': [
    // 1 node away - class quality
    'expert instructors', 'certified teachers', 'proper form', 'core strength', 'full-body workout', 'reformer classes', 'mat classes', 'challenging', 'progressive', 'personalized attention',
    'classical Pilates', 'contemporary', 'rehabilitation', 'injury prevention', 'posture improvement', 'flexibility', 'muscle tone', 'controlled movements', 'mind-body', 'breathwork',
    // 2 nodes away - experience
    'supportive', 'encouraging', 'small classes', 'individual attention', 'clean studio', 'quality equipment', 'well-maintained reformers', 'welcoming atmosphere', 'professional environment', 'results-driven',
    'scheduling flexibility', 'package options', 'private sessions', 'duets', 'group classes', 'beginner-friendly', 'advanced options', 'workshops', 'consistent progress', 'measurable results',
    'will return', 'highly recommend', 'transformed my body', 'stronger than ever', 'pain-free', 'life-changing', 'found my workout', 'addicted', 'best investment', 'love this studio'
  ],
  'CrossFit': [
    // 1 node away - training quality
    'skilled coaches', 'certified trainers', 'proper technique', 'scalable workouts', 'functional fitness', 'high-intensity', 'varied programming', 'strength training', 'conditioning', 'Olympic lifting',
    'WODs', 'AMRAP', 'EMOM', 'benchmark workouts', 'skill development', 'gymnastics', 'rowing', 'assault bike', 'kettlebells', 'barbell work',
    // 2 nodes away - experience
    'great community', 'supportive members', 'motivating', 'encouraging', 'competitive atmosphere', 'team spirit', 'accountability', 'challenging', 'push your limits', 'personal records',
    'clean box', 'well-equipped', 'quality gear', 'convenient schedule', 'multiple class times', 'beginner on-ramp', 'fundamentals course', 'nutrition guidance', 'competitions', 'events',
    'will return', 'highly recommend', 'life-changing', 'found my tribe', 'best shape ever', 'addicted', 'transformed', 'strong community', 'more than a gym', 'family atmosphere'
  ],
  'Martial Arts': [
    // 1 node away - training quality
    'skilled instructors', 'experienced masters', 'proper technique', 'traditional training', 'authentic', 'discipline', 'structured curriculum', 'belt progression', 'self-defense', 'sparring',
    'forms', 'kata', 'striking', 'grappling', 'weapons training', 'competition prep', 'fitness benefits', 'flexibility', 'strength', 'coordination',
    // 2 nodes away - experience
    'respectful environment', 'safe training', 'all ages', 'family classes', 'kids programs', 'adult classes', 'beginner-friendly', 'advanced training', 'supportive community', 'character development',
    'confidence building', 'focus', 'mental discipline', 'stress relief', 'clean dojo', 'well-maintained', 'quality equipment', 'protective gear', 'reasonable tuition', 'trial classes',
    'will return', 'highly recommend', 'life-changing', 'found my passion', 'kids love it', 'whole family trains', 'discipline improved', 'confidence boost', 'best decision', 'transformative'
  ],
  'Dance Studio': [
    // 1 node away - instruction quality
    'talented instructors', 'professional dancers', 'experienced teachers', 'patient', 'encouraging', 'proper technique', 'variety of styles', 'ballet', 'jazz', 'hip-hop',
    'contemporary', 'tap', 'ballroom', 'Latin', 'salsa', 'choreography', 'performance opportunities', 'recitals', 'competitions', 'progressive curriculum',
    // 2 nodes away - experience
    'fun atmosphere', 'welcoming', 'inclusive', 'all ages', 'all levels', 'supportive community', 'great music', 'nice studio space', 'sprung floors', 'mirrors',
    'reasonable tuition', 'flexible scheduling', 'drop-in classes', 'packages available', 'costume assistance', 'performance prep', 'confidence building', 'self-expression', 'fitness benefits', 'social',
    'will return', 'highly recommend', 'found my passion', 'look forward to class', 'great exercise', 'stress relief', 'amazing community', 'kids love it', 'adult-friendly', 'life-changing'
  ],
  'Golf Course': [
    // 1 node away - course quality
    'well-maintained', 'manicured greens', 'challenging layout', 'fair fairways', 'good conditions', 'scenic holes', 'variety of tees', 'strategic design', 'playable for all levels', 'true putting',
    'good pace of play', 'marshals helpful', 'course management', 'yardage markers', 'GPS carts', 'practice facility', 'driving range', 'putting green', 'chipping area', 'lessons available',
    // 2 nodes away - experience
    'beautiful scenery', 'peaceful setting', 'great views', 'wildlife', 'friendly staff', 'professional service', 'well-stocked pro shop', 'quality equipment', 'club rentals', 'cart included',
    'good food', 'clubhouse', 'bar service', 'event hosting', 'tournaments', 'membership options', 'public welcome', 'reasonable rates', 'twilight specials', 'stay and play',
    'will return', 'highly recommend', 'favorite course', 'great value', 'worth the drive', 'bucket list course', 'memorable round', 'bring your friends', 'best in area', 'hidden gem'
  ],
  'Bowling Alley': [
    // 1 node away - facility quality
    'clean lanes', 'well-maintained', 'smooth approaches', 'consistent pin action', 'quality balls', 'variety of weights', 'comfortable shoes', 'modern scoring', 'automatic bumpers', 'good lighting',
    'league bowling', 'open bowling', 'cosmic bowling', 'glow bowling', 'party packages', 'arcade games', 'billiards', 'air hockey', 'laser tag', 'entertainment center',
    // 2 nodes away - experience
    'fun atmosphere', 'family-friendly', 'great for groups', 'birthday parties', 'corporate events', 'team building', 'good food', 'full bar', 'reasonable prices', 'shoe rental included',
    'friendly staff', 'helpful with kids', 'music playing', 'TVs for sports', 'comfortable seating', 'clean restrooms', 'convenient parking', 'weekend specials', 'daily deals', 'loyalty program',
    'will return', 'highly recommend', 'great time', 'fun for everyone', 'perfect outing', 'kids loved it', 'date night success', 'group favorite', 'best bowling alley', 'always a blast'
  ],
  // Retail - keeping entries shorter for space
  'Retail Store': [
    'great selection', 'quality products', 'fair prices', 'helpful staff', 'knowledgeable', 'well-organized', 'clean', 'easy to find items', 'good inventory', 'latest products',
    'variety', 'brands I trust', 'competitive prices', 'price matching', 'sales and deals', 'loyalty program', 'returns accepted', 'exchange policy', 'gift cards', 'special orders',
    'friendly service', 'no pressure', 'quick checkout', 'convenient location', 'parking available', 'good hours', 'weekend availability', 'online ordering', 'in-store pickup', 'delivery options',
    'local business', 'community-focused', 'supports local', 'family-owned', 'established', 'trusted', 'consistent quality', 'go-to store', 'always satisfied', 'will return',
    'highly recommend', 'best store', 'found what I needed', 'exceeded expectations', 'pleasant experience', 'stress-free shopping', 'one-stop shop', 'favorite store', 'loyal customer', 'hidden gem'
  ],
  'Boutique': [
    'unique selection', 'curated items', 'quality pieces', 'stylish', 'trendy', 'one-of-a-kind', 'handpicked', 'local designers', 'exclusive brands', 'limited quantities',
    'personalized service', 'styling advice', 'knows my taste', 'honest opinions', 'special orders', 'alterations', 'gift wrapping', 'beautiful packaging', 'attention to detail', 'memorable experience',
    'beautiful store', 'aesthetic', 'Instagram-worthy', 'inviting atmosphere', 'well-displayed', 'easy to browse', 'not overwhelming', 'comfortable', 'relaxed shopping', 'no pressure',
    'fair prices', 'quality over quantity', 'investment pieces', 'timeless', 'versatile', 'sustainable', 'ethical brands', 'local support', 'small business', 'community',
    'will return', 'highly recommend', 'found my style', 'always find something', 'go-to boutique', 'favorite shop', 'special finds', 'gift destination', 'hidden gem', 'love this store'
  ],
  'Jewelry Store': [
    'beautiful pieces', 'quality craftsmanship', 'fine jewelry', 'authentic', 'certified', 'conflict-free', 'precious metals', 'gemstones', 'diamonds', 'custom designs',
    'engagement rings', 'wedding bands', 'anniversary gifts', 'special occasions', 'everyday pieces', 'repairs', 'resizing', 'cleaning service', 'appraisals', 'insurance documentation',
    'knowledgeable staff', 'patient', 'no pressure', 'educational', 'honest recommendations', 'fair pricing', 'transparent', 'financing options', 'layaway', 'trade-in',
    'elegant showroom', 'secure', 'private viewing', 'comfortable', 'romantic atmosphere', 'gift wrapping', 'beautiful packaging', 'memorable experience', 'special treatment', 'VIP service',
    'will return', 'highly recommend', 'found the one', 'perfect ring', 'she said yes', 'exceeded expectations', 'trusted jeweler', 'family purchases', 'generational', 'heirloom quality'
  ],
  // Services
  'Dry Cleaner': [
    'quality cleaning', 'stain removal experts', 'gentle on fabrics', 'proper care', 'professional pressing', 'crisp finish', 'no chemical smell', 'eco-friendly options', 'wedding gown specialist', 'leather and suede',
    'quick turnaround', 'same-day service', 'next-day ready', 'reliable timing', 'convenient location', 'easy parking', 'drive-through', 'delivery service', 'pickup available', 'flexible hours',
    'fair prices', 'competitive rates', 'no surprises', 'itemized receipt', 'loyalty program', 'frequent customer discount', 'bulk pricing', 'corporate accounts', 'consistent quality', 'trustworthy',
    'friendly staff', 'knows my preferences', 'attention to detail', 'handles delicates', 'alterations available', 'repairs', 'button replacement', 'organized system', 'never lost items', 'careful handling',
    'will return', 'highly recommend', 'trusted for years', 'go-to cleaner', 'clothes look new', 'best dry cleaner', 'reliable service', 'peace of mind', 'always satisfied', 'wouldn\'t go anywhere else'
  ],
  'Plumber': [
    'prompt response', 'arrived on time', 'professional', 'licensed', 'insured', 'experienced', 'knowledgeable', 'diagnosed quickly', 'fixed right first time', 'quality work',
    'fair pricing', 'upfront quotes', 'no hidden fees', 'explained costs', 'competitive rates', 'honest assessment', 'didn\'t upsell', 'offered options', 'worked within budget', 'transparent',
    'clean work', 'respected my home', 'wore shoe covers', 'cleaned up after', 'no mess', 'efficient', 'fast service', 'solved the problem', 'lasting repair', 'warranty on work',
    'friendly', 'courteous', 'explained everything', 'answered questions', 'gave maintenance tips', 'emergency service', '24/7 available', 'weekend service', 'reliable', 'trustworthy',
    'will call again', 'highly recommend', 'saved the day', 'lifesaver', 'go-to plumber', 'found my plumber', 'trusted professional', 'stress-free experience', 'excellent service', 'best plumber'
  ],
  'Electrician': [
    'licensed', 'certified', 'experienced', 'knowledgeable', 'code compliant', 'safety focused', 'proper permits', 'quality work', 'neat wiring', 'professional installation',
    'prompt service', 'arrived on time', 'efficient', 'diagnosed quickly', 'fixed correctly', 'lasting repairs', 'thorough inspection', 'preventive recommendations', 'upgrade advice', 'future-proofing',
    'fair pricing', 'upfront quotes', 'no surprises', 'competitive rates', 'explained costs', 'worked within budget', 'honest assessment', 'transparent billing', 'warranty provided', 'guaranteed work',
    'professional', 'clean work area', 'respected property', 'courteous', 'explained everything', 'answered questions', 'reliable', 'trustworthy', 'emergency service', 'responsive',
    'will call again', 'highly recommend', 'found my electrician', 'trusted professional', 'peace of mind', 'safe home', 'excellent work', 'go-to electrician', 'best in area', 'wouldn\'t use anyone else'
  ],
  // Professional Services
  'Dental Office': [
    'gentle', 'painless', 'thorough exam', 'modern equipment', 'digital X-rays', 'comfortable chairs', 'clean facility', 'sterile environment', 'skilled dentist', 'experienced team',
    'preventive care', 'cleanings', 'fillings', 'crowns', 'root canals', 'extractions', 'cosmetic dentistry', 'whitening', 'veneers', 'Invisalign',
    'friendly staff', 'welcoming', 'calming atmosphere', 'reduced anxiety', 'patient with kids', 'explains procedures', 'no surprises', 'transparent pricing', 'insurance accepted', 'payment plans',
    'convenient scheduling', 'minimal wait', 'on time', 'reminder system', 'follow-up care', 'emergency appointments', 'Saturday hours', 'family-friendly', 'all ages', 'comprehensive care',
    'will return', 'highly recommend', 'found my dentist', 'no longer afraid', 'actually enjoy visits', 'healthy smile', 'trusted provider', 'whole family goes', 'best dental experience', 'life-changing'
  ],
  'Veterinarian': [
    'caring', 'compassionate', 'gentle with pets', 'patient', 'knowledgeable', 'experienced', 'thorough exam', 'accurate diagnosis', 'effective treatment', 'skilled',
    'preventive care', 'vaccinations', 'dental cleaning', 'surgery', 'emergency care', 'senior pet care', 'nutrition advice', 'behavior guidance', 'quality medications', 'follow-up care',
    'loves animals', 'calming presence', 'pet feels comfortable', 'handles nervous pets', 'takes time', 'not rushed', 'explains everything', 'answers questions', 'honest recommendations', 'no unnecessary treatments',
    'clean facility', 'modern equipment', 'friendly staff', 'easy scheduling', 'reasonable prices', 'transparent costs', 'payment options', 'insurance accepted', 'convenient location', 'emergency hours',
    'will return', 'highly recommend', 'found our vet', 'trust completely', 'pets love them', 'peace of mind', 'excellent care', 'like family', 'best vet ever', 'couldn\'t ask for better'
  ],
  // Hospitality
  'Hotel': [
    'comfortable beds', 'clean rooms', 'spacious', 'quiet', 'good sleep', 'quality linens', 'fluffy pillows', 'blackout curtains', 'climate control', 'well-appointed',
    'great location', 'convenient', 'walkable', 'near attractions', 'easy parking', 'safe neighborhood', 'accessible', 'beautiful views', 'pool', 'fitness center',
    'friendly staff', 'helpful concierge', 'quick check-in', 'responsive', 'accommodating', 'went above and beyond', 'remembered preferences', 'professional service', 'attentive', 'welcoming',
    'delicious breakfast', 'good restaurant', 'room service', 'bar lounge', 'business center', 'meeting rooms', 'WiFi included', 'amenities', 'toiletries', 'robes and slippers',
    'will return', 'highly recommend', 'exceeded expectations', 'felt like home', 'relaxing stay', 'perfect trip', 'great value', 'worth the price', 'memorable experience', 'best hotel'
  ],
  // Education
  'Tutoring Center': [
    'effective teaching', 'patient instructors', 'knowledgeable tutors', 'subject expertise', 'personalized approach', 'customized curriculum', 'one-on-one attention', 'small groups', 'focused learning', 'clear explanations',
    'improved grades', 'better understanding', 'confidence building', 'test prep', 'SAT/ACT', 'homework help', 'study skills', 'learning strategies', 'catch-up support', 'advanced enrichment',
    'progress tracking', 'regular updates', 'parent communication', 'flexible scheduling', 'convenient location', 'online options', 'reasonable rates', 'packages available', 'trial session', 'no contracts',
    'supportive environment', 'encouraging', 'motivating', 'stress-free', 'safe space', 'positive reinforcement', 'celebrates success', 'builds confidence', 'addresses weaknesses', 'develops strengths',
    'will return', 'highly recommend', 'grades improved', 'confidence soared', 'found their tutor', 'stress relief', 'worth the investment', 'life-changing', 'couldn\'t do without', 'best decision'
  ],
  // Liquor & Beverage Retail
  'Liquor Store': [
    'great selection', 'wide variety', 'craft beer', 'local wines', 'premium spirits', 'rare finds', 'imported options', 'domestic favorites', 'competitive prices', 'good deals',
    'knowledgeable staff', 'helpful recommendations', 'pairing suggestions', 'special orders', 'gift sets', 'mixers available', 'accessories', 'ice cold beer', 'chilled wines', 'well-organized',
    'clean store', 'easy to navigate', 'clearly labeled', 'good lighting', 'convenient location', 'parking available', 'friendly service', 'quick checkout', 'loyalty program', 'sale items',
    'party supplies', 'keg orders', 'delivery available', 'curbside pickup', 'late hours', 'weekend hours', 'local business', 'community staple', 'trusted', 'reliable',
    'will return', 'highly recommend', 'go-to spot', 'best selection', 'fair prices', 'always find what I need', 'great for gifts', 'party headquarters', 'favorite liquor store', 'wouldn\'t shop anywhere else'
  ],
  'Wine Shop': [
    'curated selection', 'quality wines', 'knowledgeable sommelier', 'expert recommendations', 'rare vintages', 'local wineries', 'imported wines', 'organic options', 'natural wines', 'biodynamic',
    'wine tastings', 'educational events', 'wine club', 'food pairings', 'gift wrapping', 'corporate gifts', 'special occasions', 'cellar worthy', 'everyday wines', 'hidden gems',
    'passionate staff', 'personalized service', 'remembers preferences', 'budget-friendly options', 'premium selections', 'beautiful store', 'inviting atmosphere', 'temperature controlled', 'proper storage', 'quality assured',
    'fair prices', 'competitive', 'value finds', 'splurge worthy', 'special orders', 'delivery available', 'convenient location', 'easy parking', 'great hours', 'local business',
    'will return', 'highly recommend', 'found my wine shop', 'elevated my palate', 'great discoveries', 'trusted advice', 'go-to for gifts', 'wine lover\'s paradise', 'best wine shop', 'wouldn\'t go anywhere else'
  ],
  'Grocery Store': [
    'fresh produce', 'quality meats', 'good selection', 'organic options', 'local products', 'competitive prices', 'clean store', 'well-stocked', 'organized aisles', 'easy to find items',
    'friendly staff', 'helpful', 'quick checkout', 'self-checkout', 'good deli', 'fresh bakery', 'prepared foods', 'hot bar', 'salad bar', 'pharmacy',
    'curbside pickup', 'delivery available', 'app ordering', 'digital coupons', 'loyalty program', 'weekly sales', 'good deals', 'price matching', 'BOGO offers', 'bulk options',
    'convenient location', 'good hours', 'parking available', 'clean carts', 'clean restrooms', 'wide aisles', 'not crowded', 'family-friendly', 'community staple', 'local',
    'will return', 'highly recommend', 'go-to grocery', 'one-stop shop', 'quality and value', 'always fresh', 'reliable', 'consistent', 'best grocery store', 'shop here weekly'
  ],
  'Convenience Store': [
    'quick stop', 'grab and go', 'open late', '24/7', 'convenient location', 'easy parking', 'fast service', 'friendly staff', 'clean store', 'well-stocked',
    'essentials available', 'snacks', 'drinks', 'hot food', 'fresh coffee', 'lottery tickets', 'ATM', 'phone chargers', 'toiletries', 'medicine',
    'fair prices', 'good deals', 'loyalty program', 'fuel station', 'car wash', 'air pump', 'ice', 'propane', 'everyday items', 'emergency supplies',
    'safe location', 'well-lit', 'security cameras', 'clean restrooms', 'quick in and out', 'no long lines', 'efficient', 'reliable', 'community spot', 'local',
    'will return', 'highly recommend', 'lifesaver', 'always open', 'dependable', 'go-to stop', 'convenient', 'quick and easy', 'best convenience store', 'neighborhood staple'
  ],
  'Smoke Shop': [
    'great selection', 'quality products', 'premium brands', 'variety', 'knowledgeable staff', 'helpful recommendations', 'fair prices', 'competitive', 'clean store', 'well-organized',
    'cigars', 'cigarettes', 'tobacco', 'rolling papers', 'pipes', 'hookahs', 'accessories', 'lighters', 'cases', 'humidors',
    'friendly service', 'no judgment', 'welcoming', 'relaxed atmosphere', 'quick checkout', 'loyalty program', 'deals available', 'bulk pricing', 'special orders', 'rare finds',
    'convenient location', 'good hours', 'easy parking', 'local business', 'community shop', 'established', 'trusted', 'reliable', 'consistent quality', 'good inventory',
    'will return', 'highly recommend', 'go-to shop', 'best selection', 'fair prices', 'always stocked', 'friendly staff', 'quick service', 'favorite smoke shop', 'wouldn\'t go anywhere else'
  ],
  'Vape Shop': [
    'great selection', 'quality products', 'latest devices', 'premium e-liquids', 'variety of flavors', 'knowledgeable staff', 'helpful', 'patient with beginners', 'expert advice', 'troubleshooting help',
    'mods', 'pods', 'disposables', 'coils', 'batteries', 'accessories', 'custom builds', 'starter kits', 'nicotine options', 'CBD products',
    'try before you buy', 'flavor sampling', 'fair prices', 'competitive', 'deals available', 'loyalty program', 'rewards', 'new arrivals', 'trending products', 'quality assured',
    'clean store', 'modern', 'welcoming atmosphere', 'no pressure', 'educational', 'friendly service', 'quick checkout', 'convenient location', 'good hours', 'local business',
    'will return', 'highly recommend', 'found my vape shop', 'best selection', 'knowledgeable team', 'always helpful', 'fair prices', 'quality products', 'go-to shop', 'loyal customer'
  ],
  'Dispensary': [
    'quality products', 'tested', 'lab certified', 'safe', 'variety', 'flower', 'edibles', 'concentrates', 'topicals', 'tinctures',
    'knowledgeable budtenders', 'helpful recommendations', 'patient', 'educational', 'dosage guidance', 'strain information', 'effects explained', 'medical expertise', 'personalized service', 'no pressure',
    'clean facility', 'professional', 'welcoming', 'comfortable', 'discreet', 'secure', 'compliant', 'licensed', 'reputable', 'established',
    'fair prices', 'deals available', 'first-time discounts', 'loyalty program', 'daily specials', 'online ordering', 'express pickup', 'delivery available', 'convenient location', 'good hours',
    'will return', 'highly recommend', 'trusted dispensary', 'quality assured', 'consistent products', 'knowledgeable staff', 'great experience', 'comfortable atmosphere', 'go-to spot', 'best dispensary'
  ],
  // Pet Services
  'Pet Groomer': [
    'gentle handling', 'patient with pets', 'skilled groomers', 'professional', 'experienced', 'breed knowledge', 'proper techniques', 'quality cuts', 'beautiful results', 'attention to detail',
    'bath and brush', 'haircuts', 'nail trimming', 'ear cleaning', 'teeth brushing', 'de-shedding', 'flea treatment', 'medicated baths', 'puppy grooming', 'senior pet care',
    'clean facility', 'safe environment', 'proper sanitation', 'quality products', 'hypoallergenic options', 'comfortable', 'calming atmosphere', 'treats for pets', 'photos provided', 'updates during service',
    'fair prices', 'packages available', 'convenient scheduling', 'online booking', 'reminder service', 'flexible hours', 'walk-ins welcome', 'quick turnaround', 'reliable', 'consistent',
    'will return', 'highly recommend', 'pet loves it', 'looks amazing', 'stress-free', 'found our groomer', 'trusted', 'gentle care', 'best groomer', 'wouldn\'t go anywhere else'
  ],
  'Dog Trainer': [
    'effective methods', 'positive reinforcement', 'patient', 'knowledgeable', 'experienced', 'certified', 'behavior expertise', 'customized training', 'results-driven', 'clear communication',
    'obedience training', 'puppy classes', 'behavior modification', 'aggression help', 'anxiety issues', 'leash training', 'socialization', 'tricks', 'agility', 'therapy dog prep',
    'private sessions', 'group classes', 'board and train', 'in-home training', 'flexible scheduling', 'follow-up support', 'homework provided', 'progress tracking', 'video resources', 'lifetime support',
    'clean facility', 'safe environment', 'good with all breeds', 'good with all sizes', 'gentle approach', 'builds confidence', 'strengthens bond', 'educational for owners', 'realistic expectations', 'honest assessment',
    'will return', 'highly recommend', 'transformed our dog', 'life-changing', 'worth every penny', 'found our trainer', 'amazing results', 'patient and kind', 'best decision', 'couldn\'t be happier'
  ],
  'Pet Boarding': [
    'safe facility', 'secure', 'clean', 'spacious', 'comfortable', 'climate controlled', 'proper supervision', '24/7 staff', 'veterinary access', 'emergency protocols',
    'individual attention', 'playtime', 'socialization', 'exercise', 'walks', 'cuddle time', 'feeding schedule', 'medication administration', 'special needs care', 'senior pet care',
    'photo updates', 'video updates', 'webcam access', 'daily reports', 'responsive communication', 'peace of mind', 'happy pets', 'tail wagging pickup', 'well-rested', 'well-cared for',
    'fair prices', 'packages available', 'long-term discounts', 'vaccination required', 'meet and greet', 'trial stay', 'flexible drop-off', 'flexible pickup', 'convenient location', 'easy booking',
    'will return', 'highly recommend', 'pet was happy', 'stress-free vacation', 'trusted facility', 'like a second home', 'amazing staff', 'peace of mind', 'best boarding', 'only place we use'
  ],
  'Daycare': [
    'safe environment', 'clean facility', 'licensed', 'certified staff', 'background checked', 'proper ratios', 'age-appropriate', 'structured activities', 'learning curriculum', 'developmental focus',
    'nurturing caregivers', 'loving attention', 'patient', 'experienced', 'good communication', 'daily reports', 'photos shared', 'app updates', 'parent involvement', 'open door policy',
    'healthy meals', 'snacks provided', 'nap time', 'outdoor play', 'indoor activities', 'arts and crafts', 'music', 'reading', 'socialization', 'school readiness',
    'flexible hours', 'convenient location', 'easy drop-off', 'secure entry', 'parking available', 'reasonable rates', 'sibling discounts', 'part-time options', 'full-time care', 'summer programs',
    'will return', 'highly recommend', 'child thrives', 'loves going', 'peace of mind', 'found our daycare', 'like family', 'excellent care', 'best decision', 'couldn\'t be happier'
  ],
  // Repair Services
  'Phone Repair': [
    'quick service', 'same-day repair', 'while you wait', 'skilled technicians', 'quality parts', 'warranty on repairs', 'screen replacement', 'battery replacement', 'charging port', 'water damage',
    'cracked screen', 'broken glass', 'camera repair', 'speaker issues', 'microphone fix', 'button repair', 'software issues', 'data recovery', 'diagnostics', 'all brands',
    'fair prices', 'competitive rates', 'free estimates', 'no fix no fee', 'transparent pricing', 'affordable', 'quality work', 'lasting repairs', 'OEM options', 'aftermarket options',
    'convenient location', 'walk-ins welcome', 'appointment available', 'friendly staff', 'knowledgeable', 'honest assessment', 'no upselling', 'mail-in service', 'corporate accounts', 'bulk repairs',
    'will return', 'highly recommend', 'saved my phone', 'lifesaver', 'quick and affordable', 'works perfectly', 'trusted repair shop', 'go-to place', 'best phone repair', 'excellent service'
  ],
  'Computer Repair': [
    'skilled technicians', 'experienced', 'certified', 'diagnostics', 'troubleshooting', 'virus removal', 'malware cleanup', 'speed optimization', 'hardware repair', 'software issues',
    'screen replacement', 'keyboard repair', 'battery replacement', 'data recovery', 'backup services', 'upgrades', 'RAM', 'SSD', 'custom builds', 'networking',
    'PC and Mac', 'laptops', 'desktops', 'all brands', 'quick turnaround', 'same-day service', 'while you wait', 'pickup and delivery', 'remote support', 'on-site service',
    'fair prices', 'free estimates', 'transparent quotes', 'no fix no fee', 'warranty on work', 'quality parts', 'honest assessment', 'explained clearly', 'patient', 'educational',
    'will return', 'highly recommend', 'fixed the problem', 'runs like new', 'saved my data', 'knowledgeable', 'trustworthy', 'fair and honest', 'best computer repair', 'go-to tech support'
  ],
  // Other
  'Other': [
    'professional', 'reliable', 'trustworthy', 'experienced', 'knowledgeable', 'skilled', 'attention to detail', 'quality service', 'exceeded expectations', 'went above and beyond',
    'friendly', 'courteous', 'responsive', 'good communication', 'punctual', 'on time', 'efficient', 'thorough', 'careful', 'respectful',
    'fair pricing', 'transparent', 'no hidden fees', 'good value', 'competitive rates', 'honest', 'upfront', 'explained everything', 'no surprises', 'worked within budget',
    'convenient', 'flexible scheduling', 'easy to work with', 'accommodating', 'problem solver', 'creative solutions', 'quick turnaround', 'available when needed', 'follow-up', 'stands behind work',
    'will use again', 'highly recommend', 'found my go-to', 'trusted provider', 'excellent experience', 'couldn\'t be happier', 'stress-free', 'peace of mind', 'best in business', 'wouldn\'t go anywhere else'
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
      // If there's a typed value that's not in the list, allow custom type
      if (businessTypeInput.trim() && businessTypes.length < MAX_BUSINESS_TYPES) {
        const exactMatch = BUSINESS_TYPES.find(
          type => type.toLowerCase() === businessTypeInput.toLowerCase()
        );
        if (exactMatch && !businessTypes.includes(exactMatch)) {
          handleBusinessTypeSelect(exactMatch);
        } else if (!exactMatch && !businessTypes.includes(businessTypeInput.trim())) {
          // Custom business type
          const newBusinessTypes = [...businessTypes, businessTypeInput.trim()];
          setBusinessTypes(newBusinessTypes);
          setBusinessTypeInput('');
          setShowBusinessTypeDropdown(false);
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
            
            {/* Custom type hint */}
            {businessTypeInput && !BUSINESS_TYPES.some(t => t.toLowerCase() === businessTypeInput.toLowerCase()) && (
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to add custom type: &quot;{businessTypeInput}&quot;
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
