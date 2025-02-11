function loadFooter() {
    fetch('../../templates/footer.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('beforeend', data);
        });
}

document.addEventListener('DOMContentLoaded', loadFooter); 