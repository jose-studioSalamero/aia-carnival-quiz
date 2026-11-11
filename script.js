const PENDING_REQUESTS_KEY = "aia-carnival-pending-requests";

function readPendingRequests() {
	try {
		return JSON.parse(localStorage.getItem(PENDING_REQUESTS_KEY)) || [];
	} catch {
		return [];
	}
}

function writePendingRequests(requests) {
	try {
		localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
	} catch (error) {
		console.error("Could not persist pending requests.", error);
	}
}

function queuePendingRequest(url, payload) {
	const requests = readPendingRequests();
	requests.push({ url, payload, queuedAt: Date.now() });
	writePendingRequests(requests);
}

// Tries once immediately; if it fails (offline, 5xx, etc.) it queues for later retry.
async function sendOrQueue(url, payload) {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (!response.ok) throw new Error(`${url} failed with status ${response.status}`);
		return await response.json();
	} catch (error) {
		queuePendingRequest(url, payload);
		throw error;
	}
}

let isFlushingQueue = false;
async function flushPendingRequests() {
	if (isFlushingQueue) return;
	isFlushingQueue = true;

	const requests = readPendingRequests();
	const remaining = [];

	for (const request of requests) {
		try {
			const response = await fetch(request.url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(request.payload),
			});
			if (!response.ok) throw new Error(`Retry to ${request.url} failed with status ${response.status}`);
		} catch {
			remaining.push(request); // keep it for the next attempt
		}
	}

	writePendingRequests(remaining);
	isFlushingQueue = false;
}

window.addEventListener("online", flushPendingRequests);
window.addEventListener("load", flushPendingRequests);
setInterval(flushPendingRequests, 30000); // Safari's 'online' event isn't always reliable on iPads

const screens = [...document.querySelectorAll("[data-screen]")];
const questions = [...document.querySelectorAll(".question-screen")];
let activeQuestion = 0;
let activeLocale = "en";
let submissionId = createSubmissionId();
let submissionStarted = false;

const personas = {
	thrill: {
		mascot: "ZIPPY CAPPY",
		art: "assets/Carnival_Daredevil_PersonaCard_DAREDEVIL.png",
		title: { en: "Daredevil", "zh-Hant": "速度冒險家", "zh-Hans": "极速冒险家" },
	},
	games: {
		mascot: "ROBO-C12",
		art: "assets/Carnival_Daredevil_PersonaCard_GAMEMVP.png",
		title: { en: "Game MVP", "zh-Hant": "攤位遊戲達人", "zh-Hans": "摊位游戏达人" },
	},
	food: {
		mascot: "VIOLET",
		art: "assets/Carnival_Daredevil_PersonaCard_CERTRIFIEDFOODIE.png",
		title: { en: "Certified Foodie", "zh-Hant": "美食家", "zh-Hans": "美食家" },
	},
	content: {
		mascot: "COCO Q",
		art: "assets/Carnival_Daredevil_PersonaCard_SELFIESTAR.png",
		title: { en: "Selfie Star", "zh-Hant": "自拍王", "zh-Hans": "出片王" },
	},
};

