const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ===== NAME / DATA GENERATORS =====
const firstNames = ['Ahmed','Mohamed','Sara','Fatma','Omar','Layla','Hassan','Nour','Youssef','Dina','Ali','Mona','Karim','Hana','Tarek','Reem','Khaled','Yasmin','Mahmoud','Aya','Amr','Sama','Waleed','Farah','Mostafa','Salma','Hossam','Mariam','Ayman','Nada'];
const lastNames = ['ElSayed','Hassan','Ibrahim','Ahmed','Ali','Mohamed','Khalil','Farouk','Salem','Nasser','Gamal','Samir','Emad','Rashed','Soliman','Fathy','Adel','Magdy','Shaker','Mansour'];
const streetNames = ['Tahrir','Nile','Cairo','Ramses','Giza','Heliopolis','Zamalek','Maadi','Nasr City','Dokki','Mohandiseen','Garden City','Downtown','Shubra','Helwan','October','Salam','Faisal','Haram','Oraby'];

const parkingNames = [
  'AutoPark Central','SafeSpot Garage','CityPark Plus','QuickPark Nasr','NileView Parking','DownTown Garage','GizaPark Premium','ZamalekPark',
  'Maadi Station Parking','OctoberPark Express','HelioPark Gold','DokkiPark Smart','ShubraGarage','SalamPark','FaisalPark','El Haram Parking',
  'TahrirPark','MohandiseenGarage','RamsesParking','GardenCity Park',
];
const washNames = [
  'SparkleWash Downtown','AquaClean Express','DiamondWash Pro','ShineMax Premium','FreshWave Car Spa','CrystalClean Auto','PureGlow Wash',
  'WaterJet Premium','BubbleShine Cairo','SpotlessWash Maadi','RainbowWash Studio','MegaClean Express','LuxeWash Zamalek','TurboClean Pro',
  'AquaStar Auto Spa','CleanStream Express','GoldenWash VIP','BlueWave Car Care','ProShine Auto','EliteWash Studio',
];

const washServiceNames = ['Internal Wash','External Wash','Chemical Wash','Polishing','Engine Wash','Tire Shine','Interior Detailing','Ceramic Coating','Paint Protection','Wax Finish'];
const washServicePrices = [80, 60, 150, 200, 120, 40, 300, 500, 400, 100];
const washServiceDurs   = [30, 20, 45, 60, 30, 15, 60, 90, 75, 25];

const reviewComments = [
  'Great service, very clean!','Quick and professional','Best wash in Cairo!','Could be better honestly','Amazing experience, highly recommend!',
  'Staff was very friendly','A bit pricey but worth it','Loved the attention to detail','Will definitely come back','Good location, easy to find',
  'Excellent polishing work!','My car looks brand new','Very thorough cleaning','Fast service, no waiting','Premium quality, 5 stars!',
  'Nice staff, clean facility','Exceeded my expectations','Reasonable prices','Top notch service','The best in the area!',
  'Convenient location','Professional team','Modern equipment','Highly satisfied','Will recommend to friends',
  'Clean and organized','Gentle with my car','Superb detailing','Worth every pound','Outstanding work!',
];

function randomEl(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysBack) {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(randomBetween(7, 21), randomBetween(0, 59), 0, 0); return d;
}
function cairoLat() { return 29.95 + Math.random() * 0.15; }
function cairoLng() { return 31.15 + Math.random() * 0.2; }

