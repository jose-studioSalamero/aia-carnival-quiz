const answerCategories = new Set(["thrill", "games", "food", "content"]);
const locales = new Set(["en", "zh-Hant", "zh-Hans"]);
const personaLetters = { thrill: "A", games: "B", food: "C", content: "D" };
const personaNames = {
	thrill: "Daredevil",
	games: "Game MVP",
	food: "Certified Foodie",
	content: "Selfie Star",
};

function calculatePersona(answers) {
	const scores = Object.fromEntries([...answerCategories].map((category) => [category, 0]));
	answers.forEach((category) => {
		scores[category] += 1;
	});

	const score = Math.max(...Object.values(scores));
	const leadingCategories = Object.keys(scores).filter((category) => scores[category] === score);
	const finalAnswer = answers.at(-1);
	const persona = leadingCategories.includes(finalAnswer)
		? finalAnswer
		: [...answers].reverse().find((answer) => leadingCategories.includes(answer));

	return { persona, score, dominantLetter: personaLetters[persona] };
}

function respond(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "no-store");
	res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
	res.setHeader("Cache-Control", "no-store");

	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return respond(res, 405, { error: "method_not_allowed" });
	}

	const contentLength = Number(req.headers["content-length"]);
	if (Number.isFinite(contentLength) && contentLength > 4096) {
		return respond(res, 413, { error: "submission_too_large" });
	}

	const contentType = req.headers["content-type"];
	if (contentType && !/^application\/json(?:\s*;|$)/i.test(contentType)) {
		return respond(res, 415, { error: "content_type_not_supported" });
	}

	const origin = req.headers.origin;
	const host = req.headers["x-forwarded-host"] || req.headers.host;
	if (origin && host) {
		try {
			if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
				return respond(res, 403, { error: "origin_not_allowed" });
			}
		} catch {
			return respond(res, 403, { error: "origin_not_allowed" });
		}
	}

	let body = req.body;
	if (typeof body === "string") {
		try {
			body = JSON.parse(body);
		} catch {
			return respond(res, 400, { error: "invalid_json" });
		}
	}

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return respond(res, 400, { error: "invalid_submission" });
	}

	const { submissionId, answers, locale } = body;
	const isValidId = typeof submissionId === "string"
		&& /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId);
	if (!isValidId || !Array.isArray(answers) || answers.length !== 5
		|| !answers.every((answer) => answerCategories.has(answer)) || !locales.has(locale)) {
		return respond(res, 400, { error: "invalid_submission" });
	}

	const supabaseUrl = process.env.SUPABASE_URL;
	const secretKey = process.env.SUPABASE_SECRET_KEY;
	const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const supabaseApiKey = secretKey || legacyServiceRoleKey;
	if (!supabaseUrl || !supabaseApiKey) {
		console.error("Quiz submissions are unavailable: Supabase environment variables are not configured.");
		return respond(res, 503, { error: "storage_unavailable" });
	}

	let restUrl;
	try {
		restUrl = new URL("/rest/v1/quiz_submissions", supabaseUrl);
	} catch {
		console.error("Quiz submissions are unavailable: SUPABASE_URL is invalid.");
		return respond(res, 503, { error: "storage_unavailable" });
	}
	restUrl.searchParams.set("on_conflict", "id");

	const result = calculatePersona(answers);
	const row = {
		id: submissionId,
		answer_1: answers[0],
		answer_2: answers[1],
		answer_3: answers[2],
		answer_4: answers[3],
		answer_5: answers[4],
		locale,
		persona: result.persona,
	};

	let response;
	try {
		response = await fetch(restUrl, {
			method: "POST",
			headers: {
				apikey: supabaseApiKey,
				...(secretKey ? {} : { Authorization: `Bearer ${legacyServiceRoleKey}` }),
				"Content-Type": "application/json",
				Prefer: "resolution=ignore-duplicates,return=minimal",
			},
			body: JSON.stringify(row),
		});
	} catch (error) {
		console.error("Quiz submission could not reach Supabase.", error);
		return respond(res, 502, { error: "storage_request_failed" });
	}

	if (!response.ok) {
		console.error(`Quiz submission failed in Supabase with status ${response.status}.`);
		return respond(res, 502, { error: "storage_request_failed" });
	}

	return respond(res, 201, result);
};
