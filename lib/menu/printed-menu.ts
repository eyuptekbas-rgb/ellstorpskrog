/**
 * Physical restaurant menu — single source of truth for Ellstorps Krog.
 * Category and product order must match the printed menu exactly.
 */

export type PrintedMenuProduct = {
  name: string;
  description: string;
  price: number;
  /** Pizza menu number (printed menu), when applicable */
  menuNumber?: number;
};

export type PrintedMenuCategory = {
  name: string;
  slug: string;
  sortOrder: number;
  image?: string | null;
  products: PrintedMenuProduct[];
  extras?: Array<{ name: string; priceModifier: number }>;
};

export const PRINTED_MENU_CATEGORIES: PrintedMenuCategory[] = [
  {
    name: "Våra goda pizzor",
    slug: "vara-goda-pizzor",
    sortOrder: 0,
    image: "/images/categories/pizza.jpg",
    extras: [
      { name: "Extra ost", priceModifier: 15 },
      { name: "Glutenfri botten", priceModifier: 25 },
      { name: "Extra skinka", priceModifier: 20 },
      { name: "Extra kebab", priceModifier: 25 },
      { name: "Stark sås", priceModifier: 0 },
    ],
    products: [
      { menuNumber: 1, name: "Margherita", description: "Tomatsås och ost.", price: 121 },
      { menuNumber: 2, name: "Vesuvio", description: "Tomatsås, ost och skinka.", price: 126 },
      { menuNumber: 3, name: "Al Funghi", description: "Tomatsås, ost och champinjoner.", price: 126 },
      { menuNumber: 4, name: "Al Tonno", description: "Tomatsås, ost, lök och tonfisk.", price: 126 },
      { menuNumber: 5, name: "Calzone", description: "Tomatsås, ost och skinka. Inbakad.", price: 126 },
      { menuNumber: 6, name: "Bolognese", description: "Tomatsås, ost, lök, vitlök och köttfärs.", price: 129 },
      { menuNumber: 7, name: "Siciliana", description: "Tomatsås, ost, oliver, sardeller, kapris och färsk vitlök.", price: 129 },
      { menuNumber: 8, name: "Capricciosa", description: "Tomatsås, ost, skinka och champinjoner.", price: 129 },
      { menuNumber: 9, name: "Marinara", description: "Tomatsås, ost, räkor och musslor.", price: 129 },
      { menuNumber: 10, name: "Hawaii", description: "Tomatsås, ost, skinka och ananas.", price: 129 },
      { menuNumber: 11, name: "Salami", description: "Tomatsås, ost, lök, paprika och salami.", price: 135 },
      { menuNumber: 12, name: "Africana", description: "Tomatsås, ost, banan, jordnötter, ananas och curry.", price: 135 },
      { menuNumber: 13, name: "Rimini", description: "Tomatsås, ost, skinka, champinjoner och räkor.", price: 135 },
      { menuNumber: 14, name: "Gudfadern", description: "Tomatsås, ost, lök, bacon, stark korv och ägg.", price: 150 },
      { menuNumber: 15, name: "Vegetariana", description: "Tomatsås, ost, lök, champinjoner, paprika, sparris, oliver och kronärtskocka.", price: 150 },
      { menuNumber: 16, name: "Quattro", description: "Tomatsås, ost, skinka, champinjoner, räkor, musslor och kronärtskocka.", price: 150 },
      { menuNumber: 17, name: "Legend", description: "Tomatsås, ost, lök, svamp, kyckling, cayennepeppar och valfri sås.", price: 150 },
      { menuNumber: 18, name: "Kebabpizza", description: "Tomatsås, ost, lök, kebab, feferoni och valfri sås.", price: 150 },
      { menuNumber: 19, name: "Gyrospizza", description: "Tomatsås, ost, lök, gyros, feferoni och valfri sås.", price: 150 },
      { menuNumber: 20, name: "Mexikana", description: "Tomatsås, ost, köttfärssås, lök, jalapeno, tacokrydda och vitlök.", price: 150 },
      { menuNumber: 21, name: "Malmö Special", description: "Tomatsås, ost, lök, skinka, kebab, tomat, feferoni och vitlökssås.", price: 150 },
      { menuNumber: 22, name: "Kebabpizza Special", description: "Tomatsås, ost, kebab, isbergssallad, tomat, gurka, rödlök, feferoni och valfri sås.", price: 155 },
      { menuNumber: 23, name: "Bacon Special", description: "Tomatsås, ost, bacon, lök, köttfärs, stark korv och gorgonzola.", price: 155 },
      { menuNumber: 24, name: "Deluxe", description: "Tomatsås, ost, pepperoni, salami och stark korv.", price: 155 },
      { menuNumber: 25, name: "Ellstorps Special", description: "Tomatsås, ost, kebab, lök, pommes och valfri sås.", price: 155 },
      { menuNumber: 26, name: "Kär & Galen", description: "Tomatsås, ost, oxfilé, lök, räkor, cayennepeppar, bearnaisesås och stark sås.", price: 155 },
      { menuNumber: 27, name: "Quattro Formaggio", description: "Tomatsås, ost, buffelmozzarella, parmesan, gorgonzola och fetaost.", price: 155 },
      { menuNumber: 28, name: "Gorgonzola", description: "Tomatsås, ost, lök, champinjoner, tomat, gorgonzola, oxfilé och bearnaisesås.", price: 155 },
      { menuNumber: 29, name: "Parma Special", description: "Tomatsås, ost, körsbärstomater, svarta oliver, parmaskinka och ruccola.", price: 155 },
      { menuNumber: 30, name: "Mozzarella Special", description: "Tomatsås, ost, mozzarella, buffalomozzarella, svarta oliver, soltorkade tomater och ruccola.", price: 155 },
      { menuNumber: 31, name: "Pesto", description: "Tomatsås, ost, buffalomozzarella, körsbärstomater, pesto och ruccola.", price: 155 },
      { menuNumber: 32, name: "Makiki", description: "Tomatsås, ost, oxfilé, sparris, svartpeppar och bearnaisesås.", price: 155 },
      { menuNumber: 33, name: "Gyrospizza Special", description: "Tomatsås, ost, gyros, isbergssallad, tomat, gurka, rödlök, feferoni och valfri sås.", price: 155 },
      { menuNumber: 34, name: "Vegansk Kebabpizza", description: "Tomatsås, ost, lök, kebab, feferoni och valfri sås.", price: 160 },
    ],
  },
  {
    name: "Smårätter",
    slug: "smaratter",
    sortOrder: 6,
    products: [
      { name: "Vitlöksbröd", description: "", price: 90 },
      { name: "Pommestallrik", description: "", price: 55 },
      { name: "Toast med Räkröra", description: "Toppas med handskalade räkor.", price: 115 },
      { name: "Pubtallrik", description: "3 st chilicheese, 3 st mozzarellasticks, 3 st buffalo wings, 3 st lökringar och valfri sås.", price: 150 },
    ],
  },
  {
    name: "A la Carte",
    slug: "a-la-carte",
    sortOrder: 1,
    products: [
      { name: "Laxfilé", description: "Serveras med stekt potatis, stekt sparris, hollandaisesås och blandsallad.", price: 260 },
      { name: "Fläskfilé Oscar", description: "Serveras med stekt potatis, stekt sparris, handskalade räkor, blandsallad och bearnaisesås.", price: 250 },
      { name: "Wienerschnitzel", description: "Hemmagjord kalvschnitzel. Serveras med stekt potatis, brunsås och ärtor.", price: 220 },
      { name: "Pannbiff", description: "Pannbiff. Serveras med stekt potatis, ägg, lök, gräddsås och lingonsylt.", price: 209 },
      { name: "Kycklingfilé", description: "Serveras med pommes, grönsaker och valfri sås.", price: 185 },
      { name: "Friterad Rödspätta", description: "Serveras med pommes och remouladsås.", price: 194 },
      { name: "Black & White", description: "Oxfilé och fläskfilé serveras med pommes, bearnaisesås och rödvinssås.", price: 320 },
      { name: "Oxfilé", description: "Serveras med stekt potatis, vitlökssmör och bearnaisesås.", price: 300 },
      { name: "Entrecôte", description: "Serveras med stekt potatis, vitlökssmör och bearnaisesås.", price: 260 },
      { name: "Grillspett", description: "Oxfilé med pommes, oliver, grönsaker, fetaost och valfri sås.", price: 230 },
      { name: "Lammkotlett", description: "Serveras med pommes och bearnaisesås.", price: 250 },
    ],
  },
  {
    name: "Plankstek",
    slug: "plankstek",
    sortOrder: 5,
    products: [
      { name: "Plankstek - Oxfilé", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 300 },
      { name: "Plankstek - Laxfilé", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 260 },
      { name: "Plankstek - Entrecôte", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 260 },
      { name: "Plankstek - Fläskfilé", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 250 },
      { name: "Plankstek - Lammkotlett", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 250 },
      { name: "Plankstek - Kyckling", description: "Serveras med potatismos, baconlindad sparris, broccoli och sås.", price: 219 },
    ],
  },
  {
    name: "Kebab / Kyckling / Falafel / Gyros",
    slug: "kebab-kyckling-falafel-gyros",
    sortOrder: 2,
    products: [
      { name: "Kebabtallrik", description: "Serveras med pommes, sallad och valfri sås.", price: 140 },
      { name: "Kebabrulle", description: "Hemlagad tunnbrödrulle med kebab och valfri sås.", price: 140 },
      { name: "Kebabsallad", description: "Välj valfri sås.", price: 140 },
      { name: "Kycklingtallrik", description: "Serveras med pommes, sallad och valfri sås.", price: 140 },
      { name: "Kycklingrulle", description: "Hemlagad tunnbrödrulle med kyckling och valfri sås.", price: 140 },
      { name: "Kycklingsallad", description: "Serveras med valfri sås.", price: 140 },
      { name: "Falafeltallrik", description: "Serveras med pommes, sallad och valfri sås.", price: 140 },
      { name: "Falafelrulle", description: "Hemlagad tunnbrödrulle med falafel och valfri sås.", price: 140 },
      { name: "Falafelsallad", description: "Serveras med valfri sås.", price: 140 },
      { name: "Gyrostallrik", description: "Serveras med pommes, sallad och valfri sås.", price: 140 },
      { name: "Gyrosrulle", description: "Hemlagad tunnbrödrulle med gyros och valfri sås.", price: 140 },
      { name: "Gyrossallad", description: "Serveras med valfri sås.", price: 140 },
      { name: "Vegansk Kebabtallrik", description: "Serveras med pommes, sallad och valfri sås.", price: 140 },
      { name: "Vegansk Kebabrulle", description: "Hemlagad tunnbrödrulle med kebab och valfri sås.", price: 140 },
    ],
  },
  {
    name: "Pastarätter",
    slug: "pastaratter",
    sortOrder: 4,
    products: [
      { name: "Spaghetti Bolognese", description: "", price: 140 },
      { name: "Spaghetti Carbonara", description: "", price: 140 },
      { name: "Oxfilépasta", description: "", price: 150 },
      { name: "Kycklingpasta", description: "", price: 140 },
      { name: "Penne Vegetable", description: "", price: 140 },
    ],
  },
  {
    name: "Hamburgare",
    slug: "hamburgare",
    sortOrder: 3,
    products: [
      { name: "Hamburgertallrik 90g", description: "", price: 125 },
      { name: "Vegansk Burgare 90g", description: "", price: 135 },
      { name: "Hamburgertallrik 150g", description: "", price: 135 },
    ],
  },
  {
    name: "Efterrätt",
    slug: "efterratt",
    sortOrder: 7,
    products: [
      { name: "Camembert", description: "Serveras med hjortronsylt, persilja och saltiner.", price: 90 },
    ],
  },
  {
    name: "Drycker",
    slug: "drycker",
    sortOrder: 8,
    image: "/images/categories/dryck.jpg",
    products: [
      { name: "Coca-Cola 33 cl", description: "", price: 35 },
      { name: "Coca-Cola Zero Sugar 33 cl", description: "", price: 35 },
      { name: "Fanta 33 cl", description: "", price: 35 },
      { name: "Fanta Extotic 33 cl", description: "", price: 35 },
      { name: "Fanta Lemon Zero 33 cl", description: "", price: 35 },
      { name: "Bonaqua Naturell 33 cl", description: "", price: 35 },
      { name: "Bonaqua Citrus 33 cl", description: "", price: 35 },
      { name: "Coca-Cola 2 L", description: "", price: 60 },
      { name: "Coca-Cola Zero 2 L", description: "", price: 60 },
      { name: "Fanta 2 L", description: "", price: 60 },
    ],
  },
];

export const PRINTED_MENU_SLUGS = new Set(
  PRINTED_MENU_CATEGORIES.map((c) => c.slug)
);
