import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // 1. Create Company
    const [company] = await db.insert(schema.companies).values({
      name: 'Brewflow Coffee',
      contactEmail: 'hello@brewflow.com',
    }).returning();
    console.log('✅ Company created:', company.name);

    // 2. Create Branch
    const [branch] = await db.insert(schema.branches).values({
      companyId: company.id,
      branchName: 'Main Street Branch',
      address: '123 Brew Lane',
      isActive: true,
    }).returning();
    console.log('✅ Branch created:', branch.branchName);

    // 3. Create Categories
    const categoriesData = [
      { name: 'Coffee', type: 'drink' },
      { name: 'Tea', type: 'drink' },
      { name: 'Pastries', type: 'snack' },
    ];
    
    const categories = await db.insert(schema.categories).values(
      categoriesData.map(c => ({ ...c, companyId: company.id }))
    ).returning();
    console.log(`✅ ${categories.length} Categories created`);

    const coffeeCat = categories.find(c => c.name === 'Coffee')!;
    const teaCat = categories.find(c => c.name === 'Tea')!;
    const pastriesCat = categories.find(c => c.name === 'Pastries')!;

    // 4. Create Modifier Groups
    const modGroupsData = [
      { name: 'Size' },
      { name: 'Milk' },
      { name: 'Syrup' },
    ];

    const modGroups = await db.insert(schema.modifierGroups).values(
      modGroupsData.map(g => ({ ...g, companyId: company.id }))
    ).returning();
    console.log(`✅ ${modGroups.length} Modifier Groups created`);

    const sizeGroup = modGroups.find(g => g.name === 'Size')!;
    const milkGroup = modGroups.find(g => g.name === 'Milk')!;

    // 5. Create Modifier Options
    await db.insert(schema.modifierOptions).values([
      { modifierGroupId: sizeGroup.id, name: 'Small' },
      { modifierGroupId: sizeGroup.id, name: 'Medium' },
      { modifierGroupId: sizeGroup.id, name: 'Large' },
      { modifierGroupId: milkGroup.id, name: 'Whole Milk' },
      { modifierGroupId: milkGroup.id, name: 'Oat Milk' },
      { modifierGroupId: milkGroup.id, name: 'Almond Milk' },
    ]);
    console.log('✅ Modifier Options created');

    // 6. Create Products
    const productsData = [
      { name: 'Espresso', basePrice: '3.00', categoryId: coffeeCat.id },
      { name: 'Latte', basePrice: '4.50', categoryId: coffeeCat.id },
      { name: 'Cappuccino', basePrice: '4.50', categoryId: coffeeCat.id },
      { name: 'Green Tea', basePrice: '3.50', categoryId: teaCat.id },
      { name: 'Taro Milk Tea', basePrice: '4.50', categoryId: teaCat.id },
      { name: 'Bottled Water', basePrice: '1.50', categoryId: teaCat.id },
      { name: 'Croissant', basePrice: '3.75', categoryId: pastriesCat.id, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f40388085?auto=format&fit=crop&w=800&q=80' },
      { name: 'Blueberry Muffin', basePrice: '3.25', categoryId: pastriesCat.id },
    ];

    const products = await db.insert(schema.products).values(productsData.map(p => ({
        ...p,
        basePrice: p.basePrice, // Ensure string for decimal
    }))).returning();
    console.log(`✅ ${products.length} Products created`);

    // 7. Link Products to Branch (Availability)
    await db.insert(schema.branchProductAvailability).values(
      products.map(p => ({
        branchId: branch.id,
        productId: p.id,
        isInStock: true,
      }))
    );
    console.log('✅ Products linked to Branch');

    // 8. Link Modifiers to Products (Coffee gets Size & Milk)
    const coffeeProducts = products.filter(p => [coffeeCat.id].includes(p.categoryId));
    
    const productModLinks = [];
    for (const prod of coffeeProducts) {
      productModLinks.push({ productId: prod.id, modifierGroupId: sizeGroup.id });
      productModLinks.push({ productId: prod.id, modifierGroupId: milkGroup.id });
    }

    if (productModLinks.length > 0) {
        await db.insert(schema.productModifierLinks).values(productModLinks);
        console.log('✅ Modifiers linked to Products');
    }

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
