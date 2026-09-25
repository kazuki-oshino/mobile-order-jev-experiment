const baseDonuts = [
  { id: 'honey', name: 'ハニー・ハグ', en: 'Honey hug', price: 260, kcal: 245, sweetness: 3, richness: 2, category: 'classic', note: 'はちみつ × ふわもち', description: 'Golden honey glazed ring; familiar, soft, gentle honey sweetness.', index: 0 },
  { id: 'berry', name: 'ベリー・キス', en: 'Berry kiss', price: 320, kcal: 278, sweetness: 4, richness: 2, category: 'fruit', note: 'いちご × 甘酸っぱい', description: 'Pink strawberry glaze and berry flakes; sweet-tart, colorful and cute.', index: 1 },
  { id: 'cacao', name: 'ミッドナイト', en: 'Midnight cacao', price: 340, kcal: 328, sweetness: 2, richness: 5, category: 'chocolate', note: 'カカオ × ほろ苦い', description: 'Dark chocolate glaze and shavings; intensely rich cocoa, bitter, less sweet but high calorie.', index: 2 },
  { id: 'pistachio', name: 'ピスタチオ・デイ', en: 'Pistachio day', price: 380, kcal: 310, sweetness: 3, richness: 4, category: 'nuts', note: 'ピスタチオ × 香ばしい', description: 'Green pistachio glaze with nuts; rich, fragrant, premium and sophisticated.', index: 3 },
  { id: 'confetti', name: 'リトル・パレード', en: 'Little parade', price: 300, kcal: 295, sweetness: 5, richness: 3, category: 'sweet', note: 'バニラ × カラフル', description: 'White vanilla icing and rainbow sprinkles; very sweet, playful, celebratory.', index: 4 },
  { id: 'cinnamon', name: 'シナモン・サン', en: 'Cinnamon sun', price: 250, kcal: 235, sweetness: 3, richness: 2, category: 'classic', note: 'シナモン × さっくり', description: 'Rustic cinnamon sugar old-fashioned ring; familiar, crisp, warm and inexpensive.', index: 5 },
  { id: 'lemon', name: 'レモン・レター', en: 'Lemon letter', price: 290, kcal: 228, sweetness: 2, richness: 1, category: 'fruit', note: 'レモン × さわやか', description: 'Bright yellow lemon glaze with zest; citrusy, tart and refreshing.', index: 6 },
  { id: 'blueberry', name: 'ブルーベリー・ムーン', en: 'Blueberry moon', price: 330, kcal: 270, sweetness: 3, richness: 2, category: 'fruit', note: 'ブルーベリー × 果実感', description: 'Deep purple blueberry glaze with berry crumbs; fruity, gently tart and colorful.', index: 7 },
  { id: 'matcha', name: '抹茶の余白', en: 'Matcha moment', price: 320, kcal: 240, sweetness: 1, richness: 3, category: 'bitter', note: '宇治抹茶 × ほろ苦い', description: 'Deep green matcha glaze; bittersweet tea aroma, very low sweetness, calm adult flavor.', index: 8 },
  { id: 'coconut', name: 'ココナッツ・クラウド', en: 'Coconut cloud', price: 310, kcal: 285, sweetness: 3, richness: 3, category: 'nuts', note: 'ココナッツ × ふんわり', description: 'White coconut flakes; fragrant, soft, tropical, moderately sweet.', index: 9 },
  { id: 'custard', name: 'カスタードの休日', en: 'Custard Sunday', price: 360, kcal: 365, sweetness: 5, richness: 5, category: 'sweet', note: 'カスタード × とろり', description: 'Sugar-coated bombolone stuffed with vanilla custard; very sweet, creamy, indulgent, high calorie.', index: 10 },
  { id: 'chococream', name: 'ショコラ・メルト', en: 'Chocolate melt', price: 380, kcal: 390, sweetness: 5, richness: 5, category: 'chocolate', note: 'チョコクリーム × 濃厚', description: 'Cocoa bombolone filled with sweet chocolate cream; deeply rich and very sweet, highest calorie.', index: 11 },
  { id: 'caramel', name: 'キャラメル・リボン', en: 'Caramel ribbon', price: 340, kcal: 340, sweetness: 5, richness: 4, category: 'sweet', note: 'キャラメル × ごほうび', description: 'Caramel glaze and caramel drizzle; buttery, very sweet indulgent treat.', index: 12 },
  { id: 'maple', name: 'メープルの森', en: 'Maple woods', price: 350, kcal: 320, sweetness: 4, richness: 4, category: 'nuts', note: 'メープル × くるみ', description: 'Maple glaze topped with walnuts; sweet, nutty, cozy and rich.', index: 13 },
  { id: 'mango', name: 'マンゴー・バカンス', en: 'Mango vacation', price: 330, kcal: 265, sweetness: 4, richness: 2, category: 'fruit', note: 'マンゴー × トロピカル', description: 'Vivid orange mango glaze with fruit pieces; tropical, fruity, sweet, cheerful.', index: 14 },
  { id: 'plain', name: 'まいにちプレーン', en: 'Everyday plain', price: 190, kcal: 148, sweetness: 1, richness: 1, category: 'light', note: '焼きドーナツ × 素朴', description: 'Small plain baked ring without glaze; least sweet, lowest calorie and lowest price.', index: 15 },
  { id: 'oat', name: 'オーツの朝', en: 'Oat morning', price: 230, kcal: 168, sweetness: 1, richness: 1, category: 'light', note: '全粒粉 × オーツ', description: 'Whole wheat baked ring with oat flakes; low calorie, low sweetness, rustic and mildly nutty.', index: 16 },
  { id: 'yogurt', name: 'いちごヨーグルト', en: 'Strawberry yogurt', price: 280, kcal: 182, sweetness: 2, richness: 1, category: 'light', note: 'ヨーグルト × 軽やか', description: 'Small baked ring with thin pale pink strawberry yogurt glaze; light, low calorie and gently sweet-tart.', index: 17 },
  { id: 'sesame', name: '黒ごまララバイ', en: 'Sesame lullaby', price: 290, kcal: 255, sweetness: 2, richness: 3, category: 'nuts', note: '黒ごま × 香ばしい', description: 'Gray glaze with black sesame seeds; nutty roasted aroma, understated sweetness and calm appearance.', index: 18 },
  { id: 'espresso', name: 'エスプレッソ・ブレイク', en: 'Espresso break', price: 300, kcal: 230, sweetness: 1, richness: 3, category: 'bitter', note: 'コーヒー × ほろ苦い', description: 'Coffee glaze dusted with cocoa; roasted espresso bitterness, low sweetness, adult flavor.', index: 19 },
] as const;
export const attributeLabels = {
  acidity: '酸味', bitterness: '苦味', roastiness: '香ばしさ', fruitiness: '果実感',
  crispness: 'さっくり感', chewiness: 'もちもち感', fluffiness: 'ふんわり感', creaminess: 'クリーム感',
  colorfulness: '彩り', messiness: 'こぼれやすさ',
} as const;
export type Attribute = keyof typeof attributeLabels;
export type ProductProfile = Record<Attribute, number> & { portionGrams: number; method: 'baked' | 'fried' };
// このPOCの架空の商品設定。強度は1〜5、重量はg。実測の栄養・物性データではない。
const profiles: Record<typeof baseDonuts[number]['id'], ProductProfile> = {
  honey:     { acidity:1, bitterness:1, roastiness:1, fruitiness:1, crispness:1, chewiness:5, fluffiness:4, creaminess:1, colorfulness:1, messiness:2, portionGrams:65, method:'fried' },
  berry:     { acidity:4, bitterness:1, roastiness:1, fruitiness:5, crispness:1, chewiness:4, fluffiness:4, creaminess:1, colorfulness:4, messiness:2, portionGrams:70, method:'fried' },
  cacao:     { acidity:1, bitterness:5, roastiness:4, fruitiness:1, crispness:3, chewiness:2, fluffiness:3, creaminess:2, colorfulness:1, messiness:4, portionGrams:78, method:'fried' },
  pistachio: { acidity:1, bitterness:2, roastiness:5, fruitiness:1, crispness:4, chewiness:2, fluffiness:3, creaminess:2, colorfulness:3, messiness:4, portionGrams:76, method:'fried' },
  confetti:  { acidity:1, bitterness:1, roastiness:1, fruitiness:1, crispness:2, chewiness:3, fluffiness:4, creaminess:2, colorfulness:5, messiness:4, portionGrams:72, method:'fried' },
  cinnamon:  { acidity:1, bitterness:1, roastiness:3, fruitiness:1, crispness:5, chewiness:1, fluffiness:2, creaminess:1, colorfulness:1, messiness:4, portionGrams:60, method:'fried' },
  lemon:     { acidity:5, bitterness:1, roastiness:1, fruitiness:5, crispness:1, chewiness:3, fluffiness:4, creaminess:1, colorfulness:4, messiness:2, portionGrams:58, method:'fried' },
  blueberry: { acidity:4, bitterness:1, roastiness:1, fruitiness:5, crispness:1, chewiness:4, fluffiness:4, creaminess:1, colorfulness:4, messiness:3, portionGrams:68, method:'fried' },
  matcha:    { acidity:1, bitterness:5, roastiness:3, fruitiness:1, crispness:1, chewiness:5, fluffiness:3, creaminess:1, colorfulness:2, messiness:3, portionGrams:60, method:'fried' },
  coconut:   { acidity:1, bitterness:1, roastiness:4, fruitiness:1, crispness:3, chewiness:2, fluffiness:5, creaminess:2, colorfulness:1, messiness:5, portionGrams:65, method:'fried' },
  custard:   { acidity:1, bitterness:1, roastiness:1, fruitiness:1, crispness:1, chewiness:2, fluffiness:5, creaminess:5, colorfulness:1, messiness:5, portionGrams:100, method:'fried' },
  chococream:{ acidity:1, bitterness:2, roastiness:3, fruitiness:1, crispness:1, chewiness:2, fluffiness:5, creaminess:5, colorfulness:1, messiness:5, portionGrams:105, method:'fried' },
  caramel:   { acidity:1, bitterness:2, roastiness:4, fruitiness:1, crispness:1, chewiness:4, fluffiness:3, creaminess:3, colorfulness:2, messiness:3, portionGrams:82, method:'fried' },
  maple:     { acidity:1, bitterness:1, roastiness:5, fruitiness:1, crispness:4, chewiness:2, fluffiness:3, creaminess:1, colorfulness:1, messiness:4, portionGrams:80, method:'fried' },
  mango:     { acidity:3, bitterness:1, roastiness:1, fruitiness:5, crispness:1, chewiness:3, fluffiness:4, creaminess:1, colorfulness:5, messiness:3, portionGrams:68, method:'fried' },
  plain:     { acidity:1, bitterness:1, roastiness:2, fruitiness:1, crispness:2, chewiness:2, fluffiness:4, creaminess:1, colorfulness:1, messiness:1, portionGrams:40, method:'baked' },
  oat:       { acidity:1, bitterness:1, roastiness:4, fruitiness:1, crispness:4, chewiness:2, fluffiness:2, creaminess:1, colorfulness:1, messiness:3, portionGrams:45, method:'baked' },
  yogurt:    { acidity:4, bitterness:1, roastiness:1, fruitiness:4, crispness:1, chewiness:3, fluffiness:5, creaminess:2, colorfulness:3, messiness:1, portionGrams:45, method:'baked' },
  sesame:    { acidity:1, bitterness:2, roastiness:5, fruitiness:1, crispness:2, chewiness:5, fluffiness:2, creaminess:1, colorfulness:1, messiness:3, portionGrams:65, method:'fried' },
  espresso:  { acidity:2, bitterness:5, roastiness:5, fruitiness:1, crispness:2, chewiness:2, fluffiness:3, creaminess:1, colorfulness:1, messiness:2, portionGrams:58, method:'fried' },
};
export const donuts = baseDonuts.map(d => ({ ...d, ...profiles[d.id] }));
export type Donut = typeof donuts[number];
export type DonutId = Donut['id'];
export const findDonut = (id: DonutId) => donuts.find(d => d.id === id)!;
export const moods = {
  sweet: { label: '甘いごほうび', criterion: 'Seeking strong sweetness and indulgent creamy treats (sweetness 4-5), not simply all donuts.', face: 1, line: '今日は、とびきり甘いごほうびの気分？', detail: 'クリームやキャラメルの濃厚な子たちも、見てみて。' },
  light: { label: '軽めが気になる', criterion: 'Comparing genuinely low-calorie products (under 200 kcal) or explicitly asking for fewer calories. Low sweetness alone is NOT evidence of low-calorie intent.', face: 2, line: '軽めのおやつも、気になっているのかな？', detail: '焼きドーナツなら、軽やかな3種類もありますよ。' },
  bitter: { label: 'ほろ苦い味', criterion: 'Seeking low sweetness and bitter matcha, espresso or dark cocoa; this is independent of calories.', face: 3, line: '甘さより、ほろ苦い余韻がお好み？', detail: '抹茶やカカオ、コーヒーの香りを楽しむのもいいですね。' },
  fruity: { label: '果実のさわやかさ', criterion: 'Seeking fruity, tart, refreshing berry, lemon or mango flavors.', face: 4, line: '果実のさわやかさに、惹かれている？', detail: '甘酸っぱいベリーも、すっきりレモンもお似合いかも。' },
  nutty: { label: 'ナッツとごま', criterion: 'Repeated interest in nuts, coconut, sesame or roasted aromas, rather than bright fruit or sugar.', face: 3, line: '香ばしいもの、つい気になりますよね。', detail: 'ナッツやごまの香りがするドーナツを集めてみました。' },
  playful: { label: '見た目も楽しく', criterion: 'Comparing colorful playful decorations across different flavors (sprinkles, vivid pink, purple, yellow). One color alone is weak evidence.', face: 4, line: '見ているだけで楽しい子たち、集めようか。', detail: '色も味もいろいろ。いつもと違うひとつはいかが？' },
  comfort: { label: 'いつもの安心感', criterion: 'Seeking familiar simple classic honey, cinnamon or plain flavors rather than novel decorated treats.', face: 0, line: 'いつもの味で、ほっとひと息つきたい？', detail: '飾らない甘さって、なんだか落ち着きますよね。' },
  budget: { label: 'お手頃がうれしい', criterion: 'Explicit budget preference or consistently comparing the cheapest items (price 250 yen or less). Price preference is tentative from browsing alone.', face: 2, line: '気軽に楽しめる、お手頃な子もいますよ。', detail: 'ちょっとしたおやつにぴったりなものを選んでみました。' },
  crispy: { label: 'さっくり食感', criterion: 'Seeking crispness >= 4, including crisp dough or crunchy nut/oat toppings. Do not confuse chewiness with crispness.', face: 4, line: 'さくっとした食感、気になりますか？', detail: '生地もトッピングも、歯ざわりを楽しめる子を探しましょう。' },
  chewy: { label: 'もちもち食感', criterion: 'Seeking chewiness >= 4, a springy chewy bite; separate from fluffy softness.', face: 1, line: 'もっちりしたひと口が、気になる？', detail: 'はちみつや抹茶、黒ごまにも、もちもちの子がいますよ。' },
  fluffy: { label: 'ふんわり食感', criterion: 'Seeking fluffiness >= 4: soft airy dough, not necessarily low-calorie or chewy.', face: 0, line: 'ふんわり、やわらかいものはいかが？', detail: '軽い口あたりとカロリーは別。食感の好みから選びましょう。' },
  creamy: { label: 'とろけるクリーム', criterion: 'Seeking creaminess >= 4, rich filled custard or chocolate cream. Sweet glaze alone does not count.', face: 1, line: '中のクリームまで、楽しみたい気分？', detail: 'とろりとしたカスタードとショコラを、見比べてみて。' },
  tangy: { label: 'きゅっと酸っぱい', criterion: 'Seeking acidity >= 4. Fruit aroma and vivid color alone do not imply sourness.', face: 4, line: 'きゅっと甘酸っぱいのも、いいですよね。', detail: 'レモン、ベリー、ヨーグルト。酸味のある子を集めました。' },
  roasted: { label: '深い焙煎の香り', criterion: 'Seeking roastiness >= 4 across cocoa, coffee, sesame or nuts. Aroma does not imply caffeine or low calories.', face: 3, line: '深い香ばしさに、惹かれている？', detail: 'コーヒーやカカオ、ナッツの香りで選ぶのも楽しそう。' },
  small: { label: '小腹にちょうどいい', criterion: 'Seeking a small physical portion, portionGrams <= 50. Portion size and calories are different attributes.', face: 2, line: '小腹にちょうどいい、小さめの子はいかが？', detail: 'サイズで選ぶなら、40〜45gの焼きドーナツもあります。' },
  hearty: { label: 'しっかり満足', criterion: 'Seeking portionGrams >= 80 and richness >= 4: a large substantial indulgent portion. Do not infer actual hunger.', face: 1, line: '今日は、しっかり楽しみたい気分？', detail: '大きめサイズに濃厚な味わい。満足感のある子をどうぞ。' },
  tidy: { label: '手軽に食べたい', criterion: 'Seeking messiness <= 2: little loose topping or exposed filling, convenient to eat. Infer context such as work only from explicit note.', face: 2, line: 'ぽろぽろしにくい子も、いますよ。', detail: 'トッピングやクリームがこぼれにくいものを選んでみました。' },
  baked: { label: '焼きドーナツ派', criterion: 'Seeking method=baked rather than fried. This is preparation preference; do not invent dietary restrictions or health benefits.', face: 0, line: '焼きドーナツも、気になっている？', detail: '揚げた生地とは違う、素朴な味わいを楽しんでみて。' },
} as const;
export type Mood = keyof typeof moods;
export const moodKeys = Object.keys(moods) as Mood[];
export const filters = [
  { id: 'all', label: 'すべて', includes: (_: Donut) => true },
  { id: 'sweet', label: '甘くて濃厚', includes: (d: Donut) => d.sweetness >= 4 },
  { id: 'light', label: '200 kcal 未満', includes: (d: Donut) => d.kcal < 200 },
  { id: 'bitter', label: '甘さひかえめ', includes: (d: Donut) => d.sweetness <= 2 },
  { id: 'fruit', label: 'フルーティ', includes: (d: Donut) => d.category === 'fruit' },
] as const;
export type Filter = typeof filters[number]['id'];

