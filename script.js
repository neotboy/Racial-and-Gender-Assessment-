const EMAILJS_CONFIG = {
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID",
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  teacherEmail: "fynnley.toppert@linnmar.k12.ia.us"
};

const STORAGE_KEY = "sociologySummativeReflectionDraft";
const START_TIME_KEY = "sociologySummativeReflectionStartTime";

const questionMap = [
  { name: "studentName", label: "Student name", standard: "Student information", type: "text" },
  { name: "v1_q1", label: "1. Best explanation of social stratification", standard: "SS.9-12.Soc.12", type: "multiple choice" },
  { name: "v1_q2", label: "2. Describe the U.S. class system", standard: "SS.9-12.Soc.12", type: "short answer" },
  { name: "v1_q3", label: "3. Meaning of life chances", standard: "SS.9-12.Soc.12", type: "multiple choice" },
  { name: "v1_q4", label: "4. Evidence from Video 1 about class and opportunity", standard: "SS.9-12.Soc.13", type: "evidence from video" },
  { name: "v2_q1", label: "5. How inequality can affect a group", standard: "SS.9-12.Soc.13", type: "multiple choice" },
  { name: "v2_q2", label: "6. Race, gender, class, and opportunity", standard: "SS.9-12.Soc.13", type: "paragraph reflection" },
  { name: "v2_q3", label: "7. How institutions can reinforce inequality", standard: "SS.9-12.Soc.14", type: "multiple choice" },
  { name: "v2_q4", label: "8. Institutions reinforcing or challenging inequality", standard: "SS.9-12.Soc.14", type: "short answer" },
  { name: "compare_q1", label: "9. Compare and contrast both videos", standard: "SS.9-12.Soc.12; SS.9-12.Soc.13", type: "compare and contrast" },
  { name: "compare_q2", label: "10. Evidence from both videos about institutions", standard: "SS.9-12.Soc.14", type: "evidence from videos" },
  { name: "compare_q3", label: "11. Government policy response to inequality", standard: "SS.9-12.Soc.15", type: "multiple choice" },
  { name: "final_q1", label: "12. Evaluate responses to inequality", standard: "SS.9-12.Soc.15", type: "paragraph reflection" },
  { name: "final_q2", label: "13. Personal sociology reflection", standard: "SS.9-12.Soc.12; SS.9-12.Soc.13; SS.9-12.Soc.14; SS.9-12.Soc.15", type: "personal reflection" }
];

const form = document.querySelector("#assessmentForm");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const saveStatus = document.querySelector("#saveStatus");
const reviewButton = document.querySelector("#reviewButton");
const submitButton = document.querySelector("#submitButton");
const reviewScreen = document.querySelector("#reviewScreen");
const reviewContent = document.querySelector("#reviewContent");
const formMessage = document.querySelector("#formMessage");
const clearDraftButton = document.querySelector("#clearDraftButton");
const confirmationScreen = document.querySelector("#confirmationScreen");
const confirmationDetails = document.querySelector("#confirmationDetails");
const newSubmissionButton = document.querySelector("#newSubmissionButton");
const modeToggle = document.querySelector("#modeToggle");

let saveTimer;

function setupStartTime() {
  if (!localStorage.getItem(START_TIME_KEY)) {
    localStorage.setItem(START_TIME_KEY, new Date().toISOString());
  }
}

function getFieldValue(name) {
  const fields = form.elements[name];
  if (!fields) return "";

  if (fields instanceof RadioNodeList) {
    return fields.value || "";
  }

  return fields.value?.trim() || "";
}

function getFormData() {
  return questionMap.reduce((data, question) => {
    data[question.name] = getFieldValue(question.name);
    return data;
  }, {});
}

function setFormData(data) {
  questionMap.forEach((question) => {
    const fields = form.elements[question.name];
    if (!fields || data[question.name] === undefined) return;

    if (fields instanceof RadioNodeList) {
      fields.value = data[question.name];
    } else {
      fields.value = data[question.name];
    }
  });
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormData()));
  saveStatus.textContent = `Draft saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function scheduleSave() {
  saveStatus.textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 300);
}

function loadDraft() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    setFormData(JSON.parse(saved));
    saveStatus.textContent = "Saved draft loaded";
  } catch (error) {
    console.warn("Saved draft could not be loaded.", error);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateProgress() {
  const data = getFormData();
  const answered = questionMap.filter((question) => data[question.name]).length;
  const percent = Math.round((answered / questionMap.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}% complete`;
}

function validateForm() {
  const firstInvalid = form.querySelector(":invalid");
  if (!firstInvalid) {
    formMessage.textContent = "";
    return true;
  }

  formMessage.textContent = "Please answer every required question before reviewing or submitting.";
  firstInvalid.focus();
  firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildReview() {
  const data = getFormData();
  reviewContent.innerHTML = questionMap
    .map((question) => `
      <article class="review-item">
        <h3>${escapeHtml(question.label)}</h3>
        <p><strong>Standard:</strong> ${escapeHtml(question.standard)}</p>
        <p><strong>Answer:</strong> ${escapeHtml(data[question.name] || "No response")}</p>
      </article>
    `)
    .join("");
}

function getCompletionTime() {
  const start = new Date(localStorage.getItem(START_TIME_KEY));
  const end = new Date();
  const elapsedMilliseconds = end - start;

  if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
    return "Not available";
  }

  const minutes = Math.floor(elapsedMilliseconds / 60000);
  const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
  return `${minutes} minutes, ${seconds} seconds`;
}

