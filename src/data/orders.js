// Shared order data — used by OrderHistoryScreen and ChatSupportScreen

export const mockOrders = [
  {
    id: 'AZM104823',
    date: '2026-02-25',
    status: 'delivered',
    total: '€51.98',
    itemCount: 3,
    estimatedDelivery: 'ተላኢኹ',
    currentLocation: 'Luxembourg - ብዓወት ተቐቢሉ',
    items: [
      {
        name: 'Premium Cotton T-Shirt',
        image: 'https://picsum.photos/seed/tshirt1/400/400',
        price: '€15.99',
        qty: 1,
        size: 'L',
        color: 'ጸሊም',
      },
      {
        name: 'Wireless Headphones',
        image: 'https://picsum.photos/seed/headphones1/400/400',
        price: '€45.99',
        qty: 1,
        size: 'Standard',
        color: 'ጻዕዳ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '25 Feb 2026', time: '10:30', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '25 Feb 2026', time: '10:45', completed: true},
      {status: 'ካብ መኽዘን ወጺኡ', date: '26 Feb 2026', time: '08:20', completed: true},
      {status: 'ብመገዲ ይገሓዝ', date: '27 Feb 2026', time: '14:00', completed: true},
      {status: 'ናብ ከተማኻ በጺሑ', date: '28 Feb 2026', time: '09:00', completed: true},
      {status: 'ተመሓላለፊ ✅', date: '28 Feb 2026', time: '14:30', completed: true},
    ],
  },
  {
    id: 'AZM098341',
    date: '2026-02-18',
    status: 'processing',
    total: '€299.99',
    itemCount: 1,
    estimatedDelivery: '3-5 መዓልታት',
    currentLocation: 'Azmarino Warehouse - ይዳሎ',
    items: [
      {
        name: 'Smartphone 5G',
        image: 'https://picsum.photos/seed/phone1/400/400',
        price: '€299.99',
        qty: 1,
        size: '256GB',
        color: 'ጸሊም',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '18 Feb 2026', time: '16:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '18 Feb 2026', time: '16:10', completed: true},
      {status: 'ካብ መኽዘን ይዳሎ ⏳', date: 'ይጽበ...', completed: false, current: true},
      {status: 'ብመገዲ ይገሓዝ', date: 'ይጽበ...', completed: false},
      {status: 'ናብ ከተማኻ ይበጽሕ', date: 'ይጽበ...', completed: false},
      {status: 'ምልኣኽ', date: 'ይጽበ...', completed: false},
    ],
  },
  {
    id: 'AZM091205',
    date: '2026-02-10',
    status: 'shipped',
    total: '€88.98',
    itemCount: 2,
    estimatedDelivery: '1-2 መዓልታት',
    currentLocation: 'Brussels Distribution Center - ኣብ ጉዕዞ',
    items: [
      {
        name: 'Slim Fit Jeans',
        image: 'https://picsum.photos/seed/jeans1/400/400',
        price: '€35.99',
        qty: 1,
        size: '32',
        color: 'ሰማያዊ',
      },
      {
        name: 'Running Shoes',
        image: 'https://picsum.photos/seed/sneakers1/400/400',
        price: '€55.99',
        qty: 1,
        size: '42',
        color: 'ጻዕዳ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '10 Feb 2026', time: '09:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '10 Feb 2026', time: '09:15', completed: true},
      {status: 'ካብ መኽዘን ወጺኡ', date: '11 Feb 2026', time: '07:30', completed: true},
      {status: 'ብመገዲ ይገሓዝ 🚚', date: '28 Feb 2026', time: '11:00', completed: true, current: true},
      {status: 'ናብ ከተማኻ ይበጽሕ', date: 'ይጽበ...', completed: false},
      {status: 'ምልኣኽ', date: 'ይጽበ...', completed: false},
    ],
  },
  {
    id: 'AZM083490',
    date: '2026-01-28',
    status: 'cancelled',
    total: '€28.99',
    itemCount: 1,
    estimatedDelivery: 'ተሰሪዙ',
    currentLocation: 'ትእዛዝ ተሰሪዙ',
    items: [
      {
        name: 'Summer Dress',
        image: 'https://picsum.photos/seed/dress1/400/400',
        price: '€28.99',
        qty: 1,
        size: 'M',
        color: 'ቀይሕ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '28 Jan 2026', time: '14:00', completed: true},
      {status: 'ትእዛዝ ተሰሪዙ ❌', date: '28 Jan 2026', time: '15:30', completed: true},
    ],
  },
  {
    id: 'AZM075112',
    date: '2026-01-15',
    status: 'delivered',
    total: '€124.97',
    itemCount: 3,
    estimatedDelivery: 'ተላኢኹ',
    currentLocation: 'Luxembourg - ብዓወት ተቐቢሉ',
    items: [
      {
        name: 'Winter Jacket',
        image: 'https://picsum.photos/seed/jacket1/400/400',
        price: '€49.99',
        qty: 1,
        size: 'M',
        color: 'ጸሊም',
      },
      {
        name: 'Backpack',
        image: 'https://picsum.photos/seed/backpack1/400/400',
        price: '€24.99',
        qty: 2,
        size: 'Standard',
        color: 'ግራጫ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '15 Jan 2026', time: '10:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '15 Jan 2026', time: '10:20', completed: true},
      {status: 'ካብ መኽዘን ወጺኡ', date: '16 Jan 2026', time: '08:00', completed: true},
      {status: 'ብመገዲ ይገሓዝ', date: '17 Jan 2026', time: '12:00', completed: true},
      {status: 'ናብ ከተማኻ በጺሑ', date: '18 Jan 2026', time: '08:30', completed: true},
      {status: 'ተመሓላለፊ ✅', date: '18 Jan 2026', time: '13:00', completed: true},
    ],
  },
];

export const statusLabels = {
  delivered: 'ተላኢኹ ✅',
  processing: 'ይዳሎ ⏳',
  shipped: 'ኣብ ጉዕዞ 🚚',
  cancelled: 'ተሰሪዙ ❌',
};

// Lookup a single order by ID (case-insensitive)
export const findOrderById = id => {
  return mockOrders.find(
    o => o.id.toUpperCase() === id.trim().toUpperCase(),
  ) || null;
};
