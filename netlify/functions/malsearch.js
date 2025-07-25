export async function handler(event) {
  const { searchParams } = new URL(event.rawUrl);
  const query = searchParams.get("q");

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing search query" }),
    };
  }

  const CLIENT_ID = process.env.MAL_CLIENT_ID; //  Need to set up this environment variable in Netlify

  try {
    const res = await fetch(`https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(query)}&limit=5`, {
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID,
      },
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API error", detail: err.message }),
    };
  }
}