function getStandardsBreakdown(data) {
  const standards = {};

  questionMap.slice(1).forEach((question) => {
    question.standard.split(";").map((standard) => standard.trim()).forEach((standard) => {
      if (!standards[standard]) standards[standard] = [];
      standards[standard].push({
        question: question.label,
        type: question.type,
        answer: data[question.name]
      });
    });
  });

  return standards;
}

function buildPlainTextEmail(data, completionTime) {
  const lines = [
    "Sociology Summative Reflection Assessment",
    `Student name: ${data.studentName}`,
    `Completion time: ${completionTime}`,
    `Submitted at: ${new Date().toLocaleString()}`,
    "",
    "Student responses:"
  ];

  questionMap.slice(1).forEach((question) => {
    lines.push("", `${question.label}`, `Type: ${question.type}`, `Standard(s): ${question.standard}`, `Answer: ${data[question.name]}`);
  });

  lines.push("", "Standards breakdown:");
  const breakdown = getStandardsBreakdown(data);
  Object.entries(breakdown).forEach(([standard, items]) => {
    lines.push("", standard);
    items.forEach((item) => {
      lines.push(`- ${item.question} (${item.type})`);
    });
  });

  return lines.join("\n");
}

function buildEmailParams(data, completionTime) {
  return {
    to_email: EMAILJS_CONFIG.teacherEmail,
    student_name: data.studentName,
    completion_time: completionTime,
    multiple_choice_answers: [
      `1. ${data.v1_q1}`,
      `3. ${data.v1_q3}`,
      `5. ${data.v2_q1}`,
      `7. ${data.v2_q3}`,
      `11. ${data.compare_q3}`
    ].join("\n"),
    written_responses: [
      `2. ${data.v1_q2}`,
      `4. ${data.v1_q4}`,
      `6. ${data.v2_q2}`,
      `8. ${data.v2_q4}`,
      `9. ${data.compare_q1}`,
      `10. ${data.compare_q2}`
    ].join("\n\n"),
    final_reflection: [`12. ${data.final_q1}`, `13. ${data.final_q2}`].join("\n\n"),
    standards_breakdown: JSON.stringify(getStandardsBreakdown(data), null, 2),
    full_submission: buildPlainTextEmail(data, completionTime)
  };
}

function emailJsIsConfigured() {
  return !Object.values(EMAILJS_CONFIG).some((value) => value.startsWith("YOUR_EMAILJS"));
}

async function sendSubmission(data, completionTime) {
  if (!emailJsIsConfigured()) {
    console.info("EmailJS placeholders are not configured. Submission preview:", buildEmailParams(data, completionTime));
    return { previewOnly: true };
  }

  if (!window.emailjs) {
    throw new Error("EmailJS did not load. Check the script connection or internet access.");
  }

  emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  await emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    buildEmailParams(data, completionTime)
  );

  return { previewOnly: false };
}

function showConfirmation(data, completionTime, previewOnly) {
  form.hidden = true;
  confirmationScreen.hidden = false;
  confirmationDetails.textContent = previewOnly
    ? `Draft submission for ${data.studentName} is complete. Add your EmailJS IDs in script.js to send emails to ${EMAILJS_CONFIG.teacherEmail}. Completion time: ${completionTime}.`
    : `Submission for ${data.studentName} was sent to ${EMAILJS_CONFIG.teacherEmail}. Completion time: ${completionTime}.`;
  confirmationScreen.focus();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("sociologyAssessmentTheme");
  const useDark = savedTheme === "dark";
  document.body.classList.toggle("dark", useDark);
  modeToggle.textContent = useDark ? "Light mode" : "Dark mode";
}

reviewButton.addEventListener("click", () => {
  if (!validateForm()) return;
  buildReview();
  reviewScreen.hidden = false;
  submitButton.hidden = false;
  reviewButton.textContent = "Update review";
  reviewScreen.scrollIntoView({ behavior: "smooth", block: "start" });
});

form.addEventListener("input", () => {
  updateProgress();
  scheduleSave();
  if (!reviewScreen.hidden) buildReview();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const data = getFormData();
  const completionTime = getCompletionTime();
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  formMessage.textContent = "";

  try {
    const result = await sendSubmission(data, completionTime);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(START_TIME_KEY);
    showConfirmation(data, completionTime, result.previewOnly);
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Your answers were saved, but the email could not be sent. Please check EmailJS settings and try again.";
    submitButton.disabled = false;
    submitButton.textContent = "Submit final responses";
  }
});

clearDraftButton.addEventListener("click", () => {
  const keepGoing = window.confirm("Clear the saved draft on this browser? Your typed answers will also be cleared.");
  if (!keepGoing) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(START_TIME_KEY);
  form.reset();
  reviewScreen.hidden = true;
  submitButton.hidden = true;
  reviewButton.textContent = "Review before submitting";
  setupStartTime();
  updateProgress();
  saveStatus.textContent = "Draft cleared";
});

newSubmissionButton.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  confirmationScreen.hidden = true;
  reviewScreen.hidden = true;
  submitButton.hidden = true;
  reviewButton.textContent = "Review before submitting";
  setupStartTime();
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

modeToggle.addEventListener("click", () => {
  const useDark = !document.body.classList.contains("dark");
  document.body.classList.toggle("dark", useDark);
  localStorage.setItem("sociologyAssessmentTheme", useDark ? "dark" : "light");
  modeToggle.textContent = useDark ? "Light mode" : "Dark mode";
});

setupStartTime();
applySavedTheme();
loadDraft();
updateProgress();
