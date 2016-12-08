export function HelpView(element: HTMLElement) {
    let viewUrl = element.getAttribute('data-help-view');

    // Ensure that a template view URL exists for this
    if (!viewUrl)
        return;

    // Fetch the template view and store it in a template for later use
    fetch(viewUrl)
        .then(response => response.text())
        .then(text => {
            let helpView = document.createElement('div');
            helpView.className = 'help-view';
            helpView.style.display = 'none';
            helpView.innerHTML = '<div class="inner">' + text + '</div>';
            document.body.appendChild(helpView);

            let viewShouldStayVisible = false;

            // Show and hide the help view 
            element.addEventListener('mouseenter', (event) => {
                // First show the view to compute its dimensions
                helpView.style.display = 'block';

                let sourceBox = element.getBoundingClientRect();
                let viewBox = helpView.getBoundingClientRect();

                let horizontal: 'left'|'right';
                let vertical: 'top'|'bottom';

                if (sourceBox.left + viewBox.width < window.innerWidth) {
                    horizontal = 'left';
                    helpView.style.left = (sourceBox.left + sourceBox.width/2 - 17) + 'px';
                }
                else {
                    horizontal = 'right';
                    helpView.style.left = (sourceBox.right - viewBox.width - sourceBox.width/2 + 17) + 'px';
                }

                if (sourceBox.top + viewBox.height < window.innerHeight) {
                    vertical = 'top';
                    helpView.style.top = (sourceBox.top + sourceBox.height + 18) + 'px';
                }
                else {
                    vertical = 'bottom';
                    helpView.style.top = (sourceBox.bottom - sourceBox.height - viewBox.height - 18) + 'px';
                }

                helpView.className = `help-view ${vertical}-${horizontal}`;
            });

            element.addEventListener('mouseleave', (event) => {
                // Hide the view after 500ms, to allow the user to hover over the view
                setTimeout(() => {
                    if (!viewShouldStayVisible)
                        helpView.style.display = 'none';
                }, 100);
            });

            helpView.addEventListener('mouseenter', (event) => {
                viewShouldStayVisible = true;
            });

            helpView.addEventListener('mouseleave', (event) => {
                helpView.style.display = 'none';
                viewShouldStayVisible = false;
            });
        });
}