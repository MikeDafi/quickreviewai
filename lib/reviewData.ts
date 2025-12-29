/**
 * Review Generation Data
 * 
 * This module contains static data used to generate varied, human-sounding reviews.
 * Extracted from generate.ts to keep the API handler focused on business logic.
 */

/**
 * Character personas for variety in generated reviews.
 * These represent different types of reviewers to create authentic-sounding content.
 */
export const CHARACTER_PERSONAS = [
  // Regular customers
  'a regular local customer who visits often',
  'been coming here for years and finally writing a review',
  'a loyal customer who keeps coming back every week',
  'someone who lives nearby and walks here all the time',
  
  // First timers
  'a first-time visitor who was pleasantly surprised',
  'skeptical at first but totally converted now',
  'finally tried this place after walking past it a hundred times',
  'tourist visiting the area who stumbled upon this gem',
  
  // Professionals
  'a busy professional who values efficiency and quality',
  'work nearby and this has become my go-to spot',
  'grabbed lunch here between meetings',
  'remote worker who needed a change of scenery',
  
  // Parents and families
  'a parent with young kids who appreciates kid-friendly places',
  'brought the whole family including picky eaters',
  'mom of three looking for places that work for everyone',
  'grandparent taking grandkids out for a treat',
  
  // Age groups
  'an older customer who appreciates good old-fashioned service',
  'young adult who found this through TikTok actually',
  'college student on a budget',
  'retiree with time to enjoy the little things',
  
  // Social situations
  'someone celebrating a special occasion',
  'brought my date here and wanted to impress them',
  'met up with old friends I hadn\'t seen in months',
  'hosting out-of-town relatives',
  'girls night out with my friends',
  'guys trip and we needed fuel',
  
  // Personalities
  'a non-native English speaker who moved here recently',
  'someone who doesn\'t usually write reviews but felt compelled to',
  'a skeptic who was won over despite low expectations',
  'a foodie/enthusiast who knows quality when I see it',
  'quiet introvert who appreciated the chill atmosphere',
  'someone who\'s tried basically every place in town',
  'picky eater who\'s hard to please',
  'someone with dietary restrictions who usually struggles',
  
  // Situational
  'someone in a rush who was impressed by speed',
  'had a rough day and needed something to cheer me up',
  'recovering from being sick and this hit the spot',
  'jet-lagged traveler who needed exactly this',
  'hungover and desperate for good food',
  'pregnant and dealing with weird cravings',
  'post-workout and starving',
  'killing time before a movie nearby',
  
  // Referral types
  'my coworker wouldn\'t stop talking about this place',
  'my partner dragged me here and I\'m glad they did',
  'saw this on Instagram and had to check it out',
  'Yelp recommended this and for once it was right',
  'read about this in a local blog',
  
  // Quirky/specific
  'night owl who appreciates late hours',
  'morning person who needs early options',
  'someone who judges places by their bathroom cleanliness',
  'former industry worker who knows what good service looks like',
  'someone who\'s lived in 5 different cities and has high standards',
] as const

/**
 * Reasons for visiting a business.
 * Provides context for the review narrative.
 */
export const VISIT_REASONS = [
  // Work related
  'stopped by on my lunch break',
  'came here after a long day at work',
  'needed coffee before a big meeting',
  'grabbed something quick between appointments',
  'working remotely and needed to get out of the house',
  'celebrating finally finishing a big project',
  'stress eating after a rough day at the office',
  
  // Social
  'my friend recommended this place months ago',
  'came here for a birthday celebration',
  'met up with friends I hadn\'t seen in forever',
  'first date and wanted somewhere casual but good',
  'anniversary dinner with my partner',
  'catching up with an old college roommate',
  'team lunch with coworkers',
  'baby shower for my sister',
  'post-funeral gathering needed comfort food',
  
  // Discovery
  'found it while walking around the neighborhood',
  'saw good reviews online and had to try it',
  'drove past this place every day and finally stopped',
  'Google maps said this was nearby when I was starving',
  'the place I usually go to was closed so tried this instead',
  'taking a different route home and spotted it',
  'Uber driver recommended it actually',
  
  // Repeat visits
  'been coming here for years honestly',
  'this is probably my tenth time here',
  'came back after a great first experience last month',
  'dragged my family here because I couldn\'t stop talking about it',
  'brought friends from out of town to show off the local spots',
  
  // Timing
  'needed something quick before catching a flight',
  'late night craving hit hard',
  'early morning before everyone else woke up',
  'rainy day and needed somewhere cozy',
  'it was hot outside and needed AC and cold drinks',
  'waiting for my car at the shop nearby',
  'killing time before a doctor\'s appointment',
  
  // Circumstantial  
  'treating myself after a long week',
  'reward for hitting the gym this morning',
  'comfort food after a breakup honestly',
  'celebrating getting a new job',
  'needed to get out of the house during renovations',
  'first outing after being sick for a week',
  'wanted to try something new instead of cooking',
  'groceries looked sad so decided to eat out instead',
  
  // Family
  'brought my family here for dinner',
  'kids were begging to go somewhere',
  'needed to entertain visiting in-laws',
  'took my mom out for Mother\'s Day',
  'dad was in town and wanted to show him around',
  'family tradition every Sunday',
  
  // Specific needs
  'needed a place with good wifi to work',
  'looking for somewhere with outdoor seating',
  'wanted to try their new menu items',
  'heard they had vegan options finally',
  'craving specifically what they make here',
  'only place open this late that looked decent',
] as const

