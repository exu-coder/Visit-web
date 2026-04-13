export interface Product {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  badge: string;
  features: string[];
  description?: string;
}

export const products: Product[] = [
  {
    id: "glory-bot-1",
    name: "Guild Glory Bot 1 Scoud",
    price: "৳450",
    priceValue: 450,
    badge: "Popular",
    features: ["1 Days Access", "Auto Glory Count", "Anti-Ban Protection"],
    description: "Get automated glory counting with our reliable bot. Perfect for solo players."
  },
  {
    id: "glory-bot-2",
    name: "Guild Glory Bot 2 Scoud",
    price: "৳800",
    priceValue: 800,
    badge: "Best Value",
    features: ["1 Days Access", "160-200K Glory", "Priority Support"],
    description: "Double the power with enhanced glory farming. Best for competitive guilds."
  },
  {
    id: "7-lvl-guild",
    name: "7 LVL Guild",
    price: "৳2200",
    priceValue: 2200,
    badge: "Hot",
    features: ["Custom Name", "8 Hours Delivery", "Fresh New Guild"],
    description: "Get a brand new Level 7 guild with your custom name. Quick delivery guaranteed."
  },
  {
    id: "glory-100k",
    name: "Guild Glory (100K)",
    price: "৳450",
    priceValue: 450,
    badge: "Premium",
    features: ["100K Glory", "3 Hours Max", "Auto Add"],
    description: "100,000 glory points added directly to your guild. Fast and secure."
  },
  {
    id: "glory-200k",
    name: "Guild Glory (200K)",
    price: "৳850",
    priceValue: 850,
    badge: "Best Service",
    features: ["200K Glory", "5 Hours Max", "Auto Add"],
    description: "Double the glory! 200,000 points for your guild's rise to the top."
  },
  {
    id: "glory-400k",
    name: "Guild Glory (400K)",
    price: "৳1650",
    priceValue: 1650,
    badge: "Elite",
    features: ["400K Glory", "8 Hours Max", "Full Setup"],
    description: "Massive 400,000 glory boost. Complete setup included for elite guilds."
  }
];

export type PaymentMethod = "upi" | "bkash";

export interface PaymentInfo {
  method: PaymentMethod;
  details: {
    upi?: {
      id: string;
      qrImage: string;
      merchantName: string;
    };
    bkash?: {
      phoneNumber: string;
      type: string;
    };
  };
}

export const paymentMethods: PaymentInfo = {
  method: "upi",
  details: {
    upi: {
      id: "9742560010@fam",
      qrImage: "https://i.ibb.co.com/hR2rjByW/IMG-20260111-183846-950-2.jpg",
      merchantName: "ROSHAN X EXU"
    },
    bkash: {
      phoneNumber: "01346498005",
      type: "Personal (Send Money)"
    }
  }
};
