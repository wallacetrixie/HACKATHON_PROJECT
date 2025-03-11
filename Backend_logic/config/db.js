const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost", // or your database host
  user: "root",
  password: "",
  database: "consiouscart",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

module.exports = db;