const messages = {
	en: {
		appTitle: "AIA Carnival | Next-Gen Persona Check",
		mainNavigation: "Main navigation", subscribe: "Subscribe", chooseLanguage: "Choose language", questionProgress: "Question progress",
		introTitleFirst: "Next-Gen Persona Check",
		introWelcome: "Welcome! We are scouting the next wave of fans to join us at the AIA Carnival.",
		introInstructions: "Answer the questions to unlock your official fan persona.",
		mailingListTitle: "Join our mailing list",
		nameLabel: "Given Name*", namePlaceholder: "Your name",
		emailLabel: "Email*", emailPlaceholder: "you@example.com",
		emailSubmit: "Submit", skip: "Skip",
		emailNotConnected: "Mailing list sign-up isn't connected yet. Please use Skip to continue.",
		section1: "1. Opening Protocol", section2: "2: Resource Allocation Test",
		section3: "3: Energy & Refuel Strategy", section4: "4: The Ultimate KPI",
		section5: "5: Closing Interview Pitch",
		question1: "You’ve entered the AIA Carnival. What’s your first move?",
		q1a: "A) Head straight for the fastest ride.", q1b: "B) Find the best game and plan your prize win.",
		q1c: "C) Hunt down the must-try food.", q1d: "D) Find the perfect selfie spot.",
		question2: "You have HK$200 and 30 minutes before the rush. What’s your plan?",
		q2a: "A) Fit in as many rides as possible.", q2b: "B) Target games with the best prize potential.",
		q2c: "C) Sample as many Carnival treats as possible.", q2d: "D) Find the best-lit spots for standout content.",
		question3: "It’s 7 pm and you need a recharge. What do you choose?",
		q3a: "A) A quick coffee, then back to the rides.", q3b: "B) A clean, easy snack between games.",
		q3c: "C) A street-food feast with all the favourites.", q3d: "D) The most photogenic treat on offer.",
		question4: "What proves your Carnival night was a success?",
		q4a: "A) Ride Count: Four or more thrilling rides.", q4b: "B) Prize Haul: One giant plushie.",
		q4c: "C) Taste Index: Five or more dishes tried.", q4d: "D) Content Score: A post, Reel and night portraits.",
		question5: "Why should you be recruited as a Next-Gen Superfan?",
		q5a: "A) I bring fearless energy to every ride.", q5b: "B) I turn every game into a winning strategy.",
		q5c: "C) I discover and celebrate the best flavours.", q5d: "D) I create content that brings the Carnival to life.",
		validation: "Please choose an answer to continue.", step: "Step {step}/5",
		back: "Back", next: "Next", viewPersona: "View My Persona", retry: "Try Again",
		personaLabel: "Your Official Persona",
		saving: "Saving…", saveError: "We couldn't save your answers. Please try again.",
		artworkError: "We couldn't load your persona card. Please try again.",
		subscribeSuccess: "Thanks — you're on the list!",
		surnameLabel: "Surname*", surnamePlaceholder: "Your surname",
		phoneLabel: "Phone Number", phonePlaceholder: "5123 4567",
		dobLabel: "Date of Birth", dobPlaceholder: "DD/MM/YYYY",
		marketingConsentLabel: "I wish to receive marketing and promotional materials from GCEG & GEG. *",
		dataSharingConsentLabel: "I agree to GCEG sharing of my personal data with AIA International Limited acting through its Hong Kong Branch (\u201CAIA\u201D) so that I can receive marketing and promotional materials from them, such as offers, discounts, incentive programs, new services and other marketing information.",
	},
	"zh-Hant": {
		appTitle: "友邦嘉年華｜新一代個性探索",
		mainNavigation: "主選單", subscribe: "立即訂閱", chooseLanguage: "選擇語言", questionProgress: "問題進度",
		introTitleFirst: "新一代個性探索",
		introWelcome: "歡迎！我們正在尋找新一批粉絲加入友邦嘉年華。",
		introInstructions: "回答以下問題，看看你是哪一類嘉年華粉絲！",
		mailingListTitle: "訂閱嘉年華電郵通訊",
		nameLabel: "姓名*", namePlaceholder: "你的姓名",
		emailLabel: "電郵地址*", emailPlaceholder: "you@example.com",
		emailSubmit: "提交", skip: "略過",
		emailNotConnected: "郵件列表功能尚未連接，請按「略過」繼續。",
		section1: "P1", section2: "P2",
		section3: "P3", section4: "P4", section5: "P5",
		question1: "一踏進友邦嘉年華，你會先做甚麼？",
		q1a: "A）直奔最刺激的機動遊戲。", q1b: "B）尋找最好玩的攤位遊戲，並計劃贏取心水獎品。",
		q1c: "C）尋找必吃美食。", q1d: "D）尋找最佳自拍位置。",
		question2: "你手上有 $200，而距離人流高峰時段還有 30 分鐘。你會怎樣安排？",
		q2a: "A）把握時間，盡情玩機動遊戲。", q2b: "B）挑戰獎品最吸引的攤位遊戲。",
		q2c: "C）品嚐各款嘉年華特色小食。", q2d: "D）尋找最佳打卡位置，拍照分享到社交平台。",
		question3: "現在已是晚上 7 時，是時候補充能量。你會怎樣選擇？",
		q3a: "A）喝杯咖啡，然後繼續挑戰機動遊戲。", q3b: "B）在挑戰不同攤位遊戲之間，吃點簡單小食。",
		q3c: "C）大飽口福，一次過品嚐各款至愛街頭美食。", q3d: "D）挑選最上鏡的美食，打卡拍照。",
		question4: "對你來說，怎樣才算是一次完美的嘉年華體驗？",
		q4a: "A）機動遊戲：挑戰四款或以上刺激的機動遊戲。",
		q4b: "B）獎品收穫：贏得一隻巨型毛公仔。", q4c: "C）美食指數：品嚐五款或以上嘉年華美食。",
		q4d: "D）內容產量：發布一篇帖文、一段 Reels 短片及多張令人羨慕的照片。",
		question5: "為甚麼你應該獲選為新一代嘉年華超級粉絲？",
		q5a: "A）我活力十足，最適合挑戰各款機動遊戲。",
		q5b: "B）我深諳攤位遊戲的致勝策略，獎品自然手到拿來。", q5c: "C）我最愛發掘及品嚐場內各款美食。",
		q5d: "D）我擅長創作精彩內容，將嘉年華的歡樂氣氛分享給更多人。", 
		validation: "請選擇一個答案以繼續。", step: "第 {step}/5 題",
		back: "返回", next: "下一題", viewPersona: "查看我的角色", retry: "再玩一次",
		personaLabel: "官方粉絲類型",
		saving: "正在儲存…", saveError: "未能儲存你的答案，請再試一次。",
		artworkError: "未能載入你的角色卡，請再試一次。",
		subscribeSuccess: "多謝訂閱！你已加入我們的郵件列表。",
		surnameLabel: "姓氏*", surnamePlaceholder: "你的姓氏",
		phoneLabel: "電話號碼", phonePlaceholder: "5123 4567",
		dobLabel: "出生日期", dobPlaceholder: "DD/MM/YYYY",
		marketingConsentLabel: "我希望收到GCEG及GEG的市場推廣及宣傳資料。*",
		dataSharingConsentLabel: "我同意GCEG分享我的個人資料給友邦保險國際有限公司（經由其香港分行）（「AIA」），以便我能收到他們的市場推廣及宣傳資料，例如優惠、折扣、獎勵計劃、新服務及其他市場推廣資訊。",
	},
	"zh-Hans": {
		appTitle: "友邦嘉年华｜新一代个性探索",
		mainNavigation: "主菜单", subscribe: "立即订阅", chooseLanguage: "选择语言", questionProgress: "问题进度",
		introTitleFirst: "新一代个性探索",
		introWelcome: "欢迎！我们正在寻找新一批粉丝加入友邦嘉年华。",
		introInstructions: "回答以下问题，看看你是哪一类嘉年华粉丝！",
		mailingListTitle: "订阅嘉年华电邮通讯",
		nameLabel: "姓名*", namePlaceholder: "你的姓名",
		emailLabel: "邮箱地址*", emailPlaceholder: "you@example.com",
		emailSubmit: "提交", skip: "跳过",
		emailNotConnected: "邮件列表功能尚未连接，请按“跳过”继续。",
		section1: "P1", section2: "P2",
		section3: "P3", section4: "P4", section5: "P5",
		question1: "一踏进友邦嘉年华，你会先做什么？",
		q1a: "A）直冲最刺激的机动游戏。", q1b: "B）寻找最好玩的摊位游戏，并计划赢取心水奖品。",
		q1c: "C）寻找必吃美食。", q1d: "D）寻找最佳自拍位置。",
		question2: "你手上有 $200，而距离人流高峰时段还有 30 分钟。你会怎样安排？",
		q2a: "A）把握时间，尽情玩机动游戏。", q2b: "B）挑战奖品最吸引的摊位游戏。",
		q2c: "C）品尝各类嘉年华特色小食。", q2d: "D）寻找最佳打卡位置，拍照分享到社交平台。",
		question3: "现在已经是晚上 7 点，是时候补充能量。你会怎样选择？",
		q3a: "A）喝杯咖啡，然后继续挑战机动游戏。", q3b: "B）在挑战不同摊位游戏之间，吃点简单小食。",
		q3c: "C）大快朵颐，一次过品尝各款至爱的街头美食。", q3d: "D）挑选最上镜的美食，打卡拍照。",
		question4: "对你来说，怎样才算是一次完美的嘉年华体验？",
		q4a: "A）机动游戏：挑战四款或以上刺激的机动游戏。",
		q4b: "B）奖品收获：赢得一只巨型毛公仔。", q4c: "C）美食指数：品尝五款或以上嘉年华美食。",
		q4d: "D）内容产量：发布一篇帖子、一段 Reels 短片及多张令人羡慕的照片。",
		question5: "为什么你应该被选为新一代嘉年华超级粉丝？",
		q5a: "A）我活力十足，最适合挑战各类机动游戏。",
		q5b: "B）我深谙摊位游戏的制胜策略，奖品自然手到拿来。", q5c: "C）我最爱发掘及品尝场内各类美食。",
		q5d: "D）我擅长创作精彩内容，将嘉年华的欢乐气氛分享给更多人。", 
		validation: "请选择一个答案以继续。", step: "第 {step}/5 题",
		back: "返回", next: "下一题", viewPersona: "查看我的角色", retry: "再玩一次",
		personaLabel: "官方粉丝类型",
		saving: "正在保存…", saveError: "未能保存你的答案，请重试。",
		artworkError: "未能加载你的角色卡，请重试。",
		subscribeSuccess: "感谢订阅！你已加入我们的邮件列表。",
		surnameLabel: "姓氏*", surnamePlaceholder: "你的姓氏",
		phoneLabel: "电话号码", phonePlaceholder: "5123 4567",
		dobLabel: "出生日期", dobPlaceholder: "DD/MM/YYYY",
		marketingConsentLabel: "我希望收到GCEG及GEG的市场推广及宣传资料。*",
		dataSharingConsentLabel: "我同意GCEG分享我的个人资料给友邦保险国际有限公司（经由其香港分行）（“AIA”），以便我能收到他们的市场推广及宣传资料，例如优惠、折扣、奖励计划、新服务及其他市场推广信息。",
	},
};

