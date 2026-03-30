const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const calculateRoutes = require("./routes/calculateRoutes");

app.use("/api", calculateRoutes);

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
