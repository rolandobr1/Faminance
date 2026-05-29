import { collection, getDocs, writeBatch, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { defaultCategories } from '@/lib/data';
import type { Category } from '@/lib/types';

export async function seedDefaultCategories(familyId: string) {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, where("familyId", "==", familyId));
    const snapshot = await getDocs(q);

    const existingCategories = snapshot.docs.map(doc => doc.data() as Omit<Category, 'id'>);
    const existingCategoryValues = new Set(existingCategories.map(c => c.value));

    const missingCategories = defaultCategories.filter(
        defaultCat => !existingCategoryValues.has(defaultCat.value)
    );

    if (missingCategories.length > 0) {
        console.log(`Found ${missingCategories.length} missing categories for family ${familyId}. Seeding...`);
        const batch = writeBatch(db);

        missingCategories.forEach(categoryData => {
            const docRef = doc(categoriesRef); // Create a new doc with a random ID
            const dataWithFamily = {
                ...categoryData,
                familyId: familyId,
            };
            batch.set(docRef, dataWithFamily);
        });

        await batch.commit();
        console.log('Missing default categories seeded successfully.');
    } else {
        // console.log(`All default categories already exist for family ${familyId}. No seeding needed.`);
    }
}
