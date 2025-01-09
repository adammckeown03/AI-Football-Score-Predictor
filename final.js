// Pinnacle odds API: https://rapidapi.com/tipsters/api/pinnacle-odds
const apiUrl = "https://pinnacle-odds.p.rapidapi.com/kit/v1/markets?sport_id=1&is_have_odds=true";
const apiKey = "add0670566msh733ea0627ee8672p134b13jsnabb0f229a41a";

// Initialise the UI dynamically
function initializeUI() {
    const body = document.body;
    body.style.margin = "20px";
    body.style.padding = "20px";

    const title = document.createElement("h1");
    title.textContent = "Football Score Predictor";
    body.appendChild(title);

    const dropdownContainer = document.createElement("div");
    const label = document.createElement("label");
    label.setAttribute("for", "games-dropdown");
    label.textContent = "Select a Game:";
    dropdownContainer.appendChild(label);

    const dropdown = document.createElement("select");
    dropdown.id = "games-dropdown";
    dropdown.style.width = "100%";
    dropdown.style.padding = "10px";
    dropdown.style.margin = "10px 0";
    dropdown.innerHTML = '<option value="">--Choose a Game--</option>';
    dropdown.addEventListener("change", function() {
        const selectedEventId = this.value;
        if (selectedEventId) {
            fetchGameOdds(selectedEventId, window.oddsData);
        }
    });
    dropdownContainer.appendChild(dropdown);
    body.appendChild(dropdownContainer);

    const marketsContainer = document.createElement("div");
    marketsContainer.id = "markets-container";
    marketsContainer.textContent = "Loading markets...";
    body.appendChild(marketsContainer);

    const chatContainer = document.createElement("div");
    chatContainer.id = "chat-container";
    body.appendChild(chatContainer);

    const cohereChatBox = document.createElement("div");
    cohereChatBox.id = "cohere-chat-box";
    cohereChatBox.innerHTML = `
        <h2>Cohere Chat</h2>
        <div id="cohere-response"></div>
    `;
    chatContainer.appendChild(cohereChatBox);

    const openAIChatBox = document.createElement("div");
    openAIChatBox.id = "openai-chat-box";
    openAIChatBox.innerHTML = `
        <h2>OpenAI Chat</h2>
        <div id="openai-response"></div>
    `;
    chatContainer.appendChild(openAIChatBox);
}

// Fetch odds data for a specific game
function fetchGameOdds(selectedEventId, data) {
    const container = document.getElementById("markets-container");
    container.innerHTML = "Loading game odds...";

    const selectedGame = data.events.find(event => event.event_id.toString() === selectedEventId);

    if (selectedGame) {
        const groupElement = document.createElement("div");
        groupElement.style.marginBottom = "16px";

        // Odds for the game
        const homeMoneyLine = selectedGame.periods?.num_0?.money_line?.home || "Market Closed";
        const awayMoneyLine = selectedGame.periods?.num_0?.money_line?.away || "Market Closed";
        const drawMoneyLine = selectedGame.periods?.num_0?.money_line?.draw || "Market Closed";

        // Game information
        groupElement.innerHTML = `
            <h3>${selectedGame.home} vs. ${selectedGame.away}</h3>
            <strong>Competition:</strong> ${selectedGame.league_name || "N/A"} <br>
            <strong>Date & Time:</strong> ${new Date(selectedGame.starts).toLocaleString("en-GB")} <br><br>
            <strong>Home Win Odds:</strong> ${homeMoneyLine} <br>
            <strong>Away Win Odds:</strong> ${awayMoneyLine} <br>
            <strong>Draw Odds:</strong> ${drawMoneyLine} <br>
        `;

        // Game status
        const periodResults = selectedGame.period_results || [];
        const currentTime = new Date();
        const settledAt = periodResults[1]?.settled_at ? new Date(periodResults[1].settled_at) : null;

        let gameStatus = "Game has not started";
        if (periodResults.length > 0) {
            if (settledAt && currentTime >= settledAt) {
                const finalScore = periodResults[1]
                    ? `${periodResults[1].team_1_score} - ${periodResults[1].team_2_score}`
                    : "N/A";
                gameStatus = `Final score: ${finalScore}`;
            } else {
                const currentScore = periodResults[1]
                    ? `${periodResults[1].team_1_score} - ${periodResults[1].team_2_score}`
                    : "Current score not available";
                gameStatus = `Current score: ${currentScore}`;
            }
        }

        groupElement.innerHTML += `<p>${gameStatus}</p>`;

        container.innerHTML = ""; // Clear previous content
        container.appendChild(groupElement);

        const prompt = `Using the following odds (where the lowest odds represent the most likely outcome and the highest odds represent the least likely outcome): Home Win Odds: ${homeMoneyLine} Away Win Odds: ${awayMoneyLine} Draw Odds: ${drawMoneyLine} Please estimate the most likely scoreline for the ${selectedGame.home} vs. ${selectedGame.away} match, based on the lowest odds (which represent the most likely outcome). Suggest the most probable scoreline that fits this result, focusing on the outcome with the lowest odds. Provide only the most likely scoreline and ensure that it aligns logically with the odds and Provide only the predicted scoreline with no additional explanation or details.`;

        sendCohereChat(prompt);
        sendOpenAIChat(prompt);
    } else {
        container.innerHTML = "Selected game data not available.";
    }
}

