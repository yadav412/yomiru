export async function handler(event) {
  const { searchParams } = new URL(event.rawUrl);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing image URL" }),
    };
  }

  try {
    const res = await fetch(`https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(imageUrl)}`);
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