function createSubmissionId() {
	if (crypto.randomUUID) return crypto.randomUUID();

	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function applyLocale(locale) {
	activeLocale = locale;
	const localized = messages[locale];
	document.documentElement.lang = locale;
	document.title = localized.appTitle;

	document.querySelectorAll("[data-i18n]").forEach((element) => {
		element.textContent = localized[element.dataset.i18n];
	});
	document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
		element.setAttribute("aria-label", localized[element.dataset.i18nAria]);
	});
	document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
		element.alt = localized[element.dataset.i18nAlt];
	});
	document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
		element.placeholder = localized[element.dataset.i18nPlaceholder];
	});
	document.querySelectorAll("[data-step-label]").forEach((element) => {
		element.textContent = localized.step.replace("{step}", Number(element.dataset.stepLabel) + 1);
	});
	document.querySelectorAll("[data-locale]").forEach((button) => {
		button.setAttribute("aria-pressed", String(button.dataset.locale === locale));
	});

	if (!document.querySelector('[data-screen="result"]').hidden) showPersona();
}

document.querySelector(".language-options").addEventListener("click", (event) => {
	const button = event.target.closest("[data-locale]");
	if (!button) return;
	if (submissionStarted && button.dataset.locale !== activeLocale) {
		submissionId = createSubmissionId();
		submissionStarted = false;
	}
	applyLocale(button.dataset.locale);
	document.querySelector(".language-picker").open = false;
});

