import 'dotenv/config';
import { db } from '@/lib/db';
import { tables, categories, products } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Seeding database with Drizzle...');

  // 1. Create Table
  // Check if exists first to avoid unique constraint error
  const existingTable = await db.query.tables.findFirst({
    where: eq(tables.qrCode, 'table-1')
  });

  if (!existingTable) {
    await db.insert(tables).values({
      name: 'Table 1',
      qrCode: 'table-1',
    });
    console.log('Created Table 1');
  }

  // 2. Create Categories
  const categoryData = [
    { name: 'Milk Tea', type: 'drink' },
    { name: 'Tea', type: 'drink' },
    { name: 'Smoothies', type: 'drink' },
    { name: 'Iced Coffee', type: 'drink' },
    { name: 'Pasta', type: 'snack' },
    { name: 'Pastry', type: 'snack' },
  ];

  const cats = [];
  for (const cat of categoryData) {
    // Check existence by name roughly
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, cat.name)
    });
    
    if (!existing) {
      const [newCat] = await db.insert(categories).values(cat).returning();
      cats.push(newCat);
    } else {
      // Update type if needed (optional, but good for sync)
      await db.update(categories).set({ type: cat.type }).where(eq(categories.id, existing.id));
      cats.push(existing);
    }
  }
  console.log('Categories synced');

  // 3. Create Products
  const milkTeaCat = cats.find(c => c.name === 'Milk Tea');
  const teaCat = cats.find(c => c.name === 'Tea');
  const pastaCat = cats.find(c => c.name === 'Pasta');

  if (milkTeaCat) {
    const existingP = await db.query.products.findFirst({
      where: eq(products.name, 'Thai Milk Tea')
    });
    if (!existingP) {
      await db.insert(products).values({
        name: 'Thai Milk Tea',
        price: '175.00',
        description: 'Classic Thai milk tea.',
        image: '/images/menu-items/thai-tea.png', // Assuming user added
        isSignature: true,
        categoryId: milkTeaCat.id,
      });
    }
  }

  if (teaCat) {
    const existingP = await db.query.products.findFirst({
      where: eq(products.name, 'Hot Lemon Tea')
    });
    if (!existingP) {
      await db.insert(products).values({
        name: 'Hot Lemon Tea',
        price: '120.00',
        description: 'Hot refreshing tea.',
        image: '/images/menu-items/lemon-tea.png',
        categoryId: teaCat.id,
      });
    }
  }


  if (pastaCat) {
    const existingP = await db.query.products.findFirst({
      where: eq(products.name, 'Spaghetti')
    });
    if (!existingP) {
      await db.insert(products).values({
        name: 'Spaghetti',
        price: '150.75',
        description: 'Classic tomato spaghetti.',
        image: '/images/menu-items/spaghetti.png',
        isSignature: true, 
        categoryId: pastaCat.id,
      });
    }

    const existingMac = await db.query.products.findFirst({
      where: eq(products.name, 'Macaroni')
    });
    if (!existingMac) {
      await db.insert(products).values({
        name: 'Macaroni',
        price: '145.00',
        description: 'Creamy macaroni pasta.',
        image: '/images/menu-items/macaroni.png',
        categoryId: pastaCat.id,
      });
    }
  }

  const pastryCat = cats.find(c => c.name === 'Pastry');
  if (pastryCat) {
    const existingCroissant = await db.query.products.findFirst({
      where: eq(products.name, 'Croissant')
    });
    if (!existingCroissant) {
      await db.insert(products).values({
        name: 'Croissant',
        price: '95.00',
        description: 'Buttery flaky pastry.',
        image: '/images/menu-items/croissant.png',
        categoryId: pastryCat.id,
      });
    }

    const existingSandwich = await db.query.products.findFirst({
      where: eq(products.name, 'Ham and Cheese Sandwich')
    });
    if (!existingSandwich) {
      await db.insert(products).values({
        name: 'Ham and Cheese Sandwich',
        price: '120.00',
        description: 'Classic sandwich with premium ham.',
        image: '/images/menu-items/sandwich.png',
        categoryId: pastryCat.id,
      });
    }
  }

  const icedCoffeeCat = cats.find(c => c.name === 'Iced Coffee');
  if (icedCoffeeCat) {
    const existingP = await db.query.products.findFirst({
      where: eq(products.name, 'Iced Caramel Macchiato')
    });
    if (!existingP) {
      await db.insert(products).values({
        name: 'Iced Caramel Macchiato',
        price: '180.00',
        description: 'Rich espresso with vanilla syrup, milk and caramel drizzle.',
        image: '/placeholder-caramel-macchiato.png',
        isSignature: true,
        categoryId: icedCoffeeCat.id,
      });
    }
  }

  console.log('Seeding finished.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
