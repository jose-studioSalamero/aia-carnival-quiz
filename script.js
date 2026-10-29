const screens = [...document.querySelectorAll("[data-screen]")];
const questions = [...document.querySelectorAll(".question-screen")];
let activeQuestion = 0;
let activeLocale = "en";

const personas = {
	thrill: {
		mascot: "ZIPPY CAPPY",
		title: { en: "Daredevil", "zh-Hant": "Daredevil", "zh-Hans": "Daredevil" },
		tagline: { en: "High-Velocity Thrill-Seeker", "zh-Hant": "極速冒險王", "zh-Hans": "极速冒险王" },
		power: { en: "Unmatched endurance, fearless coaster energy", "zh-Hant": "無比耐力，無懼過山車能量", "zh-Hans": "无比耐力，无惧过山车能量" },
		mission: { en: "Set the standard for maximising ride pacing, conquer every new attraction", "zh-Hant": "定立機動遊戲節奏控制的指標，征服每個新項目。", "zh-Hans": "设定机动游戏节奏控制的指标，征服每个新项目。" },
	},
	games: {
		mascot: "ROBO-C12",
		title: { en: "Game MVP", "zh-Hant": "Game MVP", "zh-Hans": "Game MVP" },
		tagline: { en: "Precision Game Strategist", "zh-Hant": "遊戲策略家", "zh-Hans": "游戏策略家" },
		power: { en: "Physics mastery, token ROI optimization", "zh-Hant": "精通物理學及代幣投資回報率", "zh-Hans": "精通物理学及代币投资回报率" },
		mission: { en: "Crack the physics behind the games. Turn tokens into huge prize hauls.", "zh-Hant": "探究攤位遊戲背後的物理原理，將代幣兌換成豐富獎品。", "zh-Hans": "观察摊位游戏背后的物理原理，将代币兑换成丰富奖品。" },
	},
	food: {
		mascot: "VIOLET",
		title: { en: "Certified Foodie", "zh-Hant": "Certified Foodie", "zh-Hans": "Certified Foodie" },
		tagline: { en: "Culinary Explorer & Foodie", "zh-Hant": "美食獵人", "zh-Hans": "美食猎人" },
		power: { en: "Trend forecasting, flavour mashup discovery", "zh-Hant": "趨勢預測，發掘不同混合新口味", "zh-Hans": "趋势预测，发掘不同混合新口味" },
		mission: { en: "Seek out culinary special treats and secret carnival snack combos.", "zh-Hant": "尋找特色美食和隱藏的嘉年華小食組合。", "zh-Hans": "寻找特色美食和隐藏的嘉年华小吃组合。" },
	},
	content: {
		mascot: "COCO Q",
		title: { en: "Selfie Star", "zh-Hant": "Selfie Star", "zh-Hans": "Selfie Star" },
		tagline: { en: "Aesthetic Curator & Creator", "zh-Hant": "靚相創作人", "zh-Hans": "镜头捕捉者" },
		power: { en: "Visual storytelling, neon framing mastery", "zh-Hant": "用視覺說故事，大師級霓虹燈光拍照技術", "zh-Hans": "用美学视觉说故事，大师级打卡包出片" },
		mission: { en: "Turn every photo op and candid laugh into top-tier content that defines the carnival aesthetic.", "zh-Hant": "將每一次拍照機會和每一次真情流露的笑聲轉化為定義嘉年華美學的頂級內容。", "zh-Hans": "将每一次拍照机会和每一次真情流露的笑声转化为定义嘉年华美学的顶级内容。" },
	},
};