let subscriber = null; // becomes the full captured form data once someone signs up

function buildSubscriberPayload(form) {
	const firstName = form.querySelector('[name="firstName"]').value.trim();
	const lastName = form.querySelector('[name="lastName"]').value.trim();
	const email = form.querySelector('[name="email"]').value.trim();
	const dialCode = form.querySelector('[name="dialCode"]').value.trim();
	const phoneNumber = form.querySelector('[name="phone"]').value.trim();
	const birthday = form.querySelector('[name="birthday"]').value.trim();
	const marketingConsent = form.querySelector('[name="marketingConsent"]').checked;
	const dataSharingConsent = form.querySelector('[name="dataSharingConsent"]').checked;

	return {
		firstName,
		lastName,
		email,
		phone: phoneNumber ? `+${dialCode} ${phoneNumber}` : undefined,
		birthday: birthday || undefined,
		marketingConsent,
		dataSharingConsent,
	};
}

document.querySelector(".mailing-list-form").addEventListener("submit", (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	const status = document.querySelector(".mailing-list-status");

	if (!form.reportValidity()) return; // native required-field + checkbox validation

	subscriber = buildSubscriberPayload(form);

	sendOrQueue("/api/subscribe", { ...subscriber, locale: activeLocale })
		.catch((error) => console.warn("Subscribe request queued (likely offline).", error));

	status.textContent = messages[activeLocale].subscribeSuccess;
	status.hidden = false;

	setTimeout(() => {
		submissionId = createSubmissionId();
		submissionStarted = false;
		showScreen("question", 0);
	}, 900);
});

