const screens = [...document.querySelectorAll("[data-screen]")];
const questions = [...document.querySelectorAll(".question-screen")];
let activeQuestion = 0;

const personas = {
	thrill: {
		title: "Daredevil",
		tagline: "High-Velocity Thrill-Seeker",
		power: "Unmatched endurance and fearless coaster energy",
		mission: "Set the pace, conquer every new attraction, and keep the adrenaline high",
	},
	games: {
		title: "Prize Champion",
		tagline: "Strategic Game-Plan Master",
		power: "Sharp aim, clever tactics, and an eye for the big win",
		mission: "Turn every challenge into a winning strategy and bring home the biggest prize",
	},
	food: {
		title: "Flavor Explorer",
		tagline: "Carnival Foodie-in-Chief",
		power: "A fearless appetite and an instinct for must-try bites",
		mission: "Discover the best Carnival flavours and make every stop a delicious one",
	},
	content: {
		title: "Carnival Creator",
		tagline: "Chief Memory-Maker",
		power: "A creative eye for picture-perfect moments",
		mission: "Capture the Carnival at its brightest and share the fun with everyone",
	},
};

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

	document.querySelector("[data-persona-title]").textContent = persona.title;
	document.querySelector("[data-persona-tagline]").textContent = persona.tagline;
	document.querySelector("[data-persona-power]").textContent = persona.power;
	document.querySelector("[data-persona-mission]").textContent = persona.mission;
	document.querySelector("[data-persona-score]").textContent = `${highestScore} out of 5 answers matched this persona.`;
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