const messages = {
	en: {
		appTitle: "AIA Carnival | 10 Next Gen Persona Quiz",
		mainNavigation: "Main navigation", subscribe: "Subscribe", chooseLanguage: "Choose language", questionProgress: "Question progress",
		introTitleFirst: "Next-Gen Persona Check",
		introWelcome: "Welcome! We are scouting the next wave of fans to join us at the AIA Carnival.",
		introInstructions: "Answer the questions to unlock your official fan persona.",
		socialTitle: "First follow us on social media", instagramAlt: "QR code to AIA Carnival on Instagram",
		rednoteAlt: "QR code to AIA Carnival on RedNote", instagramLabel: "@aiacarnival",
		rednoteName: "RedNote", start: "Start Now",
		section1: "1. Opening Protocol", section2: "2. Resource Allocation Test",
		section3: "3. Energy & Refuel Strategy", section4: "4. The Ultimate KPI",
		section5: "5. Closing Interview Pitch",
		question1: "You’ve entered the AIA Carnival. What’s your first move?",
		q1a: "Head straight for the fastest ride.", q1b: "Find the best game and plan your prize win.",
		q1c: "Hunt down the must-try food.", q1d: "Find the perfect selfie spot.",
		question2: "You have HK$200 and 30 minutes before the rush. What’s your plan?",
		q2a: "Fit in as many rides as possible.", q2b: "Target games with the best prize potential.",
		q2c: "Sample as many Carnival treats as possible.", q2d: "Find the best-lit spots for standout content.",
		question3: "It’s 7 pm and you need a recharge. What do you choose?",
		q3a: "A quick coffee, then back to the rides.", q3b: "A clean, easy snack between games.",
		q3c: "A street-food feast with all the favourites.", q3d: "The most photogenic treat on offer.",
		question4: "Suggested: What proves your Carnival night was a success?",
		q4a: "Ride Count: Four or more thrilling rides.", q4b: "Prize Haul: One giant plushie.",
		q4c: "Taste Index: Five or more dishes tried.", q4d: "Content Score: A post, Reel and night portraits.",
		question5: "Why should you be recruited as a Next-Gen Superfan?",
		q5a: "I bring fearless energy to every ride.", q5b: "I turn every game into a winning strategy.",
		q5c: "I discover and celebrate the best flavours.", q5d: "I create content that brings the Carnival to life.",
		validation: "Please choose an answer to continue.", step: "Step {step}/5",
		back: "Back", next: "Next", viewPersona: "View My Persona", retry: "Try Again",
		personaLabel: "Your Official Persona", superpower: "Superpower:", mission: "Mission:",
		personaScore: "Dominant Letter: Mostly {letter} · {score} out of 5 answers",
		primaryArchetype: "Primary Archetype",
	},
	"zh-Hant": {
		appTitle: "友邦嘉年華｜新一代個性探索",
		mainNavigation: "主選單", subscribe: "立即訂閱", chooseLanguage: "選擇語言", questionProgress: "問題進度",
		introTitleFirst: "新一代個性探索",
		introWelcome: "歡迎！我們正在尋找新一批粉絲加入友邦嘉年華。",
		introInstructions: "回答以下問題，以了解你是屬於哪一類型的嘉年華粉絲。",
		socialTitle: "首先，追蹤我們的社交媒體", instagramAlt: "友邦嘉年華 Instagram QR Code",
		rednoteAlt: "友邦嘉年華小紅書 QR Code", instagramLabel: "IG",
		rednoteName: "小紅書", start: "立即開始",
		section1: "入場前準備事項", section2: "2：資源分配題",
		section3: "3：補充能量策略", section4: "4：終極KPI", section5: "5：最後總結",
		question1: "您已進入友邦嘉年華，第一件事會做什麼？",
		q1a: "直衝去最刺激的機動遊戲。", q1b: "找最好玩的攤位遊戲並計劃贏取心水獎品。",
		q1c: "尋找必食美食。", q1d: "尋找完美的自拍位置。",
		question2: "你有$200，並且還有30分鐘才到高峰時間。你的計劃是什麼？",
		q2a: "盡力玩遍機動遊樂。", q2b: "選擇獎品最好的攤位遊戲。",
		q2c: "食盡所有嘉年華小食。", q2d: "找出最佳打卡位放上社交媒體。",
		question3: "已是晚上7點，你需要補充能量。你會選擇什麼？",
		q3a: "喝杯咖啡，然後繼續玩機動遊戲。", q3b: "在玩不同攤位遊戲之間吃點簡單小食。",
		q3c: "食一餐包含所有最愛的街頭美食盛宴。", q3d: "品嚐最上鏡美食。",
		question4: "建議：什麼能決定你在嘉年華的體驗是成功的？",
		q4a: "機動遊戲數量：體驗四個或以上刺激的機動遊戲。",
		q4b: "獎品收穫：一個巨型毛公仔。", q4c: "美食指數：嘗試五個或以上的美食。",
		q4d: "內容分數：一篇貼文、一段Reel影片和一些夜景人像。",
		question5: "為什麼你應該被招募為新一代超級粉絲？",
		q5a: "我為每一個機動遊戲都注入無畏無懼的活力。",
		q5b: "我將每一個攤位遊戲轉化為勝利策略。", q5c: "我搜尋並品嚐最佳美食。",
		q5d: "我製作的內容能令嘉年華充滿無限歡樂。",
		validation: "請選擇一個答案以繼續。", step: "第 {step}/5 題",
		back: "返回", next: "下一題", viewPersona: "查看我的角色", retry: "再玩一次",
		personaLabel: "官方粉絲類型", primaryArchetype: "主類型",
		superpower: "超能力：", mission: "任務：",
		personaScore: "最多字母：主要是{letter} · {score}/5",
	},
	"zh-Hans": {
		appTitle: "友邦嘉年华｜新一代个性探索",
		mainNavigation: "主菜单", subscribe: "立即订阅", chooseLanguage: "选择语言", questionProgress: "问题进度",
		introTitleFirst: "新一代个性探索",
		introWelcome: "欢迎！我们正在寻找新一批粉丝加入友邦嘉年华。",
		introInstructions: "回答以下问题，以了解你是属于哪一类型的嘉年华粉丝。",
		socialTitle: "首先，关注我们的社交媒体", instagramAlt: "友邦嘉年华 Instagram 二维码",
		rednoteAlt: "友邦嘉年华小红书二维码", instagramLabel: "IG",
		rednoteName: "小红书", start: "立即开始",
		section1: "入场前准备事项", section2: "2：资源分配题",
		section3: "3：补充能量策略", section4: "4：终极KPI", section5: "5：最后总结",
		question1: "您已进入友邦嘉年华，首先会做什么？",
		q1a: "直冲去最刺激的机动游戏。", q1b: "找最好玩的摊位游戏并计划赢取心水奖品。",
		q1c: "寻找必吃美食。", q1d: "寻找完美的自拍位置。",
		question2: "你有$200，并还有30分钟才到高峰时间。你的计划是什么？",
		q2a: "玩遍所有机动游乐。", q2b: "选择奖品最好的摊位游戏。",
		q2c: "尝遍所有嘉年华美食。", q2d: "在最佳打卡位出片。",
		question3: "已是晚上7点，你需要补充能量。你会选择什么？",
		q3a: "喝杯咖啡，然后继续玩机动游戏。", q3b: "在玩不同摊位游戏之间吃点简单小吃。",
		q3c: "一顿饱餐，品尝所有最爱的街头美食。", q3d: "品尝最出片的美食。",
		question4: "建议：什么能证明你在嘉年华的体验是成功的？",
		q4a: "机动游戏数量：体验四个或以上刺激的机动游戏。",
		q4b: "奖品收获：一个巨型毛公仔。", q4c: "美食指数：尝试五个或以上的美食。",
		q4d: "出片质量：一篇贴文、一段vlog影片和一些夜景人像。",
		question5: "为什么你应该被招募为新一代超级粉丝？",
		q5a: "我为每一个机动游戏都注入无畏无惧的活力。",
		q5b: "我将每一个摊位游戏转化为胜利策略。", q5c: "我搜寻并品尝最佳美食。",
		q5d: "我发布的社媒内容能令嘉年华更生动欢乐。",
		validation: "请选择一个答案以继续。", step: "第 {step}/5 题",
		back: "返回", next: "下一题", viewPersona: "查看我的角色", retry: "再玩一次",
		personaLabel: "官方粉丝类型", primaryArchetype: "主类型",
		superpower: "超能力：", mission: "任务：",
		personaScore: "最多字母：主要是{letter} · {score}/5",
	},
};

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
	applyLocale(button.dataset.locale);
	document.querySelector(".language-picker").open = false;
});

