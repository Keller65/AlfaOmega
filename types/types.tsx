export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: string
};

export type ProductDiscount = {
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
  imageUrl: string | null;
  taxType: "EXE" | "INA";
  tiers: Tier[];
};

export type CreateOrder = {
  cardCode: string,
  docDate: string,
  docDueDate: string,
  comments: string,
  lines: [
    {
      itemCode: string,
      quantity: number,
      lineTotal: number
    },
    {
      itemCode: string,
      quantity: number,
      lineTotal: number
    }
  ]
}

export interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: number;
}

export interface CustomersResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
}
