const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("BeyCord is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});