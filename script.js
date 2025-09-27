function convertText() {
    const string = document.getElementById("originalText").value;

    const removeAccent = string
        .normalize("NFD")
        .replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, "")
        .replace(/[\u0300-\u036f]/g, "");
    const replaceSpecialCharWithDash = removeAccent.replace(/[^a-zA-Z0-9]/g, "-");
    const removeUnwantedDashes = replaceSpecialCharWithDash.replace(/-+/g, '-');
    const removeStartOrEndDash = removeUnwantedDashes.replace(/^-|-$/g, "");
    const toLowerCase = removeStartOrEndDash.toLowerCase();
    const result = toLowerCase;

    document.getElementById("moddedText").value = result;
}

function copyToClipboard() {
    const copyText = document.getElementById("moddedText");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

function clearAll() {
    document.getElementById('originalText').value = "";
    document.getElementById('moddedText').value = "";
}

/**/

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    // Show the selected tab
    document.getElementById(tabId).classList.add('active');

    // Activate the corresponding button
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabId === "tab1") {
        tabButtons[0].classList.add('active');
    } else {
        tabButtons[1].classList.add('active');
    }
}



/* Populate the dropdown menu from a txt file */
fetch('dropdown-menu/options.txt')
    .then(response => response.text())
    .then(text => {
        const lines = text.trim().split('\n');
        const dropdown = document.getElementById('dropdownMenu');

        // Add a placeholder option first
        const placeholder = document.createElement('option');
        placeholder.textContent = '-- Válassz egy elemet --';
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.hidden = true;
        placeholder.value = "";
        dropdown.appendChild(placeholder);

        // Add options from the file
        lines.forEach((line) => {
            const label = line.trim();
            const option = document.createElement('option');
            option.value = label;
            option.textContent = label;
            dropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error("Error loading options.txt:", error);
    });

/* Event Listener */
let editorMainXml;
let editorInLinks;
let editorPrompt;

window.addEventListener('DOMContentLoaded', () => {
    // Main XML
    editorMainXml = ace.edit("editorMainXml");
    editorMainXml.setTheme("ace/theme/twilight");
    editorMainXml.session.setMode("ace/mode/xml");
    editorMainXml.setOptions({
        fontSize: "14px",
        wrap: true,
        showPrintMargin: false
    });

    // Inner Links XML
    editorInLinks = ace.edit("editorInLinks");
    editorInLinks.setTheme("ace/theme/twilight");
    editorInLinks.session.setMode("ace/mode/xml");
    editorInLinks.setOptions({
        fontSize: "14px",
        wrap: true,
        showPrintMargin: false
    });

    // Prompt XML
    editorPrompt = ace.edit("editorPrompt");
    editorPrompt.setTheme("ace/theme/twilight");
    editorPrompt.session.setMode("ace/mode/xml");
    editorPrompt.setOptions({
        fontSize: "14px",
        wrap: true,
        showPrintMargin: false
    });

    // Restore product description height
    const textarea = document.getElementById("productDescription");
    const savedHeight = localStorage.getItem("productDescriptionHeight");
    if (savedHeight) {
        textarea.style.height = savedHeight;
    }

    // Save product description height on resize to localStorage
    textarea.addEventListener("mouseup", () => {
        const height = textarea.getBoundingClientRect().height;
        localStorage.setItem("productDescriptionHeight", height + "px");
    });
});

/* Update content depending on what is selected from the dropdown menu */
function updateDropdownContent() {
    const selectedLabel = document.getElementById("dropdownMenu").value;

    if (!fileMap[selectedLabel]) {
        editorMainXml.setValue("<!-- Hiba: ez az elem nem található a fileMap-ben. -->", -1);
        return;
    }

    const fileName = fileMap[selectedLabel];
    fetch(fileName + "?v=" + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error(`A fájl nem található: ${fileName}`);
            }
            return response.text();
        })
        .then(xml => editorMainXml.setValue(xml, -1))
        .catch(err => {
            console.error(err);
            editorMainXml.setValue("<!-- Hiba: a fileMap-ben, az ehhez az elemhez tartozó XML fájl nem található-->", -1);
        });
}

function updateDropdownContentInLinks() {
    const selectedLabel = document.getElementById("dropdownMenu").value;

    if (!fileMap_inLinks[selectedLabel]) {
        editorInLinks.setValue("<!-- Hiba: ez az elem nem található a fileMap_inLinks-ben. -->", -1);
        return;
    }

    const fileName = fileMap_inLinks[selectedLabel];
    fetch(fileName + "?v=" + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error(`A fájl nem található: ${fileName}`);
            }
            return response.text();
        })
        .then(xml => editorInLinks.setValue(xml, -1))
        .catch(err => {
            console.error(err);
            editorInLinks.setValue("<!-- Hiba: a fileMap_inLinks-ben, az ehhez az elemhez tartozó XML fájl nem található -->", -1);
        });
}

function generatePrompt() {
    // 1. Copy content from editorMainXml → editorPrompt
    const mainContent = editorMainXml.getValue();
    editorPrompt.setValue(mainContent, -1);

    // 2. Get values from inputs + editors
    const productName = document.getElementById("productName").value.trim();
    const productDescription = document.getElementById("productDescription").value.trim();
    const keywords = editorInLinks.getValue().trim();

    // If productName is empty → clear editorPrompt and stop
    if (!productName || !productDescription) {
        editorPrompt.setValue("", -1);
        return;
    }

    // 3. Replace <productName>...</productName>
    let updatedContent = editorPrompt.getValue().replace(
        /<productName>.*?<\/productName>/s,
        `<productName>${productName}</productName>`
    );

    // 4. Replace <text>...</text> if description is provided
    if (productDescription) {
        updatedContent = updatedContent.replace(
            /<text>.*?<\/text>/s,
            `<text>${productDescription}</text>`
        );
    }

    // 5. Replace <keywords>...</keywords> if keywords exist
    if (keywords) {
        updatedContent = updatedContent.replace(
            /<keywords>.*?<\/keywords>/s,
            `<keywords>${keywords}</keywords>`
        );
    }

    // 6. Update editorPrompt
    editorPrompt.setValue(updatedContent, -1);
}

function copyPrompt() {
    const content = editorPrompt.getValue().trim();

    if (!content) {
        alert("A prompt mező üres!");
        return;
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth" // smooth scrolling effect
    });
}