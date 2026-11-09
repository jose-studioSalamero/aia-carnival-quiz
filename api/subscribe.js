const crypto = require("crypto");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSONA_LABELS = {
	thrill: "Daredevil",
	games: "Game MVP",
	food: "Certified Foodie",
	content: "Selfie Star",
};

function respond(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "no-store");
	res.end(JSON.stringify(body));
}

// Reads the raw, unparsed body ourselves instead of letting
// Vercel's automatic JSON parser crash on bad input.
function readRawBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
		});
		req.on("end", () => resolve(data));
		req.on("error", reject);
	});
}

module.exports = async function handler(req, res) {
	res.setHeader("Cache-Control", "no-store");

	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return respond(res, 405, { error: "method_not_allowed" });
	}

	let raw;
	try {
		raw = await readRawBody(req);
	} catch (error) {
		console.error("Failed to read request body.", error);
		return respond(res, 400, { error: "invalid_submission" });
	}

	let body;
	try {
		body = raw ? JSON.parse(raw) : {};
	} catch {
		return respond(res, 400, { error: "invalid_json" });
	}
	if (!body || typeof body !== "object") return respond(res, 400, { error: "invalid_submission" });

	const { email, name, persona, locale } = body;

	if (typeof email !== "string" || email.length > 320 || !EMAIL_RE.test(email)) {
		return respond(res, 400, { error: "invalid_email" });
	}
	if (name !== undefined && (typeof name !== "string" || name.length > 200)) {
		return respond(res, 400, { error: "invalid_name" });
	}
	if (persona !== undefined && !PERSONA_LABELS[persona]) {
		return respond(res, 400, { error: "invalid_persona" });
	}

	const apiKey = process.env.MAILCHIMP_API_KEY;
	const listId = process.env.MAILCHIMP_AUDIENCE_ID;
	if (!apiKey || !listId) {
		console.error("Mailchimp env vars are not configured.");
		return respond(res, 503, { error: "mailchimp_unavailable" });
	}

	const dataCenter = apiKey.split("-")[1];
	if (!dataCenter) {
		console.error("MAILCHIMP_API_KEY is malformed (missing data-center suffix, e.g. -us21).");
		return respond(res, 503, { error: "mailchimp_unavailable" });
	}

	const subscriberHash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
	const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

	const mergeFields = {};
	if (name) mergeFields.FNAME = name;
	if (persona) mergeFields.PERSONA = PERSONA_LABELS[persona];

	const payload = {
		email_address: email,
		status_if_new: "subscribed", // only applies if this email is new
		...(Object.keys(mergeFields).length ? { merge_fields: mergeFields } : {}),
		...(locale ? { language: locale.startsWith("zh") ? "zh" : "en" } : {}),
	};

	let response, data;
	try {
		response = await fetch(url, {
			method: "PUT", // upsert: creates on first call, updates merge fields on later calls
			headers: {
				Authorization: `apikey ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
		data = await response.json();
	} catch (error) {
		console.error("Mailchimp request failed.", error);
		return respond(res, 502, { error: "mailchimp_request_failed" });
	}

	if (!response.ok) {
		console.error(`Mailchimp request failed with status ${response.status}:`, data);
		return respond(res, 502, { error: "mailchimp_request_failed", detail: data.detail });
	}

	return respond(res, 200, { success: true });
};

// This is the important new bit — tells Vercel:
// "Don't auto-parse the body for me, I'll handle it myself above."
module.exports.config = {
	api: {
		bodyParser: false,
	},
};