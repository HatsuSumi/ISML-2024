window.copyEmail = function(element, event) {
    event.preventDefault();
    const email = element.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = '邮箱已复制';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 1500);
    });
}
