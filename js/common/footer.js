function loadFooter() {
    fetch(
        location.hostname === "hatsusumi.github.io" 
            ? "/ISML-2024/templates/footer.html"
            : "../../templates/footer.html"
    )
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('beforeend', data);
        });
}

document.addEventListener('DOMContentLoaded', loadFooter); 