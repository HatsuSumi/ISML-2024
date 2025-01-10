function loadNavbar() {
    fetch('../../templates/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data);
        });
}

document.addEventListener('DOMContentLoaded', loadNavbar); 