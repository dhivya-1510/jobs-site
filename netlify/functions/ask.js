// Netlify serverless function — keeps your Anthropic API key on the server, never sent to visitors.
// Set ANTHROPIC_API_KEY in Netlify: Site settings → Environment variables.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let prompt;
  try {
    prompt = JSON.parse(event.body).prompt;
  } catch {
    return { statusCode: 400, body: "Bad request" };
  }
  if (!prompt || typeof prompt !== "string") {
    return { statusCode: 400, body: "Missing prompt" };
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: "You are a career coach helping an international jobseeker in Germany improve their resume and job search. Be specific, concise, and practical (short paragraphs or bullet points).\n\n" + prompt
        }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return { statusCode: r.status, body: JSON.stringify({ text: "Assistant error: " + errText.slice(0, 200) }) };
    }

    const data = await r.json();
    const text = data.content?.[0]?.text || "No response.";
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ text: "Server error contacting the assistant." }) };
  }
};
