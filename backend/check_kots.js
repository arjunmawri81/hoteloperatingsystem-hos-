require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const KOT = require("./src/models/KOT");
  const Order = require("./src/models/RestaurantOrder");

  const kots = await KOT.find().sort({ createdAt: -1 }).limit(5);
  const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

  console.log("\n=== LAST 5 KOTs ===");
  kots.forEach((k) =>
    console.log(JSON.stringify({
      kotNumber: k.kotNumber,
      table: k.tableNumber,
      status: k.status,
      itemCount: k.items?.length,
      items: k.items?.map(i => i.name),
      created: k.createdAt,
    }))
  );

  console.log("\n=== LAST 5 ORDERS ===");
  orders.forEach((o) =>
    console.log(JSON.stringify({
      id: o.id,
      table: o.tableNumber,
      guest: o.guestName,
      status: o.status,
      itemCount: o.items?.length,
      created: o.createdAt,
    }))
  );

  await mongoose.disconnect();
  console.log("\nDone.");
});