document.querySelector(".mailing-list-form").addEventListener("input", () => {
	document.querySelector(".mailing-list-status").hidden = true;
});

function fadeOutScreen(screen) {
	return new Promise((resolve) => {
		screen.classList.add("is-fading");
		const finish = () => {
			screen.removeEventListener("transitionend", finish);
			resolve();
		};
		screen.addEventListener("transitionend", finish);
		setTimeout(finish, 350); // safety fallback if transitionend doesn't fire
	});
}

async function showScreen(name, questionIndex = activeQuestion) {
	const currentScreen = screens.find((screen) => screen.classList.contains("is-active"));

	if (currentScreen) {
		await fadeOutScreen(currentScreen);
	}

	screens.forEach((screen) => {
		const isActive = screen.dataset.screen === name
			&& (name !== "question" || Number(screen.dataset.step) === questionIndex);
		screen.classList.toggle("is-active", isActive);
		screen.classList.remove("is-fading");
		screen.hidden = !isActive;
		if (isActive) screen.classList.add("is-fading"); // start transparent, ready to fade in
	});

	if (name === "question") {
		activeQuestion = questionIndex;
		if (questionIndex === 0) window.scrollTo(0, 0);
		const currentScreen = questions.find((screen) => Number(screen.dataset.step) === activeQuestion);
		const progressSteps = currentScreen.querySelectorAll("[data-progress-step]");

		progressSteps.forEach((step, index) => {
			const stepNumber = step.querySelector("span");
			const isComplete = index < activeQuestion;
			step.classList.toggle("is-current", index === activeQuestion);
			step.classList.toggle("is-complete", isComplete);
			stepNumber.textContent = isComplete ? "✓" : String(index + 1);
			if (index === activeQuestion) {
				step.setAttribute("aria-current", "step");
			} else {
				step.removeAttribute("aria-current");
			}
		});

		currentScreen.querySelector("legend").focus({ preventScroll: true });
	}

	const newScreen = screens.find((screen) => screen.classList.contains("is-active"));
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			newScreen?.classList.remove("is-fading"); // triggers the fade-in transition
		});
	});
}

function getSelectedCategory(form) {
	return form.querySelector('input[type="radio"]:checked')?.value;
}

function isCurrentAnswerValid() {
	const form = questions[activeQuestion].querySelector(".question-form");
	const error = form.querySelector(".question-error");
	if (getSelectedCategory(form)) {
		error.hidden = true;
		return true;
	}

	error.hidden = false;
	form.querySelector('input[type="radio"]').focus({ preventScroll: true });
	return false;
}

function preloadPersonaArtwork(persona) {
	const artwork = new Image();
	artwork.src = persona.art;
	return artwork.decode().then(() => artwork);
}

