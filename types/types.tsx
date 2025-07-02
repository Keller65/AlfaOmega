export type Tier = {
  qty: number;
  price: number;
  percent: number;
};

export type ProductDiscount = {
  tiers: Tier[];
  itemCode: string;
  itemName: string;
  groupCode: number;
  groupName: string;
  inStock: number;
  committed: number;
  ordered: number;
  price: number;
  hasDiscount: boolean;
  barCode: string | null;
  salesUnit: string | null;
  salesItemsPerUnit: number;
};