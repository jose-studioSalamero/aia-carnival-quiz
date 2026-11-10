const crypto = require("crypto");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function parseAndValidateBirthday(input) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  if (!match) return null;

  const mm = Number(match[1]);
  const dd = Number(match[2]);
  const yyyy = Number(match[3]);

  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  if (yyyy < 1900 || yyyy > new Date().getFullYear()) return null;

  const d = new Date(yyyy, mm - 1, dd);
  // Reject any overflow (e.g. Feb 30, Apr 31, Feb 29 on non-leap years)
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return null;
  }

  // Reject future dates
  if (d.getTime() > Date.now()) return null;

  return `${match[1]}/${match[2]}/${match[3]}`; // already in correct MM/DD/YYYY format
}

const validBirthday = birthday ? parseAndValidateBirthday(birthday) : null;
if (birthday && !validBirthday) {
  return res.status(400).json({ error: "invalid_birthday" });
}
// only include BIRTHDAY in merge_fields if validBirthday is truthy
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

function readRawBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => { data += chunk; });
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

	const {
		email,
		firstName,
		lastName,
		phone,
		birthday,
		marketingConsent,
		dataSharingConsent,
		persona,
		locale,
	} = body;

	if (typeof email !== "string" || email.length > 320 || !EMAIL_RE.test(email)) {
		return respond(res, 400, { error: "invalid_email" });
	}
	if (firstName !== undefined && (typeof firstName !== "string" || firstName.length > 256)) {
		return respond(res, 400, { error: "invalid_first_name" });
	}
	if (lastName !== undefined && (typeof lastName !== "string" || lastName.length > 256)) {
		return respond(res, 400, { error: "invalid_last_name" });
	}
	if (phone !== undefined && (typeof phone !== "string" || phone.length > 32)) {
		return respond(res, 400, { error: "invalid_phone" });
	}
	if (birthday !== undefined && (typeof birthday !== "string" || !DOB_RE.test(birthday))) {
		return respond(res, 400, { error: "invalid_birthday" });
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
	if (firstName) mergeFields.FNAME = firstName;
	if (lastName) mergeFields.LNAME = lastName;
	if (phone) mergeFields.PHONE = phone;
	if (birthday) {
	const [day, month, year] = birthday.split("/");
	mergeFields.BIRTHDAY = `${month}/${day}/${year}`;
}
	if (persona) mergeFields.PERSONA = PERSONA_LABELS[persona];

	// Maps to the two checkboxes on the live site (marketing consent / AIA data-sharing
	// consent). Interest IDs are specific to this Mailchimp audience — fetched once via:
	//   GET https://<dc>.api.mailchimp.com/3.0/lists/<listId>/interest-categories
	//   GET .../interest-categories/<categoryId>/interests
	// and set as env vars below.
	const interests = {};
	const marketingInterestId = process.env.MAILCHIMP_INTEREST_MARKETING_ID;
	const dataSharingInterestId = process.env.MAILCHIMP_INTEREST_DATA_SHARING_ID;
	if (marketingInterestId) interests[marketingInterestId] = Boolean(marketingConsent);
	if (dataSharingInterestId) interests[dataSharingInterestId] = Boolean(dataSharingConsent);

	const payload = {
		email_address: email,
		status_if_new: "subscribed",
		...(Object.keys(mergeFields).length ? { merge_fields: mergeFields } : {}),
		...(Object.keys(interests).length ? { interests } : {}),
		...(locale ? { language: locale.startsWith("zh") ? "zh" : "en" } : {}),
	};

	let response, data;
	try {
		response = await fetch(url, {
			method: "PUT",
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

module.exports.config = {
	api: {
		bodyParser: false,
	},
};