import { PrismaClient, FuelType, Region, StationStatus, DeliveryStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@petroleum.th" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@petroleum.th",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create provinces (selected major provinces)
  const provinces = [
    { nameEn: "Bangkok", nameTh: "กรุงเทพมหานคร", region: Region.CENTRAL },
    { nameEn: "Nonthaburi", nameTh: "นนทบุรี", region: Region.CENTRAL },
    { nameEn: "Pathum Thani", nameTh: "ปทุมธานี", region: Region.CENTRAL },
    { nameEn: "Samut Prakan", nameTh: "สมุทรปราการ", region: Region.CENTRAL },
    { nameEn: "Ayutthaya", nameTh: "พระนครศรีอยุธยา", region: Region.CENTRAL },
    { nameEn: "Chiang Mai", nameTh: "เชียงใหม่", region: Region.NORTHERN },
    { nameEn: "Chiang Rai", nameTh: "เชียงราย", region: Region.NORTHERN },
    { nameEn: "Lampang", nameTh: "ลำปาง", region: Region.NORTHERN },
    { nameEn: "Phitsanulok", nameTh: "พิษณุโลก", region: Region.NORTHERN },
    { nameEn: "Khon Kaen", nameTh: "ขอนแก่น", region: Region.NORTHEASTERN },
    { nameEn: "Nakhon Ratchasima", nameTh: "นครราชสีมา", region: Region.NORTHEASTERN },
    { nameEn: "Udon Thani", nameTh: "อุดรธานี", region: Region.NORTHEASTERN },
    { nameEn: "Ubon Ratchathani", nameTh: "อุบลราชธานี", region: Region.NORTHEASTERN },
    { nameEn: "Chonburi", nameTh: "ชลบุรี", region: Region.EASTERN },
    { nameEn: "Rayong", nameTh: "ระยอง", region: Region.EASTERN },
    { nameEn: "Chanthaburi", nameTh: "จันทบุรี", region: Region.EASTERN },
    { nameEn: "Kanchanaburi", nameTh: "กาญจนบุรี", region: Region.WESTERN },
    { nameEn: "Ratchaburi", nameTh: "ราชบุรี", region: Region.WESTERN },
    { nameEn: "Surat Thani", nameTh: "สุราษฎร์ธานี", region: Region.SOUTHERN },
    { nameEn: "Songkhla", nameTh: "สงขลา", region: Region.SOUTHERN },
    { nameEn: "Phuket", nameTh: "ภูเก็ต", region: Region.SOUTHERN },
    { nameEn: "Nakhon Si Thammarat", nameTh: "นครศรีธรรมราช", region: Region.SOUTHERN },
    { nameEn: "Krabi", nameTh: "กระบี่", region: Region.SOUTHERN },
  ];

  const createdProvinces = [];
  for (const p of provinces) {
    const province = await prisma.province.upsert({
      where: { nameEn: p.nameEn },
      update: {},
      create: p,
    });
    createdProvinces.push(province);
  }

  // Create fuel prices (recent daily prices)
  const fuelTypes = Object.values(FuelType);
  const basePrices: Record<string, number> = {
    DIESEL: 29.94,
    DIESEL_B7: 30.44,
    GASOHOL_91: 36.08,
    GASOHOL_95: 43.95,
    GASOHOL_E20: 34.08,
    GASOHOL_E85: 25.24,
    LPG: 20.29,
    NGV: 17.59,
  };

  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const fuelType of fuelTypes) {
      const basePrice = basePrices[fuelType] || 30;
      const variation = (Math.random() - 0.5) * 2;
      const price = Math.round((basePrice + variation) * 100) / 100;

      await prisma.fuelPrice.upsert({
        where: {
          fuelType_effectiveDate: { fuelType, effectiveDate: date },
        },
        update: {},
        create: {
          fuelType,
          price,
          effectiveDate: date,
          source: "EPPO",
        },
      });
    }
  }

  // Create depots
  const bkkProvince = createdProvinces.find((p) => p.nameEn === "Bangkok")!;
  const rayongProvince = createdProvinces.find((p) => p.nameEn === "Rayong")!;
  const srtProvince = createdProvinces.find((p) => p.nameEn === "Surat Thani")!;

  const depots = [
    {
      name: "Bangkok Central Depot",
      address: "123 Vibhavadi Rangsit Rd, Bangkok",
      provinceId: bkkProvince.id,
      latitude: 13.8471,
      longitude: 100.5625,
      capacity: 5000000,
    },
    {
      name: "Rayong Eastern Depot",
      address: "456 Sukhumvit Rd, Rayong",
      provinceId: rayongProvince.id,
      latitude: 12.6833,
      longitude: 101.2500,
      capacity: 3000000,
    },
    {
      name: "Surat Thani Southern Depot",
      address: "789 Taladmai Rd, Surat Thani",
      provinceId: srtProvince.id,
      latitude: 9.1356,
      longitude: 99.3297,
      capacity: 2000000,
    },
  ];

  const createdDepots = [];
  for (const d of depots) {
    const depot = await prisma.depot.create({ data: d });
    createdDepots.push(depot);
  }

  // Create stations
  const stationData = [
    { name: "PTT Vibhavadi 1", address: "88 Vibhavadi Rangsit Rd", province: "Bangkok", lat: 13.8481, lng: 100.5610 },
    { name: "PTT Sukhumvit 2", address: "234 Sukhumvit Rd", province: "Bangkok", lat: 13.7274, lng: 100.5735 },
    { name: "Shell Ratchada", address: "567 Ratchadaphisek Rd", province: "Bangkok", lat: 13.7804, lng: 100.5730 },
    { name: "Bangchak Chaeng Wattana", address: "100 Chaeng Wattana Rd", province: "Nonthaburi", lat: 13.8845, lng: 100.5413 },
    { name: "PTT Rangsit", address: "88 Phahonyothin Rd", province: "Pathum Thani", lat: 13.9654, lng: 100.5860 },
    { name: "Shell Chiang Mai", address: "222 Super Highway Rd", province: "Chiang Mai", lat: 18.7963, lng: 98.9847 },
    { name: "PTT Chiang Rai", address: "55 Phahonyothin Rd", province: "Chiang Rai", lat: 19.9091, lng: 99.8346 },
    { name: "Bangchak Khon Kaen", address: "789 Mittraphap Rd", province: "Khon Kaen", lat: 16.4322, lng: 102.8356 },
    { name: "PTT Korat", address: "123 Mittraphap Rd", province: "Nakhon Ratchasima", lat: 14.9799, lng: 102.0977 },
    { name: "Shell Pattaya", address: "456 Sukhumvit Rd", province: "Chonburi", lat: 12.9336, lng: 100.8825 },
    { name: "PTT Rayong", address: "321 Sukhumvit Rd", province: "Rayong", lat: 12.6803, lng: 101.2590 },
    { name: "Bangchak Phuket", address: "88 Thepkrasattri Rd", province: "Phuket", lat: 7.8783, lng: 98.3782 },
    { name: "PTT Songkhla", address: "111 Phetkasem Rd", province: "Songkhla", lat: 7.1890, lng: 100.5915 },
    { name: "Shell Surat Thani", address: "222 Na Mueang Rd", province: "Surat Thani", lat: 9.1382, lng: 99.3212 },
    { name: "PTT Krabi", address: "333 Utarakit Rd", province: "Krabi", lat: 8.0863, lng: 98.9063 },
  ];

  const createdStations = [];
  for (const s of stationData) {
    const province = createdProvinces.find((p) => p.nameEn === s.province);
    if (!province) continue;

    const station = await prisma.station.create({
      data: {
        name: s.name,
        address: s.address,
        provinceId: province.id,
        latitude: s.lat,
        longitude: s.lng,
        owner: `Owner of ${s.name}`,
        phone: `0${Math.floor(Math.random() * 900000000 + 100000000)}`,
        status: StationStatus.ACTIVE,
      },
    });
    createdStations.push(station);
  }

  // Create inventory for each station
  const inventoryFuels = [FuelType.DIESEL, FuelType.GASOHOL_91, FuelType.GASOHOL_95, FuelType.GASOHOL_E20];
  for (const station of createdStations) {
    for (const fuelType of inventoryFuels) {
      const capacity = 30000 + Math.floor(Math.random() * 20000);
      const quantity = Math.floor(Math.random() * capacity);
      await prisma.inventory.create({
        data: {
          stationId: station.id,
          fuelType,
          quantity,
          capacity,
        },
      });
    }
  }

  // Create deliveries
  const statuses = [DeliveryStatus.SCHEDULED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.DELIVERED];
  for (let i = 0; i < 20; i++) {
    const depot = createdDepots[Math.floor(Math.random() * createdDepots.length)];
    const station = createdStations[Math.floor(Math.random() * createdStations.length)];
    const fuelType = inventoryFuels[Math.floor(Math.random() * inventoryFuels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() - Math.floor(Math.random() * 14));

    await prisma.delivery.create({
      data: {
        depotId: depot.id,
        stationId: station.id,
        fuelType,
        quantity: 5000 + Math.floor(Math.random() * 15000),
        status,
        scheduledDate,
        deliveredDate: status === DeliveryStatus.DELIVERED ? new Date() : null,
        driverName: `Driver ${i + 1}`,
        truckPlate: `${Math.floor(Math.random() * 9000 + 1000)} ${["กท", "บค", "สม", "ชร"][Math.floor(Math.random() * 4)]}`,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
