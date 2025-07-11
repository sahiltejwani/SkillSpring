const cron = require("node-cron");
const User = require("../models/User");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const usersToDelete = await User.find({
      isDeletionRequested: true,
      deletionTime: { $lte: now },
    });

    for (const user of usersToDelete) {
      await User.findByIdAndDelete(user._id);
      console.log(`Deleted user ${user._id} after 1 day`);
    }
  } catch (error) {
    console.error("Error deleting users:", error);
  }
});
