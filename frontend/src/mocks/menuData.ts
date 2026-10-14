import type { PublicMenu } from '@/types/menu';
/**
 * TEMPORARY local menu data, transcribed exactly from the approved 23-page menu PDF
 * (names, spellings, prices and descriptions unchanged; verified 13 Oct 2026).
 *
 * - description: null = pending wording from the owner (Lemonade, Delster, Tiramisu,
 *   Lemon & Mint Shisha). Nothing is invented.
 * - imageUrl: null for every item — the owner uploads real photos via the Admin Dashboard.
 * - isFeatured: false for every item — the owner chooses featured items later.
 * - options: empty — flavor wording stays inside the PDF descriptions.
 *
 * Replaced by GET /api/v1/menu once the Laravel API is connected.
 */
export const mockMenu: PublicMenu = {
  categories: [
    {
      id: 1,
      name: "Smoothies",
      slug: "smoothies",
      displayOrder: 1,
      items: [
        { id: 1, categoryId: 1, name: "Strawberry Smoothie", slug: "strawberry-smoothie", description: "Strawberry smoothie topped with fresh fruit, perfect for a healthy lifestyle.", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 2, categoryId: 1, name: "Mango Smoothie", slug: "mango-smoothie", description: "A refreshing glass of mango Smoothie .", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 3, categoryId: 1, name: "Mixed Berry Smoothie", slug: "mixed-berry-smoothie", description: "Mixed berry smoothie with fresh mint and berries, perfect for a summer refreshment.", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 4, categoryId: 1, name: "Passion Smoothie", slug: "passion-smoothie", description: "A refreshing glass of Passion Smoothie .", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 5, categoryId: 1, name: "Mojito", slug: "mojito", description: "Choose Your Flavor .", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
        { id: 6, categoryId: 1, name: "Tropical Smoothie", slug: "tropical-smoothie", description: "Tropical smoothie with fresh fruits, perfect for a summer refreshment.", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 6, options: [] },
      ],
    },
    {
      id: 2,
      name: "Hot Drinks",
      slug: "hot-drinks",
      displayOrder: 2,
      items: [
        { id: 7, categoryId: 2, name: "Tea", slug: "tea", description: "Experience authentic Turkish tea", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 8, categoryId: 2, name: "Espresso", slug: "espresso", description: "Fresh espresso Served With Love", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 9, categoryId: 2, name: "Hot Chocolate", slug: "hot-chocolate", description: "Taste The Real Chocolate .", price: "1.75", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 10, categoryId: 2, name: "Cappucino", slug: "cappucino", description: "Warm cappuccino .", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 11, categoryId: 2, name: "Coffee Latte", slug: "coffee-latte", description: "Taste The Best Flavors (Caramel,Mocha,Hazelnut)", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
        { id: 12, categoryId: 2, name: "Nesquick", slug: "nesquick", description: "Warm Cup Of Special Nesquik.", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 6, options: [] },
        { id: 13, categoryId: 2, name: "Nescafe", slug: "nescafe", description: "Warm Nescafe.", price: "1.75", imageUrl: null, isFeatured: false, displayOrder: 7, options: [] },
        { id: 14, categoryId: 2, name: "Tea Pot", slug: "tea-pot", description: "2 People.", price: "3.00", imageUrl: null, isFeatured: false, displayOrder: 8, options: [] },
        { id: 15, categoryId: 2, name: "Tea Pot", slug: "tea-pot-2", description: "4 People.", price: "4.50", imageUrl: null, isFeatured: false, displayOrder: 9, options: [] },
        { id: 16, categoryId: 2, name: "Arabic Coffee Pot", slug: "arabic-coffee-pot", description: "2 People.", price: "2.50", imageUrl: null, isFeatured: false, displayOrder: 10, options: [] },
        { id: 17, categoryId: 2, name: "Arabic Coffee Pot", slug: "arabic-coffee-pot-2", description: "4 People.", price: "4.00", imageUrl: null, isFeatured: false, displayOrder: 11, options: [] },
      ],
    },
    {
      id: 3,
      name: "Cold Drinks",
      slug: "cold-drinks",
      displayOrder: 3,
      items: [
        { id: 18, categoryId: 3, name: "Iced Coffee", slug: "iced-coffee", description: "Refreshing iced coffee with your choice of flavor (Caramel,Mocha,Hazelnut).", price: "5.00", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 19, categoryId: 3, name: "Carrot", slug: "carrot", description: "Fresh carrot juice, naturally sweet and refreshing.", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 20, categoryId: 3, name: "Lemonade", slug: "lemonade", description: null, price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 21, categoryId: 3, name: "Fresh Fruit Blends", slug: "fresh-fruit-blends", description: "Fresh, fruity, and bursting with tropical flavor. (Mango,Cocktail,Strawberry).", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 22, categoryId: 3, name: "Orange", slug: "orange", description: "Fresh Orange juice, naturally sweet and refreshing.", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
        { id: 23, categoryId: 3, name: "Waterrmelon Lemonade", slug: "waterrmelon-lemonade", description: "Fresh watermelon and zesty lemonade, perfectly refreshing.", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 6, options: [] },
        { id: 24, categoryId: 3, name: "Passion Berries", slug: "passion-berries", description: "A refreshing blend of passion fruit and sweet berries.", price: "4.50", imageUrl: null, isFeatured: false, displayOrder: 7, options: [] },
        { id: 25, categoryId: 3, name: "Iced Tea", slug: "iced-tea", description: "Refreshing iced tea with a smooth, fruity twist.", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 8, options: [] },
        { id: 26, categoryId: 3, name: "Passion Berries Ice Tea", slug: "passion-berries-ice-tea", description: "Refreshing iced tea with a sweet passion fruit and berry twist.", price: "4.00", imageUrl: null, isFeatured: false, displayOrder: 9, options: [] },
      ],
    },
    {
      id: 4,
      name: "Beverages",
      slug: "beverages",
      displayOrder: 4,
      items: [
        { id: 27, categoryId: 4, name: "Freeze", slug: "freeze", description: "Refreshing Drink With Flavors.", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 28, categoryId: 4, name: "Dark Blue", slug: "dark-blue", description: "Iced Energy Drink .", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 29, categoryId: 4, name: "Boom Boom", slug: "boom-boom", description: "Iced Energy Drink .", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 30, categoryId: 4, name: "Extra Juice", slug: "extra-juice", description: "Refreshing Fruits Drink.", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 31, categoryId: 4, name: "Cola", slug: "cola", description: "Pepsi,7UP,Miranda.", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
        { id: 32, categoryId: 4, name: "Sparkling Water", slug: "sparkling-water", description: "Rim Sparkling Water .", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 6, options: [] },
        { id: 33, categoryId: 4, name: "Delster", slug: "delster", description: null, price: "2.00", imageUrl: null, isFeatured: false, displayOrder: 7, options: [] },
        { id: 34, categoryId: 4, name: "Large Water", slug: "large-water", description: "Large Bottle .", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 8, options: [] },
        { id: 35, categoryId: 4, name: "Small Water", slug: "small-water", description: "Small Bottle .", price: "0.50", imageUrl: null, isFeatured: false, displayOrder: 9, options: [] },
      ],
    },
    {
      id: 5,
      name: "Milkshakes",
      slug: "milkshakes",
      displayOrder: 5,
      items: [
        { id: 36, categoryId: 5, name: "Caramel Milkshake", slug: "caramel-milkshake", description: "A rich, cold, and sweet blend of vanilla ice cream, milk, and caramel sauce, topped with whipped cream.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 37, categoryId: 5, name: "Chocolate Milkshake", slug: "chocolate-milkshake", description: "A rich, velvety blend of milk, vanilla or chocolate ice cream, and deep cocoa syrup, topped with whipped cream.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 38, categoryId: 5, name: "Strawberry Milkshake", slug: "strawberry-milkshake", description: "A classic, sweet, and fruity treat made with fresh strawberries or strawberry syrup blended into creamy vanilla ice cream and milk.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 39, categoryId: 5, name: "Kinder Milkshake", slug: "kinder-milkshake", description: "A smooth, milky, and ultra-sweet shake inspired by Kinder chocolate, featuring a rich blend of milk chocolate, hazelnut cream, and a milky white chocolate drizzle.", price: "6.00", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 40, categoryId: 5, name: "Mix Berries Milkshake", slug: "mix-berries-milkshake", description: "A vibrant, refreshing, and tangy-sweet shake made by blending cold milk and ice cream with a tart assortment of strawberries, blueberries, and raspberries.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
        { id: 41, categoryId: 5, name: "Nutella Milkshake", slug: "nutella-milkshake", description: "A thick, decadent shake combining chocolate ice cream, milk, and a generous scoop of hazelnut Nutella spread.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 6, options: [] },
        { id: 42, categoryId: 5, name: "Lotus Milkshake", slug: "lotus-milkshake", description: "A creamy, spiced milkshake blended with crushed Lotus Biscoff cookies and cookie butter spread for a distinct caramelized-cinnamon kick.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 7, options: [] },
        { id: 43, categoryId: 5, name: "Musk & Amber Milkshake", slug: "musk-amber-milkshake", description: "Creamy, aromatic, and irresistibly rich — a perfect blend of musk, amber & mastic.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 8, options: [] },
      ],
    },
    {
      id: 6,
      name: "Chips/Treats",
      slug: "chips-treats",
      displayOrder: 6,
      items: [
        { id: 44, categoryId: 6, name: "Chips", slug: "chips", description: "Medium Dolsi.", price: "0.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 45, categoryId: 6, name: "Pringles", slug: "pringles", description: "Small Pringles.", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 46, categoryId: 6, name: "Mars", slug: "mars", description: "Chocolate Bar.", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 47, categoryId: 6, name: "Snickers", slug: "snickers", description: "Chocolate Bar.", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 48, categoryId: 6, name: "Twix", slug: "twix", description: "Chocolate Bar.", price: "1.00", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
      ],
    },
    {
      id: 7,
      name: "Dessert",
      slug: "dessert",
      displayOrder: 7,
      items: [
        { id: 49, categoryId: 7, name: "Cheesecake", slug: "cheesecake", description: "Creamy, smooth cheesecake with a rich and delicious flavor (Strawberry Mango/lotus).", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 50, categoryId: 7, name: "Mini Tart", slug: "mini-tart", description: "Delicate mini tarts with a sweet, delicious filling.", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 51, categoryId: 7, name: "Tiramisu", slug: "tiramisu", description: null, price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
      ],
    },
    {
      id: 8,
      name: "Sajj",
      slug: "sajj",
      displayOrder: 8,
      items: [
        { id: 52, categoryId: 8, name: "Cocktail", slug: "cocktail", description: "A flavorful mix of cheese, zaatar, and fresh toppings.", price: "1.75", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 53, categoryId: 8, name: "Jebneh", slug: "jebneh", description: "Warm saj topped with delicious melted cheese.", price: "2.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 54, categoryId: 8, name: "Keshek", slug: "keshek", description: "Traditional saj topped with rich and tangy kishk.", price: "3.00", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 55, categoryId: 8, name: "Nutella", slug: "nutella", description: "Warm saj filled with smooth and creamy Nutella.", price: "3.00", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
        { id: 56, categoryId: 8, name: "Zaatar", slug: "zaatar", description: "Classic saj topped with aromatic zaatar.", price: "1.50", imageUrl: null, isFeatured: false, displayOrder: 5, options: [] },
      ],
    },
    {
      id: 9,
      name: "Shisha",
      slug: "shisha",
      displayOrder: 9,
      items: [
        { id: 57, categoryId: 9, name: "Lemon & Mint Shisha", slug: "lemon-mint-shisha", description: null, price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 1, options: [] },
        { id: 58, categoryId: 9, name: "Nakhleh Two Apples Shisha", slug: "nakhleh-two-apples-shisha", description: "A stylish hookah with a Special Two Apples Flavor, Served With Love.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 2, options: [] },
        { id: 59, categoryId: 9, name: "Grape Shisha", slug: "grape-shisha", description: "A stylish hookah with a Special Grape Flavor, Served With Love.", price: "5.50", imageUrl: null, isFeatured: false, displayOrder: 3, options: [] },
        { id: 60, categoryId: 9, name: "Charcoal Service", slug: "charcoal-service", description: "Hookah Columbia charcoal ,", price: "3.50", imageUrl: null, isFeatured: false, displayOrder: 4, options: [] },
      ],
    },
  ],
};
