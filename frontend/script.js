// Medicine Tracker - frontend script.
//
// The backend API runs at BASE_URL (default http://localhost:8000).
//
// TASKS
// -----
// Core task 1: implement fetchMedicines() and renderMedicines(data) so the page
//   fetches /medicines and displays it WITHOUT crashing on missing or invalid
//   data. The data contains records with a null name, an empty-string name, a
//   missing name, a null price, a missing price, and a non-numeric price. Decide
//   how to display each case (e.g. show "Unknown" or flag it) without throwing.
//
// Core task 2: implement fetchUnreliable() so it calls /medicines/unreliable,
//   shows a useful message in the #error area when it fails, and retries
//   sensibly. Do NOT hammer the server: use a small number of retries with a
//   short delay between them, and give up cleanly after a few tries. The
//   endpoint fails about 30% of the time.
//
// Stretch: add an average-price endpoint in backend/main.py and call it here.

const BASE_URL = "http://localhost:8000";

// DOM elements (already present in index.html - no layout work needed).
const resultsEl = document.getElementById("results");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");

/**
 * TODO (Core task 1): fetch the list of medicines from /medicines.
 * Return the medicines array. Surface network/HTTP errors so the caller can show them.
 */
async function processMedicineResponse(response) {
	const medicines = response.medicines;
	if (!Array.isArray(medicines))
		throw new Error("Request returned invalid data");

	return medicines.map((m) => {
		const name = m.name ? m.name : null;

		let price = null;
		try {
			price = m.price ? parseFloat(m.price) : null;
			if (!Number.isFinite(price)) price = null;
		} catch (error) {
			console.error("failed to parse price", error);
		}

		return {
			name,
			price,
		};
	});
}
async function fetchMedicines() {
	const request = await fetch(`${BASE_URL}/medicines`);
	if (!request.ok) throw new Error("Failed to retrieve medicine list");

	const response = await request.json();
	return processMedicineResponse(response);
}

/**
 * TODO (Core task 1): render the medicines into #results without crashing on
 * missing or invalid fields. Handle: null name, empty-string name, missing name,
 * null price, missing price, non-numeric price. Show something sensible for each.
 * TODO: clear the #error area on success.
 */
function createRow(elementName, col1, col2) {
	const row = document.createElement("tr");

	const col1Container = document.createElement(elementName);
	if (!col1) col1Container.classList.add("invalid");
	col1Container.appendChild(document.createTextNode(col1 ?? "N/A"));

	const col2Container = document.createElement(elementName);
	if (!col2) col2Container.classList.add("invalid");
	col2Container.appendChild(document.createTextNode(col2 ?? "N/A"));

	row.appendChild(col1Container);
	row.appendChild(col2Container);

	return row;
}

function renderMedicines(data) {
	// TODO: build a table (the .results styles expect a <table>), iterate the
	// records, and render each row safely. Use the .invalid class to flag bad
	// values if you like.

	const table = document.createElement("table");
	const header = document.createElement("thead");
	table.appendChild(header);
	header.appendChild(createRow("th", "Name", "Price"));

	const tableBody = document.createElement("tbody");
	table.appendChild(tableBody);

	for (const medicine of data) {
		const row = createRow("td", medicine.name, medicine.price);
		tableBody.appendChild(row);
	}

	return table;
}

/**
 * TODO (Core task 2): fetch from /medicines/unreliable with sensible retries.
 * Retry a few times with a short delay between attempts (do not hammer the
 * server). When you give up, show a useful message in #error. On success,
 * render the data and clear #error. Show/hide the #loading area while working.
 */
async function fetchUnreliable(retryCount = 3) {
	const request = await fetch(`${BASE_URL}/medicines/unreliable`);
	if (!request.ok) {
		if (retryCount > 0) {
			await new Promise((r) => setTimeout(r, 1_000));
			return fetchUnreliable(retryCount - 1);
		}

		throw new Error("Failed to retrieve unreliable medicine list");
	}

	const response = await request.json();
	return processMedicineResponse(response);
}

// ---- Button wiring (already works - no need to change) ----
document
	.getElementById("load-medicines")
	.addEventListener("click", async () => {
		errorEl.setAttribute("hidden", true);
		loadingEl.removeAttribute("hidden");

		let medicines = null;

		try {
			medicines = await fetchMedicines();
		} catch (error) {
			console.error(error);

			errorEl.innerText = error.message;
			errorEl.removeAttribute("hidden");
		}

		loadingEl.setAttribute("hidden", true);

		const content = renderMedicines(medicines);
		resultsEl.innerHTML = "";
		resultsEl.appendChild(content);
	});

document
	.getElementById("load-unreliable")
	.addEventListener("click", async () => {
		errorEl.setAttribute("hidden", true);
		loadingEl.removeAttribute("hidden");

		let medicines = null;

		try {
			medicines = await fetchUnreliable();
		} catch (error) {
			console.error(error);

			errorEl.innerText = error.message;
			errorEl.removeAttribute("hidden");
		}

		loadingEl.setAttribute("hidden", true);

		const content = renderMedicines(medicines);
		resultsEl.innerHTML = "";
		resultsEl.appendChild(content);
	});
