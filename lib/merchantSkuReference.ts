// Hardcoded merchant SKU reference data

export interface Component {
  qty: number;
  component_merchant_sku: string;
  component_merchant_sku_norm: string;
}

export interface ComboSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  components: Component[];
}

export interface SingleSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  product_category: string;
  sale_class: string;
}

// Combo SKUs with components
export const comboSkus: Record<string, Component[]> = {
  "2HIM2SPU": [
    { qty: 2, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 2, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "3COF2SPU": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 2, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "3HIM3HER": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "TP-COF", component_merchant_sku_norm: "TP-COF" },
    { qty: 1, component_merchant_sku: "TP-HERCOF", component_merchant_sku_norm: "TP-HERCOF" }
  ],
  "E-2HERHBLISS": [
    { qty: 2, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "HBLISS", component_merchant_sku_norm: "HBLISS" }
  ],
  "E-2HIMSPU": [
    { qty: 2, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "E-2HIMVGO": [
    { qty: 2, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "VGOMX", component_merchant_sku_norm: "VGOMX" }
  ],
  "E-3HIM3HER": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "E-3HIMSPU": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "E-HER3CC-V1": [
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "COFFEE CUP V1", component_merchant_sku_norm: "COFFEE CUP V1" }
  ],
  "E-HER4": [
    { qty: 4, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "E-HER6": [
    { qty: 6, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "E-HER8": [
    { qty: 8, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "E-HIM3CC-V1": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "COFFEE CUP V1", component_merchant_sku_norm: "COFFEE CUP V1" }
  ],
  "E-HIM8": [
    { qty: 8, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" }
  ],
  "E-HIMVGO": [
    { qty: 1, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "VGOMX", component_merchant_sku_norm: "VGOMX" }
  ],
  "E-SPU2": [
    { qty: 2, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "HER1": [
    { qty: 1, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "HER3": [
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "HER3LIVE": [
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "TP-COF", component_merchant_sku_norm: "TP-COF" },
    { qty: 1, component_merchant_sku: "TP-HERCOF", component_merchant_sku_norm: "TP-HERCOF" }
  ],
  "HER3SHA-V2": [
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "SHAKER", component_merchant_sku_norm: "SHAKER" }
  ],
  "HER3TP": [
    { qty: 3, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" },
    { qty: 1, component_merchant_sku: "TP-HERCOF", component_merchant_sku_norm: "TP-HERCOF" }
  ],
  "HER8": [
    { qty: 8, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "HIM1": [
    { qty: 1, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" }
  ],
  "HIM3": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" }
  ],
  "HIM3LIVE": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "TP-COF", component_merchant_sku_norm: "TP-COF" },
    { qty: 1, component_merchant_sku: "TP-HERCOF", component_merchant_sku_norm: "TP-HERCOF" }
  ],
  "HIM3SHA/V2": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "SHAKER", component_merchant_sku_norm: "SHAKER" }
  ],
  "HIM3TP": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "TP-COF", component_merchant_sku_norm: "TP-COF" }
  ],
  "HIM3TUMB-V2": [
    { qty: 3, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "TUMB-V2-BLACK", component_merchant_sku_norm: "TUMB-V2-BLACK" }
  ],
  "HIM6": [
    { qty: 6, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" }
  ],
  "HIMHER1": [
    { qty: 1, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" },
    { qty: 1, component_merchant_sku: "HERCOF1", component_merchant_sku_norm: "HERCOF1" }
  ],
  "SMSU": [
    { qty: 1, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" },
    { qty: 1, component_merchant_sku: "buku/SM", component_merchant_sku_norm: "BUKU/SM" }
  ],
  "SPU1": [
    { qty: 1, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" }
  ],
  "SPUHIM": [
    { qty: 1, component_merchant_sku: "spr/x1", component_merchant_sku_norm: "SPR/X1" },
    { qty: 1, component_merchant_sku: "COF1", component_merchant_sku_norm: "COF1" }
  ]
};

// Single SKUs
export const singleSkus: Set<string> = new Set([
  "COF1",
  "COFCUP-V1",
  "COFFEE CUP V1",
  "HBLISS",
  "HERCOF1",
  "SHAKER",
  "TP-COF",
  "TP-HERCOF",
  "TUMB-V2-BLACK",
  "TUMB-V2-GOLD",
  "VGOMX",
  "buku/BK",
  "buku/SM",
  "spr/x1"
]);