export const moodRules: Record<Mood, { label: string; matches: (d: Donut) => boolean }> = {
  sweet: { label: '甘さ4以上', matches: d => d.sweetness >= 4 },
  light: { label: '200kcal未満', matches: d => d.kcal < 200 },
  bitter: { label: '苦味4以上・甘さ2以下', matches: d => d.bitterness >= 4 && d.sweetness <= 2 },
  fruity: { label: '果実感4以上', matches: d => d.fruitiness >= 4 },
  nutty: { label: 'ナッツ系・香ばしさ4以上', matches: d => d.category === 'nuts' && d.roastiness >= 4 },
  playful: { label: '彩り4以上', matches: d => d.colorfulness >= 4 },
  comfort: { label: '定番系またはプレーン', matches: d => d.category === 'classic' || d.id === 'plain' },
  budget: { label: '250円以下', matches: d => d.price <= 250 },
  crispy: { label: 'さっくり感4以上', matches: d => d.crispness >= 4 },
  chewy: { label: 'もちもち感4以上', matches: d => d.chewiness >= 4 },
  fluffy: { label: 'ふんわり感4以上', matches: d => d.fluffiness >= 4 },
  creamy: { label: 'クリーム感4以上', matches: d => d.creaminess >= 4 },
  tangy: { label: '酸味4以上', matches: d => d.acidity >= 4 },
  roasted: { label: '香ばしさ4以上', matches: d => d.roastiness >= 4 },
  small: { label: '50g以下', matches: d => d.portionGrams <= 50 },
  hearty: { label: '80g以上・濃厚さ4以上', matches: d => d.portionGrams >= 80 && d.richness >= 4 },
  tidy: { label: 'こぼれやすさ2以下', matches: d => d.messiness <= 2 },
  baked: { label: '焼き製法', matches: d => d.method === 'baked' },
};
