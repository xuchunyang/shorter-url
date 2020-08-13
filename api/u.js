const PREFIX = process.env.VERCEL_URL ?
      `https://shorter-url.vercel.app/api/u?id=`:
      "http://localhost:3000/api/u?id=";

module.exports = (req, res) => {
  const { id } = req.query;
  if (!id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({error: "Missing id argument"}));
  }

  const short_url = PREFIX + id;
  getOriginalURL(short_url)
    .then(original_url => {
      res.setHeader("Cache-Control", "max-age=0, s-maxage=86400");
      res.statusCode = 301;
      res.setHeader("Location", original_url);
      res.end();
    })
    .catch(error => {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({error: error.message}));
    });
}

async function getOriginalURL(short_url) {
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const DATABASE = require("url").parse(process.env.MONGODB_URI).pathname.substr(1);
    const collection = client.db(DATABASE).collection("urls");

    const found = await collection.findOne({short_url});
    if (!found) throw new Error("Invalid short URL");
    return found.original_url;
  } finally {
    await client.close();
  }
}
