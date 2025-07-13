export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: Date
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
  imageUrl: string | null;
};

export type CreateOrder = {
  cardCode: string;
  docDate: Date,
  docDueDate: Date,
  lines: [
    {
      itemCode: string;
      quantity: number | string;
      priceAfterVAT: number | string;
      warehouseCode: string;
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