/**
 * Example real human reviews to guide the AI model.
 * These demonstrate the casual, authentic tone we want.
 */
export const EXAMPLE_HUMAN_REVIEWS = [
  "Ok so I was skeptical but my coworker kept bugging me to try this place. Finally gave in last Tuesday and damn, she was right. Got the chicken sandwich and it was honestly really good. Nothing fancy but just solid food you know?",
  "Came here with my bf for our anniversary. Wasn't sure what to expect but the waiter was super nice and helped us pick out wine. Food took a while but worth the wait imo",
  "3rd time here this month lol. Can't stop thinking about their tacos. My kids are obsessed too which is rare because they're picky af. Parking kinda sucks but whatever",
  "Finally a place that gets it right. I've tried like 5 other spots in the area and this one actually knows what they're doing. The owner remembered my name on my second visit which was cool",
  "Not gonna lie, I almost didn't come in bc it looked empty but so glad I did. Super chill vibe, good music playing, and the coffee was strong without being bitter. New go-to for sure",
  "My mom recommended this place and she's usually wrong about restaurants lmao but this time she nailed it. We shared a few dishes and everything was fresh. Waitress was a little slow but no big deal",
  "Stopped in on a whim while waiting for my car at the shop next door. Pleasantly surprised! Nothing groundbreaking but everything was done well. The soup hit different on a cold day like today",
  "Been meaning to try this spot forever. Finally made it last weekend with some friends. We got way too much food but no regrets. That dessert though... I'm still thinking about it",
] as const

/**
 * Ultra-short examples for very brief reviews.
 * Used when the length profile is "ultra-short" (6-12 words).
 */
export const ULTRA_SHORT_EXAMPLES = [
  "Finally tried it, not disappointed",
  "My new go-to honestly",
  "The hype is real ngl",
  "Better than expected tbh",
  "Came for the reviews, staying for the food",
  "Worth the wait fr",
  "10/10 would come back",
  "Exactly what I needed today",
  "Can't complain at all",
  "Slaps every time",
  "Pretty decent actually",
  "They know what they're doing",
  "Hit the spot perfectly",
  "This place gets it",
  "Yep. Coming back",
  "A+ vibes here",
  "No notes tbh",
  "Just what I was looking for",
  "Lived up to expectations",
  "Good find right here",
  "Why did I wait so long",
  "Yeah this place is legit",
  "Consider me a regular now",
  "Take my money already",
  "Instant favorite",
  "Where has this been all my life",
  "Nailed it",
  "Didn't disappoint",
  "Checks all the boxes",
  "I'm sold",
] as const

/**
 * Opening phrases to force variety in reviews.
 * Each review starts with one of these to avoid repetitive beginnings.
 */
