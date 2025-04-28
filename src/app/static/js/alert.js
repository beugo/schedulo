window.addEventListener('load', () => {
    const alertContainer = document.querySelector('ul.p-3');
    if (!alertContainer) return;
    const alerts = Array.from(alertContainer.querySelectorAll('.alert'));

    alerts.forEach(alert => {
        setTimeout(() => {
            alert.classList.add('fade-out');
            alert.addEventListener('animationend', () => {
                alert.remove();
                if (!alertContainer.querySelector('.alert')) {
                    alertContainer.classList.remove('p-3');
                }
            });
        }, 5000);
    });
});