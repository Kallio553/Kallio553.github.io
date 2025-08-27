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