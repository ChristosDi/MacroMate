document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".button-container button");
    const displayContainer = document.getElementById("display");

    // Category to macro key mapping
    const categoryToMacroKey = {
        "Book a Taxi": "taxiMacro",
        "Child Seat": "seatMacro",
        "Incomplete Journey": "journeyMacro",
        "DNS": "dnsMacro",
        "Finance": "financeMacro",
        "Flights": "flightMacro",
        "Free Taxi": "freeTaxiMacro",
        "Invoice": "invoiceMacro",
        "Location": "locationMacro",
        "Memos": "memoMacro",
        "Proof Request": "proofMacro",
        "Rate": "rateMacro",
        "Zero Down": "zeroDownMacro"
    };

    buttons.forEach(button => {
        button.addEventListener("click", async () => {
            const category = button.textContent.trim();
            const data = await fetchMacros();
            
            // Find matching category (case-sensitive exact match)
            const categoryObject = data.data.find(item => item.name === category);
            
            if (categoryObject) {
                // Filter out empty items
                const nonEmptyItems = categoryObject.items.filter(item => 
                    item[categoryToMacroKey[category]]?.trim() || item.comboMemo?.trim()
                );
                
                if (nonEmptyItems.length > 0) {
                    displayMacro(nonEmptyItems, category);
                } else {
                    displayContainer.innerHTML = `<div class="title">No content available for ${category}</div>`;
                }
            } else {
                displayContainer.innerHTML = `<div class="title">Category not found: ${category}</div>`;
            }
        });
    });

    async function fetchMacros() {
        try {
            const response = await fetch("macros.json");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching macros:", error);
            displayContainer.innerHTML = `<div class="title">Error Loading Macros</div>`;
            return { data: [] };
        }
    }

    function displayMacro(macroItems, categoryName) {
        const macroKey = categoryToMacroKey[categoryName];
        let macroContent = macroItems.map(macro => {
            // Use proper line breaks for macros
            const macroText = (macro[macroKey] || "No macro available")
                .replace(/\n/g, '<br>');
            
            const memoText = (macro.comboMemo || "No memo available")
                .replace(/\n/g, '<br>');

            return `
                <div class="macro-block">
                    <div class="title">${macro.title || "Untitled"}</div>
                    <div class="macro">${macroText}</div>
                    <div class="memo">${memoText}</div>
                </div>
            `;
        }).join("");

        displayContainer.innerHTML = macroContent 
            ? `<div class="content">${macroContent}</div>`
            : `<div class="title">No content to display</div>`;
    }
});