'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface MenuGroup {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  active: boolean;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  items: string[]; // MenuItem IDs
  totalPrice: number;
  manualPrice?: number; // Override total price
  active: boolean;
  createdAt: string;
}

// Context Types
interface MenuContextType {
  groups: MenuGroup[];
  items: MenuItem[];
  packages: Package[];
  selectedItems: string[];
  
  // Group actions
  addGroup: (group: Omit<MenuGroup, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, group: Partial<MenuGroup>) => void;
  deleteGroup: (id: string) => void;
  
  // Item actions
  addItem: (item: Omit<MenuItem, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, item: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  
  // Package actions
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt'>) => void;
  updatePackage: (id: string, pkg: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  
  // Selection management
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  setSelectedItems: (items: string[]) => void;
  
  // Calculations
  calculateTotal: (itemIds: string[]) => number;
  getItemsByGroup: (groupId: string) => MenuItem[];
  getPackageItems: (pkg: Package) => MenuItem[];
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Mock Data
const mockGroups: MenuGroup[] = [
  {
    id: '1',
    name: 'Kına',
    description: 'Kına gecesi organizasyon hizmetleri',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    name: 'Düğün',
    description: 'Düğün organizasyon hizmetleri',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '3',
    name: 'Nişan',
    description: 'Nişan organizasyon hizmetleri',
    active: true,
    createdAt: '2025-01-01'
  }
];

const mockItems: MenuItem[] = [
  {
    id: '1',
    groupId: '2',
    name: 'DJ Performansı',
    description: 'Profesyonel DJ hizmeti - 5 saat',
    price: 15000,
    unit: 'Saat',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    groupId: '2',
    name: 'Düğün Pastası',
    description: '3 katlı özel tasarım pasta',
    price: 8000,
    unit: 'Adet',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '3',
    groupId: '2',
    name: 'Çiçek Süsleme',
    description: 'Salon ve masa süslemeleri',
    price: 12000,
    unit: 'Paket',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '4',
    groupId: '1',
    name: 'Kına Organizasyonu',
    description: 'Geleneksel kına organizasyonu',
    price: 10000,
    unit: 'Paket',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '5',
    groupId: '1',
    name: 'Hint Kınası',
    description: 'Profesyonel hint kınası çizimi',
    price: 3000,
    unit: 'Kişi',
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '6',
    groupId: '3',
    name: 'Çiçek Aranjmanı',
    description: 'Nişan çiçek süslemeleri',
    price: 5000,
    unit: 'Paket',
    active: true,
    createdAt: '2025-01-01'
  }
];

const mockPackages: Package[] = [
  {
    id: '1',
    name: 'Ekonomik Düğün Paketi',
    description: 'Temel düğün hizmetleri',
    groupId: '2',
    items: ['1', '2', '3'],
    totalPrice: 35000,
    active: true,
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    name: 'Premium Kına Paketi',
    description: 'Kapsamlı kına organizasyonu',
    groupId: '1',
    items: ['4', '5'],
    totalPrice: 13000,
    active: true,
    createdAt: '2025-01-01'
  }
];

export function MenuProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<MenuGroup[]>(mockGroups);
  const [items, setItems] = useState<MenuItem[]>(mockItems);
  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [selectedItems, setSelectedItemsState] = useState<string[]>([]);

  // Group actions
  const addGroup = (group: Omit<MenuGroup, 'id' | 'createdAt'>) => {
    const newGroup: MenuGroup = {
      ...group,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const updateGroup = (id: string, group: Partial<MenuGroup>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...group } : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  // Item actions
  const addItem = (item: Omit<MenuItem, 'id' | 'createdAt'>) => {
    const newItem: MenuItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, item: Partial<MenuItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Package actions
  const addPackage = (pkg: Omit<Package, 'id' | 'createdAt'>) => {
    const newPackage: Package = {
      ...pkg,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setPackages(prev => [...prev, newPackage]);
  };

  const updatePackage = (id: string, pkg: Partial<Package>) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...pkg } : p));
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  // Selection management
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemsState(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const clearSelection = () => {
    setSelectedItemsState([]);
  };

  const setSelectedItems = (items: string[]) => {
    setSelectedItemsState(items);
  };

  // Calculations
  const calculateTotal = (itemIds: string[]) => {
    return items
      .filter(item => itemIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const getItemsByGroup = (groupId: string) => {
    return items.filter(item => item.groupId === groupId && item.active);
  };

  const getPackageItems = (pkg: Package) => {
    return items.filter(item => pkg.items.includes(item.id));
  };

  const value: MenuContextType = {
    groups,
    items,
    packages,
    selectedItems,
    addGroup,
    updateGroup,
    deleteGroup,
    addItem,
    updateItem,
    deleteItem,
    addPackage,
    updatePackage,
    deletePackage,
    toggleItemSelection,
    clearSelection,
    setSelectedItems,
    calculateTotal,
    getItemsByGroup,
    getPackageItems
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
}