export const REVIEW_OPENERS = [
  // Casual conversation starters
  "Ok so",
  "Honestly",
  "Not gonna lie",
  "Real talk",
  "Listen",
  "Look",
  "Alright so",
  "Here's the thing",
  "So basically",
  "Let me tell you",
  "I gotta say",
  "Gotta be honest",
  "Truth be told",
  "For real though",
  "No cap",
  "Straight up",
  "Lowkey",
  "Highkey",
  "Legit",
  
  // Time-based openers
  "Finally",
  "Just",
  "Recently",
  "Last week",
  "Yesterday",
  "The other day",
  "This morning",
  "Tonight",
  "Earlier today",
  "A few days ago",
  "Been meaning to",
  "After months of",
  "Took me forever to",
  
  // Action-based openers
  "Came here",
  "Stopped by",
  "Dropped in",
  "Swung by",
  "Checked out",
  "Tried",
  "Just tried",
  "Had to try",
  "Decided to try",
  "Walked in",
  "Popped in",
  "Grabbed",
  "Got",
  "Ordered",
  "Picked up",
  
  // Social/referral openers
  "My friend",
  "My coworker",
  "My partner",
  "My mom",
  "Someone told me",
  "Heard about",
  "Everyone kept saying",
  "People weren't lying",
  "The reviews were right",
  "Yelp said",
  "Google led me here",
  "TikTok made me",
  "Instagram brought me",
  "A friend dragged me",
  "My bf/gf recommended",
  
  // Discovery openers
  "Found this",
  "Stumbled upon",
  "Discovered",
  "Walked past",
  "Drove by",
  "Never noticed",
  "Hidden away",
  "Tucked in",
  "Right around the corner",
  "Down the street",
  
  // Emotion/reaction openers
  "So glad",
  "Super happy",
  "Pleasantly surprised",
  "Wasn't expecting",
  "Didn't think",
  "Who knew",
  "Can't believe",
  "Mind blown",
  "Impressed",
  "Wow",
  "Whoa",
  "Damn",
  "Man",
  "Dude",
  "Yo",
  "Y'all",
  "Omg",
  "Bruh",
  
  // Skeptic/convert openers
  "I was skeptical",
  "Wasn't sure",
  "Had my doubts",
  "Almost didn't",
  "Nearly skipped",
  "Hesitated but",
  "Took a chance",
  "Gave it a shot",
  "Worth the risk",
  
  // Context openers
  "After a long day",
  "On my lunch break",
  "Needed something",
  "Was craving",
  "In the mood for",
  "Looking for",
  "Searching for",
  "Hungry and",
  "Starving so",
  
  // Qualifier openers
  "Quick review",
  "Short version",
  "Long story short",
  "TLDR",
  "In a nutshell",
  "Bottom line",
  "Main takeaway",
  
  // Casual intros
  "This place",
  "These guys",
  "The team here",
  "The folks here",
  "The people",
  "The staff",
  "The owner",
  
  // Emphasis openers
  "Actually",
  "Seriously",
  "Genuinely",
  "Truly",
  "Really",
  "Definitely",
  "Absolutely",
  "Can confirm",
  "100%",
  "10/10",
] as const

/**
 * Length profiles for reviews with their weights.
 * Higher weight = more likely to be selected.
 * 
 * Distribution rationale:
 * - ultra-short (2 weight): ~10% - Very brief one-liners
 * - short (6 weight): ~30% - 1-2 sentences, common for quick reviews
 * - medium (12 weight): ~50% - 3-4 sentences, the most common review length
 * - long (4 weight): ~20% - 5-6 sentences for detailed reviews
 * - extended (1 weight): ~5% - Full story reviews, rare but authentic
 */
export const LENGTH_PROFILES = [
  { type: 'ultra-short', instruction: '6-12 words only. Just a quick one-liner reaction.', weight: 1 },
  { type: 'ultra-short', instruction: '6-12 words only. Just a quick one-liner reaction.', weight: 1 },
  { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
  { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
  { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
  { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
  { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
  { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
  { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
  { type: 'long', instruction: '5-6 sentences with some detail.', weight: 2 },
  { type: 'long', instruction: '5-6 sentences with some detail.', weight: 2 },
  { type: 'extended', instruction: '2 short paragraphs. Tell a story about the experience.', weight: 1 },
] as const

export type LengthProfile = typeof LENGTH_PROFILES[number]

/**
 * Quirk probabilities for adding human-like imperfections.
 * 
 * Each quirk has a probability of being added to make reviews more authentic.
 * Lower probabilities = rarer quirks that would look suspicious if overused.
 */
export const REVIEW_QUIRKS = {
  /** 30% chance - Common internet expressions */
  LOL_EXPRESSIONS: { probability: 0.3, instruction: 'use "lol", "lmao", or "haha" once' },
  /** 25% chance - Casual contractions */
  CASUAL_CONTRACTIONS: { probability: 0.25, instruction: 'use "gonna", "kinda", "gotta", or "wanna"' },
  /** 15% chance - Minor typos (lower probability to avoid looking fake) */
  MINOR_TYPOS: { probability: 0.15, instruction: 'include a minor typo like "teh", "definately", "resturant", or missing apostrophe' },
  /** 30% chance - Ellipsis or em-dash mid-thought */
  TRAILING_PUNCTUATION: { probability: 0.3, instruction: 'use "..." or "—" mid-thought' },
  /** 25% chance - Common abbreviations */
  ABBREVIATIONS: { probability: 0.25, instruction: 'abbreviate something like "bf", "bc", "tbh", "imo", or "ngl"' },
  /** 20% chance - Starting sentences with conjunctions */
  CONJUNCTION_STARTS: { probability: 0.2, instruction: 'start a sentence with "And" or "But" or "So"' },
  /** 10% chance - Lowercase "i" (very rare, would be suspicious if common) */
  LOWERCASE_I: { probability: 0.1, instruction: 'use lowercase "i" instead of "I" once' },
} as const

/**
 * Keyword selection probability.
 * 60% chance of selecting 1 keyword, 40% chance of selecting 2.
 * This creates natural variation - most reviews mention 1 thing.
 */
export const KEYWORD_SELECTION = {
  /** Probability of selecting just 1 keyword (vs 2) */
  SINGLE_KEYWORD_PROBABILITY: 0.6,
} as const