async function main() {
  console.log('🗑️  Cleaning database...');
  await prisma.review.deleteMany();
  await prisma.washingBooking.deleteMany();
  await prisma.washingService.deleteMany();
  await prisma.washingLocation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.parkingLot.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.user.deleteMany();

  const hashed = await bcrypt.hash('Password123', 10);

  // ===== 1. USERS (50 clients + 20 parking owners + 20 wash owners) =====
  console.log('👤 Creating 90 users...');
  const clients = [];
  const parkingOwners = [];
  const washOwners = [];

  // Fixed demo users
  const demoClient = await prisma.user.create({ data: { email: 'ahmed@demo.com', password: hashed, name: 'Ahmed ElSayed', phone: '+201001234567', role: 'CLIENT' } });
  const demoParking = await prisma.user.create({ data: { email: 'owner@demo.com', password: hashed, name: 'Mohamed Parking', phone: '+201007654321', role: 'PARKING_OWNER' } });
  const demoWash = await prisma.user.create({ data: { email: 'wash@demo.com', password: hashed, name: 'Sara WashPro', phone: '+201009876543', role: 'WASH_OWNER' } });
  clients.push(demoClient);
  parkingOwners.push(demoParking);
  washOwners.push(demoWash);

  // Generate additional clients
  for (let i = 0; i < 49; i++) {
    const u = await prisma.user.create({
      data: { email: `client${i}@spotix.com`, password: hashed, name: `${randomEl(firstNames)} ${randomEl(lastNames)}`, phone: `+20100${String(randomBetween(1000000, 9999999))}`, role: 'CLIENT' },
    });
    clients.push(u);
  }
  // Generate additional parking owners
  for (let i = 0; i < 19; i++) {
    const u = await prisma.user.create({
      data: { email: `parking${i}@spotix.com`, password: hashed, name: `${randomEl(firstNames)} ${randomEl(lastNames)}`, phone: `+20101${String(randomBetween(1000000, 9999999))}`, role: 'PARKING_OWNER' },
    });
    parkingOwners.push(u);
  }
  // Generate additional wash owners
  for (let i = 0; i < 19; i++) {
    const u = await prisma.user.create({
      data: { email: `wash${i}@spotix.com`, password: hashed, name: `${randomEl(firstNames)} ${randomEl(lastNames)}`, phone: `+20102${String(randomBetween(1000000, 9999999))}`, role: 'WASH_OWNER' },
    });
    washOwners.push(u);
  }
  console.log(`   ✅ ${clients.length} clients, ${parkingOwners.length} parking owners, ${washOwners.length} wash owners`);

  // ===== 2. PARKING LOTS (20, one per owner) =====
  console.log('🅿️  Creating 20 parking lots...');
  const lots = [];
  for (let i = 0; i < parkingOwners.length; i++) {
    const total = randomBetween(15, 80);
    const avail = randomBetween(0, total);
    const price = randomBetween(8, 35);
    const type = i % 3 === 0 ? 'COVERED' : 'UNCOVERED';
    const lot = await prisma.parkingLot.create({
      data: {
        ownerId: parkingOwners[i].id, name: parkingNames[i] || `Parking Lot ${i + 1}`,
        address: `${randomBetween(1, 200)} ${randomEl(streetNames)} St, Cairo`,
        latitude: cairoLat(), longitude: cairoLng(),
        totalSpots: total, availableSpots: avail, pricePerHour: price,
        oldPrice: Math.random() > 0.4 ? price + randomBetween(5, 20) : null,
        parkingType: type,
        openTime: randomBetween(0, 6), closeTime: randomBetween(22, 24),
      },
    });
    lots.push(lot);
  }
  console.log(`   ✅ ${lots.length} parking lots`);

  // ===== 3. RESERVATIONS (300 parking reservations) =====
  console.log('🎟️  Creating 300 parking reservations...');
  const statuses = ['ACTIVE', 'USED', 'USED', 'USED', 'CANCELLED']; // weight towards USED
  let resCount = 0;
  for (let i = 0; i < 300; i++) {
    const client = randomEl(clients);
    const lot = randomEl(lots);
    const status = randomEl(statuses);
    const createdAt = randomDate(60);
    const startTime = new Date(createdAt);
    const hours = randomBetween(1, 8);
    const endTime = status !== 'ACTIVE' ? new Date(startTime.getTime() + hours * 3600000) : null;
    const price = hours * lot.pricePerHour;

    await prisma.reservation.create({
      data: {
        userId: client.id, lotId: lot.id, status,
        startTime, endTime, price,
        qrToken: uuidv4(), createdAt,
      },
    });
    resCount++;
  }
  console.log(`   ✅ ${resCount} reservations`);

  // ===== 4. WASHING LOCATIONS (20, one per wash owner) =====
  console.log('🚿 Creating 20 washing locations...');
  const washLocs = [];
  for (let i = 0; i < washOwners.length; i++) {
    const openTime = randomBetween(7, 10);
    const closeTime = randomBetween(19, 23);
    const loc = await prisma.washingLocation.create({
      data: {
        ownerId: washOwners[i].id, name: washNames[i] || `Wash Store ${i + 1}`,
        address: `${randomBetween(1, 200)} ${randomEl(streetNames)} St, Cairo`,
        latitude: cairoLat(), longitude: cairoLng(),
        openTime, closeTime, openHours: `${openTime}:00 - ${closeTime}:00`,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)), reviewCount: 0,
      },
    });

    // Add 3-6 services per location
    const numServices = randomBetween(3, 6);
    const usedIndices = new Set();
    for (let s = 0; s < numServices; s++) {
      let idx;
      do { idx = randomBetween(0, washServiceNames.length - 1); } while (usedIndices.has(idx));
      usedIndices.add(idx);
      await prisma.washingService.create({
        data: {
          locationId: loc.id, name: washServiceNames[idx],
          price: washServicePrices[idx] + randomBetween(-10, 30),
          oldPrice: Math.random() > 0.4 ? washServicePrices[idx] + randomBetween(20, 60) : null,
          duration: washServiceDurs[idx],
        },
      });
    }
    washLocs.push(loc);
  }
  console.log(`   ✅ ${washLocs.length} wash locations with services`);

  // ===== 5. WASHING BOOKINGS (200) =====
  console.log('📋 Creating 200 wash bookings...');
  const washStatuses = ['CONFIRMED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
  let bookCount = 0;
  for (let i = 0; i < 200; i++) {
    const client = randomEl(clients);
    const loc = randomEl(washLocs);
    const status = randomEl(washStatuses);
    const createdAt = randomDate(45);
    const bookingTime = new Date(createdAt);
    bookingTime.setHours(randomBetween(loc.openTime || 9, (loc.closeTime || 21) - 1), 0, 0, 0);
    const dur = randomBetween(20, 90);
    const endTime = new Date(bookingTime.getTime() + dur * 60000);
    const price = randomBetween(50, 400);
    const serviceNames = [];
    const numSvc = randomBetween(1, 3);
    const usedSvc = new Set();
    for (let s = 0; s < numSvc; s++) {
      let sn;
      do { sn = randomEl(washServiceNames); } while (usedSvc.has(sn));
      usedSvc.add(sn);
      serviceNames.push(sn);
    }

    await prisma.washingBooking.create({
      data: {
        userId: client.id, locationId: loc.id, status,
        services: JSON.stringify(serviceNames),
        totalDuration: dur, totalPrice: price,
        bookingTime, endTime, qrToken: uuidv4(),
        createdAt,
      },
    });
    bookCount++;
  }
  console.log(`   ✅ ${bookCount} wash bookings`);

  // ===== 6. REVIEWS (400 — across parking and washing) =====
  console.log('⭐ Creating 400 reviews...');
  let revCount = 0;

  // Parking reviews (200)
  for (let i = 0; i < 200; i++) {
    const client = randomEl(clients);
    const lot = randomEl(lots);
    const rating = randomBetween(2, 5);
    await prisma.review.create({
      data: {
        userId: client.id, rating, comment: randomEl(reviewComments),
        locationType: 'PARKING', parkingLotId: lot.id,
        createdAt: randomDate(90),
      },
    });
    revCount++;
  }

  // Washing reviews (200)
  for (let i = 0; i < 200; i++) {
    const client = randomEl(clients);
    const loc = randomEl(washLocs);
    const rating = randomBetween(3, 5);
    await prisma.review.create({
      data: {
        userId: client.id, rating, comment: randomEl(reviewComments),
        locationType: 'WASHING', washingLocationId: loc.id,
        createdAt: randomDate(90),
      },
    });
    revCount++;
  }

  // Update wash location review counts & ratings
  for (const loc of washLocs) {
    const reviews = await prisma.review.findMany({ where: { washingLocationId: loc.id, locationType: 'WASHING' } });
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    await prisma.washingLocation.update({
      where: { id: loc.id },
      data: { rating: parseFloat(avgRating.toFixed(1)), reviewCount: reviews.length },
    });
  }

  console.log(`   ✅ ${revCount} reviews`);

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETE!');
  console.log('='.repeat(50));
  console.log(`  👤 Users:       ${clients.length + parkingOwners.length + washOwners.length}`);
  console.log(`  🅿️  Parking:     ${lots.length} lots, ${resCount} reservations`);
  console.log(`  🚿 Washing:     ${washLocs.length} locations, ${bookCount} bookings`);
  console.log(`  ⭐ Reviews:     ${revCount}`);
  console.log('='.repeat(50));
  console.log('\n📱 Demo Credentials (Password: Password123):');
  console.log('  Client:        ahmed@demo.com');
  console.log('  Parking Owner: owner@demo.com');
  console.log('  Wash Owner:    wash@demo.com');
  console.log('='.repeat(50) + '\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
