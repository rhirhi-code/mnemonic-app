import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types';
import { listCategories, getCategoryById, getCategoryByName } from '@/db/categories';

export function useCategories() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories(db).then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, [db]);

  const findById = useCallback((id: number) => getCategoryById(db, id), [db]);
  const findByName = useCallback((name: string) => getCategoryByName(db, name), [db]);

  return { categories, loading, findById, findByName };
}
