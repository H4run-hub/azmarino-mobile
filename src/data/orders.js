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
        name: 'Classic Cotton Crew T-Shirt',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
        price: '€12.99',
        qty: 1,
        size: 'L',
        color: 'ጸሊም',
      },
      {
        name: 'TWS Wireless Earbuds Pro',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop',
        price: '€16.99',
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
      {status: 'ተመሓላለፊ', date: '28 Feb 2026', time: '14:30', completed: true},
    ],
  },
  {
    id: 'AZM098341',
    date: '2026-02-18',
    status: 'processing',
    total: '€34.99',
    itemCount: 1,
    estimatedDelivery: '3-5 መዓልታት',
    currentLocation: 'Azmarino Warehouse - ይዳሎ',
    items: [
      {
        name: 'Smart Watch Pro X1',
        image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
        price: '€34.99',
        qty: 1,
        size: '44mm',
        color: 'ጸሊም',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '18 Feb 2026', time: '16:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '18 Feb 2026', time: '16:10', completed: true},
      {status: 'ካብ መኽዘን ይዳሎ', date: 'ይጽበ...', completed: false, current: true},
      {status: 'ብመገዲ ይገሓዝ', date: 'ይጽበ...', completed: false},
      {status: 'ናብ ከተማኻ ይበጽሕ', date: 'ይጽበ...', completed: false},
      {status: 'ደሊቨሪ', date: 'ይጽበ...', completed: false},
    ],
  },
  {
    id: 'AZM091205',
    date: '2026-02-10',
    status: 'shipped',
    total: '€61.98',
    itemCount: 2,
    estimatedDelivery: '1-2 መዓልታት',
    currentLocation: 'Brussels Distribution Center - ኣብ ጉዕዞ',
    items: [
      {
        name: 'Slim Fit Stretch Jeans',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop',
        price: '€29.99',
        qty: 1,
        size: '32',
        color: 'ሰማያዊ',
      },
      {
        name: 'Breathable Running Shoes',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
        price: '€32.99',
        qty: 1,
        size: '42',
        color: 'ጻዕዳ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '10 Feb 2026', time: '09:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '10 Feb 2026', time: '09:15', completed: true},
      {status: 'ካብ መኽዘን ወጺኡ', date: '11 Feb 2026', time: '07:30', completed: true},
      {status: 'ብመገዲ ይገሓዝ', date: '28 Feb 2026', time: '11:00', completed: true, current: true},
      {status: 'ናብ ከተማኻ ይበጽሕ', date: 'ይጽበ...', completed: false},
      {status: 'ደሊቨሪ', date: 'ይጽበ...', completed: false},
    ],
  },
  {
    id: 'AZM083490',
    date: '2026-01-28',
    status: 'cancelled',
    total: '€24.99',
    itemCount: 1,
    estimatedDelivery: 'ተሰሪዙ',
    currentLocation: 'ትእዛዝ ተሰሪዙ',
    items: [
      {
        name: 'Elegant Summer Midi Dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop',
        price: '€24.99',
        qty: 1,
        size: 'M',
        color: 'ቀይሕ',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '28 Jan 2026', time: '14:00', completed: true},
      {status: 'ትእዛዝ ተሰሪዙ', date: '28 Jan 2026', time: '15:30', completed: true},
    ],
  },
  {
    id: 'AZM075112',
    date: '2026-01-15',
    status: 'delivered',
    total: '€59.97',
    itemCount: 3,
    estimatedDelivery: 'ተላኢኹ',
    currentLocation: 'Luxembourg - ብዓወት ተቐቢሉ',
    items: [
      {
        name: 'Premium Pullover Hoodie',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop',
        price: '€27.99',
        qty: 1,
        size: 'M',
        color: 'ጸሊም',
      },
      {
        name: 'Waterproof Laptop Backpack',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
        price: '€19.99',
        qty: 2,
        size: '15.6"',
        color: 'ሲልቨር',
      },
    ],
    timeline: [
      {status: 'ትእዛዝ ተቐቢሉ', date: '15 Jan 2026', time: '10:00', completed: true},
      {status: 'ክፍሊት ተረጋጊጹ', date: '15 Jan 2026', time: '10:20', completed: true},
      {status: 'ካብ መኽዘን ወጺኡ', date: '16 Jan 2026', time: '08:00', completed: true},
      {status: 'ብመገዲ ይገሓዝ', date: '17 Jan 2026', time: '12:00', completed: true},
      {status: 'ናብ ከተማኻ በጺሑ', date: '18 Jan 2026', time: '08:30', completed: true},
      {status: 'ተመሓላለፊ', date: '18 Jan 2026', time: '13:00', completed: true},
    ],
  },
];

export const statusLabels = {
  delivered: 'ተላኢኹ',
  processing: 'ይዳሎ',
  shipped: 'ኣብ ጉዕዞ',
  cancelled: 'ተሰሪዙ',
};

// Translated status labels — pass `t` from useLanguage()
export const getStatusLabels = (t) => ({
  delivered: `${t('chatOrderDelivered')}`,
  processing: `${t('chatOrderProcessing')}`,
  shipped: `${t('chatOrderShipped')}`,
  cancelled: `${t('chatOrderCancelled')}`,
});

// Lookup a single order by ID (case-insensitive)
export const findOrderById = id => {
  return mockOrders.find(
    o => o.id.toUpperCase() === id.trim().toUpperCase(),
  ) || null;
};