// Function to send chat request to Cohere
// https://coral.cohere.com/
function sendCohereChat(prompt) {
    const requestData = {
        message: prompt,
        model: "command",
        temperature: 0.3,
        chat_history: [],
    };

    $.ajax({
        type: "POST",
        url: "https://api.cohere.ai/v1/chat",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + "X5Hvxd0TE1eF7yXa6PjlH3bt71sI91nQr3EzsSzv",
        },
        data: JSON.stringify(requestData),
        dataType: "json",
        success: function (data) {
            const botResponse = data?.text || "No response.";
            document.getElementById("cohere-response").innerHTML = `<b>Cohere:</b> ${botResponse}`;
        },
    });
}

// Function to send chat request to OpenAI
// https://rapidapi.com/rphrp1985/api/open-ai21/playground/apiendpoint_2c3bcc79-d795-426f-be50-f94c9823b480
function sendOpenAIChat(prompt) {
    const data = JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        web_access: false,
        system_prompt: '',
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256
    });

    fetch("https://open-ai21.p.rapidapi.com/conversationgpt35", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "740a54912amshbccc8fc8e43e000p167c0ajsn6b741a1714e7",
            "X-RapidAPI-Host": "open-ai21.p.rapidapi.com"
        },
        body: data
    })
    .then(response => response.json())
    .then(responseData => {
        const botMessage = responseData.result || "No response from the server.";
        document.getElementById("openai-response").innerHTML = `<b>OpenAI:</b> ${botMessage}`;
    });
}

// Fetch odds data from the Pinnacle API
// XMLHttpRequest Docs: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
function fetchOddsData() {
    const xhr = new XMLHttpRequest();
    const dropdown = document.getElementById("games-dropdown");
    const container = document.getElementById("markets-container");

    container.innerHTML = "Fetching odds data...";
    dropdown.innerHTML = '<option value="">--Choose a Game--</option>'; // Reset dropdown

    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            const data = JSON.parse(this.responseText);
            window.oddsData = data; // Store data globally

            if (data && data.events && data.events.length > 0) {
                const eventGroups = {};

                data.events.forEach(event => {
                    const key = event.parent_id || event.event_id;
                    if (!eventGroups[key]) {
                        eventGroups[key] = [];
                    }
                    eventGroups[key].push(event);
                });

                // Populate dropdown
                Object.values(eventGroups).forEach(group => {
                    const prematch = group.find(event => event.event_type === "prematch");
                    if (prematch) {
                        const option = document.createElement("option");
                        option.value = prematch.event_id;
                        option.textContent = `${prematch.home} vs. ${prematch.away}`;
                        dropdown.appendChild(option);
                    }
                });

                container.innerHTML = "Select a game to view odds.";
            } else {
                container.innerHTML = "No events found.";
            }
        }
    });

    xhr.open("GET", apiUrl);
    xhr.setRequestHeader("X-RapidAPI-Key", apiKey);
    xhr.setRequestHeader("X-RapidAPI-Host", "pinnacle-odds.p.rapidapi.com");
    xhr.send();
}

// Initialise the app
window.addEventListener("load", function () {
    initializeUI();
    fetchOddsData();
});