import {CARDS, DIM, daily} from './generate.mjs'

// Keeps track of selected cards and their animations
const CARDS_SELECTED = new Set();
function onCardClicked(cardNum, cardEl) {
    cardEl.classList.toggle("selected");

    if (CARDS_SELECTED.delete(cardNum))
        return;

    // Adding a card
    CARDS_SELECTED.add(cardNum);

    if (CARDS_SELECTED.size == 4) {
        // Need to call Array.from to freeze the collection of elements
        const cardEls = Array.from(document.getElementsByClassName("card selected"));

        const four = Array.from(CARDS_SELECTED);
        const key = quadKey(four);
        // Immediately clear CARDS_SELECTED and remove .selected
        CARDS_SELECTED.clear();
        cardEls.forEach(e => {
            e.classList.remove("selected");
            // .animating prevents click events on them
            e.classList.add("animating");
        });
        
        // Three cases: 
        // * new quad
        //   -> green, "pop", add to found quads
        // * quad already found
        //   -> gray? blue?
        // * not a quad
        //   -> red, shake
        // => all cases: deselect
        
        if ( four.reduce((a, b) => a^b) == 0 ) {
            // Correct quad
            if ( !progress.includes(key) ) {
                // New quad
                // Animate
                cardEls.forEach(x => x.classList.add("correct"));
                // Save the found quad
                progress.push(key);
                saveProgress();
                // Check if all quads have been found
                if (progress.length == PUZZLE.n) {
                    // Stop the timer
                    finish_time = Date.now();
                    localStorage.setItem("finish_time", finish_time);
                    // Also maybe play a "finished" animation?
                    setTimeout(() => document.body.classList.add("finished"), 500);
                }
                // Wait a little bit for the animation, and then put the found quad in the sidebar
                setTimeout(() => {
                    createDomQuad(four);
                }, 250);


            }
            else {
                // Previously found quad
                cardEls.forEach(x => x.classList.add("already-found"));
                // Highlight it on the side
                const prev = document.getElementById(key);
                prev.classList.add("highlight");
                prev.addEventListener("animationend", () => prev.classList.remove("highlight"), { once: true });
            }

        } else {
            // Not a quad
            cardEls.forEach(x => x.classList.add("incorrect"));
        }

        // Remove any styles that we added here once the animation we chose ends
        cardEls[0].addEventListener("animationend", () => 
            cardEls.forEach(x => x.classList.remove("animating", "incorrect", "correct", "already-found")),
            { once: true })
        
    }
    
}

// Stores found quads in localstorage
var progress = [];
var finish_time = 0;
function saveProgress() {
    localStorage.setItem("progress_quads", JSON.stringify(progress));
}

// Helper function to split a binary card into an array of attributes
function binToTup(card) {
    let res = [];
    for (let i = 0; i < Math.ceil(DIM/2); i++)
        res.push((card >> (2 * i)) & 3);
    return res;
}
// Computes a string key from a quad
function quadKey(quad) {
    return Array.from(quad).sort().join();
}
function deQuadKey(key) {
    return key.split(",").map(t => parseInt(t));
}

// Creates a card element and styles it
function createDomCard(card) {

    const SHAPES = [
        "fa-biohazard",
        "fa-dice-d20",
        "fa-tooth",
        "fa-crown"
    ];

    // Convert to a base 4 array
    const attrs = binToTup(card);
    const color = attrs[0];
    const number = attrs[1];
    const shape = attrs[2];

    let cardEl = document.createElement("div");
    cardEl.classList.add("card");

    let cardElInner = document.createElement("div");
    cardElInner.classList.add("card-inner");
    cardEl.appendChild(cardElInner);

    // Set attributes
    cardEl.classList.add(`color-${color}`);

    // Add icons
    for (let n = 0; n <= number; n++) {
        let icon = document.createElement("i");
        icon.classList.add("fas", SHAPES[shape]);

        cardElInner.appendChild(icon);
    }

    return cardEl;
}

// Adds a found or recalled quad to the sidebar, and sets the number on the sidebar
function createDomQuad(quad) {
    let container = document.createElement("div");
    container.classList.add("found-quad");
    container.id = quadKey(quad);

    quad.forEach(q => container.appendChild(createDomCard(q)));
    document.getElementById("found-scroll").appendChild(container);

    // Update the count
    document.getElementById("nfound").textContent = progress.length;

    return container;
}

// Populates the page content
function createListeners() {
    document.getElementById("date").textContent =
        timestamp.toLocaleDateString("default", {
            "timeZone": "UTC",
            "day": "numeric",
            "month": "long",
            "year": "numeric"
        })

    document.getElementById("nquads").textContent = PUZZLE.n;
    document.getElementById("nquads2").textContent = PUZZLE.n;

    // Populate the card display
    const card_container = document.getElementById("cards");
    PUZZLE.cards.forEach(c => {
        let el = createDomCard(c);
        el.addEventListener("click",
            () => onCardClicked(c, el),
            { passive: true });
        card_container.appendChild(el)
    });

    // Set up the timer
    const time_container = document.getElementById("timer");
    var start_time = Date.now();
    let updateTimer = () => {

        let ms = Date.now() - start_time;

        if (finish_time > 0) {
            // This is the last update.
            ms = finish_time - start_time;
            // The green text will have already been added
        } else {
            // Figure out when we need to next update the timer.
            // We do this first to keep the timer accurate
            let ms_to_next_update = (Math.ceil(ms/1000) * 1000) - ms;
            // Set a timeout for the next update
            setTimeout(() => requestAnimationFrame(updateTimer), ms_to_next_update);
        }

        // Now update the actual timer text
        // Get ISO time in hours, as the time elapsed can never be more than 24 hrs.
        timer.textContent = (new Date(ms)).toISOString().substr(11, 8)

    }
    // We want the timer to only update when the browser is rendering.
    // We also want it to update once per second!
    requestAnimationFrame(updateTimer)

    // Populate found-quads display
    // Create dummy quad so that the width of the quads display will be correct
    createDomQuad([0, 0, 0, 0]).classList.add("dummy");
    // Check progress in localstorage
    if (!(localStorage.getItem("progress_day") >= day)) {
        // No progress or progress is outdated
        localStorage.setItem("progress_day", day);
        localStorage.setItem("start_time", start_time);
        saveProgress();
    }
    else {
        // Load progress
        progress = JSON.parse(localStorage.getItem("progress_quads")) || [];
        // Set the timer correctly
        start_time = parseInt(localStorage.getItem("start_time") || Date.now()); // If localstorage got messed up, reset the start time
        finish_time = parseInt(localStorage.getItem("finish_time") || 0);
        // Populate the sidebar
        // Don't animate these quads
        progress.forEach(q => createDomQuad(deQuadKey(q)));
        // Set the finished class if we're done
        if (progress.length == PUZZLE.n)
            document.body.classList.add("finished");
    }

    // Set a random congratulation message
    const messages = ["Well done!", "Good job!", "Awesome!", "Nice job!", "You did it!", "All done!"];
    document.getElementById("congrats").textContent = messages[Math.floor(Math.random() * messages.length)];

}

// Check the day
const timestamp = new Date();
const day = Math.floor(timestamp.getTime() / (1000 * 60 * 60 * 24));
// Start generating puzzle even before DOM content is ready
const PUZZLE = daily(day);

// Once DOM is ready, populate the page
if (document.readyState === "complete" ||
   (document.readyState !== "loading" && !document.documentElement.doScroll) )
    createListeners();
else
    document.addEventListener("DOMContentLoaded", createListeners);
