const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const handler = require("./quiz-submissions");

const originalFetch = global.fetch;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalSecretKey = process.env.SUPABASE_SECRET_KEY;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
	global.fetch = originalFetch;
	if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
	else process.env.SUPABASE_URL = originalSupabaseUrl;
	if (originalSecretKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
	else process.env.SUPABASE_SECRET_KEY = originalSecretKey;
	if (originalServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
	else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
});

function createResponseRecorder() {
	return {
		headers: {},
		setHeader(name, value) {
			this.headers[name] = value;
		},
		end(body) {
			this.body = JSON.parse(body);
		},
	};
}

function createRequest({ method = "POST", body, headers = {} } = {}) {
	return { method, body, headers };
}

test("rejects methods other than POST", async () => {
	const res = createResponseRecorder();
	await handler(createRequest({ method: "GET" }), res);
	assert.equal(res.statusCode, 405);
	assert.equal(res.headers.Allow, "POST");
});

test("rejects incomplete or invalid answers without writing to storage", async () => {
	global.fetch = async () => {
		throw new Error("Storage should not be called for invalid submissions");
	};
	const res = createResponseRecorder();
	await handler(createRequest({
		body: { submissionId: "8a5a9514-4d58-4cab-bd29-b375a4eb8d80", answers: ["thrill"], locale: "en" },
	}), res);
	assert.equal(res.statusCode, 400);
	assert.equal(res.body.error, "invalid_submission");
});

test("stores the answers and locale with the server-calculated persona", async () => {
	process.env.SUPABASE_URL = "https://example.supabase.co";
	process.env.SUPABASE_SECRET_KEY = "test-secret-key";
	let request;
	global.fetch = async (url, options) => {
		request = { url: String(url), options };
		return { ok: true, status: 201 };
	};

	const res = createResponseRecorder();
	await handler(createRequest({
		body: {
			submissionId: "8a5a9514-4d58-4cab-bd29-b375a4eb8d80",
			answers: ["thrill", "games", "games", "food", "games"],
			locale: "zh-Hant",
		},
		headers: { host: "quiz.example.com", origin: "https://quiz.example.com", "content-type": "application/json" },
	}), res);

	assert.equal(res.statusCode, 201);
	assert.deepEqual(res.body, { persona: "games", score: 3, dominantLetter: "B" });
	assert.equal(request.url, "https://example.supabase.co/rest/v1/quiz_submissions?on_conflict=id");
	assert.equal(request.options.headers.apikey, "test-secret-key");
	assert.equal(request.options.headers.Authorization, undefined);
	assert.equal(request.options.headers.Prefer, "resolution=ignore-duplicates,return=minimal");
	assert.deepEqual(JSON.parse(request.options.body), {
		id: "8a5a9514-4d58-4cab-bd29-b375a4eb8d80",
		answer_1: "thrill",
		answer_2: "games",
		answer_3: "games",
		answer_4: "food",
		answer_5: "games",
		locale: "zh-Hant",
		persona: "games",
	});
});

test("rejects cross-origin submissions", async () => {
	const res = createResponseRecorder();
	await handler(createRequest({
		body: {},
		headers: { host: "quiz.example.com", origin: "https://other.example.com" },
	}), res);
	assert.equal(res.statusCode, 403);
	assert.equal(res.body.error, "origin_not_allowed");
});

test("reports a storage failure without exposing service details", async () => {
	process.env.SUPABASE_URL = "https://example.supabase.co";
	process.env.SUPABASE_SECRET_KEY = "test-secret-key";
	const originalError = console.error;
	console.error = () => {};
	global.fetch = async () => ({ ok: false, status: 401 });

	const res = createResponseRecorder();
	try {
		await handler(createRequest({
			body: {
				submissionId: "8a5a9514-4d58-4cab-bd29-b375a4eb8d80",
				answers: ["food", "food", "food", "food", "food"],
				locale: "en",
			},
		}), res);
	} finally {
		console.error = originalError;
	}
	assert.equal(res.statusCode, 502);
	assert.deepEqual(res.body, { error: "storage_request_failed" });
});