function showScreen(name, questionIndex = activeQuestion) {
	screens.forEach((screen) => {
		const isActive = screen.dataset.screen === name
			&& (name !== "question" || Number(screen.dataset.step) === questionIndex);
		screen.hidden = !isActive;
		screen.classList.toggle("is-active", isActive);
	});

	if (name === "question") {
		activeQuestion = questionIndex;
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

function showPersona() {
	const answers = questions.map((question) => getSelectedCategory(question.querySelector(".question-form")));
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
	const persona = personas[category];
	const letter = { thrill: "A", games: "B", food: "C", content: "D" }[category];

	document.querySelector("[data-persona-mascot]").textContent = persona.mascot;
	document.querySelector("[data-persona-title]").textContent = persona.title[activeLocale];
	document.querySelector("[data-persona-tagline]").textContent = persona.tagline[activeLocale];
	document.querySelector("[data-persona-power]").textContent = persona.power[activeLocale];
	document.querySelector("[data-persona-mission]").textContent = persona.mission[activeLocale];
	document.querySelector("[data-persona-score]").textContent = messages[activeLocale].personaScore
		.replace("{letter}", letter)
		.replace("{score}", highestScore);
}

document.addEventListener("change", (event) => {
	const input = event.target;
	if (!(input instanceof HTMLInputElement) || input.type !== "radio") return;
	input.closest(".question-form").querySelector(".question-error").hidden = true;
});

document.addEventListener("click", (event) => {
	const actionButton = event.target.closest("[data-action]");
	if (!actionButton) return;

	switch (actionButton.dataset.action) {
		case "start":
			showScreen("question", 0);
			break;
		case "back":
			showScreen("question", Math.max(0, activeQuestion - 1));
			break;
		case "next":
			if (!isCurrentAnswerValid()) break;
			showScreen("question", Math.min(questions.length - 1, activeQuestion + 1));
			break;
		case "result":
			if (!isCurrentAnswerValid()) break;
			showPersona();
			showScreen("result");
			document.querySelector("#persona-name").focus({ preventScroll: true });
			break;
		case "result-back":
			showScreen("question", questions.length - 1);
			break;
		case "retry":
			document.querySelectorAll(".question-form").forEach((form) => {
				form.reset();
				form.querySelector(".question-error").hidden = true;
			});
			showScreen("intro");
			break;
	}
});

applyLocale(activeLocale);