function showPersona(result = calculatePersona(questions.map((question) => getSelectedCategory(question.querySelector(".question-form")))), preloadedArtwork) {
	const persona = personas[result.category];
	const artwork = document.querySelector(".persona-art");

	artwork.alt = `${persona.mascot} ${persona.title[activeLocale]} persona card`;
	artwork.src = preloadedArtwork?.src ?? persona.art;
	artwork.dataset.loaded = "true";
	document.querySelector("[data-persona-mascot]").textContent = persona.mascot;
	document.querySelector("[data-persona-title]").textContent = persona.title[activeLocale];
}

function calculatePersona(answers) {
	const scores = Object.fromEntries(Object.keys(personas).map((category) => [category, 0]));
	answers.forEach((category) => {
		scores[category] += 1;
	});

	const highestScore = Math.max(...Object.values(scores));
	const leadingCategories = Object.keys(scores).filter((category) => scores[category] === highestScore);
	const finalAnswer = answers.at(-1);
	const category = leadingCategories.includes(finalAnswer)
		? finalAnswer
		: [...answers].reverse().find((answer) => leadingCategories.includes(answer));

	return {
		category,
	};
}

document.addEventListener("change", (event) => {
	const input = event.target;
	if (!(input instanceof HTMLInputElement) || input.type !== "radio") return;
	if (submissionStarted) {
		submissionId = createSubmissionId();
		submissionStarted = false;
	}
	input.closest(".question-form").querySelector(".question-error").hidden = true;
});

document.addEventListener("click", async (event) => {
	const actionButton = event.target.closest("[data-action]");
	if (!actionButton) return;

	switch (actionButton.dataset.action) {
		case "start":
			submissionId = createSubmissionId();
			submissionStarted = false;
			showScreen("question", 0);
			break;
		case "back":
			if (submissionStarted) {
				submissionId = createSubmissionId();
				submissionStarted = false;
			}
			showScreen("question", Math.max(0, activeQuestion - 1));
			break;
		case "next":
			if (!isCurrentAnswerValid()) break;
			showScreen("question", Math.min(questions.length - 1, activeQuestion + 1));
			break;
		case "result": {
			if (!isCurrentAnswerValid()) break;
			actionButton.disabled = true;
			actionButton.textContent = messages[activeLocale].saving;
			const saveError = document.querySelector(".submission-error");
			saveError.hidden = true;

			const answers = questions.map((question) => getSelectedCategory(question.querySelector(".question-form")));
			const localResult = calculatePersona(answers);

			try {
				const preloadedArtwork = await preloadPersonaArtwork(personas[localResult.category]);
				showPersona(localResult, preloadedArtwork);
				showScreen("result");
				document.querySelector("#persona-name").focus({ preventScroll: true });
			} catch (error) {
				console.error("Could not load persona artwork.", error);
				saveError.textContent = messages[activeLocale].artworkError;
				saveError.hidden = false;
				actionButton.disabled = false;
				actionButton.textContent = messages[activeLocale].viewPersona;
				break;
			}

			// Background sync — never blocks the result from showing, retried automatically if offline.
			sendOrQueue("/api/quiz-submissions", { submissionId, answers, locale: activeLocale })
				.catch((error) => console.warn("Quiz submission queued for later sync.", error));

			if (subscriber) {
				sendOrQueue("/api/subscribe", {
					...subscriber,
					persona: localResult.category,
					locale: activeLocale,
				}).catch((error) => console.warn("Mailchimp persona update queued for later sync.", error));
			}

			actionButton.disabled = false;
			actionButton.textContent = messages[activeLocale].viewPersona;
			break;
		}
		case "result-back":
			submissionId = createSubmissionId();
			submissionStarted = false;
			showScreen("question", questions.length - 1);
			break;
		case "retry":
			document.querySelectorAll(".question-form").forEach((form) => {
				form.reset();
				form.querySelector(".question-error").hidden = true;
			});
			document.querySelector(".submission-error").hidden = true;
			submissionId = createSubmissionId();
			submissionStarted = false;
			showScreen("intro");
			break;
	}
});

applyLocale(activeLocale);