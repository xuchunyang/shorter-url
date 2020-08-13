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
  const USER = "xcy";
  const PASSWORD = "Fh7QKDMbYWkYcqN2";
  const DATABASE = "shorter-url-db";

  const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.lelfo.azure.mongodb.net/${DATABASE}?retryWrites=true&w=majority`;
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const collection = client.db(DATABASE).collection("urls");

    const {original_url} = await collection.findOne({short_url});
    return original_url;
  } finally {
    await client.close();
  }
}
