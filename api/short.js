const PREFIX = process.env.VERCEL_URL ?
      `https://shorter-url.vercel.app/api/u?id=`:
      "http://localhost:3000/api/u?id=";

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "max-age=0, s-maxage=86400");

  const { url } = req.query;
  console.log(`Shortening ${url}...`);

  if (!url) {
    res.statusCode = 400;
    res.end(JSON.stringify({
      ok: false,
      error: "Missing url argument",
    }, null, 2));
    return;
  }

  if (!isURL(url)) {
    res.statusCode = 400;
    res.end(JSON.stringify({
      ok: false,
      error: `"${url}" is not a URL`,
    }, null, 2));
    return;
  }

  shortener(url).then(short_url => {
    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      original_url: url,
      short_url
    }, null, 2));
  }).catch(error => {
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: error.message
    }, null, 2));
  })
};

function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch(error) {
    return false;
  }
}

async function shortener(original_url) {
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(
    // mongodb+srv://xcy:<password>@cluster0.lelfo.azure.mongodb.net/shorter-url-db?retryWrites=true&w=majority
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const collection = client.db(DATABASE).collection("urls");

    let short_url = null;
    while (true) {
      const id = require('shortid').generate();
      short_url = PREFIX + id;

      const duplicate = await collection.findOne({short_url});
      if (!duplicate) {
        await collection.insertOne({original_url, short_url});
        break;
      }
    }

    return short_url;
  } finally {
    await client.close();
  }
}
