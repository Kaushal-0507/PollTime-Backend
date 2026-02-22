const app = require("./app");
const connectDB = require("./config/database");
const { PORT } = require("./config/env");

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
