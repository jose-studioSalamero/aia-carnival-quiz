const screens = [...document.querySelectorAll("[data-screen]")];
const questions = [...document.querySelectorAll(".question-screen")];
let activeQuestion = 0;

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
			showScreen("question", Math.min(questions.length - 1, activeQuestion + 1));
			break;
		case "result":
			showScreen("result");
			document.querySelector("#persona-name").focus({ preventScroll: true });
			break;
		case "result-back":
			showScreen("question", questions.length - 1);
			break;
		case "retry":
			document.querySelectorAll(".question-form").forEach((form) => {
				const defaultAnswer = form.querySelector('input[type="radio"][checked]');
				form.reset();
				if (defaultAnswer) defaultAnswer.checked = true;
			});
			showScreen("intro");
			break;
	}
});
